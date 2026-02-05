-- Migration: Add proper Anterior Knee Pain and Rotator Cuff Pain Relief Routines
-- Date: 2026-02-05
-- Purpose: Create curated exercise routines that properly match to knee and shoulder pain assessments

-- ============================================
-- STEP 1: Fix existing knee routine - add proper target_symptoms
-- ============================================

-- First, delete the old knee routine that was created with wrong schema
DELETE FROM exercise_routine_items WHERE routine_id IN (
  SELECT id FROM exercise_routines WHERE name = 'Knee Pain Relief'
);
DELETE FROM exercise_routines WHERE name = 'Knee Pain Relief';

-- ============================================
-- STEP 2: Create Anterior Knee Pain Relief Routine
-- ============================================

INSERT INTO exercise_routines (name, slug, description, target_symptoms, exclusion_criteria, disclaimer, difficulty, estimated_duration_minutes)
VALUES (
  'Anterior Knee Pain Relief Routine',
  'anterior-knee-pain-relief',
  'A comprehensive exercise sequence designed for anterior knee pain, patellofemoral syndrome, and general knee discomfort. Includes mobility, stability, and strengthening exercises targeting the quadriceps, hip abductors, and knee stabilizers.',
  ARRAY[
    'Pain around or behind the kneecap',
    'Pain going up or down stairs',
    'Pain with squatting or kneeling',
    'Pain after prolonged sitting',
    'Pain during running or jumping',
    'Knee stiffness',
    'Grinding or crunching sensation in knee',
    'Swelling around the knee',
    'Weakness in the leg',
    'Difficulty with deep knee bends',
    'Pain with walking on uneven surfaces',
    'Anterior knee pain',
    'Patellofemoral pain',
    'Knee pain'
  ],
  ARRAY[
    'Recent knee surgery (within 6 weeks)',
    'Significant knee swelling with fever',
    'Locked knee unable to bend or straighten',
    'Complete inability to bear weight',
    'Severe trauma to the knee'
  ],
  'These exercises are educational and not a substitute for medical advice. If pain worsens with any activity, seek professional guidance. If symptoms persist after 2-3 weeks, consult a healthcare professional.',
  'Beginner',
  20
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  target_symptoms = EXCLUDED.target_symptoms,
  exclusion_criteria = EXCLUDED.exclusion_criteria,
  disclaimer = EXCLUDED.disclaimer,
  updated_at = now();

-- ============================================
-- STEP 3: Link knee exercises to the routine
-- ============================================

-- First, clear any existing items for this routine
DELETE FROM exercise_routine_items WHERE routine_id = (
  SELECT id FROM exercise_routines WHERE slug = 'anterior-knee-pain-relief'
);

-- Link exercises in proper sequence
INSERT INTO exercise_routine_items (routine_id, video_id, sequence_order, phase, phase_notes, transition_notes)
SELECT
  (SELECT id FROM exercise_routines WHERE slug = 'anterior-knee-pain-relief'),
  ev.id,
  item.seq_order,
  item.phase,
  item.phase_notes,
  item.transition_notes
FROM (VALUES
  -- Phase 1: Mobility and Activation
  ('Eccentric Knee Extension', 1, 'Mobility', 'Begin with gentle quad activation to prepare the knee', NULL),
  ('Resisted Side Stepping with Band', 2, 'Strengthening', 'Hip strengthening helps reduce knee stress', 'Progress to this once knee feels mobile'),
  ('Terminal Knee Extension', 3, 'Strengthening', 'Focus on the final degrees of knee extension', NULL),
  ('Step Ups', 4, 'Strengthening', 'Functional exercise for daily activities', 'Start with low step height'),
  ('Bulgarian Split Squat', 5, 'Integration', 'Advanced exercise - only if previous exercises are comfortable', 'Can skip if too challenging initially')
) AS item(title, seq_order, phase, phase_notes, transition_notes)
JOIN exercise_videos ev ON ev.title = item.title
WHERE ev.is_active = true;

-- ============================================
-- STEP 4: Create Rotator Cuff Pain Relief Routine
-- ============================================

INSERT INTO exercise_routines (name, slug, description, target_symptoms, exclusion_criteria, disclaimer, difficulty, estimated_duration_minutes)
VALUES (
  'Rotator Cuff Pain Relief Routine',
  'rotator-cuff-pain-relief',
  'A progressive exercise sequence designed for shoulder pain, rotator cuff issues, and general shoulder discomfort. Includes isometric strengthening, scapular stability, and rotator cuff conditioning exercises.',
  ARRAY[
    'Pain in the shoulder',
    'Pain with overhead reaching',
    'Pain when lying on the affected shoulder',
    'Weakness in the arm',
    'Difficulty lifting objects',
    'Pain with arm rotation',
    'Shoulder stiffness',
    'Pain at night',
    'Difficulty reaching behind back',
    'Clicking or popping in shoulder',
    'Pain with throwing or overhead movements',
    'Rotator cuff pain',
    'Shoulder impingement',
    'Shoulder pain'
  ],
  ARRAY[
    'Recent shoulder surgery (within 6 weeks)',
    'Complete inability to lift arm',
    'Significant shoulder dislocation',
    'Severe trauma to the shoulder',
    'Acute rotator cuff tear'
  ],
  'These exercises are educational and not a substitute for medical advice. If pain worsens with any activity, seek professional guidance. If symptoms persist after 2-3 weeks, consult a healthcare professional.',
  'Beginner',
  15
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  target_symptoms = EXCLUDED.target_symptoms,
  exclusion_criteria = EXCLUDED.exclusion_criteria,
  disclaimer = EXCLUDED.disclaimer,
  updated_at = now();

-- ============================================
-- STEP 5: Link shoulder exercises to the routine
-- ============================================

-- First, clear any existing items for this routine
DELETE FROM exercise_routine_items WHERE routine_id = (
  SELECT id FROM exercise_routines WHERE slug = 'rotator-cuff-pain-relief'
);

-- Link exercises in proper sequence
INSERT INTO exercise_routine_items (routine_id, video_id, sequence_order, phase, phase_notes, transition_notes)
SELECT
  (SELECT id FROM exercise_routines WHERE slug = 'rotator-cuff-pain-relief'),
  ev.id,
  item.seq_order,
  item.phase,
  item.phase_notes,
  item.transition_notes
FROM (VALUES
  -- Phase 1: Gentle Activation
  ('Rotator Cuff Isometrics', 1, 'Activation', 'Start with gentle isometric contractions to activate the rotator cuff safely', NULL),
  -- Phase 2: Strengthening
  ('Dumbbell Scaption', 2, 'Strengthening', 'Use light weight or no weight initially', 'Progress once isometrics are pain-free'),
  ('Prone Y''s', 3, 'Strengthening', 'Focus on squeezing shoulder blades together', NULL),
  ('Shoulder Horizontal Abduction', 4, 'Strengthening', 'Targets posterior deltoid and rhomboids', NULL),
  -- Phase 3: Integration
  ('Four-Way Shoulder Stability', 5, 'Integration', 'Comprehensive shoulder strengthening - perform only if previous exercises are comfortable', 'Advanced exercise - can skip if too challenging')
) AS item(title, seq_order, phase, phase_notes, transition_notes)
JOIN exercise_videos ev ON ev.title = item.title
WHERE ev.is_active = true;

-- ============================================
-- VERIFICATION QUERIES (for manual checking)
-- ============================================
-- SELECT * FROM exercise_routines WHERE slug IN ('anterior-knee-pain-relief', 'rotator-cuff-pain-relief');
-- SELECT r.name, ev.title, ri.sequence_order, ri.phase
-- FROM exercise_routine_items ri
-- JOIN exercise_routines r ON r.id = ri.routine_id
-- JOIN exercise_videos ev ON ev.id = ri.video_id
-- WHERE r.slug IN ('anterior-knee-pain-relief', 'rotator-cuff-pain-relief')
-- ORDER BY r.name, ri.sequence_order;
