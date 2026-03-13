CREATE POLICY "Admins can update agency member profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  agency_id IN (
    SELECT p.agency_id FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);