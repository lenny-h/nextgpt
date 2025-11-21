"""
Google Cloud Storage implementation.
Uses lazy initialization to avoid creating the client at import time.
Thread-safe using double-checked locking pattern.
"""

import os
import threading
from typing import Optional

from google.cloud import storage
from ..interfaces.storage_client import IStorageClient


class GoogleStorageClient(IStorageClient):
    """Google Cloud Storage implementation of IStorageClient."""

    def __init__(self):
        self._client: Optional[storage.Client] = None
        self._client_lock = threading.Lock()

    def _get_client(self) -> storage.Client:
        """
        Get or create the GCS storage client singleton.
        Lazily initializes the client on first access.
        Thread-safe using double-checked locking.

        Returns:
            storage.Client: Initialized GCS client
        """
        if self._client is None:
            with self._client_lock:
                # Double-check after acquiring lock
                if self._client is None:
                    self._client = storage.Client()

        return self._client

    def get_object_bytes(self, bucket: str, key: str) -> bytes:
        """
        Retrieve raw bytes of an object from GCS.

        Args:
            bucket: GCS bucket name
            key: Object key (path) in the bucket

        Returns:
            bytes: Raw object content

        Raises:
            google.cloud.exceptions.NotFound: If object doesn't exist
            Exception: If the storage operation fails
        """
        bucket_prefix = os.getenv("GOOGLE_VERTEX_PROJECT")

        if not bucket_prefix:
            raise ValueError(
                "Environment variable 'GOOGLE_VERTEX_PROJECT' is not set.")

        client = self._get_client()
        blob = client.bucket(bucket_prefix + bucket).blob(key)
        return blob.download_as_bytes()

    def delete_file(self, bucket: str, key: str) -> None:
        """
        Delete a file from GCS storage.

        Args:
            bucket: GCS bucket name
            key: Object key (path) in the bucket

        Raises:
            google.cloud.exceptions.NotFound: If object doesn't exist
            Exception: If the storage operation fails
        """
        bucket_prefix = os.getenv("GOOGLE_VERTEX_PROJECT")

        if not bucket_prefix:
            raise ValueError(
                "Environment variable 'GOOGLE_VERTEX_PROJECT' is not set.")

        client = self._get_client()
        blob = client.bucket(bucket_prefix + bucket).blob(key)
        blob.delete()
