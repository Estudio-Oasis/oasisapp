-- Add billing fields to agency_settings
ALTER TABLE public.agency_settings
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS company_address text,
  ADD COLUMN IF NOT EXISTS company_email text,
  ADD COLUMN IF NOT EXISTS company_phone text,
  ADD COLUMN IF NOT EXISTS default_payment_terms text DEFAULT '50% al aceptar la cotización, 50% a contra entrega del proyecto',
  ADD COLUMN IF NOT EXISTS default_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS bank_info text;

-- Add payment_terms and notes_to_client to quotes
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT '50% al aceptar la cotización, 50% a contra entrega del proyecto',
  ADD COLUMN IF NOT EXISTS notes_to_client text DEFAULT 'Esta cotización incluye hasta 2 rondas de revisión. Cambios adicionales se cotizan por separado.';