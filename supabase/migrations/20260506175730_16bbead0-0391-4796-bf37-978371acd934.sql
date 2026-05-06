CREATE OR REPLACE FUNCTION public.regenerate_agency_invite_link()
 RETURNS TABLE(invite_token text, invite_link_enabled boolean, invite_link_created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _agency uuid;
  _token text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT p.agency_id INTO _agency FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin';
  IF _agency IS NULL THEN RAISE EXCEPTION 'Only admins can manage invite links'; END IF;

  _token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  UPDATE public.agencies
    SET invite_token = _token,
        invite_link_enabled = true,
        invite_link_created_at = now()
    WHERE id = _agency;

  RETURN QUERY SELECT a.invite_token, a.invite_link_enabled, a.invite_link_created_at
    FROM public.agencies a WHERE a.id = _agency;
END;
$function$;