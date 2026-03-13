
-- Add job_title to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title text;

-- Add onboarded flag to profiles (default false)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;

-- Add full_name and job_title to agency_invitations
ALTER TABLE public.agency_invitations ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.agency_invitations ADD COLUMN IF NOT EXISTS job_title text;
