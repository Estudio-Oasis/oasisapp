CREATE TABLE public.feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  agency_id uuid REFERENCES public.agencies(id),
  module text NOT NULL,
  type text NOT NULL CHECK (type IN ('bug', 'mejora', 'idea')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON public.feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view agency feedback"
  ON public.feedback FOR SELECT TO authenticated
  USING (agency_id = user_agency_id() AND is_admin());