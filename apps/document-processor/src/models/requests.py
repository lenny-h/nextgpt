"""
Request models for the Docling microservice
"""

from pydantic import BaseModel
from typing import Optional

from docling.datamodel.pipeline_options import PdfPipelineOptions


class DocumentUploadEvent(BaseModel):
    """Event data from document upload trigger"""
    taskId: str
    bucketId: str
    name: str
    size: str
    contentType: str
    pageNumberOffset: int
    pipelineOptions: Optional[PdfPipelineOptions] = None
