
-- Drop and recreate the INSERT policy on agencies
DROP POLICY IF EXISTS "Authenticated can create agency" ON public.agencies;

CREATE POLICY "Authenticated can create agency"
ON public.agencies
FOR INSERT
TO authenticated
WITH CHECK (true);
