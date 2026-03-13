CREATE TABLE public.agency_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  slack_channel_id text DEFAULT 'C0917V4QELS',
  slack_channel_name text DEFAULT 'todo-estudio-oasis',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agency_id)
);

ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own agency settings"
  ON public.agency_settings FOR SELECT TO authenticated
  USING (agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update own agency settings"
  ON public.agency_settings FOR UPDATE TO authenticated
  USING (agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert own agency settings"
  ON public.agency_settings FOR INSERT TO authenticated
  WITH CHECK (agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));