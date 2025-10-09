import io
from typing import List

from fastapi import APIRouter, HTTPException
from botocore.exceptions import ClientError

from docling_core.types.io import DocumentStream
from docling_core.transforms.chunker.hybrid_chunker import HybridChunker

from app_state import converter, get_tokenizer
from routes.shared_utils import create_embedded_chunk, handle_processing_error

from models.requests import DocumentUploadEvent
from models.responses import (
    DocumentChunkData,
    DocumentChunkedConversionResponse,
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


@router.post("/convert-document-from-s3")
async def convert_document_from_s3(event: DocumentUploadEvent):
    """Convert a non-PDF document from S3/R2 to chunks."""
    try:
        return await _process_document(event)
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
            status_code=500, detail=f"Failed to convert document: {str(e)}")


async def _convert_document_to_chunks(
    bucketId: str,
    key: str
) -> DocumentChunkedConversionResponse:
    """Convert document to chunks without full processing."""
    file_content = get_object_bytes(bucketId, key)

    file_extension = key.split(".")[-1].lower() if "." in key else "docx"
    buf = io.BytesIO(file_content)
    source = DocumentStream(name=f"document.{file_extension}", stream=buf)

    result = converter.convert(source)

    chunker = HybridChunker(tokenizer=get_tokenizer())
    chunk_iter = chunker.chunk(dl_doc=result.document)

    chunks: List[DocumentChunkData] = []
    for idx, chunk in enumerate(chunk_iter):
        contextualized_text = chunker.contextualize(chunk=chunk)

        chunks.append(DocumentChunkData(
            contextualized_content=contextualized_text,
            chunk_index=idx
        ))

    return DocumentChunkedConversionResponse(
        chunks=chunks,
        total_chunks=len(chunks),
        success=True,
        message=f"Successfully converted and chunked document {key}"
    )


async def _process_document(event: DocumentUploadEvent) -> ProcessingResponse:
    """Full document processing workflow with embeddings and database storage."""
    task_id = event.taskId
    course_id, shortened_filename = event.name.split("/")

    try:
        update_status_to_processing(task_id)

        chunks_response = await _convert_document_to_chunks(event.bucket, event.name)

        if not chunks_response.chunks:
            raise ValueError("No content chunks generated from document")

        chunk_contents = [
            c.contextualized_content for c in chunks_response.chunks]
        embeddings_list = embed_content(chunk_contents)

        embedded_chunks = [
            create_embedded_chunk(chunk, embeddings_list[idx])
            for idx, chunk in enumerate(chunks_response.chunks)
        ]

        upload_to_postgres_db(
            task_id, course_id, shortened_filename,
            int(event.size), embedded_chunks
        )

        update_status_to_finished(task_id)

        return ProcessingResponse(
            success=True,
            message=f"Successfully processed document {shortened_filename}",
            chunks_processed=len(embedded_chunks)
        )

    except Exception as error:
        handle_processing_error(event, error)
        raise error
