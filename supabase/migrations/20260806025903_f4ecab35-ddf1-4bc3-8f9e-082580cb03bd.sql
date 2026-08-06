-- Contact submissions: reads no longer depend on the super-admin table
DROP POLICY IF EXISTS "Super admins can read submissions" ON public.contact_submissions;
CREATE POLICY "Service role can read submissions"
ON public.contact_submissions FOR SELECT
USING (auth.role() = 'service_role');

-- Drop unused legacy tables
DROP TABLE IF EXISTS public.account_activity_log CASCADE;
DROP TABLE IF EXISTS public.agency_invitations CASCADE;
DROP TABLE IF EXISTS public.agency_settings CASCADE;
DROP TABLE IF EXISTS public.chat_summaries CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_conversations CASCADE;
DROP TABLE IF EXISTS public.client_credentials CASCADE;
DROP TABLE IF EXISTS public.client_interactions CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.expense_categories CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.member_presence CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.quote_items CASCADE;
DROP TABLE IF EXISTS public.quotes CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.time_entries CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.super_admin_audit_log CASCADE;
DROP TABLE IF EXISTS public.super_admin_users CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;

-- Drop unused functions (CASCADE also removes the old auth signup trigger)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.auto_join_agency() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.user_agency_id() CASCADE;
DROP FUNCTION IF EXISTS public.same_agency_as(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_hourly_rates(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.disable_agency_invite_link() CASCADE;
DROP FUNCTION IF EXISTS public.regenerate_agency_invite_link() CASCADE;
DROP FUNCTION IF EXISTS public.get_agency_by_invite_token(text) CASCADE;
DROP FUNCTION IF EXISTS public.join_agency_via_invite_token(text) CASCADE;
DROP FUNCTION IF EXISTS public.remove_agency_member(uuid) CASCADE;

-- Drop unused enum types
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.billing_type CASCADE;
DROP TYPE IF EXISTS public.client_status CASCADE;
DROP TYPE IF EXISTS public.interaction_type CASCADE;
DROP TYPE IF EXISTS public.invoice_status CASCADE;
DROP TYPE IF EXISTS public.project_status CASCADE;
DROP TYPE IF EXISTS public.task_priority CASCADE;
DROP TYPE IF EXISTS public.task_status CASCADE;

-- Drop unused storage policies and buckets
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Agency members can read own quote PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Agency members can upload own quote PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Agency members can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Agency members can upload receipts in own folder" ON storage.objects;
DROP POLICY IF EXISTS "Agency members can update own uploaded receipts" ON storage.objects;
DROP POLICY IF EXISTS "Agency members can delete own uploaded receipts" ON storage.objects;
DROP POLICY IF EXISTS "Participants can upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Participants can view chat images" ON storage.objects;