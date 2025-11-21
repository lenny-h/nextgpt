"""
Cloudflare R2 Storage implementation (S3-compatible).
Uses lazy initialization to avoid creating the client at import time.
Thread-safe using double-checked locking pattern.
"""

import os
import threading
from typing import Optional, Any

import boto3
from ..interfaces.storage_client import IStorageClient


class CloudflareStorageClient(IStorageClient):
    """Cloudflare R2 Storage implementation of IStorageClient (S3-compatible)."""

    def __init__(self):
        self._client: Optional[Any] = None
        self._client_lock = threading.Lock()

    def _get_client(self) -> Any:
        """
        Get or create the R2 client singleton.
        Lazily initializes the client on first access.
        Thread-safe using double-checked locking.

        Returns:
            boto3.client: Initialized R2 client

        Raises:
            ValueError: If required environment variables are not set
        """
        if self._client is None:
            with self._client_lock:
                # Double-check after acquiring lock
                if self._client is None:
                    r2_endpoint = os.getenv("R2_ENDPOINT")
                    aws_access_key_id = os.getenv("CLOUDFLARE_ACCESS_KEY_ID")
                    aws_secret_access_key = os.getenv(
                        "CLOUDFLARE_SECRET_ACCESS_KEY")

                    if not r2_endpoint or not aws_access_key_id or not aws_secret_access_key:
                        raise ValueError(
                            "R2_ENDPOINT, CLOUDFLARE_ACCESS_KEY_ID, and CLOUDFLARE_SECRET_ACCESS_KEY environment variables must be set"
                        )

                    self._client = boto3.client(
                        "s3",
                        endpoint_url=r2_endpoint,
                        aws_access_key_id=aws_access_key_id,
                        aws_secret_access_key=aws_secret_access_key,
                        region_name="auto",
                    )

        return self._client

    def get_object_bytes(self, bucket: str, key: str) -> bytes:
        """
        Retrieve raw bytes of an object from R2.

        Args:
            bucket: R2 bucket name
            key: Object key (path) in the bucket

        Returns:
            bytes: Raw object content

        Raises:
            ClientError: If the R2 operation fails
        """
        client = self._get_client()
        response = client.get_object(Bucket=bucket, Key=key)
        return response["Body"].read()

    def delete_file(self, bucket: str, key: str) -> None:
        """
        Delete a file from R2 storage.

        Args:
            bucket: R2 bucket name
            key: Object key (path) in the bucket

        Raises:
            ClientError: If the R2 operation fails
        """
        client = self._get_client()
        client.delete_object(Bucket=bucket, Key=key)
