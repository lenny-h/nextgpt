"""
PostgreSQL database operations for storing processed documents and chunks
"""

import os
import asyncio
from typing import List, Optional

from psycopg_pool import AsyncConnectionPool


# Connection pool singleton for async database access
_connection_pool: Optional[AsyncConnectionPool] = None
_pool_lock = asyncio.Lock()


async def get_connection_pool() -> AsyncConnectionPool:
    """
    Get or create the async database connection pool singleton.
    Async-safe using double-checked locking.

    Returns:
        AsyncConnectionPool: PostgreSQL async connection pool
    """
    global _connection_pool
    if _connection_pool is None:
        async with _pool_lock:
            # Double-check after acquiring lock
            if _connection_pool is None:
                database_password = os.getenv("DATABASE_PASSWORD", "")
                database_host = os.getenv("DATABASE_HOST", "")
                if not database_password or not database_host:
                    raise ValueError(
                        "DATABASE_PASSWORD and DATABASE_HOST environment variables must be set"
                    )

                database_url = (
                    f"postgresql://postgres:{database_password}@{database_host}/postgres"
                )

                # Create an async connection pool with min 2 and max 20 connections
                _connection_pool = AsyncConnectionPool(
                    conninfo=database_url,
                    min_size=2,
                    max_size=20,
                    open=False
                )
                # Open the pool
                await _connection_pool.open()
    return _connection_pool


class EmbeddedChunk:
    """Represents a document chunk with embedding"""

    def __init__(
        self,
        page_id: str,
        chunk_index: int,
        page_index: int,
        embedding: List[float],
        content: str,
    ):
        self.page_id = page_id
        self.chunk_index = chunk_index
        self.page_index = page_index
        self.embedding = embedding
        self.content = content


async def upload_to_postgres_db(
    task_id: str,
    course_id: str,
    filename: str,
    file_size: int,
    processed_chunks: List[EmbeddedChunk],
    page_number_offset: int,
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
    pool = await get_connection_pool()
    inserted_file_id = None

    async with pool.connection() as conn:
        async with conn.cursor() as cursor:
            try:
                # Get course name
                await cursor.execute(
                    "SELECT name FROM courses WHERE id = %s LIMIT 1",
                    (course_id,)
                )
                course_result = await cursor.fetchone()

                if not course_result:
                    raise ValueError(f"Course not found: {course_id}")

                course_name = course_result[0]

                # Insert file record
                await cursor.execute(
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
                            chunk_data.chunk_index,
                            max(0, chunk_data.page_index +
                                1 - page_number_offset)
                        )
                        pages_to_insert.append(row)

                    # Batch insert pages using executemany
                    await cursor.executemany(
                        """
                        INSERT INTO pages
                        (id, file_id, file_name, course_id, course_name, embedding, content,
                         page_index, page_number)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        pages_to_insert
                    )

                await conn.commit()

            except Exception as e:
                await conn.rollback()

                # Cleanup on failure
                if inserted_file_id:
                    try:
                        await cursor.execute(
                            "DELETE FROM pages WHERE file_id = %s",
                            (inserted_file_id,)
                        )
                        await cursor.execute(
                            "DELETE FROM files WHERE id = %s",
                            (inserted_file_id,)
                        )
                        await conn.commit()
                    except Exception as cleanup_error:
                        print(
                            f"Failed to cleanup after error: {cleanup_error}")

                raise e


async def update_status_to_processing(task_id: str) -> None:
    """Update task status to 'processing'"""
    pool = await get_connection_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                "UPDATE tasks SET status = 'processing' WHERE id = %s",
                (task_id,)
            )
            await conn.commit()


async def update_status_to_finished(task_id: str) -> None:
    """Update task status to 'finished'"""
    pool = await get_connection_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                "UPDATE tasks SET status = 'finished' WHERE id = %s",
                (task_id,)
            )
            await conn.commit()


async def update_status_to_failed(task_id: str, bucket_id: str) -> None:
    """
    Update task status to 'failed' and adjust bucket size.
    Performs atomic transaction.
    """
    pool = await get_connection_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cursor:
            try:
                # Update task status to failed
                await cursor.execute(
                    "UPDATE tasks SET status = 'failed' WHERE id = %s",
                    (task_id,)
                )

                # Update bucket size by subtracting the file size
                await cursor.execute(
                    """
                    UPDATE buckets
                    SET size = size - (SELECT file_size FROM tasks WHERE id = %s)
                    WHERE id = %s
                    """,
                    (task_id, bucket_id)
                )

                await conn.commit()
            except Exception as e:
                await conn.rollback()
                raise e
