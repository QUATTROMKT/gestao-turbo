-- Add 'sales' to the allowed roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'editor', 'viewer', 'sales'));

-- Update RLS Policies for the new 'sales' role

-- CRM/Pipeline: Sales & Admin have full access
CREATE POLICY "Sales can manage pipeline" ON pipeline_deals 
FOR ALL 
USING (get_user_role() = 'sales');

-- Clients: Sales can VIEW (to see contact info)
CREATE POLICY "Sales can view clients" ON clients 
FOR SELECT 
USING (get_user_role() = 'sales');

-- Tasks: Sales can VIEW tasks assigned to them? (Maybe we should allow them to manage likely)
-- For now, let's allow Sales to view tasks.
CREATE POLICY "Sales can view tasks" ON tasks
FOR SELECT
USING (get_user_role() = 'sales');

-- Meetings: Sales can view meetings they are part of? 
-- (Assuming RLS already handles owner/admin, we might need adjustments later)
