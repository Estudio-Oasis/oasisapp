
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Mexico_City',
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{"email_daily_summary":true,"email_mentions":true,"email_task_reminders":true,"email_product_updates":false,"inapp_sounds":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS week_start_day smallint NOT NULL DEFAULT 1;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR length(bio) <= 280),
  ADD CONSTRAINT profiles_week_start_day CHECK (week_start_day IN (0,1));
