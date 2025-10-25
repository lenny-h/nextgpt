import io
from fastapi import APIRouter, HTTPException

from docling_core.types.io import DocumentStream
from models.responses import ConversionResponse

from app_state import get_converter
from access_clients import get_storage_client

router = APIRouter()


@router.post("/convert", response_model=ConversionResponse)
async def convert_file(key):
    """
    Convert a file from cloud storage to Markdown.
    """
    try:
        storage_client = get_storage_client()
        file_content = storage_client.get_object_bytes(
            "temporary-files-bucket", key)

        # Create a file-like object from bytes
        buf = io.BytesIO(file_content)
        source = DocumentStream(name=key, stream=buf)

        # Convert to markdown using Docling
        converter = get_converter()
        result = converter.convert(source)

        # Export to markdown
        markdown_content = result.document.export_to_markdown()

        return ConversionResponse(
            markdown=markdown_content,
            success=True,
            message=f"Successfully converted {key}"
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
