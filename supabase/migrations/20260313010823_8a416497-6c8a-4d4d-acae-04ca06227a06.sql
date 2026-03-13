
-- Add period columns to invoices
ALTER TABLE public.invoices ADD COLUMN period_start date;
ALTER TABLE public.invoices ADD COLUMN period_end date;

-- Create expense_categories table
CREATE TABLE public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories" ON public.expense_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert categories" ON public.expense_categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories" ON public.expense_categories
  FOR UPDATE TO authenticated USING (true);

-- Seed default categories
INSERT INTO public.expense_categories (name, icon) VALUES
  ('Payroll', 'users'),
  ('AI Credits', 'cpu'),
  ('Software', 'monitor'),
  ('Ad Spend', 'megaphone'),
  ('Freelancers', 'user-plus'),
  ('Other', 'circle-dot');

-- Create expenses table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'Other',
  description text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  date date NOT NULL DEFAULT CURRENT_DATE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view expenses" ON public.expenses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert expenses" ON public.expenses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update expenses" ON public.expenses
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete expenses" ON public.expenses
  FOR DELETE TO authenticated USING (true);
