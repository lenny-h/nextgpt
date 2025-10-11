"""
PostgreSQL database operations for storing processed documents and chunks
"""

import os
from typing import List, Optional
import psycopg2
from psycopg2.extras import execute_values
from psycopg2.extensions import connection as Connection


class EmbeddedChunk:
    """Represents a document chunk with embedding"""

    def __init__(
        self,
        page_id: str,
        page_index: int,
        embedding: List[float],
        content: str,
        page_number: int
    ):
        self.page_id = page_id
        self.page_index = page_index
        self.embedding = embedding
        self.content = content
        self.page_number = page_number


def get_db_connection() -> Connection:
    """Create and return a database connection using DATABASE_URL from environment"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is not set")

    return psycopg2.connect(database_url)


def upload_to_postgres_db(
    task_id: str,
    course_id: str,
    filename: str,
    file_size: int,
    processed_chunks: List[EmbeddedChunk],
    page_count: Optional[int] = None,
) -> None:
    """
    Upload processed document chunks to PostgreSQL database.

    Creates file record and associated page/chunk records.
    Performs atomic transaction - rolls back on error.

    Args:
        task_id: Unique task identifier (used as file ID)
        course_id: Course UUID the file belongs to
        filename: Name of the file
        file_size: Size of the file in bytes
        processed_chunks: List of embedded chunks to store
        page_count: Optional total number of pages in the document (only available for PDFs)
    """
    conn = None
    inserted_file_id = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get course name
        cursor.execute(
            "SELECT name FROM courses WHERE id = %s LIMIT 1",
            (course_id,)
        )
        course_result = cursor.fetchone()

        if not course_result:
            raise ValueError(f"Course not found: {course_id}")

        course_name = course_result[0]

        # Insert file record
        cursor.execute(
            """
            INSERT INTO files (id, course_id, name, size, page_count)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (task_id, course_id, filename, file_size, page_count)
        )
        inserted_file_id = task_id

        # Prepare pages/chunks data for batch insert
        CHUNK_SIZE = 100

        for i in range(0, len(processed_chunks), CHUNK_SIZE):
            chunk_batch = processed_chunks[i:i + CHUNK_SIZE]

            pages_to_insert = []
            for chunk_data in chunk_batch:
                # Build row tuple
                row = (
                    chunk_data.page_id,
                    inserted_file_id,
                    filename,
                    course_id,
                    course_name,
                    chunk_data.embedding,
                    chunk_data.content,
                    chunk_data.page_index,
                    chunk_data.page_number if chunk_data.page_number != 0 and isinstance(
                        chunk_data.page_number, int) else chunk_data.page_index + 1
                )
                pages_to_insert.append(row)

            # Batch insert pages
            execute_values(
                cursor,
                """
                INSERT INTO pages 
                (id, file_id, file_name, course_id, course_name, embedding, content, 
                 page_index, page_number)
                VALUES %s
                """,
                pages_to_insert
            )

        conn.commit()

    except Exception as e:
        if conn:
            conn.rollback()

        # Cleanup on failure
        if inserted_file_id and conn:
            try:
                cursor = conn.cursor()
                cursor.execute(
                    "DELETE FROM pages WHERE file_id = %s",
                    (inserted_file_id,)
                )
                cursor.execute(
                    "DELETE FROM files WHERE id = %s",
                    (inserted_file_id,)
                )
                conn.commit()
            except Exception as cleanup_error:
                print(f"Failed to cleanup after error: {cleanup_error}")

        raise e

    finally:
        if conn:
            conn.close()


def update_status_to_processing(task_id: str) -> None:
    """Update task status to 'processing'"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tasks SET status = 'processing' WHERE id = %s",
            (task_id,)
        )
        conn.commit()
    finally:
        if conn:
            conn.close()


def update_status_to_finished(task_id: str) -> None:
    """Update task status to 'finished'"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tasks SET status = 'finished' WHERE id = %s",
            (task_id,)
        )
        conn.commit()
    finally:
        if conn:
            conn.close()


def update_status_to_failed(task_id: str, bucket_id: str) -> None:
    """
    Update task status to 'failed' and adjust bucket size.
    Performs atomic transaction.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Update task status to failed
        cursor.execute(
            "UPDATE tasks SET status = 'failed' WHERE id = %s",
            (task_id,)
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
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()
