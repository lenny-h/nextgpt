"""
Docling Microservice
Converts various file formats to Markdown using IBM's Docling library.
Reads files from Google Cloud Storage or S3/R2.
"""

import io
import os
from typing import Optional, List, Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

import boto3
from botocore.exceptions import ClientError
from google.cloud import storage

from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling_core.types.io import DocumentStream

from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from docling_core.transforms.chunker.hierarchical_chunker import DocChunk
from docling_core.types.doc.base import BoundingBox

# Import singleton tokenizer
from tokenizer import get_tokenizer

# Initialize FastAPI app
app = FastAPI(
    title="Docling Microservice",
    description="Convert various file formats to Markdown from Google Cloud Storage",
    version="1.0.0"
)

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

# Initialize S3/R2 client
s3_client = boto3.client(
    "s3",
    endpoint_url=os.getenv("R2_ENDPOINT"),
    aws_access_key_id=os.getenv("CLOUDFLARE_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("CLOUDFLARE_SECRET_ACCESS_KEY"),
    region_name="auto",
)


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str


class ConversionResponse(BaseModel):
    """Response model for file conversion"""
    markdown: str
    success: bool
    message: Optional[str] = None


class PipelineOptionsRequest(BaseModel):
    """Pipeline configuration for PDF document conversion"""
    do_ocr: bool = False
    do_formula_enrichment: bool = True
    do_code_enrichment: bool = False
    do_table_structure: bool = False
    do_picture_description: bool = False


class PdfChunkData(BaseModel):
    """Individual chunk of PDF content with positioning metadata"""
    contextualized_content: str
    chunk_index: int
    page_number: Optional[int] = None
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


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="docling",
        version="1.0.0"
    )


def parse_gcs_url(url: str) -> tuple[str, str]:
    """
    Parse a GCS URL and return bucket name and blob path.

    Only supports the gs://bucket-name/path/to/file format.
    """
    if not url.startswith("gs://"):
        raise ValueError(
            "Only gs:// URLs are supported. Example: gs://bucket-name/path/to/file")

    # gs://bucket-name/path/to/file
    parts = url[5:].split("/", 1)
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise ValueError(
            "Invalid gs:// URL format. Expected: gs://bucket-name/path/to/file")
    return parts[0], parts[1]


@app.post("/convert", response_model=ConversionResponse)
async def convert_file(gcs_url: str):
    """
    Convert a file from Google Cloud Storage to Markdown.

    Args:
        gcs_url: GCS URL in gs://bucket-name/path/to/file format.

    Supported formats:
    - PDF documents
    - PowerPoint presentations (.pptx)
    - Word documents (.docx)
    - Excel spreadsheets (.xlsx, .xls)
    - Images
    - HTML files
    - And more...
    """
    try:
        # Parse GCS URL
        bucket_name, blob_path = parse_gcs_url(gcs_url)

        # Get the file from GCS
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_path)

        if not blob.exists():
            raise HTTPException(
                status_code=404,
                detail=f"File not found: {gcs_url}"
            )

        # Download file content to memory
        file_content = blob.download_as_bytes()

        # Create a file-like object from bytes
        buf = io.BytesIO(file_content)
        source = DocumentStream(name="my_doc.pdf", stream=buf)

        # Convert to markdown using Docling
        result = converter.convert(source)

        # Export to markdown
        markdown_content = result.document.export_to_markdown()

        return ConversionResponse(
            markdown=markdown_content,
            success=True,
            message=f"Successfully converted {blob_path}"
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to convert file: {str(e)}"
        )


@app.post("/convert-pdf-from-s3", response_model=PdfChunkedConversionResponse)
async def convert_pdf_from_s3(
    bucketId: str,
    key: str,
    pipeline_options: Optional[PipelineOptionsRequest] = None
):
    """
    Convert a PDF from S3/R2 to chunks with page numbers and bounding boxes.

    Args:
        bucketId: S3/R2 bucket name
        key: Object key (path) in the bucket
        pipeline_options: Optional pipeline configuration (OCR, table structure, etc.)

    Returns chunks with:
    - Contextualized content (best for embeddings)
    - Page number where chunk starts
    - Bounding box coordinates
    """
    try:
        # Download file from S3/R2
        response = s3_client.get_object(Bucket=bucketId, Key=key)
        file_content = response["Body"].read()

        # Create a file-like object from bytes
        buf = io.BytesIO(file_content)
        source = DocumentStream(name=f"document.pdf", stream=buf)

        # Create converter with custom pipeline options if provided
        if pipeline_options:
            custom_pipeline_options = PdfPipelineOptions()
            custom_pipeline_options.do_ocr = pipeline_options.do_ocr
            custom_pipeline_options.do_formula_enrichment = pipeline_options.do_formula_enrichment
            custom_pipeline_options.do_code_enrichment = pipeline_options.do_code_enrichment
            custom_pipeline_options.do_table_structure = pipeline_options.do_table_structure
            custom_pipeline_options.do_picture_description = pipeline_options.do_picture_description

            custom_converter = DocumentConverter(
                format_options={
                    InputFormat.PDF: PdfFormatOption(
                        pipeline_options=custom_pipeline_options)
                }
            )
            result = custom_converter.convert(source)
        else:
            # Use default converter
            result = converter.convert(source)

        doc = result.document

        custom_chunker = HybridChunker(tokenizer=get_tokenizer())
        chunk_iter = custom_chunker.chunk(dl_doc=doc)

        # Process chunks and extract PDF-specific metadata
        chunks: List[PdfChunkData] = []
        for idx, chunk in enumerate(chunk_iter):
            # Get contextualized content (includes hierarchical context)
            contextualized_text = custom_chunker.contextualize(chunk=chunk)

            doc_chunk = DocChunk.model_validate(chunk)

            # Extract page number and bounding box from chunk metadata
            page_number = doc_chunk.meta.doc_items[0].prov[0].page_no
            bbox_obj = BoundingBox.enclosing_bbox(
                [prov_item.bbox for item in doc_chunk.meta.doc_items for prov_item in item.prov])

            # Convert bounding box to Dict[str, float] expected by the response model.
            # BoundingBox.as_tuple() -> (x0, y0, x1, y1)
            bbox_dict = None
            if bbox_obj is not None:
                x0, y0, x1, y1 = bbox_obj.as_tuple()
                bbox_dict = {"x0": x0, "y0": y0, "x1": x1, "y1": y1}

            chunks.append(PdfChunkData(
                contextualized_content=contextualized_text,
                chunk_index=idx,
                page_number=page_number,
                bbox=bbox_dict
            ))

        return PdfChunkedConversionResponse(
            chunks=chunks,
            total_chunks=len(chunks),
            success=True,
            message=f"Successfully converted and chunked PDF {key}"
        )

    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        if error_code == "NoSuchKey":
            raise HTTPException(
                status_code=404,
                detail=f"File not found in S3 for bucket: {bucketId}, key: {key}"
            )
        raise HTTPException(
            status_code=500,
            detail=f"S3 error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to convert PDF: {str(e)}"
        )


@app.post("/convert-document-from-s3", response_model=DocumentChunkedConversionResponse)
async def convert_document_from_s3(bucketId: str, key: str):
    """
    Convert a non-PDF document from S3/R2 to chunks.

    Args:
        bucketId: S3/R2 bucket name
        key: Object key (path) in the bucket

    Supported formats:
    - PowerPoint presentations (.pptx)
    - Word documents (.docx)
    - Excel spreadsheets (.xlsx, .xls)
    - Images
    - HTML files
    - And more...

    Note: Page numbers and bounding boxes are not available for non-PDF documents.
    """
    try:
        # Download file from S3/R2
        response = s3_client.get_object(Bucket=bucketId, Key=key)
        file_content = response["Body"].read()

        # Determine file extension from key
        file_extension = key.split(".")[-1].lower() if "." in key else "docx"

        # Create a file-like object from bytes
        buf = io.BytesIO(file_content)
        source = DocumentStream(name=f"document.{file_extension}", stream=buf)

        # Convert to DoclingDocument using default converter
        result = converter.convert(source)
        doc = result.document

        custom_chunker = HybridChunker(tokenizer=get_tokenizer())
        chunk_iter = custom_chunker.chunk(dl_doc=doc)

        # Process chunks
        chunks: List[DocumentChunkData] = []
        for idx, chunk in enumerate(chunk_iter):
            # Get contextualized content (includes hierarchical context)
            contextualized_text = custom_chunker.contextualize(chunk=chunk)

            chunks.append(DocumentChunkData(
                contextualized_content=contextualized_text,
                chunk_index=idx
            ))

        return DocumentChunkedConversionResponse(
            chunks=chunks,
            total_chunks=len(chunks),
            success=True,
            message=f"Successfully converted and chunked document {key}"
        )

    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        if error_code == "NoSuchKey":
            raise HTTPException(
                status_code=404,
                detail=f"File not found in S3 for bucket: {bucketId}, key: {key}"
            )
        raise HTTPException(
            status_code=500,
            detail=f"S3 error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to convert document: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8080"))

    print(f"Starting Docling microservice on port {port}...")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
