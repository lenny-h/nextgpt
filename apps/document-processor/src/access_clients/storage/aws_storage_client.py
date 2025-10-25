"""
AWS S3 Storage implementation.
Uses lazy initialization to avoid creating the client at import time.
Thread-safe using double-checked locking pattern.
"""

import os
import threading
from typing import Optional, Dict, Any

import boto3
from ..interfaces.storage_client import IStorageClient


class AwsStorageClient(IStorageClient):
    """AWS S3 Storage implementation of IStorageClient."""

    def __init__(self):
        self._client: Optional[Any] = None
        self._client_lock = threading.Lock()
        self._client_creation_time: Optional[float] = None
        self.CLIENT_MAX_AGE = 60 * 60  # 1 hour in seconds

    def _get_client(self) -> Any:
        """
        Get or create the S3 client singleton.
        Lazily initializes the client on first access.
        Thread-safe using double-checked locking.
        Refreshes client if it's too old.

        Returns:
            boto3.client: Initialized S3 client
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
                    self._client = boto3.client("s3")
                    self._client_creation_time = now

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

    def get_object_response(self, bucket: str, key: str) -> Dict[str, Any]:
        """
        Retrieve full boto3 get_object response for advanced use.

        Args:
            bucket: S3 bucket name
            key: Object key (path) in the bucket

        Returns:
            Dict[str, Any]: Full boto3 get_object response

        Raises:
            ClientError: If the S3 operation fails
        """
        bucket_prefix = os.getenv("AWS_PROJECT_NAME")

        if not bucket_prefix:
            raise ValueError(
                "Environment variable 'AWS_PROJECT_NAME' is not set.")

        client = self._get_client()
        return client.get_object(Bucket=bucket_prefix + bucket, Key=key)

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
