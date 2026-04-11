
-- Add columns to agencies
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS plan_override text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Super admin users table
CREATE TABLE public.super_admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.super_admin_users ENABLE ROW LEVEL SECURITY;

-- Super admin audit log
CREATE TABLE public.super_admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  target_agency_id uuid REFERENCES public.agencies(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.super_admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admin_users WHERE id = auth.uid()
  )
$$;

-- RLS for super_admin_users
CREATE POLICY "Super admins can view list"
  ON public.super_admin_users FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- RLS for super_admin_audit_log
CREATE POLICY "Super admins can view audit log"
  ON public.super_admin_audit_log FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admins can insert audit log"
  ON public.super_admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin() AND admin_id = auth.uid());

-- Allow super admins to read ALL agencies
CREATE POLICY "Super admins can view all agencies"
  ON public.agencies FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- Allow super admins to update any agency (for plan override)
CREATE POLICY "Super admins can update any agency"
  ON public.agencies FOR UPDATE
  TO authenticated
  USING (public.is_super_admin());

-- Allow super admins to read all profiles
CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- Allow super admins to read all feedback
CREATE POLICY "Super admins can view all feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (public.is_super_admin());
