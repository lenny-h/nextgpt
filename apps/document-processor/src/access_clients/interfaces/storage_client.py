"""
Base interface for storage clients.
All storage implementations must implement this protocol.
"""

from typing import Protocol, Dict, Any


class IStorageClient(Protocol):
    """Protocol defining the interface for storage clients."""

    def get_object_bytes(self, bucket: str, key: str) -> bytes:
        """
        Retrieve raw bytes of an object from storage.

        Args:
            bucket: Storage bucket name
            key: Object key (path) in the bucket

        Returns:
            bytes: Raw object content

        Raises:
            Exception: If the storage operation fails
        """
        ...

    def get_object_response(self, bucket: str, key: str) -> Dict[str, Any]:
        """
        Retrieve full object response for advanced use.

        Args:
            bucket: Storage bucket name
            key: Object key (path) in the bucket

        Returns:
            Dict[str, Any]: Full response object from the storage provider

        Raises:
            Exception: If the storage operation fails
        """
        ...

    def delete_file(self, bucket: str, key: str) -> None:
        """
        Delete a file from storage.

        Args:
            bucket: Storage bucket name
            key: Object key (path) in the bucket

        Raises:
            Exception: If the storage operation fails
        """
        ...
