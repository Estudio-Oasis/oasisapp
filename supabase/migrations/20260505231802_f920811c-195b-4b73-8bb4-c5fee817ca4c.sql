CREATE OR REPLACE FUNCTION public.remove_agency_member(_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_agency uuid;
  _member_agency uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _member_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;

  SELECT agency_id INTO _admin_agency
  FROM public.profiles
  WHERE id = auth.uid() AND role = 'admin';

  IF _admin_agency IS NULL THEN
    RAISE EXCEPTION 'Only admins can remove members';
  END IF;

  SELECT agency_id INTO _member_agency
  FROM public.profiles
  WHERE id = _member_id;

  IF _member_agency IS DISTINCT FROM _admin_agency THEN
    RAISE EXCEPTION 'Member not in your agency';
  END IF;

  UPDATE public.profiles
  SET agency_id = NULL, role = 'member'
  WHERE id = _member_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_agency_member(uuid) TO authenticated;