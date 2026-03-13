ALTER TABLE public.profiles
  ADD COLUMN work_start_hour integer NOT NULL DEFAULT 9,
  ADD COLUMN work_start_minute integer NOT NULL DEFAULT 0;