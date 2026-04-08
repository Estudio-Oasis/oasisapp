
-- Quotes table
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  project_id uuid REFERENCES public.projects(id),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft',
  subtotal decimal NOT NULL DEFAULT 0,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value decimal NOT NULL DEFAULT 0,
  tax_enabled boolean NOT NULL DEFAULT true,
  tax_rate decimal NOT NULL DEFAULT 16,
  total_amount decimal NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  valid_until date,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agency quotes" ON public.quotes
  FOR SELECT TO authenticated
  USING (agency_id = user_agency_id());

CREATE POLICY "Users can insert own agency quotes" ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK (agency_id = user_agency_id());

CREATE POLICY "Users can update own agency quotes" ON public.quotes
  FOR UPDATE TO authenticated
  USING (agency_id = user_agency_id())
  WITH CHECK (agency_id = user_agency_id());

CREATE POLICY "Admins can delete own agency quotes" ON public.quotes
  FOR DELETE TO authenticated
  USING (agency_id = user_agency_id() AND is_admin());

-- Quote items table
CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity decimal NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'hora',
  unit_price decimal NOT NULL,
  subtotal decimal GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quote items" ON public.quote_items
  FOR SELECT TO authenticated
  USING (quote_id IN (SELECT id FROM public.quotes WHERE agency_id = user_agency_id()));

CREATE POLICY "Users can insert quote items" ON public.quote_items
  FOR INSERT TO authenticated
  WITH CHECK (quote_id IN (SELECT id FROM public.quotes WHERE agency_id = user_agency_id()));

CREATE POLICY "Users can update quote items" ON public.quote_items
  FOR UPDATE TO authenticated
  USING (quote_id IN (SELECT id FROM public.quotes WHERE agency_id = user_agency_id()))
  WITH CHECK (quote_id IN (SELECT id FROM public.quotes WHERE agency_id = user_agency_id()));

CREATE POLICY "Users can delete quote items" ON public.quote_items
  FOR DELETE TO authenticated
  USING (quote_id IN (SELECT id FROM public.quotes WHERE agency_id = user_agency_id()));

-- Storage bucket for quote PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('quote-pdfs', 'quote-pdfs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload quote PDFs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'quote-pdfs');

CREATE POLICY "Authenticated users can read quote PDFs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'quote-pdfs');
