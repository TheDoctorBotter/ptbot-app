-- Migration: Create pediatric development tables
-- Date: 2026-03-01
-- Purpose: Data model for pediatric mode - age groups, concerns, milestones, exercises, programs

-- ============================================
-- PEDIATRIC AGE GROUPS
-- ============================================
CREATE TABLE IF NOT EXISTS pediatric_age_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  min_months INT NOT NULL,
  max_months INT NOT NULL,
  display_order INT NOT NULL DEFAULT 0
);

-- ============================================
-- PEDIATRIC CONCERNS
-- ============================================
CREATE TABLE IF NOT EXISTS pediatric_concerns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concern_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  red_flags TEXT[] DEFAULT '{}'::text[],
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- ============================================
-- PEDIATRIC MILESTONES
-- ============================================
CREATE TABLE IF NOT EXISTS pediatric_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group_id UUID NOT NULL REFERENCES pediatric_age_groups(id) ON DELETE CASCADE,
  milestone_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  expected_by_month INT NOT NULL,
  concern_if_missing_by_month INT NOT NULL,
  red_flag BOOLEAN DEFAULT false,
  display_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ped_milestones_age_group ON pediatric_milestones(age_group_id);

-- ============================================
-- PEDIATRIC EXERCISE VIDEOS
-- ============================================
CREATE TABLE IF NOT EXISTS pediatric_exercise_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concern_id UUID NOT NULL REFERENCES pediatric_concerns(id) ON DELETE CASCADE,
  age_group_id UUID NOT NULL REFERENCES pediatric_age_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  coaching_cues TEXT[] DEFAULT '{}'::text[],
  safety_notes TEXT[] DEFAULT '{}'::text[],
  youtube_video_id TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_ped_videos_concern ON pediatric_exercise_videos(concern_id);
CREATE INDEX IF NOT EXISTS idx_ped_videos_age_group ON pediatric_exercise_videos(age_group_id);

-- ============================================
-- PEDIATRIC PROGRAMS
-- ============================================
CREATE TABLE IF NOT EXISTS pediatric_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  age_group_id UUID NOT NULL REFERENCES pediatric_age_groups(id) ON DELETE CASCADE,
  primary_concern_id UUID NOT NULL REFERENCES pediatric_concerns(id) ON DELETE CASCADE,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ped_programs_age_group ON pediatric_programs(age_group_id);
CREATE INDEX IF NOT EXISTS idx_ped_programs_concern ON pediatric_programs(primary_concern_id);

-- ============================================
-- PEDIATRIC PROGRAM ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS pediatric_program_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES pediatric_programs(id) ON DELETE CASCADE,
  exercise_video_id UUID NOT NULL REFERENCES pediatric_exercise_videos(id) ON DELETE CASCADE,
  week_number INT DEFAULT 1,
  sets_reps TEXT,
  frequency TEXT,
  display_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ped_program_items_program ON pediatric_program_items(program_id);

-- ============================================
-- PEDIATRIC CHILD PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS pediatric_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  birthdate DATE,
  age_group_id UUID REFERENCES pediatric_age_groups(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ped_profiles_user ON pediatric_profiles(user_id);

-- ============================================
-- PEDIATRIC MILESTONE TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS pediatric_milestone_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pediatric_profile_id UUID NOT NULL REFERENCES pediatric_profiles(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES pediatric_milestones(id) ON DELETE CASCADE,
  is_met BOOLEAN DEFAULT false,
  met_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pediatric_profile_id, milestone_id)
);

CREATE INDEX IF NOT EXISTS idx_ped_tracking_profile ON pediatric_milestone_tracking(pediatric_profile_id);
CREATE INDEX IF NOT EXISTS idx_ped_tracking_user ON pediatric_milestone_tracking(user_id);

-- ============================================
-- PEDIATRIC SAVED VIDEOS
-- ============================================
CREATE TABLE IF NOT EXISTS pediatric_saved_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_video_id UUID NOT NULL REFERENCES pediatric_exercise_videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exercise_video_id)
);

CREATE INDEX IF NOT EXISTS idx_ped_saved_user ON pediatric_saved_videos(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Pediatric age groups: everyone authenticated can read
ALTER TABLE pediatric_age_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read age groups" ON pediatric_age_groups;
CREATE POLICY "Authenticated users can read age groups" ON pediatric_age_groups
  FOR SELECT TO authenticated USING (true);

-- Pediatric concerns: everyone authenticated can read
ALTER TABLE pediatric_concerns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read concerns" ON pediatric_concerns;
CREATE POLICY "Authenticated users can read concerns" ON pediatric_concerns
  FOR SELECT TO authenticated USING (true);

-- Pediatric milestones: everyone authenticated can read
ALTER TABLE pediatric_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read milestones" ON pediatric_milestones;
CREATE POLICY "Authenticated users can read milestones" ON pediatric_milestones
  FOR SELECT TO authenticated USING (true);

-- Pediatric exercise videos: everyone authenticated can read
ALTER TABLE pediatric_exercise_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read exercise videos" ON pediatric_exercise_videos;
CREATE POLICY "Authenticated users can read exercise videos" ON pediatric_exercise_videos
  FOR SELECT TO authenticated USING (true);

-- Pediatric programs: everyone authenticated can read
ALTER TABLE pediatric_programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read programs" ON pediatric_programs;
CREATE POLICY "Authenticated users can read programs" ON pediatric_programs
  FOR SELECT TO authenticated USING (true);

-- Pediatric program items: everyone authenticated can read
ALTER TABLE pediatric_program_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read program items" ON pediatric_program_items;
CREATE POLICY "Authenticated users can read program items" ON pediatric_program_items
  FOR SELECT TO authenticated USING (true);

-- Pediatric profiles: user owns their own
ALTER TABLE pediatric_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own pediatric profiles" ON pediatric_profiles;
CREATE POLICY "Users can view own pediatric profiles" ON pediatric_profiles
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own pediatric profiles" ON pediatric_profiles;
CREATE POLICY "Users can insert own pediatric profiles" ON pediatric_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own pediatric profiles" ON pediatric_profiles;
CREATE POLICY "Users can update own pediatric profiles" ON pediatric_profiles
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own pediatric profiles" ON pediatric_profiles;
CREATE POLICY "Users can delete own pediatric profiles" ON pediatric_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Milestone tracking: user owns their own
ALTER TABLE pediatric_milestone_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own milestone tracking" ON pediatric_milestone_tracking;
CREATE POLICY "Users can view own milestone tracking" ON pediatric_milestone_tracking
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own milestone tracking" ON pediatric_milestone_tracking;
CREATE POLICY "Users can insert own milestone tracking" ON pediatric_milestone_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own milestone tracking" ON pediatric_milestone_tracking;
CREATE POLICY "Users can update own milestone tracking" ON pediatric_milestone_tracking
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own milestone tracking" ON pediatric_milestone_tracking;
CREATE POLICY "Users can delete own milestone tracking" ON pediatric_milestone_tracking
  FOR DELETE USING (auth.uid() = user_id);

-- Saved videos: user owns their own
ALTER TABLE pediatric_saved_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own saved videos" ON pediatric_saved_videos;
CREATE POLICY "Users can view own saved videos" ON pediatric_saved_videos
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own saved videos" ON pediatric_saved_videos;
CREATE POLICY "Users can insert own saved videos" ON pediatric_saved_videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own saved videos" ON pediatric_saved_videos;
CREATE POLICY "Users can delete own saved videos" ON pediatric_saved_videos
  FOR DELETE USING (auth.uid() = user_id);
