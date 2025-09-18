-- Create certification_types table first before intended_uses
-- Create certification_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS certification_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  pricing_mode TEXT NOT NULL DEFAULT 'flat' CHECK (pricing_mode IN ('flat', 'per_page', 'per_word')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on certification_types
ALTER TABLE certification_types ENABLE ROW LEVEL SECURITY;

-- Allow public read access to certification_types
CREATE POLICY "Anyone can read certification types" ON certification_types
  FOR SELECT USING (is_active = true);

-- Now create intended_uses table that references certification_types
-- Add intended_uses table and certification type mapping
CREATE TABLE IF NOT EXISTS intended_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  certification_type_id UUID REFERENCES certification_types(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on intended_uses
ALTER TABLE intended_uses ENABLE ROW LEVEL SECURITY;

-- Allow public read access to intended_uses
CREATE POLICY "Anyone can read intended uses" ON intended_uses
  FOR SELECT USING (is_active = true);

-- Insert default certification types if they don't exist
INSERT INTO certification_types (name, price_cents, pricing_mode, is_active)
VALUES 
  ('Standard', 0, 'flat', true),
  ('Notarization', 5000, 'flat', true), -- $50.00
  ('PPTC Form', 3500, 'flat', true)     -- $35.00
ON CONFLICT (name) DO NOTHING;

-- Insert default intended uses
INSERT INTO intended_uses (name, certification_type_id, is_active)
SELECT 
  'Passport Canada',
  ct.id,
  true
FROM certification_types ct 
WHERE ct.name = 'PPTC Form'
ON CONFLICT (name) DO NOTHING;

INSERT INTO intended_uses (name, certification_type_id, is_active)
SELECT 
  'Travel Document',
  ct.id,
  true
FROM certification_types ct 
WHERE ct.name = 'PPTC Form'
ON CONFLICT (name) DO NOTHING;

INSERT INTO intended_uses (name, certification_type_id, is_active)
SELECT 
  'Certified Translation',
  ct.id,
  true
FROM certification_types ct 
WHERE ct.name = 'Standard'
ON CONFLICT (name) DO NOTHING;

INSERT INTO intended_uses (name, certification_type_id, is_active)
SELECT 
  'Immigration Documents',
  ct.id,
  true
FROM certification_types ct 
WHERE ct.name = 'Notarization'
ON CONFLICT (name) DO NOTHING;

INSERT INTO intended_uses (name, certification_type_id, is_active)
SELECT 
  'Legal Documents',
  ct.id,
  true
FROM certification_types ct 
WHERE ct.name = 'Notarization'
ON CONFLICT (name) DO NOTHING;

-- Add intended_use_id to quotes table if it doesn't exist
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS intended_use_id UUID REFERENCES intended_uses(id),
ADD COLUMN IF NOT EXISTS certification_type_id UUID REFERENCES certification_types(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_intended_uses_certification_type ON intended_uses(certification_type_id);
CREATE INDEX IF NOT EXISTS idx_quotes_intended_use ON quotes(intended_use_id);
CREATE INDEX IF NOT EXISTS idx_quotes_certification_type ON quotes(certification_type_id);
