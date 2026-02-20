-- Fix permissions for tables accessed by RLS policies

-- 1. Profiles: Users need to read profiles to verify their role (e.g. are they admin?)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;

CREATE POLICY "Authenticated users can read profiles" ON profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 2. Integrations: Re-ensure admins can manage them
-- (This relies on the above profile read access)
DROP POLICY IF EXISTS "Admins can manage integrations" ON integrations;

CREATE POLICY "Admins can manage integrations" ON integrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
