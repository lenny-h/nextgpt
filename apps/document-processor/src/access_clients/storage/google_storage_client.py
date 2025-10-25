"""
Google Cloud Storage implementation.
Uses lazy initialization to avoid creating the client at import time.
Thread-safe using double-checked locking pattern.
"""

import threading
from typing import Optional, Dict, Any

from google.cloud import storage
from ..interfaces.storage_client import IStorageClient


class GoogleStorageClient(IStorageClient):
    """Google Cloud Storage implementation of IStorageClient."""

    def __init__(self):
        self._client: Optional[storage.Client] = None
        self._client_lock = threading.Lock()
        self._client_creation_time: Optional[float] = None
        self.CLIENT_MAX_AGE = 60 * 60  # 1 hour in seconds

    def _get_client(self) -> storage.Client:
        """
        Get or create the GCS storage client singleton.
        Lazily initializes the client on first access.
        Thread-safe using double-checked locking.
        Refreshes client if it's too old.

        Returns:
            storage.Client: Initialized GCS client
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
                    self._client = storage.Client()
                    self._client_creation_time = now

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
        client = self._get_client()
        blob = client.bucket(bucket).blob(key)
        return blob.download_as_bytes()

    def get_object_response(self, bucket: str, key: str) -> Dict[str, Any]:
        """
        Retrieve full object response for advanced use.
        Returns blob metadata and content.

        Args:
            bucket: GCS bucket name
            key: Object key (path) in the bucket

        Returns:
            Dict[str, Any]: Response containing blob metadata and content

        Raises:
            google.cloud.exceptions.NotFound: If object doesn't exist
            Exception: If the storage operation fails
        """
        client = self._get_client()
        blob = client.bucket(bucket).blob(key)

        # Reload to get latest metadata
        blob.reload()

        return {
            "Body": blob.download_as_bytes(),
            "ContentType": blob.content_type,
            "ContentLength": blob.size,
            "Metadata": blob.metadata or {},
            "LastModified": blob.updated,
        }

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
        client = self._get_client()
        blob = client.bucket(bucket).blob(key)
        blob.delete()
