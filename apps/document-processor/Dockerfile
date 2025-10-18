FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1
# OMP_NUM_THREADS=4 # Uncomment if desired locally

# System dependencies required by onnxruntime/rapidocr/opencv/tesseract
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first for better layer caching
COPY --chown=root:root requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Prefetch Docling models into a fixed artifacts directory for offline usage
ENV DOCLING_ARTIFACTS_PATH=/app/.cache/docling/models
RUN mkdir -p "$DOCLING_ARTIFACTS_PATH"

# Optional: configure Tesseract data path if tesseract is used
# ENV TESSDATA_PREFIX=/usr/share/tesseract/tessdata/

ARG MODELS_LIST="layout tableformer easyocr"

RUN echo "Downloading models..." && \
    HF_HUB_DOWNLOAD_TIMEOUT="90" \
    HF_HUB_ETAG_TIMEOUT="90" \
    docling-tools models download -o "${DOCLING_ARTIFACTS_PATH}" ${MODELS_LIST} && \
    chmod -R g=u ${DOCLING_ARTIFACTS_PATH}

# Copy application source
COPY --chown=appuser:appuser src ./src
# Create a non-root user for runtime (create before final chown)
RUN useradd -m appuser && chown -R appuser:appuser /app && chown -R appuser:appuser ${DOCLING_ARTIFACTS_PATH}
USER appuser

EXPOSE 8080

# Run the FastAPI app
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]