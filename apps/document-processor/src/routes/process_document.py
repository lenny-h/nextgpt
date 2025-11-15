import io
from typing import List

from fastapi import APIRouter, HTTPException
from botocore.exceptions import ClientError

from docling_core.types.io import DocumentStream
from docling_core.transforms.chunker.hybrid_chunker import HybridChunker

from app_state import get_converter

from utils.tokenizer import get_tokenizer
from utils.utils import create_embedded_chunk, handle_processing_error

from models.requests import DocumentUploadEvent
from models.responses import (
    DocumentChunkData,
    DocumentChunkedConversionResponse,
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


@router.post("/process-document")
async def process_document(event: DocumentUploadEvent):
    """Convert a non-PDF document from cloud storage to chunks."""
    logger.info(f"Received document processing request for '{event.name}' (task_id={event.taskId}, size={event.size} bytes)")
    try:
        result = await _convert_document(event)
        logger.info(f"Successfully processed document '{event.name}' (task_id={event.taskId})")
        return result
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        logger.error(f"Storage error processing document '{event.name}': {error_code} - {str(e)}")
        if error_code == "NoSuchKey":
            raise HTTPException(
                status_code=404,
                detail=f"File not found: {event.name}"
            )
        raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to process document '{event.name}' (task_id={event.taskId}): {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to convert document: {str(e)}")


async def _convert_document(event: DocumentUploadEvent) -> ProcessingResponse:
    """Full document processing workflow with embeddings and database storage."""
    task_id = event.taskId
    course_id, shortened_filename = event.name.split("/")

    try:
        logger.info(f"Updating task status to 'processing' for task_id={task_id}")
        await update_status_to_processing(task_id)

        logger.info(f"Converting document to chunks: {event.name}")
        chunks_response = await _convert_document_to_chunks("files-bucket", event.name)

        if not chunks_response.chunks:
            logger.warning(f"No content chunks generated from document: {event.name}")
            raise ValueError("No content chunks generated from document")

        logger.info(f"Generated {len(chunks_response.chunks)} chunks from document: {event.name}")

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
            int(event.size), embedded_chunks, event.pageNumberOffset
        )
        logger.info(f"Successfully uploaded chunks to database (task_id={task_id})")

        logger.info(f"Updating task status to 'finished' for task_id={task_id}")
        await update_status_to_finished(task_id)

        return ProcessingResponse(
            success=True,
            message=f"Successfully processed document {shortened_filename}",
            chunks_processed=len(embedded_chunks)
        )

    except Exception as error:
        await handle_processing_error("files-bucket", event, error)
        raise error


async def _convert_document_to_chunks(
    bucket: str,
    key: str
) -> DocumentChunkedConversionResponse:
    """Convert document to chunks without full processing."""
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

    logger.debug(f"Initializing chunker and processing document")
    chunker = HybridChunker(tokenizer=get_tokenizer())
    chunk_iter = chunker.chunk(dl_doc=result.document)

    chunks: List[DocumentChunkData] = []
    for idx, chunk in enumerate(chunk_iter):
        contextualized_text = chunker.contextualize(chunk=chunk)

        logger.debug(f"Created chunk {idx}: {contextualized_text[:60]}... (length: {len(contextualized_text)} characters)")

        if not contextualized_text.strip():
            logger.debug(f"Skipping empty chunk at index {idx}")
            continue

        chunks.append(DocumentChunkData(
            contextualized_content=contextualized_text,
            chunk_index=idx
        ))

    logger.debug(f"Created {len(chunks)} chunks from document")
    return DocumentChunkedConversionResponse(
        chunks=chunks,
        total_chunks=len(chunks),
        success=True,
        message=f"Successfully converted and chunked document {key}"
    )
