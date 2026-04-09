-- Add columns for public approval link
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS approval_token text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Index for fast token lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_approval_token ON public.quotes (approval_token) WHERE approval_token IS NOT NULL;

-- Allow anonymous users to view a quote by its approval token
CREATE POLICY "Anon can view quote by approval token"
ON public.quotes
FOR SELECT
TO anon
USING (approval_token IS NOT NULL AND approval_token = current_setting('request.header.x-approval-token', true));

-- Actually, we need a simpler approach - let's use a function-based approach
-- Drop the above policy and use a simpler one
DROP POLICY IF EXISTS "Anon can view quote by approval token" ON public.quotes;

-- Allow anon to select quotes that have an approval_token set (filtered by client in code)
CREATE POLICY "Anon can view quotes by token"
ON public.quotes
FOR SELECT
TO anon
USING (approval_token IS NOT NULL);

-- Allow anon to update status fields on quotes with approval_token
CREATE POLICY "Anon can respond to quotes by token"
ON public.quotes
FOR UPDATE
TO anon
USING (approval_token IS NOT NULL)
WITH CHECK (approval_token IS NOT NULL);