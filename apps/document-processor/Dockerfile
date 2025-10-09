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
    curl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download Docling models (only layout model for efficiency)
RUN python -c "from docling.document_converter import DocumentConverter; \
    from docling.datamodel.base_models import InputFormat; \
    from docling.datamodel.pipeline_options import PdfPipelineOptions; \
    from docling.pipeline.standard_pdf_pipeline import StandardPdfPipeline; \
    pipeline = StandardPdfPipeline(); \
    print('Models downloaded successfully')"

FROM base AS runner

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy model cache from builder
COPY --from=builder /root/.cache /root/.cache

# Create non-root user first
RUN addgroup --system --gid 1001 docling && \
    adduser --system --uid 1001 --gid 1001 docling

# Copy application code with correct ownership
COPY --chown=docling:docling src /app/src

# Create directory for service account credentials
RUN mkdir -p /app/credentials && \
    chown -R docling:docling /app/credentials

# Switch to non-root user
USER docling

# Expose port
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Optional: Set Google Cloud credentials path (mount at runtime)
# ENV GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/service-account.json

# Run the application with uvicorn directly (production-ready)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]