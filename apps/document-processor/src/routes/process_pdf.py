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

from app_state import get_converter

from utils.utils import create_embedded_chunk, handle_processing_error

from models.requests import DocumentUploadEvent
from models.responses import (
    PdfChunkData,
    PdfChunkedConversionResponse,
    ProcessingResponse
)

from access_clients import get_storage_client
from db.postgres import (
    upload_to_postgres_db,
    update_status_to_processing,
    update_status_to_finished
)
from embeddings.embeddings_client import embed_content

from logger import setup_logger

router = APIRouter()

# Configure logger
logger = setup_logger(__name__)


def _create_converter_with_options(pipeline_options: Optional[object]) -> DocumentConverter:
    """Create a DocumentConverter with custom pipeline options if provided."""
    if not pipeline_options:
        logger.debug("Using default PDF converter (no custom pipeline options)")
        return get_converter()
    
    logger.info(f"Creating PDF converter with custom pipeline options: {pipeline_options}")

    custom_options = PdfPipelineOptions()
    option_attrs = ("do_ocr", "do_formula_enrichment", "do_code_enrichment",
                    "do_table_structure", "do_picture_description")

    for attr in option_attrs:
        if hasattr(pipeline_options, attr):
            value = getattr(pipeline_options, attr)
            setattr(custom_options, attr, value)
            logger.debug(f"Pipeline option {attr}={value}")
        else:
            setattr(custom_options, attr, False)
            logger.debug(f"Pipeline option {attr}=False (default)")

    return DocumentConverter(
        format_options={InputFormat.PDF: PdfFormatOption(
            pipeline_options=custom_options)}
    )


def _extract_chunk_metadata(doc_chunk: DocChunk) -> tuple[int, Optional[tuple[float, float, float, float]]]:
    """Extract page number and bounding box from chunk."""
    page_index = doc_chunk.meta.doc_items[0].prov[0].page_no

    bbox_obj = BoundingBox.enclosing_bbox(
        [prov_item.bbox for item in doc_chunk.meta.doc_items for prov_item in item.prov]
    )

    bbox_tuple = None
    if bbox_obj:
        bbox_tuple = bbox_obj.as_tuple()

    return page_index, bbox_tuple

@router.post("/internal/process-pdf")
async def process_pdf(event: DocumentUploadEvent):
    """Process a PDF from cloud storage to chunks with page numbers and bounding boxes."""
    logger.info(f"Received PDF processing request for '{event.name}' (task_id={event.taskId}, size={event.size} bytes)")
    try:
        result = await _convert_pdf(event)
        logger.info(f"Successfully processed PDF '{event.name}' (task_id={event.taskId})")
        return result
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        logger.error(f"Storage error processing PDF '{event.name}': {error_code} - {str(e)}")
        if error_code == "NoSuchKey":
            raise HTTPException(
                status_code=404,
                detail=f"File not found: {event.name}"
            )
        raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to process PDF '{event.name}' (task_id={event.taskId}): {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to convert PDF: {str(e)}")


async def _convert_pdf(event: DocumentUploadEvent) -> ProcessingResponse:
    """Full PDF processing workflow with embeddings and database storage."""
    task_id = event.taskId
    course_id, shortened_filename = event.name.split("/")

    try:
        logger.info(f"Updating task status to 'processing' for task_id={task_id}")
        await update_status_to_processing(task_id)

        logger.info(f"Converting PDF to chunks: {event.name}")
        chunks_response, page_count = await _convert_pdf_to_chunks(
            "files-bucket", event.name, event.pipelineOptions
        )

        if not chunks_response.chunks:
            logger.warning(f"No content chunks generated from PDF: {event.name}")
            raise ValueError("No content chunks generated from PDF")

        logger.info(f"Generated {len(chunks_response.chunks)} chunks from {page_count}-page PDF: {event.name}")

        logger.info(f"Generating embeddings for {len(chunks_response.chunks)} chunks")
        chunk_contents = [
            c.contextualized_content for c in chunks_response.chunks]
        embeddings_list = embed_content(chunk_contents)
        logger.info(f"Successfully generated {len(embeddings_list)} embeddings")

        embedded_chunks = [
            create_embedded_chunk(chunk, embeddings_list[idx])
            for idx, chunk in enumerate(chunks_response.chunks)
        ]

        logger.info(f"Uploading {len(embedded_chunks)} chunks to database (task_id={task_id})")
        await upload_to_postgres_db(
            task_id, course_id, shortened_filename,
            int(event.size), embedded_chunks, event.pageNumberOffset,
            page_count
        )
        logger.info(f"Successfully uploaded chunks to database (task_id={task_id})")

        logger.info(f"Updating task status to 'finished' for task_id={task_id}")
        await update_status_to_finished(task_id)

        return ProcessingResponse(
            success=True,
            message=f"Successfully processed PDF {shortened_filename}",
            chunks_processed=len(embedded_chunks)
        )

    except Exception as error:
        await handle_processing_error("files-bucket", event, error)
        raise error


async def _convert_pdf_to_chunks(
    bucket: str,
    key: str,
    pipeline_options: Optional[object] = None
) -> Tuple[PdfChunkedConversionResponse, int]:
    """Convert PDF to chunks without full processing and return page count."""
    logger.debug(f"Fetching PDF from storage: bucket={bucket}, key={key}")
    storage_client = get_storage_client()
    file_content = storage_client.get_object_bytes(bucket, key)
    logger.debug(f"Retrieved PDF from storage (size: {len(file_content)} bytes)")

    buf = io.BytesIO(file_content)
    source = DocumentStream(name="document.pdf", stream=buf)

    logger.debug(f"Converting PDF using Docling converter")
    doc_converter = _create_converter_with_options(pipeline_options)
    result = doc_converter.convert(source)
    page_count = result.document.num_pages()
    logger.debug(f"PDF conversion completed ({page_count} pages)")

    logger.debug(f"Initializing chunker and processing PDF")
    chunker = HybridChunker()
    chunk_iter = chunker.chunk(dl_doc=result.document)

    chunks: List[PdfChunkData] = []
    for idx, chunk in enumerate(chunk_iter):
        contextualized_text = chunker.contextualize(chunk=chunk)

        doc_chunk = DocChunk.model_validate(chunk)
        page_index, bbox_tuple = _extract_chunk_metadata(doc_chunk)

        logger.debug(f"Created chunk {idx}: {contextualized_text[:60]}... (length: {len(contextualized_text)} characters)")

        if not contextualized_text.strip():
            logger.debug(f"Skipping empty chunk at index {idx}")
            continue

        chunks.append(PdfChunkData(
            contextualized_content=contextualized_text,
            chunk_index=idx,
            page_index=page_index,
            bbox=bbox_tuple
        ))

    logger.debug(f"Created {len(chunks)} chunks from PDF")
    return PdfChunkedConversionResponse(
        chunks=chunks,
        total_chunks=len(chunks),
        success=True,
        message=f"Successfully converted and chunked PDF {key}"
    ), page_count
