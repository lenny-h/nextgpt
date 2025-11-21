"""
AWS S3 Storage implementation.
Uses lazy initialization to avoid creating the client at import time.
Thread-safe using double-checked locking pattern.
"""

import os
import threading
from typing import Optional, Any

import boto3
from ..interfaces.storage_client import IStorageClient


class AwsStorageClient(IStorageClient):
    """AWS S3 Storage implementation of IStorageClient."""

    def __init__(self):
        self._client: Optional[Any] = None
        self._client_lock = threading.Lock()

    def _get_client(self) -> Any:
        """
        Get or create the S3 client singleton.
        Lazily initializes the client on first access.
        Thread-safe using double-checked locking.

        Returns:
            boto3.client: Initialized S3 client
        """
        if self._client is None:
            with self._client_lock:
                # Double-check after acquiring lock
                if self._client is None:
                    # Use explicit credentials if provided
                    if os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"):
                        self._client = boto3.client(
                            "s3",
                            region_name=os.getenv("AWS_REGION"),
                            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                            aws_secret_access_key=os.getenv(
                                "AWS_SECRET_ACCESS_KEY"),
                        )
                    else:
                        # Let boto3 use its default provider chain
                        self._client = boto3.client("s3")

        return self._client

    def get_object_bytes(self, bucket: str, key: str) -> bytes:
        """
        Retrieve raw bytes of an object from S3.

        Args:
            bucket: S3 bucket name
            key: Object key (path) in the bucket

        Returns:
            bytes: Raw object content

        Raises:
            ClientError: If the S3 operation fails
        """
        bucket_prefix = os.getenv("AWS_PROJECT_NAME")

        if not bucket_prefix:
            raise ValueError(
                "Environment variable 'AWS_PROJECT_NAME' is not set.")

        client = self._get_client()
        response = client.get_object(Bucket=bucket_prefix + bucket, Key=key)
        return response["Body"].read()

    def delete_file(self, bucket: str, key: str) -> None:
        """
        Delete a file from S3 storage.

        Args:
            bucket: S3 bucket name
            key: Object key (path) in the bucket

        Raises:
            ClientError: If the S3 operation fails
        """
        bucket_prefix = os.getenv("AWS_PROJECT_NAME")

        if not bucket_prefix:
            raise ValueError(
                "Environment variable 'AWS_PROJECT_NAME' is not set.")

        client = self._get_client()
        client.delete_object(Bucket=bucket_prefix + bucket, Key=key)
