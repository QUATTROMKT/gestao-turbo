-- Create integrations table to store API credentials
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL CHECK (provider IN ('meta_ads', 'google_ads')),
  credentials JSONB NOT NULL, -- Encrypted or plain? For MVP plain JSON: { "access_token": "...", "ad_account_id": "..." }
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Only admins can view/manage integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage integrations"
  ON integrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create cached_insights table to avoid hitting API limits
CREATE TABLE IF NOT EXISTS cached_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL, -- 'meta_ads'
  account_id TEXT NOT NULL,
  date_range TEXT NOT NULL, -- 'last_7d', 'last_30d'
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cached_insights ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read cached data (for dashboards)
CREATE POLICY "Authenticated users can read cached insights"
  ON cached_insights
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only system/admins can write cache
CREATE POLICY "Admins can write cached insights"
  ON cached_insights
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
