-- Remove implicit PUBLIC execute rights on all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.user_agency_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.same_agency_as(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_join_agency() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.disable_agency_invite_link() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_agency_by_invite_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.remove_agency_member(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.regenerate_agency_invite_link() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_hourly_rates(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.join_agency_via_invite_token(text) FROM PUBLIC;

-- Inline the exact-token check so no public helper function is required
DROP POLICY IF EXISTS "Anon can view quotes by exact token" ON public.quotes;
DROP POLICY IF EXISTS "Anon can respond to quotes by exact token" ON public.quotes;
DROP FUNCTION IF EXISTS public.quote_token_matches(text);

CREATE POLICY "Anon can view quotes by exact token"
ON public.quotes FOR SELECT TO anon
USING (
  approval_token IS NOT NULL
  AND length(approval_token) > 10
  AND approval_token = nullif(current_setting('request.headers', true)::json->>'x-quote-token', '')
);

CREATE POLICY "Anon can respond to quotes by exact token"
ON public.quotes FOR UPDATE TO anon
USING (
  approval_token IS NOT NULL
  AND length(approval_token) > 10
  AND approval_token = nullif(current_setting('request.headers', true)::json->>'x-quote-token', '')
)
WITH CHECK (
  approval_token IS NOT NULL
  AND length(approval_token) > 10
  AND approval_token = nullif(current_setting('request.headers', true)::json->>'x-quote-token', '')
);