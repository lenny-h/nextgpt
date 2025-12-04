"""
Document Processing Module

This module handles non-PDF document processing with chunk extraction,
embeddings generation, and database storage.
"""

import io
from typing import List, Generator

from docling_core.types.io import DocumentStream
from docling_core.transforms.chunker.hybrid_chunker import HybridChunker

from app_state import get_converter

from utils.utils import create_embedded_chunk, handle_processing_error

from models.requests import DocumentUploadEvent
from models.responses import (
    DocumentChunkData,
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


def convert_document(event: DocumentUploadEvent) -> ProcessingResponse:
    """Full document processing workflow with embeddings and database storage.
    
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

        logger.info(f"Converting document to chunks: {event.name}")
        chunk_generator = _create_document_chunk_generator("files-bucket", event.name)

        # Process chunks in batches of 30
        batch: List[DocumentChunkData] = []
        for chunk in chunk_generator:
            batch.append(chunk)
            
            if len(batch) >= batch_size:
                _process_and_upload_document_batch(
                    batch, task_id, course_id, shortened_filename,
                    int(event.size), event.pageNumberOffset, is_first_batch
                )
                total_chunks_processed += len(batch)
                logger.info(f"Processed batch of {len(batch)} chunks (total: {total_chunks_processed})")
                is_first_batch = False
                batch = []  # Clear batch to free memory

        # Process remaining chunks
        if batch:
            _process_and_upload_document_batch(
                batch, task_id, course_id, shortened_filename,
                int(event.size), event.pageNumberOffset, is_first_batch
            )
            total_chunks_processed += len(batch)
            logger.info(f"Processed final batch of {len(batch)} chunks (total: {total_chunks_processed})")

        if total_chunks_processed == 0:
            logger.warning(f"No content chunks generated from document: {event.name}")
            raise ValueError("No content chunks generated from document")

        logger.info(f"Updating task status to 'finished' for task_id={task_id}")
        update_status_to_finished(task_id)

        return ProcessingResponse(
            success=True,
            message=f"Successfully processed document {shortened_filename}",
            chunks_processed=total_chunks_processed
        )

    except Exception as error:
        handle_processing_error("files-bucket", event, error)
        raise error


def _process_and_upload_document_batch(
    batch: List[DocumentChunkData],
    task_id: str,
    course_id: str,
    filename: str,
    file_size: int,
    page_number_offset: int,
    is_first_batch: bool
) -> None:
    """Embed and upload a batch of document chunks to the database."""
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
        None, is_first_batch
    )


from typing import Generator


def _generate_document_chunks(
    result,
    chunker: HybridChunker
) -> Generator[DocumentChunkData, None, None]:
    """Generator that yields document chunks one at a time for memory efficiency."""
    chunk_iter = chunker.chunk(dl_doc=result.document)

    for idx, chunk in enumerate(chunk_iter):
        contextualized_text = chunker.contextualize(chunk=chunk)

        logger.debug(f"Created chunk {idx}: {contextualized_text[:60]}... (length: {len(contextualized_text)} characters)")

        if not contextualized_text.strip():
            logger.debug(f"Skipping empty chunk at index {idx}")
            continue

        yield DocumentChunkData(
            contextualized_content=contextualized_text,
            chunk_index=idx
        )


def _create_document_chunk_generator(
    bucket: str,
    key: str
) -> Generator[DocumentChunkData, None, None]:
    """Create a generator for document chunks.
    
    Returns a generator instead of a list to enable memory-efficient batch processing.
    """
    logger.debug(f"Fetching document from storage: bucket={bucket}, key={key}")
    storage_client = get_storage_client()
    file_content = storage_client.get_object_bytes(bucket, key)
    logger.debug(f"Retrieved document from storage (size: {len(file_content)} bytes)")

    if "." in key:
        file_extension = key.split(".")[-1].lower()
        logger.debug(f"Detected file extension: {file_extension}")
    else:
        logger.error(f"File key does not contain an extension: {key}")
        raise ValueError("File key does not contain an extension")

    buf = io.BytesIO(file_content)
    source = DocumentStream(name=f"document.{file_extension}", stream=buf)

    logger.debug(f"Converting document using Docling converter")
    converter = get_converter()
    result = converter.convert(source)
    logger.debug(f"Document conversion completed")

    logger.debug(f"Initializing chunker and creating chunk generator")
    # The following code may raise the error
    # 'Token indices sequence length is longer than the specified maximum sequence length for this model (531 > 512)'
    # According to https://docling-project.github.io/docling/examples/hybrid_chunking/#basic-usage, this is a false alarm
    chunker = HybridChunker()

    return _generate_document_chunks(result, chunker)
