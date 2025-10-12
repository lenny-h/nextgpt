"""
Response models for the Docling microservice
"""

from typing import Optional, List, Dict
from pydantic import BaseModel


class ConversionResponse(BaseModel):
    """Response model for file conversion"""
    markdown: str
    success: bool
    message: Optional[str] = None


class PdfChunkData(BaseModel):
    """Individual chunk of PDF content with positioning metadata"""
    contextualized_content: str
    chunk_index: int
    page_index: int
    bbox: Optional[Dict[str, float]] = None  # {x0, y0, x1, y1} coordinates


class DocumentChunkData(BaseModel):
    """Individual chunk of non-PDF document content"""
    contextualized_content: str
    chunk_index: int


class PdfChunkedConversionResponse(BaseModel):
    """Response model for chunked PDF conversion"""
    chunks: List[PdfChunkData]
    total_chunks: int
    success: bool
    message: Optional[str] = None


class DocumentChunkedConversionResponse(BaseModel):
    """Response model for chunked document conversion"""
    chunks: List[DocumentChunkData]
    total_chunks: int
    success: bool
    message: Optional[str] = None


class ProcessingResponse(BaseModel):
    """Response model for full document processing (with embeddings and DB storage)"""
    success: bool
    message: str
    chunks_processed: int
