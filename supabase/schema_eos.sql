-- ============================================================
-- Agência Turbo — EOS System Add-on
-- Run this AFTER the main schema.sql
-- ============================================================

-- ── Meetings L10 (Level 10) ──────────────────────────────

CREATE TABLE meetings_l10 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'Reunião L10 Semanal',
  date DATE DEFAULT CURRENT_DATE,
  duration_minutes INTEGER DEFAULT 90,
  score NUMERIC DEFAULT 0, -- Average rating (1-10) given by participants
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Issues (IDS: Identify, Discuss, Solve) ────────────────

CREATE TABLE meeting_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings_l10(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'solved')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Headlines (Good News / Bad News) ──────────────────────

CREATE TABLE meeting_headlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings_l10(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('customer', 'employee', 'personal')),
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Meeting To-Dos (7-day Action Items) ───────────────────

CREATE TABLE meeting_todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings_l10(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS Policies for EOS ──────────────────────────────────

ALTER TABLE meetings_l10 ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_headlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_todos ENABLE ROW LEVEL SECURITY;

-- Meetings: Only Admin/Editor
CREATE POLICY "Admin/Editor can manage meetings"
  ON meetings_l10 FOR ALL
  USING (get_user_role() IN ('admin', 'editor'));

-- Issues: Only Admin/Editor
CREATE POLICY "Admin/Editor can manage issues"
  ON meeting_issues FOR ALL
  USING (get_user_role() IN ('admin', 'editor'));

-- Headlines: Only Admin/Editor
CREATE POLICY "Admin/Editor can manage headlines"
  ON meeting_headlines FOR ALL
  USING (get_user_role() IN ('admin', 'editor'));

-- Todos: Only Admin/Editor
CREATE POLICY "Admin/Editor can manage todos"
  ON meeting_todos FOR ALL
  USING (get_user_role() IN ('admin', 'editor'));

-- ── Realtime ──────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE meetings_l10;
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_headlines;
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_todos;
