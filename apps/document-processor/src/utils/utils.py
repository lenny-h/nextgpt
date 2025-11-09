from typing import List, Union
from uuid import uuid4

from models.responses import PdfChunkData, DocumentChunkData
from db.postgres import EmbeddedChunk
from access_clients import get_storage_client
from db.postgres import update_status_to_failed
from models.requests import DocumentUploadEvent

from logger import setup_logger

# Configure logger
logger = setup_logger(__name__)


def create_embedded_chunk(
    chunk: Union[PdfChunkData, DocumentChunkData],
    embedding: List[float]
) -> EmbeddedChunk:
    """Create an EmbeddedChunk from a chunk (PDF or Document) and its embedding."""
    page_index = chunk.page_index if isinstance(
        chunk, PdfChunkData) and chunk.page_index else 0

    return EmbeddedChunk(
        page_id=str(uuid4()),
        chunk_index=chunk.chunk_index,
        page_index=page_index,
        embedding=embedding,
        content=chunk.contextualized_content,
    )


async def handle_processing_error(bucket: str, event: DocumentUploadEvent, error: Exception):
    """Handle errors during document/PDF processing with cleanup."""
    logger.error(f"Processing error for file '{event.name}' (task_id={event.taskId}): {error}", exc_info=True)
    
    try:
        logger.info(f"Attempting to clean up source file: {event.name}")
        storage_client = get_storage_client()
        storage_client.delete_file(bucket, event.name)
        logger.info(f"Successfully deleted source file: {event.name}")
    except Exception as e:
        logger.error(f"Failed to clean up source file '{event.name}': {e}", exc_info=True)

    try:
        logger.info(f"Updating task status to failed for task_id={event.taskId}")
        await update_status_to_failed(event.taskId, event.bucketId)
        logger.info(f"Successfully updated task status to failed for task_id={event.taskId}")
    except Exception as e:
        logger.error(f"Failed to update task status to failed for task_id={event.taskId}: {e}", exc_info=True)
