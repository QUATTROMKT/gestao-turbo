-- Add phone column to pipeline_deals
ALTER TABLE pipeline_deals ADD COLUMN IF NOT EXISTS phone TEXT;
