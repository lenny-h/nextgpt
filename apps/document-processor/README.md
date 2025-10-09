# Docling Microservice

A FastAPI microservice that converts various document formats to Markdown using IBM's Docling library.

## Features

- **Multi-format Support**: PDF, DOCX, PPTX, XLSX, Images, HTML, and more
- **Smart Chunking**: Automatically chunks large documents at logical boundaries
- **Two Input Methods**:
  - GCS (Google Cloud Storage)
  - S3/R2 (Cloudflare R2)
- **Database Storage**: PostgreSQL with pgvector for chunk storage
- **Vector Embeddings**: Google Vertex AI integration for semantic search

## Architecture

```
┌─────────────────┐
│ Client Request  │
└────────┬────────┘
         │
         v
┌─────────────────────────┐
│  Docling Microservice   │
│       (FastAPI)         │
└────────┬────────────────┘
         │
         ├──────────────────────┐
         v                      v
┌─────────────────┐    ┌──────────────────┐
│  Google Cloud   │    │     S3 / R2      │
│     Storage     │    │   (Cloudflare)   │
└─────────────────┘    └──────────────────┘
         │                      │
         └──────────┬───────────┘
                    v
         ┌─────────────────────┐
         │   Docling Library   │
         │  (IBM Open Source)  │
         └──────────┬──────────┘
                    v
         ┌─────────────────────┐
         │   Markdown Output   │
         │   (with chunking)   │
         └─────────────────────┘
```

## Processing Flow

1. **File uploaded to S3/R2** - Trigger event contains task metadata
2. **Task status → "processing"** - Updates PostgreSQL task table
3. **Document conversion** - Docling converts and chunks the document
4. **Embedding generation** - Google Vertex AI creates 768-dimensional vectors
5. **Database storage** - Chunks and embeddings stored in PostgreSQL
6. **Task status → "finished"** - Processing complete
7. **Error handling** - On failure, cleans up S3 file and updates status to "failed"
