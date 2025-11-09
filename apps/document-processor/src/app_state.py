"""
Shared application state and dependencies.
This module provides singleton instances that are shared across the application.
Uses lazy initialization to avoid creating clients at import time.
"""

from typing import Optional

import threading
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions

from utils.tokenizer import get_tokenizer
from logger import setup_logger

# Configure logger
logger = setup_logger(__name__)

# Singleton storage for lazy initialization
_converter: Optional[DocumentConverter] = None
_converter_lock = threading.Lock()


def get_converter() -> DocumentConverter:
    """
    Get or create the Docling converter singleton.
    Lazily initializes the converter on first access (thread-safe).

    Returns:
        DocumentConverter: Initialized Docling converter with default options
    """
    global _converter
    if _converter is None:
        with _converter_lock:
            # Double-check after acquiring lock
            if _converter is None:
                logger.info("Initializing Docling document converter with default pipeline options")
                # Initialize with default pipeline options
                pipeline_options = PdfPipelineOptions()
                pipeline_options.do_ocr = False
                pipeline_options.do_formula_enrichment = False
                pipeline_options.do_code_enrichment = False
                pipeline_options.do_table_structure = False
                pipeline_options.do_picture_description = False

                logger.debug("Pipeline options: OCR=False, Formula=False, Code=False, Table=False, Picture=False")

                _converter = DocumentConverter(
                    format_options={
                        InputFormat.PDF: PdfFormatOption(
                            pipeline_options=pipeline_options)
                    }
                )
                logger.info("Docling document converter initialized successfully")
    else:
        logger.debug("Returning existing Docling converter instance")
    return _converter


# Export functions and tokenizer utility
__all__ = ['get_converter', 'get_tokenizer']
