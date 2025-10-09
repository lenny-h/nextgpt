"""
Embedding generation using Google Vertex AI
"""

import os
from typing import List
from google.genai import Client, types


def get_vertex_ai_client() -> Client:
    """Create and return a Vertex AI client"""
    project = os.getenv("GOOGLE_VERTEX_PROJECT")
    location = os.getenv("GOOGLE_VERTEX_LOCATION")

    if not project:
        raise ValueError(
            "GOOGLE_VERTEX_PROJECT environment variable is not set")

    return Client(vertexai=True, project=project, location=location)


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
