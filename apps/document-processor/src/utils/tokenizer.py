"""
Singleton tokenizer for Docling microservice.
Ensures only one instance of the tokenizer is created.
"""

import threading
from docling_core.transforms.chunker.tokenizer.huggingface import HuggingFaceTokenizer
from transformers import AutoTokenizer

# Model ID for the tokenizer
EMBED_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"

# Singleton instance and lock for thread-safe initialization
_tokenizer_instance = None
_tokenizer_lock = threading.Lock()


def get_tokenizer() -> HuggingFaceTokenizer:
    """
    Get the singleton HuggingFace tokenizer instance.

    Thread-safe lazy initialization of the tokenizer using the
    sentence-transformers/all-MiniLM-L6-v2 model.

    Returns:
        HuggingFaceTokenizer instance
    """
    global _tokenizer_instance

    if _tokenizer_instance is None:
        with _tokenizer_lock:
            # Double-check pattern to avoid unnecessary locking
            if _tokenizer_instance is None:
                _tokenizer_instance = HuggingFaceTokenizer(
                    tokenizer=AutoTokenizer.from_pretrained(EMBED_MODEL_ID),
                )

    return _tokenizer_instance
