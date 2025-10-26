"""
FastAPI route handlers for document processing.
"""

from .health import router as health_router
from .convert import router as convert_router
from .process_document import router as document_router
from .process_pdf import router as pdf_router

__all__ = [
    "health_router",
    "convert_router",
    "document_router",
    "pdf_router",
]
