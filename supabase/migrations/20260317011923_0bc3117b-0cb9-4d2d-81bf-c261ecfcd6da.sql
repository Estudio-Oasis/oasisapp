
-- Add plan column to profiles (free by default, pro for full OasisOS)
ALTER TABLE public.profiles ADD COLUMN plan text NOT NULL DEFAULT 'free';

-- Update existing users to pro (they're already using the full system)
UPDATE public.profiles SET plan = 'pro' WHERE agency_id IS NOT NULL;
