-- 1. Add Department and Quarter to Rocks
ALTER TABLE rocks ADD COLUMN IF NOT EXISTS department text DEFAULT 'Geral';
ALTER TABLE rocks ADD COLUMN IF NOT EXISTS quarter text;

-- 2. Ensure RLS is behaving
ALTER TABLE rocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for users" ON rocks;
CREATE POLICY "Enable all for users" ON rocks FOR ALL USING (auth.role() = 'authenticated');
