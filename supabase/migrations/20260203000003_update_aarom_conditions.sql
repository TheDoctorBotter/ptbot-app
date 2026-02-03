-- Migration: Update AAROM exercises to have specific conditions only
-- Date: 2026-02-03
-- Purpose: AAROM exercises should only be recommended for frozen shoulder,
--          post-surgical, or adhesive capsulitis patients - NOT general shoulder pain

-- ============================================
-- UPDATE AAROM EXERCISE CONDITIONS
-- These exercises require specific clinical indications
-- ============================================

-- AAROM External Rotation with Wand
-- Remove any general shoulder terms, keep only specific conditions
UPDATE exercise_videos
SET
  conditions = ARRAY['frozen shoulder', 'adhesive capsulitis', 'post-surgical', 'post-operative', 'severe ROM limitation'],
  keywords = ARRAY['AAROM', 'wand exercise', 'external rotation', 'range of motion', 'gentle', 'specialist-prescribed', 'frozen shoulder rehab'],
  contraindications = ARRAY['Do not use for general shoulder pain', 'Requires clinical indication', 'Not for impingement or rotator cuff strains'],
  safety_notes = ARRAY['This exercise is specifically for frozen shoulder or post-surgical patients', 'Let the wand assist the movement', 'Move within pain-free range', 'Do not force the stretch', 'Consult your PT before starting']
WHERE title ILIKE '%AAROM External Rotation%';

-- AAROM Forward Shoulder Flexion
-- Remove any general shoulder terms, keep only specific conditions
UPDATE exercise_videos
SET
  conditions = ARRAY['frozen shoulder', 'adhesive capsulitis', 'post-surgical', 'post-operative', 'severe overhead limitation'],
  keywords = ARRAY['AAROM', 'flexion', 'overhead', 'range of motion', 'wand exercise', 'specialist-prescribed', 'frozen shoulder rehab'],
  contraindications = ARRAY['Do not use for general shoulder pain', 'Requires clinical indication', 'Not for impingement or rotator cuff strains'],
  safety_notes = ARRAY['This exercise is specifically for frozen shoulder or post-surgical patients', 'Use the other arm to assist', 'Progress slowly', 'Stop if sharp pain occurs', 'Consult your PT before starting']
WHERE title ILIKE '%AAROM Forward Shoulder Flexion%';

-- ============================================
-- VERIFY UPDATES
-- ============================================
-- You can run this SELECT to verify the updates:
-- SELECT title, conditions, keywords, contraindications FROM exercise_videos WHERE title ILIKE '%AAROM%';
