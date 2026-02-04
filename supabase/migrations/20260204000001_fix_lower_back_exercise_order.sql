/*
  # Fix Lower Back Exercise Ordering

  Updates display_order for lower back exercises to ensure:
  - Position 7: Quadruped Bird Dog Exercise
  - Position 8: Standing Hip Extension with Superman Progression

  Also ensures hip exercises (clamshells, hip abduction) don't appear
  in lower back results by removing any 'lower back' from their body_parts.
*/

-- Update Bird Dog to display_order 7 (was 6)
UPDATE exercise_videos
SET display_order = 7
WHERE title ILIKE '%Bird Dog%'
  AND title ILIKE '%Quadruped%'
  AND section_id = (SELECT id FROM exercise_sections WHERE slug = 'lower-back');

-- Ensure Standing Hip Extension with Superman Progression is at display_order 8
UPDATE exercise_videos
SET display_order = 8
WHERE title ILIKE '%Standing Hip Extension%Superman%'
  AND section_id = (SELECT id FROM exercise_sections WHERE slug = 'lower-back');

-- Remove 'lower back' from clamshell exercises to prevent them from appearing in lower back results
-- Chain array_remove calls to handle different capitalizations
UPDATE exercise_videos
SET body_parts = array_remove(array_remove(array_remove(body_parts, 'lower back'), 'Lower Back'), 'Lower back')
WHERE title ILIKE '%Clamshell%';

-- Remove 'lower back' from side lying hip abduction exercises
UPDATE exercise_videos
SET body_parts = array_remove(array_remove(array_remove(body_parts, 'lower back'), 'Lower Back'), 'Lower back')
WHERE title ILIKE '%Hip Abduction%' OR title ILIKE '%Side%Lying%Hip%';

-- Ensure clamshells and hip abduction have high display_order so they don't appear early
-- (if they somehow still match lower back)
UPDATE exercise_videos
SET display_order = GREATEST(display_order, 100)
WHERE (title ILIKE '%Clamshell%' OR title ILIKE '%Hip Abduction%' OR title ILIKE '%Side%Lying%Hip%')
  AND section_id != (SELECT id FROM exercise_sections WHERE slug = 'lower-back');
