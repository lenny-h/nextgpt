"""
Google Cloud Storage client singleton for file operations.
Uses lazy initialization to avoid creating the client at import time.
Thread-safe using double-checked locking pattern.
"""

import threading
from typing import Optional
from google.cloud import storage


# Singleton storage for lazy initialization
_storage_client: Optional[storage.Client] = None
_storage_client_lock = threading.Lock()


def get_storage_client() -> storage.Client:
    """
    Get or create the GCS storage client singleton.
    Lazily initializes the client on first access.
    Thread-safe using double-checked locking.

    Returns:
        storage.Client: Initialized GCS client
    """
    global _storage_client
    if _storage_client is None:
        with _storage_client_lock:
            # Double-check after acquiring lock
            if _storage_client is None:
                _storage_client = storage.Client()
    return _storage_client
