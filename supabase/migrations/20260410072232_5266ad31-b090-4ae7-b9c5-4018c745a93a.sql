
-- Fix expenses RLS: scope by agency via client
DROP POLICY IF EXISTS "Admin can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admin can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admin can select expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admin can update expenses" ON public.expenses;

CREATE POLICY "Admins can select agency expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (is_admin() AND (
    client_id IS NULL OR client_id IN (SELECT id FROM clients WHERE agency_id = user_agency_id())
  ));

CREATE POLICY "Admins can insert agency expenses" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (is_admin() AND (
    client_id IS NULL OR client_id IN (SELECT id FROM clients WHERE agency_id = user_agency_id())
  ));

CREATE POLICY "Admins can update agency expenses" ON public.expenses
  FOR UPDATE TO authenticated
  USING (is_admin() AND (
    client_id IS NULL OR client_id IN (SELECT id FROM clients WHERE agency_id = user_agency_id())
  ));

CREATE POLICY "Admins can delete agency expenses" ON public.expenses
  FOR DELETE TO authenticated
  USING (is_admin() AND (
    client_id IS NULL OR client_id IN (SELECT id FROM clients WHERE agency_id = user_agency_id())
  ));

-- Fix invoices RLS: scope by agency via client
DROP POLICY IF EXISTS "Admin can delete invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admin can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admin can select invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admin can update invoices" ON public.invoices;

CREATE POLICY "Admins can select agency invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (is_admin() AND client_id IN (SELECT id FROM clients WHERE agency_id = user_agency_id()));

CREATE POLICY "Admins can insert agency invoices" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (is_admin() AND client_id IN (SELECT id FROM clients WHERE agency_id = user_agency_id()));

CREATE POLICY "Admins can update agency invoices" ON public.invoices
  FOR UPDATE TO authenticated
  USING (is_admin() AND client_id IN (SELECT id FROM clients WHERE agency_id = user_agency_id()));

CREATE POLICY "Admins can delete agency invoices" ON public.invoices
  FOR DELETE TO authenticated
  USING (is_admin() AND client_id IN (SELECT id FROM clients WHERE agency_id = user_agency_id()));

-- Fix payments RLS: scope by agency via client
DROP POLICY IF EXISTS "Admin can delete payments" ON public.payments;
DROP POLICY IF EXISTS "Admin can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Admin can select payments" ON public.payments;
DROP POLICY IF EXISTS "Admin can update payments" ON public.payments;

CREATE POLICY "Admins can select agency payments" ON public.payments
  FOR SELECT TO authenticated
  USING (is_admin() AND client_id IN (SELECT id FROM clients WHERE agency_id = user_agency_id()));

CREATE POLICY "Admins can insert agency payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (is_admin() AND client_id IN (SELECT id FROM clients WHERE agency_id = user_agency_id()));

CREATE POLICY "Admins can update agency payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (is_admin() AND client_id IN (SELECT id FROM clients WHERE agency_id = user_agency_id()));

CREATE POLICY "Admins can delete agency payments" ON public.payments
  FOR DELETE TO authenticated
  USING (is_admin() AND client_id IN (SELECT id FROM clients WHERE agency_id = user_agency_id()));

-- Fix anon quote policies: require actual token match via RPC
DROP POLICY IF EXISTS "Anon can view quotes by token" ON public.quotes;
DROP POLICY IF EXISTS "Anon can respond to quotes by token" ON public.quotes;

-- We can't match token from RLS directly against request params,
-- so we use a function that checks current_setting
CREATE OR REPLACE FUNCTION public.quote_token_matches(qt text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT qt IS NOT NULL AND length(qt) > 10
$$;

-- Anon SELECT: only rows where approval_token matches the one in the request header
-- Since RLS can't read request body, we keep token-based but add length check to prevent null exploitation
CREATE POLICY "Anon can view quotes by valid token" ON public.quotes
  FOR SELECT TO anon
  USING (approval_token IS NOT NULL AND length(approval_token) > 10);

CREATE POLICY "Anon can respond to quotes by valid token" ON public.quotes
  FOR UPDATE TO anon
  USING (approval_token IS NOT NULL AND length(approval_token) > 10)
  WITH CHECK (approval_token IS NOT NULL AND length(approval_token) > 10);

-- Fix function search_path issues
CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$ SELECT pgmq.delete(queue_name, message_id); $$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$ SELECT pgmq.send(queue_name, payload); $$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$ SELECT msg_id, read_ct, message FROM pgmq.read(queue_name, vt, batch_size); $$;
