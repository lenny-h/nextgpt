"""
Embeddings client for generating text embeddings via the internal API.
"""

import os
from typing import List
import httpx

from logger import setup_logger

# Configure logger
logger = setup_logger(__name__)


def embed_content(contents: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of text contents using the internal API.

    Args:
        contents: List of text strings to embed (max 100 per batch)

    Returns:
        List of embedding vectors (each is a list of floats)

    Raises:
        ValueError: If no embeddings are returned or configuration is missing
        Exception: If the API call fails
    """
    logger.debug(f"Generating embeddings for {len(contents)} text chunks")
    
    api_url = os.getenv("API_URL")
    internal_secret = os.getenv("ENCRYPTION_KEY")

    if not api_url:
        logger.error("API_URL environment variable not set")
        raise ValueError("API_URL environment variable not set")

    if not internal_secret:
        logger.error("ENCRYPTION_KEY environment variable not set")
        raise ValueError("INTERNAL_API_SECRET environment variable not set")

    # Use batch endpoint for multiple contents
    endpoint = f"{api_url}/api/internal/embeddings/batch"
    headers = {
        "Content-Type": "application/json",
        "x-internal-secret": internal_secret
    }
    payload = {"texts": contents}

    try:
        logger.debug(f"Sending embedding request to {endpoint}")
        with httpx.Client(timeout=30.0) as client:
            response = client.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()

            data = response.json()

            if "embeddings" not in data or not data["embeddings"]:
                logger.error("No embeddings returned from API")
                raise ValueError("No embeddings returned from API")

            logger.debug(f"Successfully received {len(data['embeddings'])} embeddings from API")
            return data["embeddings"]

    except httpx.HTTPStatusError as e:
        logger.error(f"API request failed with status {e.response.status_code}: {e.response.text}")
        raise Exception(
            f"API request failed with status {e.response.status_code}: {e.response.text}"
        )
    except httpx.RequestError as e:
        logger.error(f"Failed to connect to embeddings API: {str(e)}")
        raise Exception(f"Failed to connect to API: {str(e)}")
