"""
FastAPI route handlers for document processing.
"""

from .process_document import convert_document
from .process_pdf import convert_pdf

__all__ = [
    "convert_document",
    "convert_pdf",
]
