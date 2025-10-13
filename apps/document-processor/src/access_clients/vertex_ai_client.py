"""
Vertex AI client singleton for embedding generation.
Uses lazy initialization to avoid creating the client at import time.
Thread-safe using double-checked locking pattern.
"""

import os
import threading
from typing import List, Optional
from google.genai import Client, types


# Singleton storage for lazy initialization
_vertex_ai_client: Optional[Client] = None
_vertex_ai_client_lock = threading.Lock()


def get_vertex_ai_client() -> Client:
    """
    Get or create the Vertex AI client singleton.
    Lazily initializes the client on first access.
    Thread-safe using double-checked locking.

    Returns:
        Client: Initialized Vertex AI client

    Raises:
        ValueError: If GOOGLE_VERTEX_PROJECT environment variable is not set
    """
    global _vertex_ai_client
    if _vertex_ai_client is None:
        with _vertex_ai_client_lock:
            if _vertex_ai_client is None:
                project = os.getenv("GOOGLE_VERTEX_PROJECT")
                location = os.getenv("GOOGLE_VERTEX_LOCATION")

                if not project or not location:
                    raise ValueError(
                        "GOOGLE_VERTEX_PROJECT and GOOGLE_VERTEX_LOCATION environment variables must be set")

                _vertex_ai_client = Client(
                    vertexai=True, project=project, location=location)
    return _vertex_ai_client


def embed_content(contents: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of text contents using Vertex AI.

    Args:
        contents: List of text strings to embed

    Returns:
        List of embedding vectors (each is a list of floats)

    Raises:
        ValueError: If no embeddings are returned
        Exception: If the API call fails
    """
    client = get_vertex_ai_client()
    embeddings_model = os.getenv("EMBEDDINGS_MODEL", "text-embedding-004")

    response = client.models.embed_content(
        model=embeddings_model,
        contents=[str(content) for content in contents],
        config=types.EmbedContentConfig(
            task_type="QUESTION_ANSWERING"
        )
    )

    if not response.embeddings or len(response.embeddings) == 0:
        raise ValueError("No embeddings returned from Vertex AI")

    # Extract the values from each embedding
    return [embedding.values for embedding in response.embeddings if embedding.values]
