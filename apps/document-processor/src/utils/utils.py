from typing import List, Union
from uuid import uuid4

from models.responses import PdfChunkData, DocumentChunkData
from db.postgres import EmbeddedChunk
from access_clients import delete_file_from_s3
from db.postgres import update_status_to_failed
from models.requests import DocumentUploadEvent


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


async def handle_processing_error(event: DocumentUploadEvent, error: Exception):
    """Handle errors during document/PDF processing with cleanup."""
    try:
        delete_file_from_s3(event.bucket, event.name)
    except Exception as e:
        print(f"Failed to clean up source file: {e}")

    try:
        await update_status_to_failed(event.taskId, event.bucket)
    except Exception as e:
        print(f"Failed to update task status: {e}")

    print(f"Error processing file: {error}")
