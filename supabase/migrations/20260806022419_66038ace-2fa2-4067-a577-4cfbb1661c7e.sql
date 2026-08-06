CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  need text,
  budget text,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_submissions TO anon;
GRANT INSERT, SELECT ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit the contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit the contact form"
ON public.contact_submissions FOR INSERT TO anon, authenticated
WITH CHECK (
  length(name) BETWEEN 1 AND 120
  AND length(email) BETWEEN 3 AND 255
  AND length(message) BETWEEN 1 AND 4000
  AND (company IS NULL OR length(company) <= 160)
  AND (need IS NULL OR length(need) <= 120)
  AND (budget IS NULL OR length(budget) <= 120)
);

DROP POLICY IF EXISTS "Super admins can read submissions" ON public.contact_submissions;
CREATE POLICY "Super admins can read submissions"
ON public.contact_submissions FOR SELECT TO authenticated
USING (public.is_super_admin());