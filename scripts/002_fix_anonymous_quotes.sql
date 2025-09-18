-- Allow anonymous quote creation by modifying RLS policies
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Customers can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can upload files to their quotes" ON public.files;

-- Create new policies that allow anonymous quote creation
CREATE POLICY "Anyone can create quotes" ON public.quotes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view quotes they created" ON public.quotes
  FOR SELECT USING (
    -- Allow if user owns the quote OR if it's an anonymous quote (customer_id is null)
    auth.uid() = customer_id OR customer_id IS NULL
  );

CREATE POLICY "Quote owners can update their quotes" ON public.quotes
  FOR UPDATE USING (
    (auth.uid() = customer_id AND status = 'draft') OR 
    (customer_id IS NULL AND status = 'draft')
  );

-- Allow file uploads for any quote (anonymous or authenticated)
CREATE POLICY "Anyone can upload files to quotes" ON public.files
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view files for accessible quotes" ON public.files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = files.quote_id 
      AND (quotes.customer_id = auth.uid() OR quotes.customer_id IS NULL)
    )
  );
