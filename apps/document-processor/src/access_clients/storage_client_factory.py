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

from logger import setup_logger

# Configure logger
logger = setup_logger(__name__)

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
        logger.debug("Returning existing storage client instance")
        return _storage_client_instance

    logger.info("Initializing storage client based on environment configuration")

    # Check for local storage first
    if os.getenv("USE_LOCAL_FILE_STORAGE", "").lower() == "true":
        logger.info("Using Local MinIO storage")
        _storage_client_instance = LocalStorageClient()
        return _storage_client_instance

    # Check for Cloudflare R2
    if os.getenv("USE_CLOUDFLARE_R2", "").lower() == "true":
        logger.info("Using Cloudflare R2 storage")
        _storage_client_instance = CloudflareStorageClient()
        return _storage_client_instance

    # Determine cloud provider
    cloud_provider = os.getenv("CLOUD_PROVIDER", "").lower()

    if cloud_provider == "aws":
        logger.info("Using AWS S3 Storage")
        _storage_client_instance = AwsStorageClient()
    elif cloud_provider == "azure":
        logger.warning("Azure is currently not supported, defaulting to Local MinIO storage")
        _storage_client_instance = LocalStorageClient()
    elif cloud_provider == "gcloud":
        # Default to Google Cloud Storage
        logger.info("Using Google Cloud Storage")
        _storage_client_instance = GoogleStorageClient()
    else:
        logger.error(f"Invalid CLOUD_PROVIDER '{cloud_provider}' specified")
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
