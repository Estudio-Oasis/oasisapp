-- 1. Quotes: require exact token match for anonymous access
DROP POLICY IF EXISTS "Anon can view quotes by valid token" ON public.quotes;
DROP POLICY IF EXISTS "Anon can respond to quotes by valid token" ON public.quotes;

CREATE OR REPLACE FUNCTION public.quote_token_matches(qt text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT qt IS NOT NULL
     AND length(qt) > 10
     AND qt = nullif(current_setting('request.headers', true)::json->>'x-quote-token', '')
$$;

CREATE POLICY "Anon can view quotes by exact token"
ON public.quotes FOR SELECT TO anon
USING (public.quote_token_matches(approval_token));

CREATE POLICY "Anon can respond to quotes by exact token"
ON public.quotes FOR UPDATE TO anon
USING (public.quote_token_matches(approval_token))
WITH CHECK (public.quote_token_matches(approval_token));

-- 2. member_presence: no agency-wide exposure of current client/task
DROP POLICY IF EXISTS "Users can view own or agency presence" ON public.member_presence;
CREATE POLICY "Users can view own presence"
ON public.member_presence FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 3. Storage: quote-pdfs scoped to owning agency
DROP POLICY IF EXISTS "Authenticated users can read quote PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload quote PDFs" ON storage.objects;

CREATE POLICY "Agency members can read own quote PDFs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.agency_id = public.user_agency_id()
      AND (q.pdf_url LIKE '%' || storage.objects.name OR (storage.foldername(storage.objects.name))[1] = q.id::text)
  )
);

CREATE POLICY "Agency members can upload own quote PDFs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.agency_id = public.user_agency_id()
      AND (storage.foldername(storage.objects.name))[1] = q.id::text
  )
);

-- 4. Storage: receipts scoped to owning agency
DROP POLICY IF EXISTS "Authenticated users can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete receipts" ON storage.objects;

CREATE POLICY "Agency members can view own receipts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'receipts'
  AND EXISTS (
    SELECT 1 FROM public.payments pay
    JOIN public.clients c ON c.id = pay.client_id
    WHERE c.agency_id = public.user_agency_id()
      AND pay.receipt_url LIKE '%' || storage.objects.name
  )
);

CREATE POLICY "Agency members can upload receipts in own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(storage.objects.name))[1] = (auth.uid())::text
);

CREATE POLICY "Agency members can update own uploaded receipts"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(storage.objects.name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(storage.objects.name))[1] = (auth.uid())::text
);

CREATE POLICY "Agency members can delete own uploaded receipts"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(storage.objects.name))[1] = (auth.uid())::text
);

-- 5. Storage: chat images only by conversation participants
DROP POLICY IF EXISTS "Authenticated users can upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view chat images" ON storage.objects;

CREATE POLICY "Participants can upload chat images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-images'
  AND EXISTS (
    SELECT 1 FROM public.chat_conversations cc
    WHERE cc.id::text = (storage.foldername(storage.objects.name))[1]
      AND (cc.participant_a = auth.uid() OR cc.participant_b = auth.uid())
  )
);

CREATE POLICY "Participants can view chat images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-images'
  AND EXISTS (
    SELECT 1 FROM public.chat_conversations cc
    WHERE cc.id::text = (storage.foldername(storage.objects.name))[1]
      AND (cc.participant_a = auth.uid() OR cc.participant_b = auth.uid())
  )
);

-- 6. Revoke direct EXECUTE on SECURITY DEFINER functions not needed by clients
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_join_agency() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_hourly_rates(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.disable_agency_invite_link() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.regenerate_agency_invite_link() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.remove_agency_member(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.join_agency_via_invite_token(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_agency_by_invite_token(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.quote_token_matches(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_agency_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.same_agency_as(uuid) FROM anon;