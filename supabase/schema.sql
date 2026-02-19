-- ============================================================
-- Agência Turbo — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles (extends Supabase Auth) ──────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  client_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'editor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Clients ───────────────────────────────────────────────

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  decision_maker TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  niche TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'churn', 'negotiation')),
  contract_value NUMERIC DEFAULT 0,
  contract_duration INTEGER DEFAULT 0,
  start_date DATE DEFAULT CURRENT_DATE,
  ltv NUMERIC DEFAULT 0,
  drive_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link profiles.client_id to clients
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_client
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- ── Tasks ─────────────────────────────────────────────────

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'waiting_approval', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  tags TEXT[] DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Rocks (Quarterly Goals - EOS) ─────────────────────────

CREATE TABLE rocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT NOT NULL DEFAULT 'on_track' CHECK (status IN ('on_track', 'off_track', 'done')),
  quarter TEXT NOT NULL DEFAULT '',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Scorecard Metrics (EOS) ───────────────────────────────

CREATE TABLE scorecard_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target NUMERIC DEFAULT 0,
  actual NUMERIC DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'number',
  week TEXT NOT NULL DEFAULT '',
  on_track BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SOPs (Knowledge Base - PARA) ──────────────────────────

CREATE TABLE sops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'resources' CHECK (category IN ('projects', 'areas', 'resources', 'archive')),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Approvals ─────────────────────────────────────────────

CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comment TEXT,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Pipeline Deals ────────────────────────────────────────

CREATE TABLE pipeline_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  value NUMERIC DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  probability INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Client Files ──────────────────────────────────────────

CREATE TABLE client_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT '',
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_files ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to get current user's client_id
CREATE OR REPLACE FUNCTION public.get_user_client_id()
RETURNS UUID AS $$
  SELECT client_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ── Profiles Policies ─────────────────────────────────────

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Admin can update any profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid() OR get_user_role() = 'admin');

-- ── Clients Policies ──────────────────────────────────────

CREATE POLICY "Admin/Editor can view all clients"
  ON clients FOR SELECT
  USING (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Viewer can view own client"
  ON clients FOR SELECT
  USING (get_user_role() = 'viewer' AND id = get_user_client_id());

CREATE POLICY "Admin/Editor can insert clients"
  ON clients FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Admin/Editor can update clients"
  ON clients FOR UPDATE
  USING (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Admin can delete clients"
  ON clients FOR DELETE
  USING (get_user_role() = 'admin');

-- ── Tasks Policies ────────────────────────────────────────

CREATE POLICY "Admin/Editor can view all tasks"
  ON tasks FOR SELECT
  USING (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Viewer can view own client tasks"
  ON tasks FOR SELECT
  USING (get_user_role() = 'viewer' AND client_id = get_user_client_id());

CREATE POLICY "Admin/Editor can manage tasks"
  ON tasks FOR ALL
  USING (get_user_role() IN ('admin', 'editor'));

-- ── Rocks Policies ────────────────────────────────────────

CREATE POLICY "Admin/Editor can view rocks"
  ON rocks FOR SELECT
  USING (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Admin/Editor can manage rocks"
  ON rocks FOR ALL
  USING (get_user_role() IN ('admin', 'editor'));

-- ── Scorecard Policies ────────────────────────────────────

CREATE POLICY "Admin/Editor can view scorecard"
  ON scorecard_metrics FOR SELECT
  USING (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Admin/Editor can manage scorecard"
  ON scorecard_metrics FOR ALL
  USING (get_user_role() IN ('admin', 'editor'));

-- ── SOPs Policies ─────────────────────────────────────────

CREATE POLICY "Admin/Editor can view SOPs"
  ON sops FOR SELECT
  USING (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Admin/Editor can manage SOPs"
  ON sops FOR ALL
  USING (get_user_role() IN ('admin', 'editor'));

-- ── Approvals Policies ────────────────────────────────────

CREATE POLICY "Admin/Editor can view approvals"
  ON approvals FOR SELECT
  USING (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Viewer can view own client approvals"
  ON approvals FOR SELECT
  USING (get_user_role() = 'viewer' AND client_id = get_user_client_id());

CREATE POLICY "Admin/Editor can manage approvals"
  ON approvals FOR ALL
  USING (get_user_role() IN ('admin', 'editor'));

-- ── Pipeline Policies ─────────────────────────────────────

CREATE POLICY "Admin/Editor can view pipeline"
  ON pipeline_deals FOR SELECT
  USING (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Admin/Editor can manage pipeline"
  ON pipeline_deals FOR ALL
  USING (get_user_role() IN ('admin', 'editor'));

-- ── Client Files Policies ─────────────────────────────────

CREATE POLICY "Admin/Editor can view all files"
  ON client_files FOR SELECT
  USING (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Viewer can view own client files"
  ON client_files FOR SELECT
  USING (get_user_role() = 'viewer' AND client_id = get_user_client_id());

CREATE POLICY "Admin/Editor can manage files"
  ON client_files FOR ALL
  USING (get_user_role() IN ('admin', 'editor'));

-- ============================================================
-- Enable Realtime for key tables
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE approvals;
ALTER PUBLICATION supabase_realtime ADD TABLE clients;

-- ============================================================
-- Storage Bucket for client files
-- ============================================================
-- Run in Supabase Dashboard → Storage:
-- Create bucket "client-files" (public: false)
-- Then add this policy via SQL:

-- CREATE POLICY "Admin/Editor can upload files"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'client-files'
--     AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'editor')
--   );

-- CREATE POLICY "Authenticated users can read files"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'client-files');
