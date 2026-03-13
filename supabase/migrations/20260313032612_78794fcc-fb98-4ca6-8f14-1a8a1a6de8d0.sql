
-- Function to auto-join agency on profile creation based on email domain or pending invitation
CREATE OR REPLACE FUNCTION public.auto_join_agency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _domain text;
  _agency_id uuid;
  _invite_role text;
BEGIN
  -- Extract domain from email
  _domain := split_part(NEW.email, '@', 2);

  -- Check for pending invitation first
  SELECT ai.agency_id, ai.role INTO _agency_id, _invite_role
  FROM public.agency_invitations ai
  WHERE ai.email = NEW.email AND ai.status = 'pending'
  LIMIT 1;

  IF _agency_id IS NOT NULL THEN
    NEW.agency_id := _agency_id;
    NEW.role := _invite_role::app_role;
    -- Mark invitation as accepted
    UPDATE public.agency_invitations
    SET status = 'accepted'
    WHERE email = NEW.email AND agency_id = _agency_id AND status = 'pending';
    RETURN NEW;
  END IF;

  -- Check for domain-based auto-join
  SELECT a.id INTO _agency_id
  FROM public.agencies a
  WHERE a.allowed_email_domain = _domain
  LIMIT 1;

  IF _agency_id IS NOT NULL THEN
    NEW.agency_id := _agency_id;
    NEW.role := 'member'::app_role;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger BEFORE INSERT on profiles to auto-join
CREATE TRIGGER trg_auto_join_agency
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_join_agency();
