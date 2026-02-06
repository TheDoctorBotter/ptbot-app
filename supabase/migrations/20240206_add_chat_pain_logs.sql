-- Create chat_pain_logs table for tracking pain levels via chatbot
-- This table stores quick pain logs that users submit through the chatbot

CREATE TABLE IF NOT EXISTS chat_pain_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pain_level INTEGER NOT NULL CHECK (pain_level >= 0 AND pain_level <= 10),
  pain_location TEXT NOT NULL DEFAULT 'General',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying by user
CREATE INDEX IF NOT EXISTS idx_chat_pain_logs_user_id ON chat_pain_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_pain_logs_created_at ON chat_pain_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE chat_pain_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own pain logs
CREATE POLICY "Users can view own pain logs"
  ON chat_pain_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own pain logs
CREATE POLICY "Users can insert own pain logs"
  ON chat_pain_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pain logs
CREATE POLICY "Users can update own pain logs"
  ON chat_pain_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own pain logs
CREATE POLICY "Users can delete own pain logs"
  ON chat_pain_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admin access (optional - for dr.lemmo@gmail.com)
CREATE POLICY "Admin can view all pain logs"
  ON chat_pain_logs
  FOR SELECT
  USING (auth.email() IN ('dr.lemmo@gmail.com', 'admin@ptbot.com'));

-- Add comment
COMMENT ON TABLE chat_pain_logs IS 'Stores quick pain level logs submitted through the PTBot chatbot';
COMMENT ON COLUMN chat_pain_logs.pain_level IS 'Pain level on 0-10 scale';
COMMENT ON COLUMN chat_pain_logs.pain_location IS 'Body area where pain is experienced';
COMMENT ON COLUMN chat_pain_logs.notes IS 'Optional user notes about the pain';
