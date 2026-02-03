-- Migration: Update body_parts to include Hamstrings category
-- Date: 2026-02-03
-- Purpose: Add 'Hamstrings' body part to hamstring-focused exercises

-- ============================================
-- UPDATE HAMSTRING EXERCISES
-- ============================================

-- Hamstring Bridge (Short Lever)
UPDATE exercise_videos
SET body_parts = ARRAY['Hamstrings', 'Hip', 'Knee']
WHERE title = 'Hamstring Bridge (Short Lever)';

-- Hamstring Bridge (Long Lever)
UPDATE exercise_videos
SET body_parts = ARRAY['Hamstrings', 'Hip', 'Knee']
WHERE title = 'Hamstring Bridge (Long Lever)';

-- Eccentric Hamstring Progression
UPDATE exercise_videos
SET body_parts = ARRAY['Hamstrings', 'Hip', 'Knee']
WHERE title = 'Eccentric Hamstring Progression';

-- Anti-Extension Dead Bug (core/hamstring exercise)
UPDATE exercise_videos
SET body_parts = ARRAY['Hamstrings', 'Lower Back', 'Hip']
WHERE title = 'Anti-Extension Dead Bug';

-- Partial Hip Hinge (hamstring/posterior chain focus)
UPDATE exercise_videos
SET body_parts = ARRAY['Hamstrings', 'Hip', 'Lower Back']
WHERE title = 'Partial Hip Hinge';

-- ============================================
-- VERIFY CHANGES
-- ============================================
-- SELECT title, body_parts FROM exercise_videos WHERE 'Hamstrings' = ANY(body_parts);
