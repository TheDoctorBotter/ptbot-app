-- Migration: Allow anon (unauthenticated) reads on public pediatric reference tables
-- Date: 2026-03-02
-- Purpose: Fix empty browse tabs on mobile caused by RLS blocking reads when the
--          auth session hasn't fully established yet.  Age groups, concerns,
--          milestones, exercise videos, programs, and program items are public
--          reference data — not user-specific — so they should be readable by any role.

-- ── pediatric_age_groups ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read age groups" ON pediatric_age_groups;
CREATE POLICY "Anyone can read age groups" ON pediatric_age_groups
  FOR SELECT TO anon, authenticated USING (true);
-- Drop the old authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can read age groups" ON pediatric_age_groups;

-- ── pediatric_concerns ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read concerns" ON pediatric_concerns;
CREATE POLICY "Anyone can read concerns" ON pediatric_concerns
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can read concerns" ON pediatric_concerns;

-- ── pediatric_milestones ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read milestones" ON pediatric_milestones;
CREATE POLICY "Anyone can read milestones" ON pediatric_milestones
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can read milestones" ON pediatric_milestones;

-- ── pediatric_exercise_videos ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read exercise videos" ON pediatric_exercise_videos;
CREATE POLICY "Anyone can read exercise videos" ON pediatric_exercise_videos
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can read exercise videos" ON pediatric_exercise_videos;

-- ── pediatric_programs ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read programs" ON pediatric_programs;
CREATE POLICY "Anyone can read programs" ON pediatric_programs
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can read programs" ON pediatric_programs;

-- ── pediatric_program_items ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read program items" ON pediatric_program_items;
CREATE POLICY "Anyone can read program items" ON pediatric_program_items
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can read program items" ON pediatric_program_items;
