"""
Local MinIO Storage implementation (S3-compatible).
Uses lazy initialization to avoid creating the client at import time.
Thread-safe using double-checked locking pattern.
"""

import os
import threading
from typing import Optional, Dict, Any

import boto3
from botocore.client import Config
from ..interfaces.storage_client import IStorageClient


class LocalStorageClient(IStorageClient):
    """Local MinIO Storage implementation of IStorageClient."""

    def __init__(self):
        self._client: Optional[Any] = None
        self._client_lock = threading.Lock()
        self._client_creation_time: Optional[float] = None
        self.CLIENT_MAX_AGE = 60 * 60  # 1 hour in seconds

    def _get_client(self) -> Any:
        """
        Get or create the S3 client singleton for MinIO.
        Lazily initializes the client on first access.
        Thread-safe using double-checked locking.
        Refreshes client if it's too old.

        Returns:
            boto3.client: Initialized S3 client configured for MinIO

        Raises:
            ValueError: If required environment variables are not set
        """
        import time

        now = time.time()

        if (
            self._client is None
            or self._client_creation_time is None
            or now - self._client_creation_time > self.CLIENT_MAX_AGE
        ):
            with self._client_lock:
                # Double-check after acquiring lock
                if (
                    self._client is None
                    or self._client_creation_time is None
                    or now - self._client_creation_time > self.CLIENT_MAX_AGE
                ):
                    endpoint = os.getenv("MINIO_ENDPOINT")
                    access_key = os.getenv("MINIO_ROOT_USER")
                    secret_key = os.getenv("MINIO_ROOT_PASSWORD")

                    if not endpoint or not access_key or not secret_key:
                        raise ValueError(
                            "MINIO_ENDPOINT, MINIO_ROOT_USER, and MINIO_ROOT_PASSWORD environment variables must be set"
                        )

                    self._client = boto3.client(
                        "s3",
                        endpoint_url=endpoint,
                        aws_access_key_id=access_key,
                        aws_secret_access_key=secret_key,
                        region_name="us-east-1",  # MinIO uses this as default
                        config=Config(
                            # Required for MinIO
                            s3={'addressing_style': 'path'}
                        )
                    )
                    self._client_creation_time = now

        return self._client

    def get_object_bytes(self, bucket: str, key: str) -> bytes:
        """
        Retrieve raw bytes of an object from MinIO.

        Args:
            bucket: MinIO bucket name
            key: Object key (path) in the bucket

        Returns:
            bytes: Raw object content

        Raises:
            ClientError: If the S3 operation fails
            ValueError: If required environment variables are not set
        """
        client = self._get_client()
        response = client.get_object(Bucket=bucket, Key=key)
        return response["Body"].read()

    def delete_file(self, bucket: str, key: str) -> None:
        """
        Delete a file from MinIO storage.

        Args:
            bucket: MinIO bucket name
            key: Object key (path) in the bucket

        Raises:
            ClientError: If the S3 operation fails
            ValueError: If required environment variables are not set
        """
        client = self._get_client()
        client.delete_object(Bucket=bucket, Key=key)
