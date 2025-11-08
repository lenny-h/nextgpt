FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1
# OMP_NUM_THREADS=4 # Uncomment if desired locally

# System dependencies required by onnxruntime/rapidocr/opencv/tesseract
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV PYTHONPATH=/app/src

RUN useradd -m -u 1000 appuser

# Install Python deps first for better layer caching
# NOTE: Build context is the monorepo root, so reference files with their app path
COPY apps/document-processor/requirements.txt ./requirements.txt
RUN pip install --upgrade pip \
    && pip install -r requirements.txt --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu

ENV DOCLING_ARTIFACTS_PATH=/app/.cache/docling/models
RUN mkdir -p "$DOCLING_ARTIFACTS_PATH"

# Optional: configure Tesseract data path if tesseract is used
# ENV TESSDATA_PREFIX=/usr/share/tesseract/tessdata/

# Prefetch essential Docling models at build time
# Only download the core models needed for basic PDF processing
# Optional models (formula, code, etc.) will be downloaded at runtime when first used
ARG MODELS_LIST="layout tableformer code_formula"

RUN echo "Downloading essential models..." && \
    HF_HUB_DOWNLOAD_TIMEOUT="90" \
    HF_HUB_ETAG_TIMEOUT="90" \
    docling-tools models download -o "${DOCLING_ARTIFACTS_PATH}" ${MODELS_LIST} && \
    chown -R appuser:appuser ${DOCLING_ARTIFACTS_PATH} ${HF_HOME} && \
    chmod -R g=u ${DOCLING_ARTIFACTS_PATH} ${HF_HOME}

# Copy application source (again: paths are from repo root)
COPY --chown=appuser:appuser apps/document-processor/src ./src

USER appuser

EXPOSE 8080

# Run the FastAPI app
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]