"""
Access clients module.
Provides unified interface for storage and embeddings operations across different cloud providers.
"""

from .storage_client_factory import get_storage_client

__all__ = [
    "get_storage_client",
]
