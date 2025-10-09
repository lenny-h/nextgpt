"""
S3/R2 client utilities for file operations
"""

import os
import boto3
from typing import Any, Dict


# Initialize S3/R2 client
s3_client = boto3.client(
    "s3",
    endpoint_url=os.getenv("R2_ENDPOINT"),
    aws_access_key_id=os.getenv("CLOUDFLARE_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("CLOUDFLARE_SECRET_ACCESS_KEY"),
    region_name="auto",
)


def get_object_bytes(bucket: str, key: str) -> bytes:
    """
    Return the raw bytes of an S3/R2 object.
    """
    response = s3_client.get_object(Bucket=bucket, Key=key)
    return response["Body"].read()


def get_object_response(bucket: str, key: str) -> Dict[str, Any]:
    """
    Return the full boto3 get_object response for advanced use.
    Raises ClientError on failure.
    """
    return s3_client.get_object(Bucket=bucket, Key=key)


def delete_file_from_s3(bucket: str, key: str) -> None:
    """
    Delete a file from S3/R2 storage.

    Args:
        bucket: S3/R2 bucket name
        key: Object key (path) in the bucket

    Raises:
        ClientError: If the S3 operation fails
    """
    s3_client.delete_object(Bucket=bucket, Key=key)
