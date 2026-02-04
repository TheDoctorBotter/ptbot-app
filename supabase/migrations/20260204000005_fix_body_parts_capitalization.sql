-- Migration: Fix body_parts capitalization for consistent filtering
-- Date: 2026-02-04
-- Purpose: Standardize all body_parts values to use proper capitalization

-- Fix lowercase 'lower back' to 'Lower Back'
UPDATE exercise_videos
SET body_parts = array_replace(body_parts, 'lower back', 'Lower Back')
WHERE 'lower back' = ANY(body_parts);

-- Fix 'lumbar spine' to 'Lower Back' (UI doesn't have 'Lumbar Spine' filter)
UPDATE exercise_videos
SET body_parts = array_replace(body_parts, 'lumbar spine', 'Lower Back')
WHERE 'lumbar spine' = ANY(body_parts);

-- Remove duplicates caused by replacement
UPDATE exercise_videos
SET body_parts = (
  SELECT array_agg(DISTINCT elem)
  FROM unnest(body_parts) AS elem
)
WHERE 'Lower Back' = ANY(body_parts);

-- Fix lowercase 'hip' to 'Hip'
UPDATE exercise_videos
SET body_parts = array_replace(body_parts, 'hip', 'Hip')
WHERE 'hip' = ANY(body_parts);

-- Fix lowercase 'pelvis' to 'Hip' (map pelvis to Hip for filtering)
UPDATE exercise_videos
SET body_parts = array_replace(body_parts, 'pelvis', 'Hip')
WHERE 'pelvis' = ANY(body_parts);

-- Fix 'hip flexor' to 'Hip'
UPDATE exercise_videos
SET body_parts = array_replace(body_parts, 'hip flexor', 'Hip')
WHERE 'hip flexor' = ANY(body_parts);

-- Fix lowercase 'thoracic spine' to 'Upper Back'
UPDATE exercise_videos
SET body_parts = array_replace(body_parts, 'thoracic spine', 'Upper Back')
WHERE 'thoracic spine' = ANY(body_parts);

-- Fix lowercase 'glutes' to 'Hip'
UPDATE exercise_videos
SET body_parts = array_replace(body_parts, 'glutes', 'Hip')
WHERE 'glutes' = ANY(body_parts);

-- Fix lowercase 'core' to 'Core' (may need to add to filter list)
UPDATE exercise_videos
SET body_parts = array_replace(body_parts, 'core', 'Core')
WHERE 'core' = ANY(body_parts);

-- Fix 'upper back' to 'Upper Back'
UPDATE exercise_videos
SET body_parts = array_replace(body_parts, 'upper back', 'Upper Back')
WHERE 'upper back' = ANY(body_parts);

-- Fix 'shoulders' to 'Shoulder'
UPDATE exercise_videos
SET body_parts = array_replace(body_parts, 'shoulders', 'Shoulder')
WHERE 'shoulders' = ANY(body_parts);

-- Fix 'hip extensors' and 'erector spinae' to proper categories
UPDATE exercise_videos
SET body_parts = array_replace(body_parts, 'hip extensors', 'Hip')
WHERE 'hip extensors' = ANY(body_parts);

UPDATE exercise_videos
SET body_parts = array_replace(body_parts, 'erector spinae', 'Lower Back')
WHERE 'erector spinae' = ANY(body_parts);

-- Clean up any duplicates in all rows
UPDATE exercise_videos
SET body_parts = (
  SELECT array_agg(DISTINCT elem)
  FROM unnest(body_parts) AS elem
)
WHERE array_length(body_parts, 1) > 1;

-- Verify: Show exercises grouped by body part (for debugging)
-- SELECT unnest(body_parts) as body_part, count(*)
-- FROM exercise_videos
-- GROUP BY body_part
-- ORDER BY body_part;
