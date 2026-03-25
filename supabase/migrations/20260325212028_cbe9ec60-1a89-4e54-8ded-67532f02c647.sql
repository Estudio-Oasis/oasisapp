
-- Make client_id nullable
ALTER TABLE client_credentials ALTER COLUMN client_id DROP NOT NULL;

-- Add new columns
ALTER TABLE client_credentials 
  ADD COLUMN agency_id uuid REFERENCES agencies(id),
  ADD COLUMN category text NOT NULL DEFAULT 'other',
  ADD COLUMN favicon_url text;

-- Backfill agency_id from existing client relationships
UPDATE client_credentials cc
SET agency_id = c.agency_id
FROM clients c WHERE cc.client_id = c.id;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own agency credentials" ON client_credentials;
DROP POLICY IF EXISTS "Users can insert own agency credentials" ON client_credentials;
DROP POLICY IF EXISTS "Users can update own agency credentials" ON client_credentials;
DROP POLICY IF EXISTS "Users can delete own agency credentials" ON client_credentials;

-- New RLS policies using agency_id
CREATE POLICY "Users can view own agency vault"
ON client_credentials FOR SELECT TO authenticated
USING (agency_id = user_agency_id());

CREATE POLICY "Users can insert own agency vault"
ON client_credentials FOR INSERT TO authenticated
WITH CHECK (agency_id = user_agency_id());

CREATE POLICY "Users can update own agency vault"
ON client_credentials FOR UPDATE TO authenticated
USING (agency_id = user_agency_id())
WITH CHECK (agency_id = user_agency_id());

CREATE POLICY "Users can delete own agency vault"
ON client_credentials FOR DELETE TO authenticated
USING (agency_id = user_agency_id());
