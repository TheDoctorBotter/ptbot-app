-- App-level configuration key-value store
-- Used to persist runtime state like auto-created calendar IDs
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow service role full access (no RLS needed for server-only table)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write
CREATE POLICY "Service role full access" ON app_config
  FOR ALL USING (auth.role() = 'service_role');
