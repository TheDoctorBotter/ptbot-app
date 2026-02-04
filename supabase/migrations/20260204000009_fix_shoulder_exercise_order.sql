-- Migration: Fix shoulder exercise ordering
-- Date: 2026-02-04
-- Purpose: Make Rotator Cuff Isometrics the first shoulder exercise returned

-- Shoulder exercises should be ordered:
-- 1. Rotator Cuff Isometrics (safest, first-line exercise)
-- 2. Dumbbell Scaption
-- 3. Four-Way Shoulder Stability
-- 4. Prone Y's
-- 5. Shoulder Horizontal Abduction

UPDATE exercise_videos SET display_order = 75 WHERE title = 'Rotator Cuff Isometrics';
UPDATE exercise_videos SET display_order = 76 WHERE title = 'Dumbbell Scaption';
UPDATE exercise_videos SET display_order = 77 WHERE title = 'Four-Way Shoulder Stability';
UPDATE exercise_videos SET display_order = 78 WHERE title = 'Prone Y''s';
UPDATE exercise_videos SET display_order = 79 WHERE title = 'Shoulder Horizontal Abduction';

-- Verify ordering
-- SELECT title, display_order FROM exercise_videos
-- WHERE 'Shoulder' = ANY(body_parts)
-- ORDER BY display_order;
