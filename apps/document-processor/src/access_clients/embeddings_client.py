"""
Embeddings client for generating text embeddings via the internal API.
"""

import os
from typing import List
import httpx


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
    api_url = os.getenv("API_URL")
    internal_secret = os.getenv("INTERNAL_API_SECRET")

    if not api_url:
        raise ValueError("API_URL environment variable not set")

    if not internal_secret:
        raise ValueError("INTERNAL_API_SECRET environment variable not set")

    # Use batch endpoint for multiple contents
    endpoint = f"{api_url}/api/internal/embeddings/batch"
    headers = {
        "Content-Type": "application/json",
        "x-internal-secret": internal_secret
    }
    payload = {"texts": contents}

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()

            data = response.json()

            if "embeddings" not in data or not data["embeddings"]:
                raise ValueError("No embeddings returned from API")

            return data["embeddings"]

    except httpx.HTTPStatusError as e:
        raise Exception(
            f"API request failed with status {e.response.status_code}: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise Exception(f"Failed to connect to API: {str(e)}")
