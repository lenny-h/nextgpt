"""
Singleton tokenizer for Docling microservice.
Ensures only one instance of the tokenizer is created.
"""

from docling_core.transforms.chunker.tokenizer.huggingface import HuggingFaceTokenizer
from transformers import AutoTokenizer

# Model ID for the tokenizer
EMBED_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"

# Singleton instance
_tokenizer_instance = None


def get_tokenizer() -> HuggingFaceTokenizer:
    """
    Get the singleton HuggingFace tokenizer instance.

    Args:
        max_tokens: Maximum number of tokens per chunk (default: 512)

    Returns:
        HuggingFaceTokenizer instance
    """
    global _tokenizer_instance

    if _tokenizer_instance is None:
        _tokenizer_instance = HuggingFaceTokenizer(
            tokenizer=AutoTokenizer.from_pretrained(EMBED_MODEL_ID),
        )

    return _tokenizer_instance
