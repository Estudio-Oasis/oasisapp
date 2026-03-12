
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS billing_entity text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_frequency text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS communication_channel text,
  ADD COLUMN IF NOT EXISTS completeness_score integer DEFAULT 0;
