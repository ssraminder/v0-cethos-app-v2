-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin', 'super_admin');
CREATE TYPE quote_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled');
CREATE TYPE file_status AS ENUM ('uploaded', 'processing', 'processed', 'error');
CREATE TYPE certification_type AS ENUM ('certified', 'notarized', 'apostilled');
CREATE TYPE service_type AS ENUM ('translation', 'interpretation', 'certification', 'proofreading');
CREATE TYPE urgency_level AS ENUM ('standard', 'rush', 'urgent', 'same_day');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company_name TEXT,
  role user_role DEFAULT 'customer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Languages table
CREATE TABLE IF NOT EXISTS public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  native_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Language pairs table
CREATE TABLE IF NOT EXISTS public.language_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_language_id UUID REFERENCES languages(id),
  target_language_id UUID REFERENCES languages(id),
  base_rate DECIMAL(10,4) NOT NULL,
  rush_multiplier DECIMAL(3,2) DEFAULT 1.5,
  urgent_multiplier DECIMAL(3,2) DEFAULT 2.0,
  same_day_multiplier DECIMAL(3,2) DEFAULT 3.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_language_id, target_language_id)
);

-- Quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id),
  quote_number TEXT UNIQUE NOT NULL,
  status quote_status DEFAULT 'draft',
  source_language_id UUID REFERENCES languages(id),
  target_language_id UUID REFERENCES languages(id),
  service_type service_type NOT NULL,
  urgency_level urgency_level DEFAULT 'standard',
  certification_type certification_type,
  word_count INTEGER,
  page_count INTEGER,
  estimated_hours DECIMAL(5,2),
  base_amount DECIMAL(10,2),
  rush_amount DECIMAL(10,2) DEFAULT 0,
  certification_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2),
  notes TEXT,
  internal_notes TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status file_status DEFAULT 'uploaded',
  word_count INTEGER,
  page_count INTEGER,
  language_detected TEXT,
  confidence_score DECIMAL(3,2),
  processing_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing tiers table
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_words INTEGER NOT NULL,
  max_words INTEGER,
  rate_per_word DECIMAL(6,4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax regions table
CREATE TABLE IF NOT EXISTS public.tax_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_code TEXT UNIQUE NOT NULL,
  region_name TEXT NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for quotes table
CREATE POLICY "Customers can view their own quotes" ON public.quotes
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create quotes" ON public.quotes
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their draft quotes" ON public.quotes
  FOR UPDATE USING (auth.uid() = customer_id AND status = 'draft');

-- RLS Policies for files table
CREATE POLICY "Users can view files for their quotes" ON public.files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = files.quote_id 
      AND quotes.customer_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files to their quotes" ON public.files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = files.quote_id 
      AND quotes.customer_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_files_quote_id ON files(quote_id);
CREATE INDEX idx_language_pairs_source_target ON language_pairs(source_language_id, target_language_id);

-- Insert seed data for languages
INSERT INTO public.languages (code, name, native_name) VALUES
  ('en', 'English', 'English'),
  ('fr', 'French', 'Français'),
  ('es', 'Spanish', 'Español'),
  ('de', 'German', 'Deutsch'),
  ('it', 'Italian', 'Italiano'),
  ('pt', 'Portuguese', 'Português'),
  ('zh', 'Chinese', '中文'),
  ('ja', 'Japanese', '日本語'),
  ('ko', 'Korean', '한국어'),
  ('ar', 'Arabic', 'العربية')
ON CONFLICT (code) DO NOTHING;

-- Insert seed data for tax regions
INSERT INTO public.tax_regions (region_code, region_name, tax_rate) VALUES
  ('ON', 'Ontario', 0.13),
  ('QC', 'Quebec', 0.14975),
  ('BC', 'British Columbia', 0.12),
  ('AB', 'Alberta', 0.05),
  ('SK', 'Saskatchewan', 0.11),
  ('MB', 'Manitoba', 0.12),
  ('NB', 'New Brunswick', 0.15),
  ('NS', 'Nova Scotia', 0.15),
  ('PE', 'Prince Edward Island', 0.15),
  ('NL', 'Newfoundland and Labrador', 0.15),
  ('YT', 'Yukon', 0.05),
  ('NT', 'Northwest Territories', 0.05),
  ('NU', 'Nunavut', 0.05)
ON CONFLICT (region_code) DO NOTHING;

-- Insert seed data for pricing tiers
INSERT INTO public.pricing_tiers (name, min_words, max_words, rate_per_word) VALUES
  ('Tier 1', 1, 500, 0.25),
  ('Tier 2', 501, 1500, 0.22),
  ('Tier 3', 1501, 5000, 0.20),
  ('Tier 4', 5001, NULL, 0.18)
ON CONFLICT DO NOTHING;

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
