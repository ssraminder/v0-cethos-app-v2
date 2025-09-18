# Phase 1: Google Document AI OCR Integration

## Overview

Phase 1 adds OCR (Optical Character Recognition) capabilities to the Cethos platform using Google Cloud Document AI. This implementation is purely additive and does not modify any existing upload UI components.

## API Routes

### POST /api/ocr/docai

Main OCR processing endpoint that extracts text from uploaded documents.

**Request:**
\`\`\`json
{
  "quote_id": "string",
  "files": [
    {
      "url": "https://storage.googleapis.com/bucket/file.pdf",
      "name": "document.pdf", 
      "mime": "application/pdf"
    }
  ]
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "quote_id": "CS123",
  "results": [
    {
      "file": {
        "name": "document.pdf",
        "url": "https://storage.googleapis.com/bucket/file.pdf",
        "mime": "application/pdf"
      },
      "ocr": {
        "pages": 3,
        "tokens": 1250,
        "text": "Extracted text content...",
        "blocks": [
          {"pageNumber": 1, "blocks": 5},
          {"pageNumber": 2, "blocks": 3}
        ]
      },
      "metadata": {
        "processorId": "abc123",
        "runtimeMs": 842
      }
    }
  ],
  "summary": {
    "totalFiles": 1,
    "totalPages": 3,
    "totalTokens": 1250
  }
}
\`\`\`

**Error Responses:**
- `503` - Feature disabled (`PHASE1_OCR_ENABLED != "1"`)
- `400` - Bad input (invalid JSON, missing fields)
- `500` - Processing errors (see error codes below)

### GET /api/ocr/health

Health check endpoint that verifies environment configuration and DocAI client initialization.

**Response:**
\`\`\`json
{
  "status": "healthy|degraded",
  "phase1_enabled": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": {
    "gcp_project_id": true,
    "doc_ai_location": true,
    "doc_ai_processor_id": true,
    "google_credentials": true,
    "gcs_bucket": true,
    "ocr_max_text_length": "500000",
    "download_timeout_ms": "30000"
  },
  "docai_client": {
    "status": "initialized|failed|disabled",
    "error": null
  }
}
\`\`\`

### POST /api/ocr/selftest

Simple ping test to verify API responsiveness.

**Request:**
\`\`\`json
{
  "test": "ping"
}
\`\`\`

**Response:**
\`\`\`json
{
  "ok": true,
  "ts": "2024-01-15T10:30:00.000Z"
}
\`\`\`

## Environment Variables

### Required
- `PHASE1_OCR_ENABLED` - Set to "1" to enable OCR functionality (default: "0")
- `GCP_PROJECT_ID` - Google Cloud Project ID
- `DOC_AI_LOCATION` - Document AI processor location (e.g., "us", "us-central1")
- `DOC_AI_PROCESSOR_ID` - Document AI processor ID
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` - Service account credentials (JSON string, raw or base64)

### Optional
- `GCS_BUCKET` - Google Cloud Storage bucket name
- `OCR_MAX_TEXT_LENGTH` - Maximum text length before truncation (default: "500000")
- `DOWNLOAD_TIMEOUT_MS` - File download timeout in milliseconds (default: "30000")

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `FEATURE_DISABLED` | Phase 1 OCR is disabled | 503 |
| `BAD_INPUT` | Invalid request format or missing fields | 400 |
| `ENV_MISSING` | Required environment variable missing | 500 |
| `DOWNLOAD_FAILED` | Failed to download file from URL | 400 |
| `DOC_AI_INIT_FAILED` | Failed to initialize Document AI client | 500 |
| `DOC_AI_PROCESS_FAILED` | Document processing failed | 500 |
| `INTERNAL_ERROR` | Unexpected server error | 500 |

## Sample Usage

### Enable OCR
\`\`\`bash
# Set environment variables in Vercel
PHASE1_OCR_ENABLED=1
GCP_PROJECT_ID=your-project-id
DOC_AI_LOCATION=us
DOC_AI_PROCESSOR_ID=your-processor-id
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
\`\`\`

### Health Check
\`\`\`bash
curl -X GET https://your-app.vercel.app/api/ocr/health
\`\`\`

### Self Test
\`\`\`bash
curl -X POST https://your-app.vercel.app/api/ocr/selftest \
  -H "Content-Type: application/json" \
  -d '{"test":"ping"}'
\`\`\`

### Process Documents
\`\`\`bash
curl -X POST https://your-app.vercel.app/api/ocr/docai \
  -H "Content-Type: application/json" \
  -d '{
    "quote_id": "CS123",
    "files": [
      {
        "url": "https://storage.googleapis.com/bucket/document.pdf",
        "name": "document.pdf",
        "mime": "application/pdf"
      }
    ]
  }'
\`\`\`

## Troubleshooting

### Common Issues

1. **503 Feature Disabled**
   - Ensure `PHASE1_OCR_ENABLED=1` is set in environment variables

2. **500 ENV_MISSING**
   - Check that all required environment variables are set
   - Verify `GOOGLE_APPLICATION_CREDENTIALS_JSON` contains valid service account JSON

3. **500 DOC_AI_INIT_FAILED**
   - Verify service account has Document AI permissions
   - Check that processor ID exists and is accessible

4. **400 DOWNLOAD_FAILED**
   - Ensure file URLs are publicly accessible
   - Check file size limits and network connectivity

5. **500 DOC_AI_PROCESS_FAILED**
   - Verify file format is supported by Document AI
   - Check processor configuration and quotas

### Logging

All operations emit structured JSON logs with the prefix `PHASE1_OCR`:

\`\`\`
PHASE1_OCR {"level":"INFO","op":"initDocAI","message":"Client initialized","ts":"2024-01-15T10:30:00.000Z"}
PHASE1_OCR {"level":"ERROR","op":"runDocAI","code":"DOC_AI_PROCESS_FAILED","message":"Invalid processor response","quote_id":"CS123","file":"document.pdf","ts":"2024-01-15T10:30:00.000Z"}
\`\`\`

Monitor these logs for debugging and operational insights.
