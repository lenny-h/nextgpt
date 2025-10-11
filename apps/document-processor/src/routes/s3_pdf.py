import io
from typing import Optional, List, Tuple

from fastapi import APIRouter, HTTPException
from botocore.exceptions import ClientError

from docling_core.types.io import DocumentStream
from docling_core.transforms.chunker.hierarchical_chunker import DocChunk
from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from docling_core.types.doc.base import BoundingBox

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

from app_state import converter, get_tokenizer
from routes.shared_utils import create_embedded_chunk, handle_processing_error

from models.requests import DocumentUploadEvent
from models.responses import (
    PdfChunkData,
    PdfChunkedConversionResponse,
    ProcessingResponse
)

from s3.client import get_object_bytes
from db.postgres import (
    upload_to_postgres_db,
    update_status_to_processing,
    update_status_to_finished
)
from embeddings.vertex_ai import embed_content

router = APIRouter()


def _create_converter_with_options(pipeline_options: Optional[object]) -> DocumentConverter:
    """Create a DocumentConverter with custom pipeline options if provided."""
    if not pipeline_options:
        return converter

    custom_options = PdfPipelineOptions()
    option_attrs = ("do_ocr", "do_formula_enrichment", "do_code_enrichment",
                    "do_table_structure", "do_picture_description")

    for attr in option_attrs:
        if hasattr(pipeline_options, attr):
            setattr(custom_options, attr, getattr(pipeline_options, attr))

    return DocumentConverter(
        format_options={InputFormat.PDF: PdfFormatOption(
            pipeline_options=custom_options)}
    )


def _extract_chunk_metadata(doc_chunk: DocChunk) -> tuple[int, Optional[dict]]:
    """Extract page number and bounding box from chunk."""
    page_number = doc_chunk.meta.doc_items[0].prov[0].page_no

    bbox_obj = BoundingBox.enclosing_bbox(
        [prov_item.bbox for item in doc_chunk.meta.doc_items for prov_item in item.prov]
    )

    bbox_dict = None
    if bbox_obj:
        x0, y0, x1, y1 = bbox_obj.as_tuple()
        bbox_dict = {"x0": x0, "y0": y0, "x1": x1, "y1": y1}

    return page_number, bbox_dict


@router.post("/convert-pdf-from-s3")
async def convert_pdf_from_s3(event: DocumentUploadEvent):
    """Convert a PDF from S3/R2 to chunks with page numbers and bounding boxes."""
    try:
        return await _process_pdf(event)
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        if error_code == "NoSuchKey":
            raise HTTPException(
                status_code=404,
                detail=f"File not found: {event.bucket}/{event.name}"
            )
        raise HTTPException(status_code=500, detail=f"S3 error: {str(e)}")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to convert PDF: {str(e)}")


async def _convert_pdf_to_chunks(
    bucketId: str,
    key: str,
    pipeline_options: Optional[object] = None
) -> Tuple[PdfChunkedConversionResponse, int]:
    """Convert PDF to chunks without full processing and return page count."""
    file_content = get_object_bytes(bucketId, key)
    buf = io.BytesIO(file_content)
    source = DocumentStream(name="document.pdf", stream=buf)

    doc_converter = _create_converter_with_options(pipeline_options)
    result = doc_converter.convert(source)

    chunker = HybridChunker(tokenizer=get_tokenizer())
    chunk_iter = chunker.chunk(dl_doc=result.document)

    chunks: List[PdfChunkData] = []
    for idx, chunk in enumerate(chunk_iter):
        contextualized_text = chunker.contextualize(chunk=chunk)
        doc_chunk = DocChunk.model_validate(chunk)
        page_number, bbox_dict = _extract_chunk_metadata(doc_chunk)

        chunks.append(PdfChunkData(
            contextualized_content=contextualized_text,
            chunk_index=idx,
            page_number=page_number,
            bbox=bbox_dict
        ))

    return PdfChunkedConversionResponse(
        chunks=chunks,
        total_chunks=len(chunks),
        success=True,
        message=f"Successfully converted and chunked PDF {key}"
    ), result.document.num_pages()


async def _process_pdf(event: DocumentUploadEvent) -> ProcessingResponse:
    """Full PDF processing workflow with embeddings and database storage."""
    task_id = event.taskId
    course_id, shortened_filename = event.name.split("/")

    try:
        update_status_to_processing(task_id)

        chunks_response, page_count = await _convert_pdf_to_chunks(
            event.bucket, event.name, event.pipelineOptions
        )

        if not chunks_response.chunks:
            raise ValueError("No content chunks generated from PDF")

        chunk_contents = [
            c.contextualized_content for c in chunks_response.chunks]
        embeddings_list = embed_content(chunk_contents)

        embedded_chunks = [
            create_embedded_chunk(chunk, embeddings_list[idx])
            for idx, chunk in enumerate(chunks_response.chunks)
        ]

        upload_to_postgres_db(
            task_id, course_id, shortened_filename,
            int(event.size), embedded_chunks, page_count
        )

        update_status_to_finished(task_id)

        return ProcessingResponse(
            success=True,
            message=f"Successfully processed PDF {shortened_filename}",
            chunks_processed=len(embedded_chunks)
        )

    except Exception as error:
        handle_processing_error(event, error)
        raise error
