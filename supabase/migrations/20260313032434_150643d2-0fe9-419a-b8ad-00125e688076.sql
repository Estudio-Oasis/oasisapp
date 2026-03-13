
-- AGENCIES TABLE
CREATE TABLE public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  base_currency text NOT NULL DEFAULT 'USD',
  country text,
  -- Fiscal
  tax_id text,
  legal_name text,
  fiscal_address text,
  -- Banking
  bank_name text,
  bank_account_number text,
  bank_routing text,
  bank_clabe text,
  bank_swift text,
  -- Domain auto-join
  allowed_email_domain text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Add agency_id to profiles
ALTER TABLE public.profiles ADD COLUMN agency_id uuid REFERENCES public.agencies(id);

-- AGENCY INVITATIONS TABLE
CREATE TABLE public.agency_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(agency_id, email)
);

ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;

-- RLS: agencies
CREATE POLICY "Members can view own agency" ON public.agencies
  FOR SELECT TO authenticated
  USING (id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update own agency" ON public.agencies
  FOR UPDATE TO authenticated
  USING (id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated can create agency" ON public.agencies
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- RLS: agency_invitations
CREATE POLICY "Members can view own agency invitations" ON public.agency_invitations
  FOR SELECT TO authenticated
  USING (agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can insert invitations" ON public.agency_invitations
  FOR INSERT TO authenticated
  WITH CHECK (agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update invitations" ON public.agency_invitations
  FOR UPDATE TO authenticated
  USING (agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete invitations" ON public.agency_invitations
  FOR DELETE TO authenticated
  USING (agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger for updated_at on agencies
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
