"""
Docling Microservice
Converts various file formats to Markdown using IBM's Docling library.
Reads files from cloud storage (Google Cloud Storage, AWS S3, Cloudflare R2, or local MinIO).
Supports full document processing with embeddings and database storage.
Works across multiple cloud providers with unified storage interface.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from db.postgres import get_connection_pool

# Import routers
from routes.health import router as health_router
from routes.convert import router as convert_router
from routes.process_document import router as document_router
from routes.process_pdf import router as pdf_router


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
    description="Convert various file formats to Markdown from cloud storage",
    version="1.0.0",
    lifespan=lifespan
)

# Include routers
app.include_router(health_router, tags=["health"])
app.include_router(convert_router, tags=["convert"])
app.include_router(document_router, tags=["process-document"])
app.include_router(pdf_router, tags=["process-pdf"])


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
