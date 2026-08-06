DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.contact_submissions CASCADE;
DROP TABLE IF EXISTS public.email_send_log CASCADE;
DROP TABLE IF EXISTS public.email_send_state CASCADE;
DROP TABLE IF EXISTS public.email_unsubscribe_tokens CASCADE;
DROP TABLE IF EXISTS public.suppressed_emails CASCADE;

DROP FUNCTION IF EXISTS public.delete_email(text, bigint) CASCADE;
DROP FUNCTION IF EXISTS public.email_queue_dispatch() CASCADE;
DROP FUNCTION IF EXISTS public.email_queue_wake() CASCADE;
DROP FUNCTION IF EXISTS public.enqueue_email(text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.move_to_dlq(text, text, bigint, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.read_email_batch(text, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;