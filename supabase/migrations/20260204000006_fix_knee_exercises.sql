-- Migration: Fix knee exercises
-- Date: 2026-02-04
-- Purpose: 1. Remove 'Knee' from hamstring exercises
--          2. Add proper knee exercises (Resisted Side Stepping, Bulgarian Split Squat)

-- ============================================
-- STEP 1: Remove 'Knee' from hamstring exercises
-- These are primarily hamstring/hip exercises, not knee exercises
-- ============================================

-- Hamstring Bridge (Short Lever) - Hip/Hamstring exercise, not knee
UPDATE exercise_videos
SET body_parts = ARRAY['Hamstrings', 'Hip']
WHERE title = 'Hamstring Bridge (Short Lever)';

-- Hamstring Bridge (Long Lever) - Hip/Hamstring exercise, not knee
UPDATE exercise_videos
SET body_parts = ARRAY['Hamstrings', 'Hip']
WHERE title = 'Hamstring Bridge (Long Lever)';

-- Eccentric Hamstring Progression - Hamstring exercise
UPDATE exercise_videos
SET body_parts = ARRAY['Hamstrings', 'Hip']
WHERE title = 'Eccentric Hamstring Progression';

-- ============================================
-- STEP 2: Add proper knee exercises
-- ============================================

-- Resisted Side Stepping with Band (Knee strengthening)
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Resisted Side Stepping with Band',
  'Place a resistance band around your ankles or just above your knees. Stand with feet hip-width apart, slight bend in knees. Take controlled steps to the side, maintaining tension in the band. Keep your core engaged and avoid letting knees collapse inward. This exercise strengthens the hip abductors and improves knee stability.',
  'MDEC-93yKMQ',
  'Beginner',
  ARRAY['Knee', 'Hip'],
  ARRAY['knee pain', 'knee weakness', 'patellofemoral syndrome', 'IT band syndrome', 'knee instability'],
  ARRAY['lateral walk', 'monster walk', 'band walk', 'hip strengthening', 'knee stability', 'glute medius'],
  3, 15, 'Daily',
  ARRAY['Keep knees aligned over toes', 'Maintain slight squat position', 'Control the movement - no bouncing', 'Stop if you feel knee pain'],
  30, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE youtube_video_id = 'MDEC-93yKMQ');

-- Update if already exists
UPDATE exercise_videos
SET
  title = 'Resisted Side Stepping with Band',
  description = 'Place a resistance band around your ankles or just above your knees. Stand with feet hip-width apart, slight bend in knees. Take controlled steps to the side, maintaining tension in the band. Keep your core engaged and avoid letting knees collapse inward. This exercise strengthens the hip abductors and improves knee stability.',
  body_parts = ARRAY['Knee', 'Hip'],
  conditions = ARRAY['knee pain', 'knee weakness', 'patellofemoral syndrome', 'IT band syndrome', 'knee instability'],
  keywords = ARRAY['lateral walk', 'monster walk', 'band walk', 'hip strengthening', 'knee stability', 'glute medius'],
  difficulty = 'Beginner',
  recommended_sets = 3,
  recommended_reps = 15,
  display_order = 30,
  is_active = true
WHERE youtube_video_id = 'MDEC-93yKMQ';

-- Bulgarian Split Squat (Knee and Hip strengthening)
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Bulgarian Split Squat',
  'Stand facing away from a bench or elevated surface. Place the top of one foot on the bench behind you. Lower your body by bending your front knee until your thigh is parallel to the ground. Push through your front heel to return to starting position. This exercise builds single-leg strength, improves balance, and strengthens the quadriceps, glutes, and hip stabilizers.',
  'IkEqhcBnWJs',
  'Intermediate',
  ARRAY['Knee', 'Hip'],
  ARRAY['knee weakness', 'quad weakness', 'knee rehabilitation', 'athletic performance', 'patellofemoral pain'],
  ARRAY['split squat', 'single leg', 'quad strengthening', 'unilateral', 'functional', 'balance'],
  3, 10, '3x per week',
  ARRAY['Keep front knee aligned over ankle', 'Control the descent - do not drop', 'Start with bodyweight before adding load', 'Ensure pain-free throughout range'],
  31, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE youtube_video_id = 'IkEqhcBnWJs');

-- Update if already exists
UPDATE exercise_videos
SET
  title = 'Bulgarian Split Squat',
  description = 'Stand facing away from a bench or elevated surface. Place the top of one foot on the bench behind you. Lower your body by bending your front knee until your thigh is parallel to the ground. Push through your front heel to return to starting position. This exercise builds single-leg strength, improves balance, and strengthens the quadriceps, glutes, and hip stabilizers.',
  body_parts = ARRAY['Knee', 'Hip'],
  conditions = ARRAY['knee weakness', 'quad weakness', 'knee rehabilitation', 'athletic performance', 'patellofemoral pain'],
  keywords = ARRAY['split squat', 'single leg', 'quad strengthening', 'unilateral', 'functional', 'balance'],
  difficulty = 'Intermediate',
  recommended_sets = 3,
  recommended_reps = 10,
  display_order = 31,
  is_active = true
WHERE youtube_video_id = 'IkEqhcBnWJs';

-- ============================================
-- STEP 3: Add more common knee exercises
-- ============================================

-- Terminal Knee Extension
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Terminal Knee Extension',
  'Attach a resistance band to a fixed point at knee height. Step into the band so it''s behind your knee. Stand with a slight knee bend and straighten your knee against the band resistance, focusing on the final 30 degrees of extension. This exercise specifically targets the VMO (vastus medialis oblique) which is crucial for knee stability.',
  'TKE_PLACEHOLDER',
  'Beginner',
  ARRAY['Knee'],
  ARRAY['knee pain', 'patellofemoral syndrome', 'post-surgical knee', 'VMO weakness', 'knee instability'],
  ARRAY['TKE', 'VMO', 'quad', 'knee extension', 'rehabilitation', 'patellar tracking'],
  3, 15, 'Daily',
  ARRAY['Focus on full knee extension', 'Control the movement', 'Keep core engaged', 'Ensure pain-free throughout'],
  32, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Terminal Knee Extension');

-- Step Ups (Knee strengthening)
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Step Ups',
  'Stand facing a step or platform. Place one foot fully on the step and push through that heel to lift your body up. Bring the other foot up to meet it, then step back down leading with the same leg. This functional exercise strengthens the quadriceps, glutes, and improves single-leg stability.',
  'STEPUP_PLACEHOLDER',
  'Beginner',
  ARRAY['Knee', 'Hip'],
  ARRAY['knee weakness', 'functional strengthening', 'stair difficulty', 'quad weakness', 'balance issues'],
  ARRAY['step up', 'functional', 'stairs', 'quad', 'single leg', 'balance'],
  3, 10, 'Daily',
  ARRAY['Keep knee aligned over toe', 'Push through heel not toe', 'Control the descent', 'Start with low step height'],
  33, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Step Ups');

-- ============================================
-- STEP 4: Add these knee exercises to knee pain routine
-- ============================================

-- Create a knee exercise routine if it doesn't exist
INSERT INTO exercise_routines (name, description, target_condition, difficulty, estimated_duration, is_active)
SELECT
  'Knee Pain Relief',
  'A progressive routine for knee pain including mobility, stability, and strengthening exercises.',
  'knee pain',
  'Beginner',
  20,
  true
WHERE NOT EXISTS (SELECT 1 FROM exercise_routines WHERE name = 'Knee Pain Relief');

-- Link exercises to the knee routine
DO $$
DECLARE
  v_routine_id UUID;
  v_side_step_id UUID;
  v_split_squat_id UUID;
BEGIN
  -- Get routine ID
  SELECT id INTO v_routine_id FROM exercise_routines WHERE name = 'Knee Pain Relief';

  -- Get exercise IDs
  SELECT id INTO v_side_step_id FROM exercise_videos WHERE youtube_video_id = 'MDEC-93yKMQ';
  SELECT id INTO v_split_squat_id FROM exercise_videos WHERE youtube_video_id = 'IkEqhcBnWJs';

  -- Link exercises if routine and exercises exist
  IF v_routine_id IS NOT NULL AND v_side_step_id IS NOT NULL THEN
    INSERT INTO exercise_routine_items (routine_id, exercise_id, display_order, custom_sets, custom_reps)
    VALUES (v_routine_id, v_side_step_id, 6, 3, 15)
    ON CONFLICT (routine_id, exercise_id) DO UPDATE SET display_order = 6;
  END IF;

  IF v_routine_id IS NOT NULL AND v_split_squat_id IS NOT NULL THEN
    INSERT INTO exercise_routine_items (routine_id, exercise_id, display_order, custom_sets, custom_reps)
    VALUES (v_routine_id, v_split_squat_id, 7, 3, 10)
    ON CONFLICT (routine_id, exercise_id) DO UPDATE SET display_order = 7;
  END IF;
END $$;

-- ============================================
-- VERIFY CHANGES
-- ============================================
-- SELECT title, body_parts FROM exercise_videos WHERE 'Knee' = ANY(body_parts) ORDER BY display_order;
-- SELECT title, body_parts FROM exercise_videos WHERE 'Hamstrings' = ANY(body_parts);
