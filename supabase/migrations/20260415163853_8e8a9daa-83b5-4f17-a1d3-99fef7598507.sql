
-- Add economic profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS income_target numeric,
  ADD COLUMN IF NOT EXISTS income_minimum numeric,
  ADD COLUMN IF NOT EXISTS income_currency text NOT NULL DEFAULT 'MXN',
  ADD COLUMN IF NOT EXISTS available_hours_per_week numeric,
  ADD COLUMN IF NOT EXISTS work_days text[] NOT NULL DEFAULT '{mon,tue,wed,thu,fri}',
  ADD COLUMN IF NOT EXISTS profile_type text;

-- Function to calculate hourly rates
CREATE OR REPLACE FUNCTION public.calculate_hourly_rates(_user_id uuid)
RETURNS TABLE(rate_minimum numeric, rate_target numeric, rate_premium numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE WHEN p.available_hours_per_week > 0 AND p.income_minimum IS NOT NULL
      THEN ROUND(p.income_minimum / (p.available_hours_per_week * 4.33), 2)
      ELSE NULL
    END AS rate_minimum,
    CASE WHEN p.available_hours_per_week > 0 AND p.income_target IS NOT NULL
      THEN ROUND(p.income_target / (p.available_hours_per_week * 4.33), 2)
      ELSE NULL
    END AS rate_target,
    CASE WHEN p.available_hours_per_week > 0 AND p.income_target IS NOT NULL
      THEN ROUND((p.income_target * 1.3) / (p.available_hours_per_week * 4.33), 2)
      ELSE NULL
    END AS rate_premium
  FROM public.profiles p
  WHERE p.id = _user_id;
$$;
