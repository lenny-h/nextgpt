"""
PDF Processing Module

This module handles PDF document processing with chunk extraction,
embeddings generation, and database storage.
"""

import io
from typing import Optional, List, Tuple, Generator

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


def convert_pdf(event: DocumentUploadEvent) -> ProcessingResponse:
    """Full PDF processing workflow with embeddings and database storage.
    
    Processes chunks in batches of 30 to optimize memory usage.
    Each batch is embedded and uploaded before moving to the next.
    """
    task_id = event.taskId
    course_id, shortened_filename = event.name.split("/")

    batch_size = 30
    total_chunks_processed = 0
    is_first_batch = True

    try:
        logger.info(f"Updating task status to 'processing' for task_id={task_id}")
        update_status_to_processing(task_id)

        logger.info(f"Converting PDF to chunks: {event.name}")
        chunk_generator, page_count = _create_pdf_chunk_generator(
            "files-bucket", event.name, event.pipelineOptions
        )

        # Process chunks in batches of 30
        batch: List[PdfChunkData] = []
        for chunk in chunk_generator:
            batch.append(chunk)
            
            if len(batch) >= batch_size:
                _process_and_upload_pdf_batch(
                    batch, task_id, course_id, shortened_filename,
                    int(event.size), event.pageNumberOffset, page_count,
                    is_first_batch
                )
                total_chunks_processed += len(batch)
                logger.info(f"Processed batch of {len(batch)} chunks (total: {total_chunks_processed})")
                is_first_batch = False
                batch = []  # Clear batch to free memory

        # Process remaining chunks
        if batch:
            _process_and_upload_pdf_batch(
                batch, task_id, course_id, shortened_filename,
                int(event.size), event.pageNumberOffset, page_count,
                is_first_batch
            )
            total_chunks_processed += len(batch)
            logger.info(f"Processed final batch of {len(batch)} chunks (total: {total_chunks_processed})")

        if total_chunks_processed == 0:
            logger.warning(f"No content chunks generated from PDF: {event.name}")
            raise ValueError("No content chunks generated from PDF")

        logger.info(f"Updating task status to 'finished' for task_id={task_id}")
        update_status_to_finished(task_id)

        return ProcessingResponse(
            success=True,
            message=f"Successfully processed PDF {shortened_filename}",
            chunks_processed=total_chunks_processed
        )

    except Exception as error:
        handle_processing_error("files-bucket", event, error)
        raise error


def _process_and_upload_pdf_batch(
    batch: List[PdfChunkData],
    task_id: str,
    course_id: str,
    filename: str,
    file_size: int,
    page_number_offset: int,
    page_count: int,
    is_first_batch: bool
) -> None:
    """Embed and upload a batch of PDF chunks to the database."""
    logger.debug(f"Generating embeddings for batch of {len(batch)} chunks")
    chunk_contents = [c.contextualized_content for c in batch]
    embeddings_list = embed_content(chunk_contents)

    embedded_chunks = [
        create_embedded_chunk(chunk, embeddings_list[idx])
        for idx, chunk in enumerate(batch)
    ]

    logger.debug(f"Uploading batch of {len(embedded_chunks)} chunks to database")
    upload_to_postgres_db(
        task_id, course_id, filename,
        file_size, embedded_chunks, page_number_offset,
        page_count, is_first_batch
    )


from typing import Generator


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


def _generate_pdf_chunks(
    result,
    chunker: HybridChunker
) -> Generator[PdfChunkData, None, None]:
    """Generator that yields PDF chunks one at a time for memory efficiency."""
    chunk_iter = chunker.chunk(dl_doc=result.document)

    for idx, chunk in enumerate(chunk_iter):
        contextualized_text = chunker.contextualize(chunk=chunk)

        doc_chunk = DocChunk.model_validate(chunk)
        page_index, bbox_tuple = _extract_chunk_metadata(doc_chunk)

        logger.debug(f"Created chunk {idx}: {contextualized_text[:60]}... (length: {len(contextualized_text)} characters)")

        if not contextualized_text.strip():
            logger.debug(f"Skipping empty chunk at index {idx}")
            continue

        yield PdfChunkData(
            contextualized_content=contextualized_text,
            chunk_index=idx,
            page_index=page_index,
            bbox=bbox_tuple
        )


def _create_pdf_chunk_generator(
    bucket: str,
    key: str,
    pipeline_options: Optional[object] = None
) -> Tuple[Generator[PdfChunkData, None, None], int]:
    """Create a generator for PDF chunks and return page count.
    
    Returns a generator instead of a list to enable memory-efficient batch processing.
    """
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

    logger.debug(f"Initializing chunker and creating chunk generator")
    chunker = HybridChunker()

    return _generate_pdf_chunks(result, chunker), page_count
