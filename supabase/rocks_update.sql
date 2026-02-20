-- 1. Add Department and Dates to Rocks
ALTER TABLE rocks ADD COLUMN IF NOT EXISTS department text DEFAULT 'Company';
ALTER TABLE rocks ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE rocks ADD COLUMN IF NOT EXISTS end_date date;

-- 2. Ensure RLS is behaving
ALTER TABLE rocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for users" ON rocks;
CREATE POLICY "Enable all for users" ON rocks FOR ALL USING (auth.role() = 'authenticated');
