
-- ============================================================
-- FASE 1: Multi-tenant RLS + agency_id en clients
-- ============================================================

-- 1. Helper functions (SECURITY DEFINER, search_path fijo)

CREATE OR REPLACE FUNCTION public.user_agency_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.same_agency_as(target_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.agency_id = p2.agency_id
    WHERE p1.id = auth.uid()
      AND p2.id = target_user_id
      AND p1.agency_id IS NOT NULL
  )
$$;

-- 2. Add agency_id to clients + deterministic backfill

ALTER TABLE public.clients ADD COLUMN agency_id uuid REFERENCES public.agencies(id);
UPDATE public.clients SET agency_id = '42359ad4-5aa4-4eb2-a0b4-02bc0b3cfcec';
ALTER TABLE public.clients ALTER COLUMN agency_id SET NOT NULL;
CREATE INDEX idx_clients_agency_id ON public.clients(agency_id);

-- ============================================================
-- 3. REWRITE RLS POLICIES
-- ============================================================

-- ---- time_entries ----
DROP POLICY IF EXISTS "Authenticated can view all time entries" ON public.time_entries;
CREATE POLICY "Users can view own or agency time entries"
  ON public.time_entries FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.same_agency_as(user_id));
-- INSERT/UPDATE/DELETE already scoped to auth.uid() = user_id — no changes needed

-- ---- clients ----
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Admin can delete clients" ON public.clients;

CREATE POLICY "Users can view own agency clients"
  ON public.clients FOR SELECT TO authenticated
  USING (agency_id = public.user_agency_id());

CREATE POLICY "Users can insert own agency clients"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.user_agency_id());

CREATE POLICY "Users can update own agency clients"
  ON public.clients FOR UPDATE TO authenticated
  USING (agency_id = public.user_agency_id())
  WITH CHECK (agency_id = public.user_agency_id());

CREATE POLICY "Admins can delete own agency clients"
  ON public.clients FOR DELETE TO authenticated
  USING (agency_id = public.user_agency_id() AND public.is_admin());

-- ---- projects (scoped via client -> agency) ----
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;

CREATE POLICY "Users can view own agency projects"
  ON public.projects FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()));

CREATE POLICY "Users can insert own agency projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()));

CREATE POLICY "Users can update own agency projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()))
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()));

CREATE POLICY "Admins can delete own agency projects"
  ON public.projects FOR DELETE TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()) AND public.is_admin());

-- ---- tasks (scoped via project -> client -> agency, OR assignee for personal) ----
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admin can delete tasks" ON public.tasks;

CREATE POLICY "Users can view accessible tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (
    assignee_id = auth.uid()
    OR (project_id IS NOT NULL AND project_id IN (
      SELECT id FROM public.projects WHERE client_id IN (
        SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()
      )
    ))
    OR (project_id IS NULL AND client_id IS NOT NULL AND client_id IN (
      SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()
    ))
  );

CREATE POLICY "Users can insert accessible tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (
    (assignee_id IS NULL OR assignee_id = auth.uid() OR public.same_agency_as(assignee_id))
    AND (project_id IS NULL OR project_id IN (
      SELECT id FROM public.projects WHERE client_id IN (
        SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()
      )
    ))
    AND (client_id IS NULL OR client_id IN (
      SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()
    ))
  );

CREATE POLICY "Users can update accessible tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (
    assignee_id = auth.uid()
    OR (project_id IS NOT NULL AND project_id IN (
      SELECT id FROM public.projects WHERE client_id IN (
        SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()
      )
    ))
    OR (project_id IS NULL AND client_id IS NOT NULL AND client_id IN (
      SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()
    ))
  )
  WITH CHECK (
    (assignee_id IS NULL OR assignee_id = auth.uid() OR public.same_agency_as(assignee_id))
    AND (project_id IS NULL OR project_id IN (
      SELECT id FROM public.projects WHERE client_id IN (
        SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()
      )
    ))
    AND (client_id IS NULL OR client_id IN (
      SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()
    ))
  );

CREATE POLICY "Admins can delete accessible tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (
    public.is_admin() AND (
      assignee_id = auth.uid()
      OR (project_id IS NOT NULL AND project_id IN (
        SELECT id FROM public.projects WHERE client_id IN (
          SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()
        )
      ))
      OR (project_id IS NULL AND client_id IS NOT NULL AND client_id IN (
        SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()
      ))
    )
  );

-- ---- profiles ----
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own or agency profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.same_agency_as(id));
-- INSERT/UPDATE policies already correct (own profile + admin for agency members)

-- ---- member_presence ----
DROP POLICY IF EXISTS "Authenticated can view all presence" ON public.member_presence;
CREATE POLICY "Users can view own or agency presence"
  ON public.member_presence FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.same_agency_as(user_id));

-- ---- client_credentials (scoped via client -> agency) ----
DROP POLICY IF EXISTS "Authenticated users can view credentials" ON public.client_credentials;
DROP POLICY IF EXISTS "Authenticated users can insert credentials" ON public.client_credentials;
DROP POLICY IF EXISTS "Authenticated users can update credentials" ON public.client_credentials;
DROP POLICY IF EXISTS "Authenticated users can delete credentials" ON public.client_credentials;

CREATE POLICY "Users can view own agency credentials"
  ON public.client_credentials FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()));

CREATE POLICY "Users can insert own agency credentials"
  ON public.client_credentials FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()));

CREATE POLICY "Users can update own agency credentials"
  ON public.client_credentials FOR UPDATE TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()))
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()));

CREATE POLICY "Users can delete own agency credentials"
  ON public.client_credentials FOR DELETE TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()));

-- ---- client_interactions ----
DROP POLICY IF EXISTS "Authenticated users can view interactions" ON public.client_interactions;
CREATE POLICY "Users can view own agency interactions"
  ON public.client_interactions FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.user_agency_id()));
-- INSERT/UPDATE/DELETE already scoped to auth.uid() = user_id — correct

-- ---- expense_categories (pro/admin only, defer to later phase) ----
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.expense_categories;

CREATE POLICY "Admins can view expense categories"
  ON public.expense_categories FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert expense categories"
  ON public.expense_categories FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update expense categories"
  ON public.expense_categories FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
