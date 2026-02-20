-- 1. Ensure phone column exists
ALTER TABLE pipeline_deals ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Helper to drop policies safely
DROP POLICY IF EXISTS "Admins can manage integrations" ON integrations;
DROP POLICY IF EXISTS "All users can read integrations" ON integrations;

-- 3. Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- 4. Recreate Policies
CREATE POLICY "Admins can manage integrations" ON integrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "All users can read integrations" ON integrations
  FOR SELECT
  USING (auth.role() = 'authenticated');
