"""
PostgreSQL database operations for storing processed documents and chunks

Optimized for job-based execution - uses direct synchronous connections
since each job runs as a single process and terminates after completion.
"""

import os
import json
from pathlib import Path
from typing import List, Optional
from contextlib import contextmanager
import psycopg

from logger import setup_logger

# Configure logger
logger = setup_logger(__name__)


def _log_sql_statement(query: str, params: tuple) -> None:
    """
    Log SQL statements to a file for test data generation.
    Only logs when SQL_LOG_FILE environment variable is set.
    """
    log_file = os.getenv("SQL_LOG_FILE")
    if not log_file:
        return
    
    logger.debug(f"Logging SQL statement to {log_file}")
    
    try:
        # Create parent directory if it doesn't exist
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Format the SQL statement with parameters
        # For INSERT statements, we want to log them in a way that can be reused
        if query.strip().upper().startswith("INSERT"):
            # Write to file with proper SQL formatting
            with open(log_path, "a", encoding="utf-8") as f:
                # Convert query parameters to SQL-safe format
                formatted_params = []
                for param in params:
                    if param is None:
                        formatted_params.append("NULL")
                    elif isinstance(param, str):
                        # Escape single quotes and wrap in quotes
                        escaped = param.replace("'", "''")
                        formatted_params.append(f"'{escaped}'")
                    elif isinstance(param, bool):
                        formatted_params.append(str(param).upper())
                    elif isinstance(param, (int, float)):
                        formatted_params.append(str(param))
                    elif isinstance(param, list):
                        # Handle arrays (like embeddings) - convert to PostgreSQL array syntax
                        if all(isinstance(x, (int, float)) for x in param):
                            array_str = "[" + ",".join(str(x) for x in param) + "]"
                            formatted_params.append(f"'{array_str}'")
                        else:
                            formatted_params.append(f"'{json.dumps(param)}'")
                    else:
                        # For other types (like JSON), use JSON representation
                        formatted_params.append(f"'{json.dumps(param)}'")
                
                # Replace %s placeholders with actual values
                formatted_query = query
                for param in formatted_params:
                    formatted_query = formatted_query.replace("%s", str(param), 1)
                
                f.write(f"{formatted_query};\n")
            logger.debug("SQL statement logged successfully")
    except Exception as e:
        # Don't fail the main operation if logging fails
        logger.error(f"Failed to log SQL statement: {e}")


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
                    file_query = """
                        INSERT INTO files (id, course_id, name, size, page_count)
                        VALUES (%s, %s, %s, %s, %s)
                        """
                    file_params = (task_id, course_id, filename, file_size, page_count)
                    _log_sql_statement(file_query, file_params)
                    cursor.execute(file_query, file_params)

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
                chunk_query = """
                    INSERT INTO chunks
                    (id, file_id, file_name, course_id, course_name, embedding, content,
                        page_index, page_number, bbox)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                
                # Log each chunk insert statement
                for chunk_row in chunks_to_insert:
                    _log_sql_statement(chunk_query, chunk_row)
                
                cursor.executemany(chunk_query, chunks_to_insert)
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
