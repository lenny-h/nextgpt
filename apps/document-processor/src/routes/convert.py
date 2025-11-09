import io
from fastapi import APIRouter, HTTPException

from docling_core.types.io import DocumentStream
from models.responses import ConversionResponse

from app_state import get_converter
from access_clients import get_storage_client

from logger import setup_logger

router = APIRouter()

# Configure logger
logger = setup_logger(__name__)


@router.post("/convert", response_model=ConversionResponse)
async def convert_file(key):
    """
    Convert a file from cloud storage to Markdown.
    """
    logger.info(f"Received conversion request for file: {key}")
    try:
        logger.debug(f"Fetching file from temporary-files-bucket: {key}")
        storage_client = get_storage_client()
        file_content = storage_client.get_object_bytes(
            "temporary-files-bucket", key)
        logger.debug(f"Retrieved file from storage (size: {len(file_content)} bytes)")

        # Create a file-like object from bytes
        buf = io.BytesIO(file_content)
        source = DocumentStream(name=key, stream=buf)

        # Convert to markdown using Docling
        logger.debug(f"Converting file to markdown using Docling")
        converter = get_converter()
        result = converter.convert(source)

        # Export to markdown
        markdown_content = result.document.export_to_markdown()
        logger.info(f"Successfully converted file to markdown: {key} ({len(markdown_content)} characters)")

        return ConversionResponse(
            markdown=markdown_content,
            success=True,
            message=f"Successfully converted {key}"
        )

    except ValueError as e:
        logger.warning(f"Invalid request for file conversion '{key}': {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to convert file '{key}': {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to convert file: {str(e)}"
        )
