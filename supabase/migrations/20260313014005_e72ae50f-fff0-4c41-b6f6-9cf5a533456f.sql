
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount_received numeric NOT NULL,
  currency_received text NOT NULL DEFAULT 'USD',
  date_received date NOT NULL,
  sender_name text,
  reference text,
  transaction_id text,
  method text DEFAULT 'wise',
  bank_amount numeric,
  bank_currency text,
  exchange_rate numeric,
  breakdown jsonb DEFAULT '[]'::jsonb,
  receipt_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update payments" ON public.payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete payments" ON public.payments FOR DELETE TO authenticated USING (true);
