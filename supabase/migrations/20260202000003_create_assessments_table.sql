-- Migration: Create assessments table to log all user assessments
-- Date: 2026-02-02

-- ============================================
-- CREATE ASSESSMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Assessment inputs
  pain_level INTEGER NOT NULL CHECK (pain_level >= 0 AND pain_level <= 10),
  pain_location TEXT NOT NULL,
  pain_duration TEXT NOT NULL,
  pain_type TEXT,
  mechanism_of_injury TEXT,
  medications TEXT,
  additional_symptoms TEXT[] DEFAULT '{}',
  red_flags TEXT[] DEFAULT '{}',
  location TEXT,

  -- Assessment results
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  next_steps TEXT[] DEFAULT '{}',

  -- Recommended exercises (stored as JSONB for flexibility)
  recommendations JSONB DEFAULT '[]',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES FOR COMMON QUERIES
-- ============================================

CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_created_at ON assessments(created_at DESC);
CREATE INDEX idx_assessments_risk_level ON assessments(risk_level);
CREATE INDEX idx_assessments_pain_location ON assessments(pain_location);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Users can view their own assessments
CREATE POLICY "Users can view own assessments" ON assessments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own assessments
CREATE POLICY "Users can insert own assessments" ON assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow anonymous assessments (user_id can be null)
CREATE POLICY "Allow anonymous assessments" ON assessments
  FOR INSERT WITH CHECK (user_id IS NULL);

-- ============================================
-- ADMIN ACCESS (for viewing all assessments)
-- ============================================

-- Create a view for admin dashboard that bypasses RLS
-- You can query this from Supabase dashboard or with service role key

CREATE OR REPLACE VIEW admin_assessments AS
SELECT
  a.id,
  a.user_id,
  u.email as user_email,
  a.pain_level,
  a.pain_location,
  a.pain_duration,
  a.pain_type,
  a.mechanism_of_injury,
  a.additional_symptoms,
  a.red_flags,
  a.risk_level,
  a.next_steps,
  a.recommendations,
  a.created_at
FROM assessments a
LEFT JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC;

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
