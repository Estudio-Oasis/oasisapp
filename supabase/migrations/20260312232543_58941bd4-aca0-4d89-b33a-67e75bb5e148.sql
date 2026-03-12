CREATE TABLE public.client_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service text NOT NULL,
  url text,
  username text,
  password text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.client_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view credentials"
  ON public.client_credentials FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert credentials"
  ON public.client_credentials FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update credentials"
  ON public.client_credentials FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete credentials"
  ON public.client_credentials FOR DELETE TO authenticated
  USING (true);