-- Enable RLS on integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything on integrations
CREATE POLICY "Admins can manage integrations" ON integrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow authenticated users (or maybe just admins?) to READ integrations (for Dashboard)
-- Actually, the backend logic (Service) runs on client, so the USER needs read access.
-- If Dashboard is visible to 'viewer', they need to READ integrations to fetch Meta data?
-- Ideally, we hide the TOKEN, but the frontend needs the token to call Graph API.
-- So, for this MVP, we must allow READ to the role that needs to see the chart.
-- Let's allow ALL authenticated users to READ for now (or refine to admin/editor/sales/viewer).

CREATE POLICY "All users can read integrations" ON integrations
  FOR SELECT
  USING (auth.role() = 'authenticated');
