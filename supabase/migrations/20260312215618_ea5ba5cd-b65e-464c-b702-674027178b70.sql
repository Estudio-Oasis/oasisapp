
-- =============================================
-- OasisOS Full Database Schema
-- =============================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'member', 'user');
CREATE TYPE public.client_status AS ENUM ('active', 'inactive');
CREATE TYPE public.billing_type AS ENUM ('monthly', 'project', 'hourly');
CREATE TYPE public.project_status AS ENUM ('active', 'paused', 'done');
CREATE TYPE public.task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');
CREATE TYPE public.interaction_type AS ENUM ('meeting', 'note', 'call', 'payment');

-- 2. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 3. USER_ROLES TABLE
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. CLIENTS TABLE
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  notes TEXT,
  status client_status NOT NULL DEFAULT 'active',
  billing_type billing_type NOT NULL DEFAULT 'monthly',
  monthly_rate NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update clients" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete clients" ON public.clients FOR DELETE TO authenticated USING (true);

-- 5. PROJECTS TABLE
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status project_status NOT NULL DEFAULT 'active',
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update projects" ON public.projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete projects" ON public.projects FOR DELETE TO authenticated USING (true);

-- 6. TASKS TABLE
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status task_status NOT NULL DEFAULT 'backlog',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (true);

-- 7. TIME_ENTRIES TABLE
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_min NUMERIC GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (ended_at - started_at)) / 60.0
      ELSE NULL
    END
  ) STORED,
  description TEXT,
  is_gap_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time entries" ON public.time_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own time entries" ON public.time_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own time entries" ON public.time_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own time entries" ON public.time_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 8. INVOICES TABLE
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status invoice_status NOT NULL DEFAULT 'draft',
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (true);

-- 9. CLIENT_INTERACTIONS TABLE
CREATE TABLE public.client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type interaction_type NOT NULL DEFAULT 'note',
  title TEXT NOT NULL,
  body TEXT,
  happened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view interactions" ON public.client_interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own interactions" ON public.client_interactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interactions" ON public.client_interactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own interactions" ON public.client_interactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 10. TRIGGER: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. INDEXES
CREATE INDEX idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX idx_time_entries_client_id ON public.time_entries(client_id);
CREATE INDEX idx_time_entries_started_at ON public.time_entries(started_at);
CREATE INDEX idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_client_interactions_client_id ON public.client_interactions(client_id);
