-- Upgrade migrations for Phase 5
-- Run this in Supabase SQL Editor

-- 1. Update constraint to allow new providers
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_provider_check;

ALTER TABLE integrations 
ADD CONSTRAINT integrations_provider_check 
CHECK (provider IN ('meta_ads', 'google_ads', 'google_drive', 'notion', 'clickup'));

-- 2. Create index for faster lookups if not exists
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
