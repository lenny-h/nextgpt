"""
Storage client factory.
Provides a singleton storage client based on environment configuration.
"""

import os
from typing import Optional
from .interfaces.storage_client import IStorageClient
from .storage.google_storage_client import GoogleStorageClient
from .storage.aws_storage_client import AwsStorageClient
from .storage.cloudflare_storage_client import CloudflareStorageClient
from .storage.local_storage_client import LocalStorageClient


_storage_client_instance: Optional[IStorageClient] = None


def get_storage_client() -> IStorageClient:
    """
    Get or create the appropriate storage client based on environment variables.

    Priority order:
    1. Local storage (MinIO) if USE_LOCAL_FILE_STORAGE=true
    2. Cloudflare R2 if USE_CLOUDFLARE_R2=true
    3. Cloud provider based on CLOUD_PROVIDER env variable (gcloud, aws)
    4. Default to Local storage (MinIO) if none specified

    Returns:
        IStorageClient: Initialized storage client

    Raises:
        ValueError: If required environment variables are not set for the selected provider
    """
    global _storage_client_instance

    if _storage_client_instance is not None:
        return _storage_client_instance

    # Check for local storage first
    if os.getenv("USE_LOCAL_FILE_STORAGE", "").lower() == "true":
        print("[StorageClient] Using Local MinIO storage")
        _storage_client_instance = LocalStorageClient()
        return _storage_client_instance

    # Check for Cloudflare R2
    if os.getenv("USE_CLOUDFLARE_R2", "").lower() == "true":
        print("[StorageClient] Using Cloudflare R2 storage")
        _storage_client_instance = CloudflareStorageClient()
        return _storage_client_instance

    # Determine cloud provider
    cloud_provider = os.getenv("CLOUD_PROVIDER", "").lower()

    if cloud_provider == "aws":
        print("[StorageClient] Using AWS S3 Storage")
        _storage_client_instance = AwsStorageClient()
    elif cloud_provider == "azure":
        print(
            "[StorageClient] Azure is currently not supported, defaulting to Local MinIO storage")
        _storage_client_instance = LocalStorageClient()
    elif cloud_provider == "gcloud":
        # Default to Google Cloud Storage
        print("[StorageClient] Using Google Cloud Storage")
        _storage_client_instance = GoogleStorageClient()
    else:
        print(
            f"[StorageClient] Invalid CLOUD_PROVIDER")
        raise ValueError(
            f"Unsupported CLOUD_PROVIDER '{cloud_provider}' specified.")

    return _storage_client_instance


def reset_storage_client() -> None:
    """
    Reset the storage client instance.
    Useful for testing or when configuration changes at runtime.
    """
    global _storage_client_instance
    _storage_client_instance = None
