
-- Create is_admin() helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- INVOICES: restrict all operations to admin
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can delete invoices" ON public.invoices;

CREATE POLICY "Admin can select invoices" ON public.invoices FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (public.is_admin());

-- PAYMENTS: restrict all operations to admin
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can delete payments" ON public.payments;

CREATE POLICY "Admin can select payments" ON public.payments FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update payments" ON public.payments FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can delete payments" ON public.payments FOR DELETE TO authenticated USING (public.is_admin());

-- EXPENSES: restrict all operations to admin
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;

CREATE POLICY "Admin can select expenses" ON public.expenses FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (public.is_admin());

-- CLIENTS: restrict DELETE to admin only
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;
CREATE POLICY "Admin can delete clients" ON public.clients FOR DELETE TO authenticated USING (public.is_admin());

-- CLIENTS: restrict INSERT to admin only
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
CREATE POLICY "Admin can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- TASKS: restrict DELETE to admin only
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON public.tasks;
CREATE POLICY "Admin can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (public.is_admin());
