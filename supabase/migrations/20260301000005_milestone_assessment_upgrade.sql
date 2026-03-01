-- Migration: Upgrade milestones for PDMS-2 based assessment
-- Date: 2026-03-01
-- Adds category column for PDMS-2 subtests, scoring support, and assessment results table

-- ============================================
-- ADD CATEGORY TO MILESTONES
-- ============================================
ALTER TABLE pediatric_milestones
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'locomotion';

-- Add score_value column: items are scored 0 (cannot), 1 (emerging), 2 (mastered)
-- We store the "ceiling" month for age-equivalency computation
ALTER TABLE pediatric_milestones
  ADD COLUMN IF NOT EXISTS age_equivalent_months INT;

-- ============================================
-- ASSESSMENT RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pediatric_assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pediatric_profile_id UUID NOT NULL REFERENCES pediatric_profiles(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  raw_score INT NOT NULL DEFAULT 0,
  age_equivalent_months NUMERIC(5,1) NOT NULL DEFAULT 0,
  category_scores JSONB DEFAULT '{}',
  milestones_snapshot JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ped_assessment_results_profile
  ON pediatric_assessment_results(pediatric_profile_id);
CREATE INDEX IF NOT EXISTS idx_ped_assessment_results_user
  ON pediatric_assessment_results(user_id);

-- RLS for assessment results
ALTER TABLE pediatric_assessment_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own assessment results" ON pediatric_assessment_results;
CREATE POLICY "Users can view own assessment results" ON pediatric_assessment_results
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assessment results" ON pediatric_assessment_results;
CREATE POLICY "Users can insert own assessment results" ON pediatric_assessment_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own assessment results" ON pediatric_assessment_results;
CREATE POLICY "Users can delete own assessment results" ON pediatric_assessment_results
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Update milestone_tracking to support 0/1/2 scoring
-- ============================================
ALTER TABLE pediatric_milestone_tracking
  ADD COLUMN IF NOT EXISTS score INT DEFAULT 0;
