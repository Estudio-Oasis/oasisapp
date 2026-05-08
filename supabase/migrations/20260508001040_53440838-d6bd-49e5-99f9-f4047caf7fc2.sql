-- Super admin read-only access for Comando view
CREATE POLICY "Super admins can view all time entries" ON public.time_entries FOR SELECT TO authenticated USING (is_super_admin());
CREATE POLICY "Super admins can view all tasks" ON public.tasks FOR SELECT TO authenticated USING (is_super_admin());
CREATE POLICY "Super admins can view all clients" ON public.clients FOR SELECT TO authenticated USING (is_super_admin());
CREATE POLICY "Super admins can view all projects" ON public.projects FOR SELECT TO authenticated USING (is_super_admin());
CREATE POLICY "Super admins can view all invoices" ON public.invoices FOR SELECT TO authenticated USING (is_super_admin());
CREATE POLICY "Super admins can view all quotes" ON public.quotes FOR SELECT TO authenticated USING (is_super_admin());
CREATE POLICY "Super admins can view all payments" ON public.payments FOR SELECT TO authenticated USING (is_super_admin());
CREATE POLICY "Super admins can view all presence" ON public.member_presence FOR SELECT TO authenticated USING (is_super_admin());