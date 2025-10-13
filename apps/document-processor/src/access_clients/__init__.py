"""
Access clients for external services.
This module provides singleton clients for S3/R2, Google Cloud Storage, and Vertex AI.
"""

from .s3_client import get_s3_client, get_object_bytes, get_object_response, delete_file_from_s3
from .google_storage_client import get_storage_client
from .vertex_ai_client import get_vertex_ai_client, embed_content

__all__ = [
    'get_s3_client',
    'get_object_bytes',
    'get_object_response',
    'delete_file_from_s3',
    'get_storage_client',
    'get_vertex_ai_client',
    'embed_content'
]
