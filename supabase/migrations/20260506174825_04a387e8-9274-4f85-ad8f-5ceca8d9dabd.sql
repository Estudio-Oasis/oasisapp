-- Add columns to agencies
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS invite_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_link_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invite_link_created_at timestamptz;

-- Regenerate invite link (admin only, for own agency)
CREATE OR REPLACE FUNCTION public.regenerate_agency_invite_link()
RETURNS TABLE(invite_token text, invite_link_enabled boolean, invite_link_created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _agency uuid;
  _token text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT agency_id INTO _agency FROM profiles WHERE id = auth.uid() AND role = 'admin';
  IF _agency IS NULL THEN RAISE EXCEPTION 'Only admins can manage invite links'; END IF;

  _token := encode(gen_random_bytes(24), 'hex');

  UPDATE agencies
    SET invite_token = _token,
        invite_link_enabled = true,
        invite_link_created_at = now()
    WHERE id = _agency;

  RETURN QUERY SELECT a.invite_token, a.invite_link_enabled, a.invite_link_created_at
    FROM agencies a WHERE a.id = _agency;
END;
$$;

-- Disable invite link
CREATE OR REPLACE FUNCTION public.disable_agency_invite_link()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _agency uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT agency_id INTO _agency FROM profiles WHERE id = auth.uid() AND role = 'admin';
  IF _agency IS NULL THEN RAISE EXCEPTION 'Only admins can manage invite links'; END IF;

  UPDATE agencies SET invite_link_enabled = false WHERE id = _agency;
END;
$$;

-- Public lookup by token (returns minimal info, no RLS bypass needed since we filter by token)
CREATE OR REPLACE FUNCTION public.get_agency_by_invite_token(_token text)
RETURNS TABLE(id uuid, name text, logo_url text, plan text, member_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.name, a.logo_url, a.plan,
         (SELECT count(*) FROM profiles p WHERE p.agency_id = a.id)
  FROM agencies a
  WHERE a.invite_token = _token
    AND a.invite_link_enabled = true
    AND a.is_active = true
  LIMIT 1;
$$;

-- Join agency via invite token
CREATE OR REPLACE FUNCTION public.join_agency_via_invite_token(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _agency uuid;
  _current_agency uuid;
  _plan text;
  _max int;
  _count int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT id, plan INTO _agency, _plan
  FROM agencies
  WHERE invite_token = _token AND invite_link_enabled = true AND is_active = true;

  IF _agency IS NULL THEN RAISE EXCEPTION 'Invalid or disabled invite link'; END IF;

  SELECT agency_id INTO _current_agency FROM profiles WHERE id = auth.uid();
  IF _current_agency = _agency THEN RETURN _agency; END IF;
  IF _current_agency IS NOT NULL THEN
    RAISE EXCEPTION 'You already belong to another workspace. Leave it first.';
  END IF;

  -- Plan member limit
  _max := CASE _plan WHEN 'free' THEN 1 WHEN 'pro' THEN 6 WHEN 'agency' THEN 10 ELSE 10 END;
  SELECT count(*) INTO _count FROM profiles WHERE agency_id = _agency;
  IF _count >= _max THEN RAISE EXCEPTION 'Workspace has reached its member limit'; END IF;

  UPDATE profiles
    SET agency_id = _agency, role = 'member'
    WHERE id = auth.uid();

  RETURN _agency;
END;
$$;