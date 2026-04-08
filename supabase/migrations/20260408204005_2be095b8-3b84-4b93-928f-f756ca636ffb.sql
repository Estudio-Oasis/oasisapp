
-- Fix agencies INSERT: only allow users who don't have an agency yet
DROP POLICY IF EXISTS "Authenticated can create agency" ON public.agencies;
CREATE POLICY "Authenticated can create agency"
ON public.agencies
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND agency_id IS NOT NULL
  )
);

-- Fix profiles admin update: restrict WITH CHECK to same agency
DROP POLICY IF EXISTS "Admins can update agency member profiles" ON public.profiles;
CREATE POLICY "Admins can update agency member profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  agency_id IN (
    SELECT p.agency_id FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'::app_role
  )
)
WITH CHECK (
  agency_id = user_agency_id()
);
