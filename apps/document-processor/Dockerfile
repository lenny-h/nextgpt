# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies required by some Python packages
# - gcc, g++, make for compiling Python packages
# - libpq-dev for psycopg2
# - curl for health checks
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
# Note: context is monorepo root, so we use the full path
COPY apps/document-processor/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code first (needed for initialization)
COPY apps/document-processor/src/ ./src/

# Pre-download models to avoid runtime downloads
# 1. HuggingFace tokenizer for text chunking
# 2. Initialize Docling converter to download any required models
RUN python -c "from transformers import AutoTokenizer; AutoTokenizer.from_pretrained('sentence-transformers/all-MiniLM-L6-v2')" && \
    python -c "import sys; sys.path.insert(0, 'src'); from app_state import converter; print('Docling converter initialized')"

# Expose the port the app runs on
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV ENVIRONMENT=production
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application with uvicorn directly for better production performance
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
