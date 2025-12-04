"""
Job Runner for Document Processing

This module provides a CLI entrypoint for running document processing jobs
directly, designed for use with:
- AWS ECS Tasks triggered by EventBridge
- GCloud Cloud Run Jobs triggered by Cloud Tasks

The job receives event data via environment variables and processes
the document synchronously until completion.

Usage:
    python -m job_runner

Environment Variables Required:
    JOB_TYPE: "process-pdf" or "process-document"
    TASK_ID: Unique task identifier
    BUCKET_ID: Bucket identifier
    FILE_NAME: Path to the file in storage (course_id/filename)
    FILE_SIZE: Size of the file in bytes
    CONTENT_TYPE: MIME type of the file
    PAGE_NUMBER_OFFSET: Offset for page numbering (default: 0)
    
Optional for PDFs:
    DO_OCR: "true" or "false"
    DO_TABLE_STRUCTURE: "true" or "false"
    DO_FORMULA_ENRICHMENT: "true" or "false"
    DO_CODE_ENRICHMENT: "true" or "false"
    DO_PICTURE_DESCRIPTION: "true" or "false"
"""

import os
import sys
from typing import Optional

from docling.datamodel.pipeline_options import PdfPipelineOptions

from models.requests import DocumentUploadEvent
from routes.process_pdf import convert_pdf
from routes.process_document import convert_document
from logger import setup_logger, configure_library_logging

logger = setup_logger(__name__)


def get_env_bool(name: str, default: bool = False) -> bool:
    """Get boolean environment variable."""
    value = os.getenv(name, str(default)).lower()
    return value == "true"


def get_pipeline_options() -> Optional[PdfPipelineOptions]:
    """Build PdfPipelineOptions from environment variables if any are set."""
    # Check if any pipeline option is explicitly set
    option_vars = [
        "DO_OCR", "DO_TABLE_STRUCTURE", "DO_FORMULA_ENRICHMENT",
        "DO_CODE_ENRICHMENT", "DO_PICTURE_DESCRIPTION"
    ]
    
    if not any(os.getenv(var) for var in option_vars):
        return None
    
    options = PdfPipelineOptions()
    options.do_ocr = get_env_bool("DO_OCR", False)
    options.do_table_structure = get_env_bool("DO_TABLE_STRUCTURE", False)
    options.do_formula_enrichment = get_env_bool("DO_FORMULA_ENRICHMENT", False)
    options.do_code_enrichment = get_env_bool("DO_CODE_ENRICHMENT", False)
    options.do_picture_description = get_env_bool("DO_PICTURE_DESCRIPTION", False)
    
    return options


def build_event_from_env() -> DocumentUploadEvent:
    """Build DocumentUploadEvent from environment variables."""
    task_id = os.environ.get("TASK_ID")
    bucket_id = os.environ.get("BUCKET_ID")
    file_name = os.environ.get("FILE_NAME")
    file_size = os.environ.get("FILE_SIZE")
    content_type = os.environ.get("CONTENT_TYPE")
    page_number_offset = int(os.environ.get("PAGE_NUMBER_OFFSET", "0"))
    
    # Validate required fields
    missing = []
    if not task_id:
        missing.append("TASK_ID")
    if not bucket_id:
        missing.append("BUCKET_ID")
    if not file_name:
        missing.append("FILE_NAME")
    if not file_size:
        missing.append("FILE_SIZE")
    
    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
    
    return DocumentUploadEvent(
        taskId=task_id,
        bucketId=bucket_id,
        name=file_name,
        size=file_size,
        contentType=content_type,
        pageNumberOffset=page_number_offset,
        pipelineOptions=get_pipeline_options()
    )


def run_job():
    """Main job runner entry point."""
    configure_library_logging()
    
    job_type = os.environ.get("JOB_TYPE", "").lower()
    
    if job_type not in ("process-pdf", "process-document"):
        logger.error(f"Invalid JOB_TYPE: '{job_type}'. Must be 'process-pdf' or 'process-document'")
        sys.exit(1)
    
    try:
        # Build event from environment
        event = build_event_from_env()
        logger.info(f"Starting {job_type} job for task_id={event.taskId}, file={event.name}")
        
        # Run the appropriate processor
        if job_type == "process-pdf":
            result = convert_pdf(event)
        else:
            result = convert_document(event)
        
        logger.info(f"Job completed successfully: {result.message}")
        logger.info(f"Chunks processed: {result.chunks_processed}")
        
    except Exception as e:
        logger.error(f"Job failed with error: {str(e)}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    run_job()
