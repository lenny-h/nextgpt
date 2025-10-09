# Docling Microservice

A FastAPI microservice that converts various document formats to Markdown using IBM's Docling library.

## Features

- **Multi-format Support**: PDF, DOCX, PPTX, XLSX, Images, HTML, and more
- **Smart Chunking**: Automatically chunks large documents at logical boundaries
- **Two Input Methods**:
  - GCS (Google Cloud Storage)
  - S3/R2 (Cloudflare R2)

## Endpoints

### 1. Health Check

`GET /health`

Returns service health status.

**Response:**

```json
{
  "status": "healthy",
  "service": "docling",
  "version": "1.0.0"
}
```

### 2. Convert from GCS

`POST /convert`

Convert a file from Google Cloud Storage to Markdown.

**Query Parameters:**

- `gcs_url` (string): GCS URL in format `gs://bucket-name/path/to/file`

**Response:**

```json
{
  "markdown": "# Document Title\n\nContent...",
  "success": true,
  "message": "Successfully converted path/to/file"
}
```

### 3. Convert from S3/R2 with Chunking

`POST /convert-from-s3`

Convert a file from S3/R2 to chunked Markdown.

**Query Parameters:**

- `bucket` (string, required): S3/R2 bucket name
- `key` (string, required): Object key (path) in the bucket

**Response:**

```json
{
  "chunks": [
    {
      "content": "# Chapter 1\n\nIntroduction content...",
      "chunk_index": 0
    },
    {
      "content": "More content in the next chunk...",
      "chunk_index": 1
    }
  ],
  "total_chunks": 2,
  "success": true,
  "message": "Successfully converted and chunked document.pdf"
}
```

## Supported File Formats

- **Documents**: PDF, DOCX, ODT, RTF
- **Presentations**: PPTX, ODP
- **Spreadsheets**: XLSX, XLS, ODS, CSV
- **Images**: PNG, JPG, JPEG, TIFF, BMP
- **Web**: HTML, MHTML
- **Markup**: Markdown, AsciiDoc
- **Archives**: ZIP (with document contents)

## Installation

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python src/main.py
```

## Usage Examples

### Convert from GCS

```bash
curl -X POST "http://localhost:8080/convert?gcs_url=gs://my-bucket/document.pdf" \
  -H "Content-Type: application/json"
```

### Convert from S3/R2

```bash
curl -X POST "http://localhost:8080/convert-from-s3?bucket=my-bucket&key=path/to/document.docx" \
  -H "Content-Type: application/json"
```

## Error Handling

### Common Errors

**404 - File Not Found**

```json
{
  "detail": "File not found in S3: my-bucket/nonexistent.pdf"
}
```

**400 - Invalid Request**

```json
{
  "detail": "Invalid gs:// URL format. Expected: gs://bucket-name/path/to/file"
}
```

**500 - Conversion Failed**

```json
{
  "detail": "Failed to convert file: Unsupported file format"
}
```

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

## Performance Considerations

- **Memory**: Large files are processed in memory. Monitor memory usage for very large files.
- **Processing Time**: Varies by file size and complexity
  - Simple PDF (10 pages): ~2-5 seconds
  - Complex DOCX (50 pages): ~5-10 seconds
  - Large PPTX (100 slides): ~10-20 seconds

## Integration with pdf-processor

The pdf-processor service uses this microservice via the `/convert-from-s3` endpoint:

1. File uploaded to S3/R2
2. pdf-processor calls `/convert-from-s3` with bucket and key
3. Docling downloads, converts, and chunks the file
4. pdf-processor receives chunks and generates embeddings
5. Chunks stored in PostgreSQL with embeddings

This eliminates the need for temporary GCS storage and supports multiple file formats.
