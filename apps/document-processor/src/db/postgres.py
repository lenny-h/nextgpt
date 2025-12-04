"""
PostgreSQL database operations for storing processed documents and chunks

Optimized for job-based execution - uses direct synchronous connections
since each job runs as a single process and terminates after completion.
"""

import os
import json
from typing import List, Optional
from contextlib import contextmanager

import psycopg


def _get_connection_string() -> str:
    """Build database connection string from environment variables."""
    database_password = os.getenv("DATABASE_PASSWORD", "")
    database_host = os.getenv("DATABASE_HOST", "")
    if not database_password or not database_host:
        raise ValueError(
            "DATABASE_PASSWORD and DATABASE_HOST environment variables must be set"
        )
    return f"postgresql://postgres:{database_password}@{database_host}/postgres?connect_timeout=10"


@contextmanager
def get_connection():
    """
    Create a direct database connection for the current operation.
    
    For job-based execution, we use direct connections instead of a pool
    since each job runs as a single process and terminates after completion.
    This is more efficient than maintaining a pool for short-lived jobs.
    """
    conn = psycopg.connect(
        _get_connection_string(),
        options="-c statement_timeout=60000"  # 60 second query timeout
    )
    try:
        yield conn
    finally:
        conn.close()


class EmbeddedChunk:
    """Represents a document chunk with embedding"""

    def __init__(
        self,
        page_id: str,
        page_index: int,
        embedding: List[float],
        content: str,
        bbox: Optional[tuple[float, float, float, float]] = None,
    ):
        self.page_id = page_id
        self.page_index = page_index
        self.embedding = embedding
        self.content = content
        self.bbox = bbox


def upload_to_postgres_db(
    task_id: str,
    course_id: str,
    filename: str,
    file_size: int,
    processed_chunks: List[EmbeddedChunk],
    page_number_offset: int,
    page_count: Optional[int] = None,
    is_first_batch: bool = True,
) -> None:
    """
    Upload processed document chunks to PostgreSQL database.

    Creates file record (on first batch) and associated chunk records.
    Supports incremental batch uploads for memory efficiency.

    Args:
        task_id: Unique task identifier (used as file ID)
        course_id: Course UUID the file belongs to
        filename: Name of the file
        file_size: Size of the file in bytes
        processed_chunks: List of embedded chunks to store
        page_number_offset: Offset for page numbering
        page_count: Optional total number of pages in the document (only available for PDFs)
        is_first_batch: Whether this is the first batch (creates file record)
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            try:
                # Get course name
                cursor.execute(
                    "SELECT name FROM courses WHERE id = %s LIMIT 1",
                    (course_id,)
                )
                course_result = cursor.fetchone()

                if not course_result:
                    raise ValueError(f"Course not found: {course_id}")

                course_name = course_result[0]

                # Insert file record only on first batch
                if is_first_batch:
                    cursor.execute(
                        """
                        INSERT INTO files (id, course_id, name, size, page_count)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (task_id, course_id, filename, file_size, page_count)
                    )

                # Prepare chunks data for batch insert
                chunks_to_insert = []
                for chunk_data in processed_chunks:
                    # Convert bbox tuple to JSON-compatible list
                    bbox_json = json.dumps(list(chunk_data.bbox)) if chunk_data.bbox else None

                    row = (
                        chunk_data.page_id,
                        task_id,
                        filename,
                        course_id,
                        course_name,
                        chunk_data.embedding,
                        chunk_data.content,
                        chunk_data.page_index,
                        max(0, chunk_data.page_index +
                            1 - page_number_offset),
                        bbox_json
                    )
                    chunks_to_insert.append(row)

                # Batch insert chunks using executemany
                cursor.executemany(
                    """
                    INSERT INTO chunks
                    (id, file_id, file_name, course_id, course_name, embedding, content,
                        page_index, page_number, bbox)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    chunks_to_insert
                )
                conn.commit()

            except Exception as e:
                conn.rollback()

                # Cleanup on failure - delete all chunks and file record
                try:
                    cursor.execute(
                        "DELETE FROM chunks WHERE file_id = %s",
                        (task_id,)
                    )
                    cursor.execute(
                        "DELETE FROM files WHERE id = %s",
                        (task_id,)
                    )
                    conn.commit()
                except Exception as cleanup_error:
                    print(
                        f"Failed to cleanup after error: {cleanup_error}")

                raise e


def update_status_to_processing(task_id: str) -> None:
    """Update task status to 'processing'"""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE tasks SET status = 'processing' WHERE id = %s",
                (task_id,)
            )
            conn.commit()


def update_status_to_finished(task_id: str) -> None:
    """Update task status to 'finished'"""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE tasks SET status = 'finished' WHERE id = %s",
                (task_id,)
            )
            conn.commit()


def update_status_to_failed(task_id: str, bucket_id: str, error_message: str = "") -> None:
    """
    Update task status to 'failed', set error message, and adjust bucket size.
    Performs atomic transaction.
    
    Args:
        task_id: Task identifier
        bucket_id: Bucket identifier
        error_message: Error message to store (defaults to empty string)
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            try:
                # Update task status to failed and set error message
                cursor.execute(
                    "UPDATE tasks SET status = 'failed', error_message = %s WHERE id = %s",
                    (error_message, task_id)
                )

                # Update bucket size by subtracting the file size
                cursor.execute(
                    """
                    UPDATE buckets
                    SET size = size - (SELECT file_size FROM tasks WHERE id = %s)
                    WHERE id = %s
                    """,
                    (task_id, bucket_id)
                )

                conn.commit()
            except Exception as e:
                conn.rollback()
                raise e
