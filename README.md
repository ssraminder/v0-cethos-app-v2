# Cethos Quote Platform

A comprehensive monorepo for the Cethos translation and document processing platform.

## Architecture

- **apps/web**: Next.js 14 customer & staff portals with public embed widget
- **apps/workers**: Cloud Run services for OCR, GLM classification, and antivirus scanning
- **apps/api**: Lightweight API routes for Vercel deployment
- **packages/**: Shared libraries for database, auth, UI, config, and utilities

## Prerequisites

- Node.js 20+
- pnpm
- Supabase account
- Google Cloud Platform account
- Stripe account

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in all required environment variables

### Required Integrations

#### Supabase Setup
1. Create a new Supabase project
2. Copy the URL and anon key to your `.env.local`
3. Generate a service role key for server-side operations

#### Google Cloud Platform Setup
1. Enable the following APIs:
   - Document AI API
   - Cloud Storage API
   - Pub/Sub API
   - Cloud Run API
2. Create a Document AI processor for OCR
3. Create GCS buckets for file storage
4. Create a service account with appropriate permissions
5. Download the service account JSON and add to `GOOGLE_APPLICATION_CREDENTIALS_JSON`

#### Stripe Setup
1. Create a Stripe account
2. Get your secret key and webhook secret
3. Configure webhook endpoints for payment processing

## Development

\`\`\`bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Build all packages
pnpm build

# Run database migrations
pnpm migrate

# Seed database
pnpm seed
\`\`\`

## Deployment

### Web App (Vercel)
The web app can be deployed to Vercel with automatic deployments from Git.

### Workers (Cloud Run)
Workers are deployed as containerized services to Google Cloud Run:

\`\`\`bash
# Build and deploy OCR worker
cd apps/workers/ocr
docker build -t gcr.io/PROJECT_ID/cethos-ocr .
docker push gcr.io/PROJECT_ID/cethos-ocr
gcloud run deploy cethos-ocr --image gcr.io/PROJECT_ID/cethos-ocr
\`\`\`

## WordPress Integration

Two embed options are available:

### Inline iframe
\`\`\`html
<iframe src="https://your-domain.com/embed" width="100%" height="600"></iframe>
\`\`\`

### Modal launcher
\`\`\`html
<script src="https://your-domain.com/embed.js"></script>
<button onclick="CethosEmbed.open()">Get Quote</button>
\`\`\`

## License

MIT
