
DROP POLICY IF EXISTS "Users can view own time entries" ON public.time_entries;
CREATE POLICY "Authenticated can view all time entries"
  ON public.time_entries FOR SELECT TO authenticated
  USING (true);
