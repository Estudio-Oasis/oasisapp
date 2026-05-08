
CREATE TABLE public.account_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agency_id uuid,
  category text NOT NULL CHECK (category IN ('profile','auth','identity','session','security','preferences','team','other')),
  action text NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_aal_user_created ON public.account_activity_log(user_id, created_at DESC);
CREATE INDEX idx_aal_agency_created ON public.account_activity_log(agency_id, created_at DESC);
CREATE INDEX idx_aal_category ON public.account_activity_log(category);

ALTER TABLE public.account_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own activity"
  ON public.account_activity_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activity"
  ON public.account_activity_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view agency activity"
  ON public.account_activity_log FOR SELECT TO authenticated
  USING (is_admin() AND agency_id = user_agency_id());

CREATE POLICY "Super admins can view all activity"
  ON public.account_activity_log FOR SELECT TO authenticated
  USING (is_super_admin());
