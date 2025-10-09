FROM python:3.12-slim AS base

# Set working directory
WORKDIR /app

# Install system dependencies required by Docling
RUN apt-get update && apt-get install -y \
    libpoppler-cpp-dev \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-eng \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libwebp-dev \
    gcc \
    g++ \
    libxml2-dev \
    libxslt1-dev \
    libffi-dev \
    libreoffice-common \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder

# Copy requirements file
COPY apps/docling/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download Docling models
RUN pip install --no-cache-dir docling-tools && \
    docling-tools models download && \
    mkdir -p /app/models && \
    mv $HOME/.cache/docling/models/* /app/models/

FROM base AS runner

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy downloaded models
COPY --from=builder /app/models /app/models

# Copy application code
COPY apps/docling/src /app/src

# Set ownership
RUN addgroup --system --gid 1001 docling && \
    adduser --system --uid 1001 --gid 1001 docling && \
    chown -R docling:docling /app

# Switch to non-root user
USER docling

# Expose port
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV DOCLING_ARTIFACTS_PATH="/app/models"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')"

# Run the application
CMD ["python", "src/main.py"]