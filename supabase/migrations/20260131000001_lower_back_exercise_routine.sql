/*
  # Lower Back Pain Exercise Routine

  A curated 8-exercise sequence for mechanical lower back pain.

  Target Symptoms:
  - Dull, aching pain in the lower back (midline or slightly to one side)
  - Stiffness, especially in the morning or after sitting
  - Pain that builds gradually over days or weeks
  - Symptoms that wax and wane rather than stay constant
  - Pain worsened by prolonged sitting, standing, or bending
  - Temporary relief with position changes or light movement
  - Discomfort with repeated flexion/extension movements
  - Feeling tight, locked, or weak in the lower back
  - Difficulty maintaining posture for long periods
  - Reduced tolerance to daily tasks

  Referral Patterns (without radicular symptoms):
  - Achy discomfort into buttocks and upper thighs
  - Pain that does not follow a nerve pattern
  - No true numbness, tingling, or sharp shooting pain down the leg

  NOT appropriate for:
  - Specific traumatic events
  - Progressive neurological symptoms
  - Bowel or bladder changes
  - Constant night pain unrelated to movement
  - Significant leg weakness or sensory loss

  DISCLAIMER: These exercises are educational and not medical advice. If pain worsens
  with any activity, seek medical advice. If symptoms persist after 2-3 weeks, consult
  a healthcare professional.
*/

-- Remove previous lower back seed videos to replace with curated routine
DELETE FROM exercise_videos
WHERE section_id = (SELECT id FROM exercise_sections WHERE slug = 'lower-back');

-- Insert the curated lower back pain exercise routine
INSERT INTO exercise_videos (
  section_id,
  youtube_video_id,
  title,
  description,
  difficulty,
  body_parts,
  conditions,
  keywords,
  recommended_sets,
  recommended_reps,
  recommended_hold_seconds,
  recommended_frequency,
  contraindications,
  safety_notes,
  is_featured,
  display_order
) VALUES

-- ============================================
-- PHASE 1: Symptom Relief Exercises (1-4)
-- ============================================

-- Exercise 1: McKenzie Prone Lumbar Extension
(
  (SELECT id FROM exercise_sections WHERE slug = 'lower-back'),
  'BKhlBMjKGTw',
  'McKenzie Prone Lumbar Extension',
  'Begin lying face down and gently prop yourself onto your elbows, allowing your lower back to extend. This foundational exercise promotes lumbar extension and can provide immediate symptom relief. Start with a static hold of 30-60 seconds, progressing to 1-2 minute holds as tolerated. Focus on slow, controlled movements—quick transitions may increase discomfort. Quality repetitions are essential; 3-5 well-executed reps are more beneficial than 10 poor ones. As you become comfortable, progress to prone press-ups. This exercise can also be performed standing (hands on lower back, leaning backward) for convenient relief throughout the day.',
  'Beginner',
  ARRAY['lower back', 'lumbar spine'],
  ARRAY['mechanical low back pain', 'lumbar stiffness', 'disc-related pain', 'flexion intolerance', 'sitting intolerance'],
  ARRAY['mckenzie', 'prone extension', 'press up', 'lumbar extension', 'back pain relief', 'disc', 'stiffness'],
  NULL,
  5,
  60,
  'Multiple times daily',
  ARRAY['spinal stenosis', 'extension intolerance', 'facet syndrome', 'spondylolisthesis'],
  ARRAY['Focus on slow, steady movements', 'Quality over quantity—3-5 good reps beat 10 poor ones', 'Stop if pain increases or travels into legs', 'Can be performed standing for convenience'],
  true,
  1
),

-- Exercise 2: Cat-Camel Pose
(
  (SELECT id FROM exercise_sections WHERE slug = 'lower-back'),
  'HzkE6QlaDe0',
  'Cat-Camel Spinal Mobility',
  'This gentle mobility exercise is ideal following lumbar extension work. On hands and knees, alternate between arching your back upward (cat) and letting it sag downward (camel). This rhythmic movement increases spinal and pelvic mobility while reducing stiffness. Rather than counting repetitions, focus on spending 2-3 minutes moving through the range of motion. Allow your spine to move fluidly and naturally, coordinating with your breath.',
  'Beginner',
  ARRAY['lower back', 'thoracic spine', 'lumbar spine', 'pelvis'],
  ARRAY['mechanical low back pain', 'spinal stiffness', 'morning stiffness', 'reduced mobility'],
  ARRAY['cat camel', 'cat cow', 'spinal mobility', 'pelvic mobility', 'flexibility', 'warm up'],
  NULL,
  NULL,
  120,
  'Multiple times daily',
  ARRAY['acute disc herniation', 'severe extension or flexion intolerance'],
  ARRAY['Move slowly and rhythmically', 'Coordinate movement with breathing', 'Stay within comfortable range', 'Spend 2-3 minutes rather than counting reps'],
  true,
  2
),

-- Exercise 3: Single Knee to Chest
(
  (SELECT id FROM exercise_sections WHERE slug = 'lower-back'),
  'qYvYsFrTI0U',
  'Single Knee to Chest Stretch',
  'Lying on your back, draw one knee toward your chest while keeping the opposite leg extended or bent. This exercise reduces lower back stiffness, relieves muscle tension, and improves spinal mobility with minimal risk. For added benefit, provide light resistance with your hands while pushing your knee toward the ceiling with a 3-5 second hold—this activates the hip flexor and creates gentle anterior pelvic rotation. Perform 8-10 quality repetitions on each side.',
  'Beginner',
  ARRAY['lower back', 'hip', 'pelvis', 'hip flexor'],
  ARRAY['mechanical low back pain', 'lower back stiffness', 'muscle tension', 'hip tightness'],
  ARRAY['knee to chest', 'hip flexor', 'lumbar stretch', 'pelvic mobility', 'low back relief'],
  1,
  10,
  5,
  'Multiple times daily',
  ARRAY['acute disc herniation with flexion intolerance', 'hip replacement precautions'],
  ARRAY['Keep opposite leg relaxed', 'Add light resistance for hip flexor activation', 'Hold 3-5 seconds per rep', 'Perform on both sides'],
  false,
  3
),

-- Exercise 4: Double Knee to Chest
(
  (SELECT id FROM exercise_sections WHERE slug = 'lower-back'),
  'ypmbQhmYLME',
  'Double Knee to Chest Stretch',
  'Building on the single knee variation, bring both knees toward your chest simultaneously for symmetric pelvic mobility. You may provide light resistance with your hands while pushing both knees toward the ceiling, creating bilateral anterior pelvic rotation. This is excellent for lower back pain relief. Perform 8-10 repetitions. You can cycle through single and double knee variations multiple times until comfortable before progressing to strengthening exercises.',
  'Beginner',
  ARRAY['lower back', 'hip', 'pelvis'],
  ARRAY['mechanical low back pain', 'bilateral stiffness', 'symmetric tightness', 'pelvic dysfunction'],
  ARRAY['double knee to chest', 'bilateral stretch', 'pelvic mobility', 'low back relief', 'lumbar flexion'],
  1,
  10,
  5,
  'Multiple times daily',
  ARRAY['acute disc herniation with flexion intolerance'],
  ARRAY['Control the movement throughout', 'Add resistance for deeper activation', 'Can alternate with single knee to chest', 'Stop if pain increases'],
  false,
  4
),

-- ============================================
-- PHASE 2: Strengthening Exercises (5-6)
-- ============================================

-- Exercise 5: Prone Superman Unilateral Hold
(
  (SELECT id FROM exercise_sections WHERE slug = 'lower-back'),
  'm1L-ebkLrEs',
  'Prone Superman Unilateral Hold',
  'This low-load exercise builds spinal stabilization and posterior chain strength. Lying face down, lift one arm and the opposite leg just a few inches off the floor, holding for 3-5 seconds. This targets the lumbar extensors, gluteus maximus, and upper back stabilizers while enhancing motor control and coordination. Focus on slow, controlled movements rather than height—lifting higher is not better. Keep your abdomen gently engaged without excessive arching. Complete 8-10 quality repetitions per side, progressing to 15-20 as tolerated.',
  'Beginner',
  ARRAY['lower back', 'glutes', 'upper back', 'core'],
  ARRAY['mechanical low back pain', 'core weakness', 'spinal instability', 'posterior chain weakness'],
  ARRAY['superman', 'unilateral', 'spinal stability', 'core strengthening', 'lumbar extensor', 'glute activation'],
  1,
  10,
  5,
  'Daily',
  ARRAY['severe lumbar pain', 'recent spinal surgery', 'spondylolisthesis'],
  ARRAY['Lift only a few inches—higher is not better', 'Keep abdomen gently engaged', 'Avoid excessive arching', 'Stop if pain increases or travels into legs', 'Quality over quantity'],
  true,
  5
),

-- Exercise 6: Quadruped Bird Dog
(
  (SELECT id FROM exercise_sections WHERE slug = 'lower-back'),
  '3UTBkWmMEBI',
  'Quadruped Bird Dog Exercise',
  'This progression from the prone superman requires increased core control and load management. On hands and knees, extend one arm forward and the opposite leg backward while maintaining a neutral spine. You are creating rotational and extension forces that you must stabilize to prevent twisting, sagging, or arching. Focus on slow, controlled repetitions while keeping your spine elongated and straight—you should be able to balance a broomstick on your back. If you cannot maintain proper form without twisting, continue working on Exercise 5 until ready to progress.',
  'Intermediate',
  ARRAY['lower back', 'core', 'glutes', 'shoulders'],
  ARRAY['mechanical low back pain', 'core instability', 'rotational weakness', 'motor control deficit'],
  ARRAY['bird dog', 'quadruped', 'anti-rotation', 'core stability', 'spinal control', 'coordination'],
  2,
  10,
  3,
  'Daily',
  ARRAY['severe lumbar pain', 'inability to maintain neutral spine'],
  ARRAY['Maintain elongated, straight spine', 'No twisting to either side', 'Imagine balancing a broomstick on your back', 'If form breaks down, return to Exercise 5', 'Slow, controlled movements only'],
  true,
  6
),

-- ============================================
-- PHASE 3: Integration Exercises (7-8)
-- Note: Exercise 7 uses same video as Exercise 1 - standing variation noted in description
-- ============================================

-- Exercise 8: Standing Hip Extension with Progression
(
  (SELECT id FROM exercise_sections WHERE slug = 'lower-back'),
  'd4JPAOwo02g',
  'Standing Hip Extension with Superman Progression',
  'This two-part exercise targets the gluteus maximus, which plays a key role in protecting the lower back during everyday movements—particularly important for reducing mechanical low back pain. Begin with standing hip extensions: stand tall and extend one leg backward with a 3-5 second hold at end range. Start with 1 set of 10, progressing to 2-3 sets as tolerated.

PROGRESSION: The most effective exercise for lower back pain strengthens the erector spinae through a standing superman variation. Raise one arm straight overhead and extend it backward while simultaneously extending the OPPOSITE leg backward. This requires immense control to prevent rotational movements, which the erector spinae counterbalance. Stand tall with arm vertical (not off to side), reaching approximately 15-20 degrees backward until you feel contraction in your lower back. A controlled rep with 3-5 second hold is ideal—farther reach is not better. Build from 1 set of 10 to 3 sets of 10.',
  'Intermediate',
  ARRAY['lower back', 'glutes', 'hip extensors', 'erector spinae'],
  ARRAY['mechanical low back pain', 'glute weakness', 'hip-spine integration', 'functional weakness'],
  ARRAY['hip extension', 'standing superman', 'glute strengthening', 'erector spinae', 'functional exercise', 'integration'],
  3,
  10,
  5,
  'Daily',
  ARRAY['hip pathology', 'balance impairment without support'],
  ARRAY['Start with basic hip extension before progressing', 'Keep arm vertical, not off to side', 'Controlled movement with 3-5 second hold', 'Farther reach is not better—focus on control', 'Stop if pain increases or travels down leg'],
  true,
  8
)
ON CONFLICT (youtube_video_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty,
  body_parts = EXCLUDED.body_parts,
  conditions = EXCLUDED.conditions,
  keywords = EXCLUDED.keywords,
  recommended_sets = EXCLUDED.recommended_sets,
  recommended_reps = EXCLUDED.recommended_reps,
  recommended_hold_seconds = EXCLUDED.recommended_hold_seconds,
  recommended_frequency = EXCLUDED.recommended_frequency,
  contraindications = EXCLUDED.contraindications,
  safety_notes = EXCLUDED.safety_notes,
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- ============================================
-- Create Exercise Routine Table (for sequenced programs)
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_routines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  target_symptoms text[] default '{}',
  exclusion_criteria text[] default '{}',
  disclaimer text,
  difficulty text check (difficulty in ('Beginner', 'Intermediate', 'Advanced')) default 'Beginner',
  estimated_duration_minutes int,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

CREATE TABLE IF NOT EXISTS exercise_routine_items (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references exercise_routines(id) on delete cascade not null,
  video_id uuid references exercise_videos(id) on delete cascade not null,
  sequence_order int not null,
  phase text, -- e.g., 'Symptom Relief', 'Strengthening', 'Integration'
  phase_notes text,
  transition_notes text,
  is_optional boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS
ALTER TABLE exercise_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_routine_items ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Exercise routines are publicly readable"
  ON exercise_routines FOR SELECT TO authenticated, anon USING (is_active = true);

CREATE POLICY "Exercise routine items are publicly readable"
  ON exercise_routine_items FOR SELECT TO authenticated, anon USING (true);

-- Insert the Lower Back Pain Routine
INSERT INTO exercise_routines (name, slug, description, target_symptoms, exclusion_criteria, disclaimer, difficulty, estimated_duration_minutes)
VALUES (
  'Lower Back Pain Relief Routine',
  'lower-back-pain-relief',
  'A comprehensive 8-exercise sequence designed for insidious onset mechanical lower back pain characterized by stiffness and dull aching discomfort, exacerbated by prolonged sitting and transitional movements, with partial relief through movement and position changes.',
  ARRAY[
    'Dull, aching pain in the lower back',
    'Stiffness, especially in the morning or after sitting',
    'Pain that builds gradually over days or weeks',
    'Symptoms that wax and wane',
    'Pain worsened by prolonged sitting, standing, or bending',
    'Temporary relief with position changes',
    'Discomfort with repeated flexion/extension',
    'Feeling tight, locked, or weak in the lower back',
    'Difficulty maintaining posture',
    'Achy discomfort into buttocks and upper thighs',
    'Pain not following a nerve pattern'
  ],
  ARRAY[
    'Specific traumatic event',
    'Progressive neurological symptoms',
    'Bowel or bladder changes',
    'Constant night pain unrelated to movement',
    'Significant leg weakness or sensory loss',
    'True numbness, tingling, or sharp shooting pain down the leg'
  ],
  'These exercises are educational and not a substitute for medical advice. If pain worsens with any activity, seek professional guidance. If symptoms persist after 2-3 weeks, consult a healthcare professional.',
  'Beginner',
  20
)
ON CONFLICT (slug) DO NOTHING;

-- Link exercises to the routine
INSERT INTO exercise_routine_items (routine_id, video_id, sequence_order, phase, phase_notes, transition_notes)
VALUES
-- Phase 1: Symptom Relief
(
  (SELECT id FROM exercise_routines WHERE slug = 'lower-back-pain-relief'),
  (SELECT id FROM exercise_videos WHERE youtube_video_id = 'BKhlBMjKGTw'),
  1,
  'Symptom Relief',
  'Begin with these exercises to reduce pain and stiffness before progressing to strengthening.',
  NULL
),
(
  (SELECT id FROM exercise_routines WHERE slug = 'lower-back-pain-relief'),
  (SELECT id FROM exercise_videos WHERE youtube_video_id = 'HzkE6QlaDe0'),
  2,
  'Symptom Relief',
  NULL,
  'Perform immediately following lumbar extension'
),
(
  (SELECT id FROM exercise_routines WHERE slug = 'lower-back-pain-relief'),
  (SELECT id FROM exercise_videos WHERE youtube_video_id = 'qYvYsFrTI0U'),
  3,
  'Symptom Relief',
  NULL,
  NULL
),
(
  (SELECT id FROM exercise_routines WHERE slug = 'lower-back-pain-relief'),
  (SELECT id FROM exercise_videos WHERE youtube_video_id = 'ypmbQhmYLME'),
  4,
  'Symptom Relief',
  'If any Phase 1 exercises increase pain, STOP and consult a healthcare professional. If exercises do not alleviate symptoms but do not make them worse, proceed with caution or cycle through Phase 1 for several days before progressing.',
  'Can cycle between single and double knee to chest'
),
-- Phase 2: Strengthening
(
  (SELECT id FROM exercise_routines WHERE slug = 'lower-back-pain-relief'),
  (SELECT id FROM exercise_videos WHERE youtube_video_id = 'm1L-ebkLrEs'),
  5,
  'Strengthening',
  'Progress to these exercises once comfortable with Phase 1. Focus on building spinal stability and posterior chain strength.',
  NULL
),
(
  (SELECT id FROM exercise_routines WHERE slug = 'lower-back-pain-relief'),
  (SELECT id FROM exercise_videos WHERE youtube_video_id = '3UTBkWmMEBI'),
  6,
  'Strengthening',
  'After strengthening, return to prone press-ups, cat-camel, and knees to chest to mobilize the spine before integration exercises.',
  'If unable to maintain form, continue with Exercise 5'
),
-- Phase 3: Integration
(
  (SELECT id FROM exercise_routines WHERE slug = 'lower-back-pain-relief'),
  (SELECT id FROM exercise_videos WHERE youtube_video_id = 'd4JPAOwo02g'),
  8,
  'Integration',
  'Final phase integrates hip and spine function. Can return to any previous exercise for symptom relief at any point.',
  'Perform standing lumbar extension (hands on lower back, lean backward) before this exercise'
)
ON CONFLICT DO NOTHING;
