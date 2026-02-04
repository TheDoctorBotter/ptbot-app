-- Migration: Add Eccentric Knee Extension exercise
-- Date: 2026-02-04
-- YouTube: https://www.youtube.com/watch?v=ypmbQhmYLME

INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) VALUES (
  'Eccentric Knee Extension',
  'Slowly lower your leg from an extended position while seated, focusing on the controlled lowering phase. This eccentric exercise strengthens the quadriceps and is commonly used in knee rehabilitation for tendinopathy and post-surgical recovery.',
  'ypmbQhmYLME',
  'Beginner',
  ARRAY['Knee'],
  ARRAY['knee pain', 'patellar tendinopathy', 'quad weakness', 'knee rehabilitation'],
  ARRAY['eccentric', 'quad', 'knee extension', 'strengthening', 'rehabilitation'],
  3, 10, 'Daily',
  ARRAY['Control the lowering phase', 'Do not let leg drop', 'Stop if sharp pain occurs'],
  50,
  true
)
ON CONFLICT (youtube_video_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  body_parts = EXCLUDED.body_parts,
  conditions = EXCLUDED.conditions,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;
