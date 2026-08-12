CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (source IN ('cotizador','brief')),
  lang text CHECK (lang IN ('es','en')),
  name text CHECK (char_length(name) <= 120),
  company text CHECK (char_length(company) <= 160),
  email text CHECK (char_length(email) <= 255),
  contact text CHECK (char_length(contact) <= 255),
  business text CHECK (char_length(business) <= 300),
  website text CHECK (char_length(website) <= 300),
  team_size text CHECK (char_length(team_size) <= 60),
  revenue_range text CHECK (char_length(revenue_range) <= 60),
  stage text CHECK (char_length(stage) <= 60),
  channels text[],
  goals text[],
  needs text[],
  context text CHECK (char_length(context) <= 4000),
  tried text CHECK (char_length(tried) <= 4000),
  monthly_min integer,
  monthly_max integer,
  project_min integer,
  project_max integer,
  page_path text CHECK (char_length(page_path) <= 300),
  referrer text CHECK (char_length(referrer) <= 500)
);

CREATE INDEX leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX leads_source_idx ON public.leads (source);

GRANT INSERT ON public.leads TO anon, authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead"
  ON public.leads FOR INSERT TO anon, authenticated
  WITH CHECK (
    (email IS NOT NULL AND char_length(trim(email)) > 3)
    OR (contact IS NOT NULL AND char_length(trim(contact)) > 3)
  );