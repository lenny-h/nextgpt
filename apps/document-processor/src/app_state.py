"""
Shared application state and dependencies.
This module provides singleton instances that are shared across the application.
"""

from google.cloud import storage
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions

from tokenizer import get_tokenizer


# Initialize Docling converter with chunking options
pipeline_options = PdfPipelineOptions()
pipeline_options.do_ocr = False
pipeline_options.do_formula_enrichment = True
pipeline_options.do_code_enrichment = False
pipeline_options.do_table_structure = False
pipeline_options.do_picture_description = False

converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    }
)

# Initialize GCS client
storage_client = storage.Client()

# Export get_tokenizer for use in routes
__all__ = ['converter', 'storage_client', 'get_tokenizer']
