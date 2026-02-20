-- 1. Add Phone column to pipeline_deals if it doesn't exist
ALTER TABLE pipeline_deals ADD COLUMN IF NOT EXISTS phone text;

-- 2. Fix Permissions for Profiles (Crucial for Integrations)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
CREATE POLICY "Authenticated users can read profiles" ON profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 3. Fix Integrations Policy to allow Admins to manage
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

-- 4. Enable RLS on other tables if needed (optional safekeeping)
ALTER TABLE pipeline_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for users" ON pipeline_deals FOR ALL USING (auth.role() = 'authenticated');
