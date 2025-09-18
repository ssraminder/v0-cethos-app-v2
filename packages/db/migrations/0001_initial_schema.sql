-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE "user_role" AS ENUM('admin', 'manager', 'pm', 'accountant', 'sales', 'assistant', 'customer');
CREATE TYPE "customer_type" AS ENUM('business', 'individual');
CREATE TYPE "quote_status" AS ENUM('draft', 'analyzing', 'pending_customer', 'accepted', 'paid', 'in_production', 'draft_shared', 'revisions', 'finalized', 'delivered', 'closed', 'rejected_by_customer');
CREATE TYPE "file_status" AS ENUM('uploaded', 'scanned', 'parsed', 'quarantined', 'processed');
CREATE TYPE "complexity_class" AS ENUM('easy', 'medium', 'hard');
CREATE TYPE "pricing_mode" AS ENUM('flat', 'multiplier');
CREATE TYPE "approval_state" AS ENUM('pending', 'approved', 'denied');

-- Users table
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT UNIQUE NOT NULL,
  "phone" TEXT,
  "name" TEXT NOT NULL,
  "role" "user_role" NOT NULL DEFAULT 'customer',
  "is_business" BOOLEAN DEFAULT false,
  "business_approved" BOOLEAN DEFAULT false,
  "net_terms" TEXT DEFAULT 'NET30',
  "requires_approval" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Customers table
CREATE TABLE "customers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "users"("id"),
  "type" "customer_type" NOT NULL,
  "legal_name" TEXT NOT NULL,
  "billing_address" TEXT,
  "shipping_address" TEXT,
  "business_approved" BOOLEAN DEFAULT false,
  "net_terms" TEXT DEFAULT 'NET30',
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Pricing tables
CREATE TABLE "pricing_tiers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "multiplier" NUMERIC(6,3) NOT NULL
);

CREATE TABLE "pricing_languages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "language_code" TEXT UNIQUE NOT NULL,
  "tier_id" UUID REFERENCES "pricing_tiers"("id") NOT NULL
);

CREATE TABLE "certification_types" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "price_cents" INTEGER NOT NULL,
  "pricing_mode" "pricing_mode" NOT NULL DEFAULT 'flat',
  "multiplier" NUMERIC(6,3)
);

CREATE TABLE "complexity_categories" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "multiplier" NUMERIC(6,3) NOT NULL
);

CREATE TABLE "shipping_methods" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "price_cents" INTEGER NOT NULL,
  "has_tracking" BOOLEAN NOT NULL
);

CREATE TABLE "settings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "singleton" BOOLEAN DEFAULT true UNIQUE,
  "base_rate" NUMERIC(10,2) NOT NULL,
  "divisor" INTEGER NOT NULL DEFAULT 225,
  "rounding_threshold" NUMERIC(6,3) NOT NULL DEFAULT 0.20,
  "rush_default_pct" NUMERIC(6,3) NOT NULL DEFAULT 30.0,
  "sla_json" TEXT
);

-- Quotes table
CREATE TABLE "quotes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" UUID REFERENCES "customers"("id") NOT NULL,
  "status" "quote_status" NOT NULL DEFAULT 'draft',
  "base_rate" NUMERIC(10,2),
  "source_lang" TEXT,
  "target_lang" TEXT,
  "certification_type_id" UUID,
  "rush_pct" NUMERIC(5,2),
  "shipping_method_id" UUID,
  "gst_region" TEXT,
  "billed_units" NUMERIC(10,2),
  "billed_rate" NUMERIC(10,2),
  "billed_total" NUMERIC(12,2),
  "calc_units" NUMERIC(10,2),
  "calc_rate" NUMERIC(10,2),
  "calc_total" NUMERIC(12,2),
  "requires_hitl" BOOLEAN DEFAULT false,
  "avg_confidence" NUMERIC(5,2),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE "quote_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "quote_id" UUID REFERENCES "quotes"("id") NOT NULL,
  "doc_type" TEXT,
  "language_pair" TEXT,
  "billed_units" NUMERIC(10,2),
  "calc_units" NUMERIC(10,2),
  "rate" NUMERIC(10,2),
  "certification_type_id" UUID,
  "subtotal" NUMERIC(12,2),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Files and pages
CREATE TABLE "files" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "quote_id" UUID REFERENCES "quotes"("id") NOT NULL,
  "gcs_uri" TEXT NOT NULL,
  "original_name" TEXT NOT NULL,
  "bytes" BIGINT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "checksum" TEXT,
  "status" "file_status" NOT NULL DEFAULT 'uploaded',
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE "pages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "file_id" UUID REFERENCES "files"("id") NOT NULL,
  "page_index" INTEGER NOT NULL,
  "words" INTEGER NOT NULL,
  "complexity_class" "complexity_class",
  "primary_lang" TEXT,
  "secondary_lang" TEXT,
  "primary_prominence" INTEGER,
  "secondary_prominence" INTEGER,
  "confidence_pct" INTEGER,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE "page_analysis" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "page_id" UUID REFERENCES "pages"("id") NOT NULL,
  "document_type" TEXT,
  "languages" TEXT,
  "confidence_pct" INTEGER,
  "doc_group_id" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Permissions and approvals
CREATE TABLE "role_permissions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "role" TEXT NOT NULL,
  "permission" TEXT NOT NULL
);

CREATE TABLE "approvals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "target_type" TEXT NOT NULL,
  "target_id" UUID NOT NULL,
  "requested_by" UUID REFERENCES "users"("id") NOT NULL,
  "approved_by" UUID REFERENCES "users"("id"),
  "state" "approval_state" NOT NULL DEFAULT 'pending',
  "reason" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Events and tracking
CREATE TABLE "events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "quote_id" UUID REFERENCES "quotes"("id"),
  "type" TEXT NOT NULL,
  "metadata" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE "quote_rejections" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "quote_id" UUID REFERENCES "quotes"("id") NOT NULL,
  "customer_id" UUID REFERENCES "customers"("id") NOT NULL,
  "reason" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE "internal_adjustments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "quote_id" UUID REFERENCES "quotes"("id") NOT NULL,
  "changed_by" UUID REFERENCES "users"("id") NOT NULL,
  "fields" TEXT,
  "no_customer_impact" BOOLEAN NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tax and invoicing
CREATE TABLE "tax_regions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "country" TEXT NOT NULL,
  "province" TEXT,
  "tax_pct" NUMERIC(6,3) NOT NULL
);

CREATE TABLE "invoices" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "quote_id" UUID REFERENCES "quotes"("id"),
  "customer_id" UUID REFERENCES "customers"("id") NOT NULL,
  "stripe_invoice_id" TEXT,
  "total_cents" INTEGER NOT NULL,
  "tax_cents" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "due_date" DATE,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE "shipments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "quote_id" UUID REFERENCES "quotes"("id") NOT NULL,
  "method_id" UUID REFERENCES "shipping_methods"("id") NOT NULL,
  "tracking_number" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_quotes_customer_id" ON "quotes"("customer_id");
CREATE INDEX "idx_quotes_status" ON "quotes"("status");
CREATE INDEX "idx_files_quote_id" ON "files"("quote_id");
CREATE INDEX "idx_pages_file_id" ON "pages"("file_id");
CREATE INDEX "idx_events_quote_id" ON "events"("quote_id");
CREATE INDEX "idx_pricing_languages_code" ON "pricing_languages"("language_code");

-- Enable Row Level Security
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic examples - should be expanded)
CREATE POLICY "Users can view own data" ON "users" FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Customers can view own quotes" ON "quotes" FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM customers c 
    WHERE c.id = quotes.customer_id 
    AND c.user_id::text = auth.uid()::text
  )
);
