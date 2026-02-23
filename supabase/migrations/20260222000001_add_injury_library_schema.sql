-- Migration: Add injury library schema
-- Date: 2026-02-22
-- Purpose: Add new exercise_sections for ankle/foot/elbow/wrist-hand,
--          extend protocols and protocol_phases, create injuries and injury_videos tables

-- ============================================
-- New exercise_sections rows
-- ============================================
INSERT INTO exercise_sections (name, slug, description, icon_name, display_order)
VALUES
  ('Ankle', 'ankle', 'Exercises for ankle sprains, tendinopathy, and mobility', 'Footprints', 11),
  ('Foot', 'foot', 'Exercises for plantar fasciitis, metatarsalgia, and foot pain', 'Footprints', 12),
  ('Elbow', 'elbow', 'Exercises for tennis elbow, golfer''s elbow, and elbow pain', 'Hand', 13),
  ('Wrist & Hand', 'wrist-hand', 'Exercises for carpal tunnel, de Quervain''s, and wrist pain', 'Hand', 14)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- TABLE: injuries (create before protocols FK)
-- ============================================
CREATE TABLE IF NOT EXISTS injuries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES exercise_sections(id) ON DELETE CASCADE,
  injury_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  common_symptoms TEXT[],
  red_flags TEXT[],
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_injuries_section ON injuries(section_id);
CREATE INDEX IF NOT EXISTS idx_injuries_key ON injuries(injury_key);

ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Injuries are publicly readable"
  ON injuries
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- ============================================
-- TABLE: injury_videos
-- ============================================
CREATE TABLE IF NOT EXISTS injury_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  injury_id UUID NOT NULL REFERENCES injuries(id) ON DELETE CASCADE,
  slot_number INT NOT NULL CHECK (slot_number >= 1 AND slot_number <= 8),
  youtube_video_id TEXT,
  title TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(injury_id, slot_number)
);

CREATE INDEX IF NOT EXISTS idx_injury_videos_injury ON injury_videos(injury_id);

ALTER TABLE injury_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Injury videos are publicly readable"
  ON injury_videos
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- ============================================
-- Extend protocols table
-- ============================================
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS protocol_type TEXT DEFAULT 'post_op';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS injury_id UUID REFERENCES injuries(id) ON DELETE SET NULL;

-- ============================================
-- Extend protocol_phases table
-- ============================================
ALTER TABLE protocol_phases ADD COLUMN IF NOT EXISTS goals TEXT[];
ALTER TABLE protocol_phases ADD COLUMN IF NOT EXISTS precautions TEXT[];
ALTER TABLE protocol_phases ADD COLUMN IF NOT EXISTS progress_criteria TEXT[];
