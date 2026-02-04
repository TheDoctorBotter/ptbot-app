-- Migration: Fix protocol exercise visibility
-- Date: 2026-02-04
-- Purpose:
--   1. Re-enable protocol exercises (is_active = true) so they show in Protocol Mode
--   2. Remove body part tags from protocol-specific videos so they don't appear in general browse

-- ============================================
-- STEP 1: Re-enable all protocol exercise videos
-- These were disabled to prevent them from showing in knee/shoulder browse
-- But this also broke Protocol Mode
-- ============================================

-- Re-enable Rotator Cuff Repair exercises
UPDATE exercise_videos SET is_active = true WHERE youtube_video_id IN (
  'Qw4CWf-woSo', 'HuFoHFQ5sk4', 'kS3jBBeSp6Q', 'KItyrvjV0Jo', '4SmsmkjQIN8'
);

-- Re-enable ACL Reconstruction exercises
UPDATE exercise_videos SET is_active = true WHERE youtube_video_id IN (
  'GlmphYGAyBg', '0r4jJMxIKew', 'IvGwMEdBiY4', 'dAyfCvPpk4g'
);

-- Re-enable Total Shoulder Arthroplasty exercises
UPDATE exercise_videos SET is_active = true WHERE youtube_video_id IN (
  '3fP0RKKLRUc', '7asp5IGATWI', '1Ao3HcUfMAo', 'XGAZmqoP8Fw'
);

-- Re-enable Total Hip Arthroplasty exercises (Anterior and Posterior)
UPDATE exercise_videos SET is_active = true WHERE youtube_video_id IN (
  '9eU8G038zFo', '1GEnWTeTcIk', 'QwOXFelsPBA', 'tPeJe5xJ09A'
);

-- Re-enable Meniscus Repair exercises
UPDATE exercise_videos SET is_active = true WHERE youtube_video_id IN (
  'hfHhVDW0aVE', 'vS9FtDQjgXk'
);

-- Re-enable Achilles Tendon Repair exercises
UPDATE exercise_videos SET is_active = true WHERE youtube_video_id IN (
  '8_CUUQKEx-M', 'VFEUc0KYUp0', 'CteKOmI37d8'
);

-- Re-enable Distal Biceps Repair exercises
UPDATE exercise_videos SET is_active = true WHERE youtube_video_id IN (
  '9jMkfDsbWR4'
);

-- Re-enable PCL Reconstruction exercises
UPDATE exercise_videos SET is_active = true WHERE youtube_video_id IN (
  'lzxqsNqSm1w', 'ruMuibCX2CU', 'AzEgJ0sE1x8'
);

-- ============================================
-- STEP 2: Clear body_parts from protocol-specific exercises
-- This prevents them from showing in body part browse
-- They will ONLY appear in Protocol Mode
-- ============================================

-- Clear body_parts for all protocol-specific exercise videos
-- These should only be accessed through Protocol Mode, not body part browse
UPDATE exercise_videos
SET body_parts = ARRAY[]::text[]
WHERE youtube_video_id IN (
  -- Rotator Cuff Repair (Phases 1-5)
  'Qw4CWf-woSo', 'HuFoHFQ5sk4', 'kS3jBBeSp6Q', 'KItyrvjV0Jo', '4SmsmkjQIN8',
  -- ACL Reconstruction (Phases 1-4)
  'GlmphYGAyBg', '0r4jJMxIKew', 'IvGwMEdBiY4', 'dAyfCvPpk4g',
  -- Total Shoulder Arthroplasty (Phases 1-4)
  '3fP0RKKLRUc', '7asp5IGATWI', '1Ao3HcUfMAo', 'XGAZmqoP8Fw',
  -- Total Hip Arthroplasty - Anterior (Phases 1-3)
  '9eU8G038zFo', '1GEnWTeTcIk', 'QwOXFelsPBA',
  -- Total Hip Arthroplasty - Posterior (Phase 1)
  'tPeJe5xJ09A',
  -- Meniscus Repair (Phases 1-2)
  'hfHhVDW0aVE', 'vS9FtDQjgXk',
  -- Achilles Tendon Repair (Phases 1-3)
  '8_CUUQKEx-M', 'VFEUc0KYUp0', 'CteKOmI37d8',
  -- Distal Biceps Repair
  '9jMkfDsbWR4',
  -- PCL Reconstruction (Phases 1-3)
  'lzxqsNqSm1w', 'ruMuibCX2CU', 'AzEgJ0sE1x8'
);

-- ============================================
-- VERIFY CHANGES
-- ============================================
-- Check protocol exercises are active but have no body_parts
-- SELECT title, is_active, body_parts
-- FROM exercise_videos
-- WHERE title LIKE '%Phase%' OR title LIKE '%Reconstruction%' OR title LIKE '%Arthroplasty%'
-- ORDER BY title;
