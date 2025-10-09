import io
from fastapi import APIRouter, HTTPException

from docling_core.types.io import DocumentStream
from models.responses import ConversionResponse

from app_state import converter, storage_client

router = APIRouter()


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


@router.post("/convert", response_model=ConversionResponse)
async def convert_file(gcs_url: str):
    """
    Convert a file from Google Cloud Storage to Markdown.
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
        source = DocumentStream(name=blob_path, stream=buf)

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
