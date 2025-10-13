"""
S3/R2 client singleton for file operations.
Uses lazy initialization to avoid creating the client at import time.
Thread-safe using double-checked locking pattern.
"""

import os
import threading
import boto3
from typing import Any, Dict, Optional


# Singleton storage for lazy initialization
_s3_client: Optional[Any] = None
_s3_client_lock = threading.Lock()


def get_s3_client() -> Any:
    """
    Get or create the S3/R2 client singleton.
    Lazily initializes the client on first access.
    Thread-safe using double-checked locking.

    Returns:
        boto3.client: Initialized S3/R2 client
    """
    global _s3_client
    if _s3_client is None:
        with _s3_client_lock:
            # Double-check after acquiring lock
            if _s3_client is None:
                r2_endpoint = os.getenv("R2_ENDPOINT")
                aws_access_key_id = os.getenv("CLOUDFLARE_ACCESS_KEY_ID")
                aws_secret_access_key = os.getenv(
                    "CLOUDFLARE_SECRET_ACCESS_KEY")
                if not r2_endpoint or not aws_access_key_id or not aws_secret_access_key:
                    raise ValueError(
                        "R2_ENDPOINT, CLOUDFLARE_ACCESS_KEY_ID, and CLOUDFLARE_SECRET_ACCESS_KEY environment variables must be set")

                _s3_client = boto3.client(
                    "s3",
                    endpoint_url=r2_endpoint,
                    aws_access_key_id=aws_access_key_id,
                    aws_secret_access_key=aws_secret_access_key,
                    region_name="auto",
                )
    return _s3_client


def get_object_bytes(bucket: str, key: str) -> bytes:
    """
    Return the raw bytes of an S3/R2 object.
    """
    client = get_s3_client()
    response = client.get_object(Bucket=bucket, Key=key)
    return response["Body"].read()


def get_object_response(bucket: str, key: str) -> Dict[str, Any]:
    """
    Return the full boto3 get_object response for advanced use.
    Raises ClientError on failure.
    """
    client = get_s3_client()
    return client.get_object(Bucket=bucket, Key=key)


def delete_file_from_s3(bucket: str, key: str) -> None:
    """
    Delete a file from S3/R2 storage.

    Args:
        bucket: S3/R2 bucket name
        key: Object key (path) in the bucket

    Raises:
        ClientError: If the S3 operation fails
    """
    client = get_s3_client()
    client.delete_object(Bucket=bucket, Key=key)
