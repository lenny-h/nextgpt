"""
Docling Microservice
Converts various file formats to Markdown using IBM's Docling library.
Reads files from Google Cloud Storage or S3/R2.
Supports full document processing with embeddings and database storage.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from db.postgres import get_connection_pool

# Import routers
from routes.health import router as health_router
from routes.gcs_convert import router as gcs_router
from routes.s3_pdf import router as s3_pdf_router
from routes.s3_document import router as s3_document_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - initialize and cleanup resources."""
    # Startup: Initialize database connection pool
    pool = await get_connection_pool()
    print("Database connection pool initialized")

    yield

    # Shutdown: Close database connection pool
    await pool.close()
    print("Database connection pool closed")


# Initialize FastAPI app
app = FastAPI(
    title="Docling Microservice",
    description="Convert various file formats to Markdown from Google Cloud Storage",
    version="1.0.0",
    lifespan=lifespan
)

# Include routers
app.include_router(health_router, tags=["health"])
app.include_router(gcs_router, tags=["gcs"])
app.include_router(s3_pdf_router, tags=["s3-pdf"])
app.include_router(s3_document_router, tags=["s3-document"])


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8080"))
    is_dev = os.getenv("ENVIRONMENT", "production") == "development"

    print(f"Starting Docling microservice on port {port}...")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=is_dev  # Only reload in development
    )
