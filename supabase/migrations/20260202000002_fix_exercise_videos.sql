-- Migration: Fix exercise videos - remove unique constraint and update videos
-- Date: 2026-02-02

-- ============================================
-- PART 0: REMOVE UNIQUE CONSTRAINT ON youtube_video_id
-- (Multiple exercises can share the same video)
-- ============================================

ALTER TABLE exercise_videos DROP CONSTRAINT IF EXISTS exercise_videos_youtube_video_id_key;

-- ============================================
-- PART 1: UPDATE EXISTING EXERCISES BY TITLE
-- ============================================

-- Knee exercises
UPDATE exercise_videos SET youtube_video_id = 'ypmbQhmYLME' WHERE title ILIKE '%Eccentric Knee Extension%';
UPDATE exercise_videos SET youtube_video_id = 'd2GgSoHvIXo' WHERE title ILIKE '%Lateral Heel Taps%';
UPDATE exercise_videos SET youtube_video_id = '9EhHFemc8WQ' WHERE title ILIKE '%Isometric Quad%';

-- Hip exercises
UPDATE exercise_videos SET youtube_video_id = 'MDEC-93yKMQ' WHERE title ILIKE '%Side Stepping%Thera%Band%';
UPDATE exercise_videos SET youtube_video_id = 'm7RyKQV4XhE' WHERE title ILIKE '%Clamshell%';
UPDATE exercise_videos SET youtube_video_id = '-rDiQXjeXO0' WHERE title ILIKE '%Hip Abduction%';

-- Lower Back exercises
UPDATE exercise_videos SET youtube_video_id = 'HzkE6QlaDe0' WHERE title ILIKE '%Single Knee to Chest%';
UPDATE exercise_videos SET youtube_video_id = 'kqnua4rHVVA' WHERE title ILIKE '%Cat%Camel%';
UPDATE exercise_videos SET youtube_video_id = '3UTBkWmMEBI' WHERE title ILIKE '%Double Knee to Chest%';
UPDATE exercise_videos SET youtube_video_id = 'AhD-5is4_wE' WHERE title ILIKE '%McKenzie%' OR title ILIKE '%Prone%Lumbar Extension%' OR title ILIKE '%Press Up%';
UPDATE exercise_videos SET youtube_video_id = 'm1L-ebkLrEs' WHERE title ILIKE '%Prone Superman%' OR title ILIKE '%Superman%Unilateral%';
UPDATE exercise_videos SET youtube_video_id = 'BKhlBMjKGTw' WHERE title ILIKE '%Bird Dog%' OR title ILIKE '%Quadruped%Bird%';
UPDATE exercise_videos SET youtube_video_id = 'd4JPAOwo02g' WHERE title ILIKE '%Standing Hip Extension%Superman%';
UPDATE exercise_videos SET youtube_video_id = 'IkEqhcBnWJs' WHERE title ILIKE '%Bulgarian Split Squat%' OR title ILIKE '%Rear%Foot%Elevated%';

-- ============================================
-- PART 2: DELETE DUPLICATES BEFORE INSERT
-- (In case exercises already exist with same title)
-- ============================================

-- We'll use INSERT ... ON CONFLICT DO UPDATE instead

-- ============================================
-- PART 3: INSERT NEW EXERCISES (or update if exists)
-- ============================================

-- Monster Walks with Thera-Band (Hip)
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) VALUES (
  'Monster Walks with Thera-Band',
  'Place a resistance band around your ankles or just above your knees. Stand with feet hip-width apart in a slight squat position. Take diagonal steps forward, leading with one foot then the other, maintaining tension on the band throughout. Keep your core engaged and avoid letting your knees collapse inward.',
  'O_GEUdxQETA',
  'Beginner',
  ARRAY['Hip'],
  ARRAY['hip weakness', 'hip pain', 'glute activation'],
  ARRAY['resistance band', 'hip strengthening', 'glute activation', 'lateral stability'],
  3, 10, 'Daily',
  ARRAY['Keep knees aligned over toes', 'Maintain tension on band throughout', 'Stop if you experience sharp pain'],
  25, true
) ON CONFLICT (title) DO UPDATE SET
  youtube_video_id = EXCLUDED.youtube_video_id,
  description = EXCLUDED.description,
  is_active = true;

-- Child's Pose Stretch (Lower Back)
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_hold_seconds, recommended_frequency, safety_notes, display_order, is_active
) VALUES (
  'Child''s Pose Stretch',
  'Start on your hands and knees. Sit your hips back toward your heels while extending your arms forward on the floor. Let your forehead rest on the ground and breathe deeply. This gentle stretch releases tension in the lower back, hips, and shoulders.',
  'qYvYsFrTI0U',
  'Beginner',
  ARRAY['Lower Back'],
  ARRAY['lower back pain', 'stiffness', 'tension relief'],
  ARRAY['stretch', 'relaxation', 'flexibility', 'gentle', 'restorative'],
  3, 30, 'Daily',
  ARRAY['Avoid if you have knee problems', 'Use a pillow under knees if needed', 'Breathe deeply throughout'],
  15, true
) ON CONFLICT (title) DO UPDATE SET
  youtube_video_id = EXCLUDED.youtube_video_id,
  description = EXCLUDED.description,
  is_active = true;

-- Standing Back Extension (Lower Back)
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) VALUES (
  'Standing Back Extension',
  'Stand with feet shoulder-width apart and hands on your lower back for support. Gently lean backward, extending through your spine while keeping your knees slightly bent. Hold briefly at the end range, then return to standing. This exercise promotes lumbar extension and can help relieve flexion-based back pain.',
  'IAMfLvZqAhs',
  'Beginner',
  ARRAY['Lower Back'],
  ARRAY['lower back pain', 'stiffness', 'flexion intolerance'],
  ARRAY['extension', 'McKenzie', 'standing', 'mobility', 'posture'],
  3, 10, 'Every 2-3 hours',
  ARRAY['Move slowly and controlled', 'Do not force the movement', 'Stop if pain increases'],
  16, true
) ON CONFLICT (title) DO UPDATE SET
  youtube_video_id = EXCLUDED.youtube_video_id,
  description = EXCLUDED.description,
  is_active = true;

-- Eccentric Hamstring Progression (Hamstring)
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) VALUES (
  'Eccentric Hamstring Progression',
  'This exercise strengthens the hamstrings through controlled lengthening (eccentric) contractions. Start with basic hamstring curls and progress to Nordic hamstring curls as strength improves. Focus on the slow, controlled lowering phase to build strength and prevent hamstring injuries.',
  'plOcKUYoBWQ',
  'Intermediate',
  ARRAY['Hip', 'Knee'],
  ARRAY['hamstring strain', 'hamstring weakness', 'injury prevention'],
  ARRAY['eccentric', 'hamstring', 'strengthening', 'rehabilitation', 'Nordic'],
  3, 8, '3x per week',
  ARRAY['Start with easier variations', 'Control the lowering phase', 'Stop if you feel sharp pain'],
  30, true
) ON CONFLICT (title) DO UPDATE SET
  youtube_video_id = EXCLUDED.youtube_video_id,
  description = EXCLUDED.description,
  is_active = true;

-- ============================================
-- SHOULDER EXERCISES
-- ============================================

-- Resisted Abduction and External Rotation
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) VALUES (
  'Resisted Abduction and External Rotation',
  'Using a resistance band, perform shoulder abduction (raising arm to the side) combined with external rotation. This exercise targets the rotator cuff muscles and helps improve shoulder stability and strength.',
  '2Zy07ygEAko',
  'Beginner',
  ARRAY['Shoulder'],
  ARRAY['shoulder pain', 'rotator cuff weakness', 'shoulder instability'],
  ARRAY['resistance band', 'rotator cuff', 'strengthening', 'external rotation', 'abduction'],
  3, 12, 'Daily',
  ARRAY['Keep elbow at 90 degrees', 'Move slowly and controlled', 'Stop if pain increases'],
  40, true
) ON CONFLICT (title) DO UPDATE SET
  youtube_video_id = EXCLUDED.youtube_video_id,
  description = EXCLUDED.description,
  is_active = true;

-- Side-Lying Shoulder External Rotation
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) VALUES (
  'Side-Lying Shoulder External Rotation',
  'Lie on your side with your top arm bent at 90 degrees, elbow resting on your hip. Holding a light weight, rotate your forearm upward toward the ceiling while keeping your elbow pinned to your side. This isolates the external rotators of the rotator cuff.',
  '2Zy07ygEAko',
  'Beginner',
  ARRAY['Shoulder'],
  ARRAY['shoulder pain', 'rotator cuff weakness', 'impingement'],
  ARRAY['rotator cuff', 'external rotation', 'side-lying', 'strengthening'],
  3, 15, 'Daily',
  ARRAY['Use light weight only', 'Keep elbow against your side', 'Move through pain-free range'],
  41, true
) ON CONFLICT (title) DO UPDATE SET
  youtube_video_id = EXCLUDED.youtube_video_id,
  description = EXCLUDED.description,
  is_active = true;

-- Scapular Retraction
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) VALUES (
  'Scapular Retraction',
  'Squeeze your shoulder blades together as if trying to hold a pencil between them. Hold for 5 seconds, then release. This exercise strengthens the muscles that pull the shoulder blades back and improves posture.',
  'iCZbtG0WosA',
  'Beginner',
  ARRAY['Shoulder', 'Upper Back'],
  ARRAY['poor posture', 'shoulder pain', 'upper back pain', 'rounded shoulders'],
  ARRAY['scapular', 'posture', 'retraction', 'rhomboids', 'upper back'],
  3, 15, 'Multiple times daily',
  ARRAY['Keep neck relaxed', 'Do not shrug shoulders', 'Hold each rep for 5 seconds'],
  42, true
) ON CONFLICT (title) DO UPDATE SET
  youtube_video_id = EXCLUDED.youtube_video_id,
  description = EXCLUDED.description,
  is_active = true;

-- Scapular Stabilization Exercises
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) VALUES (
  'Scapular Stabilization Exercises',
  'A series of exercises designed to strengthen the muscles that control shoulder blade movement. Includes scapular push-ups, wall slides, and prone Y-T-W exercises. These help create a stable base for shoulder movement.',
  'WoP0-kLXsRo',
  'Beginner',
  ARRAY['Shoulder', 'Upper Back'],
  ARRAY['shoulder instability', 'scapular dyskinesis', 'shoulder pain'],
  ARRAY['scapular', 'stabilization', 'serratus anterior', 'shoulder blade'],
  3, 10, 'Daily',
  ARRAY['Focus on controlled movements', 'Keep core engaged', 'Progress gradually'],
  43, true
) ON CONFLICT (title) DO UPDATE SET
  youtube_video_id = EXCLUDED.youtube_video_id,
  description = EXCLUDED.description,
  is_active = true;

-- Wall Slides with Resistance
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) VALUES (
  'Wall Slides with Resistance',
  'Stand with your back against a wall, arms bent at 90 degrees with backs of hands touching the wall. Slowly slide your arms up the wall while maintaining contact, then return. Adding resistance band increases the challenge for shoulder and scapular muscles.',
  'LIi-akh1zZc',
  'Intermediate',
  ARRAY['Shoulder', 'Upper Back'],
  ARRAY['shoulder impingement', 'poor posture', 'shoulder weakness'],
  ARRAY['wall slides', 'overhead mobility', 'scapular', 'resistance band'],
  3, 12, 'Daily',
  ARRAY['Keep entire back against wall', 'Do not arch lower back', 'Stop if pinching occurs'],
  44, true
) ON CONFLICT (title) DO UPDATE SET
  youtube_video_id = EXCLUDED.youtube_video_id,
  description = EXCLUDED.description,
  is_active = true;

-- AAROM External Rotation with Wand
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) VALUES (
  'AAROM External Rotation with Wand',
  'Active-Assisted Range of Motion exercise for shoulder external rotation. Using a wand or stick, the uninvolved arm helps move the affected shoulder through external rotation. This is ideal for early rehabilitation when active motion is limited.',
  'fLa7o3w6W2o',
  'Beginner',
  ARRAY['Shoulder'],
  ARRAY['frozen shoulder', 'post-surgical', 'limited range of motion', 'shoulder stiffness'],
  ARRAY['AAROM', 'wand exercise', 'external rotation', 'range of motion', 'gentle'],
  3, 15, 'Multiple times daily',
  ARRAY['Let the wand assist the movement', 'Move within pain-free range', 'Do not force the stretch'],
  45, true
) ON CONFLICT (title) DO UPDATE SET
  youtube_video_id = EXCLUDED.youtube_video_id,
  description = EXCLUDED.description,
  is_active = true;

-- AAROM Forward Shoulder Flexion
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) VALUES (
  'AAROM Forward Shoulder Flexion',
  'Active-Assisted Range of Motion exercise for shoulder flexion. Using a wand, cane, or the other arm, assist the affected shoulder in moving forward and overhead. This helps restore overhead reaching motion after injury or surgery.',
  'xdo0gi77SL0',
  'Beginner',
  ARRAY['Shoulder'],
  ARRAY['frozen shoulder', 'post-surgical', 'limited overhead motion', 'shoulder stiffness'],
  ARRAY['AAROM', 'flexion', 'overhead', 'range of motion', 'wand exercise'],
  3, 15, 'Multiple times daily',
  ARRAY['Use the other arm to assist', 'Progress slowly', 'Stop if sharp pain occurs'],
  46, true
) ON CONFLICT (title) DO UPDATE SET
  youtube_video_id = EXCLUDED.youtube_video_id,
  description = EXCLUDED.description,
  is_active = true;

-- ============================================
-- NECK EXERCISES
-- ============================================

-- Chin Tucks
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) VALUES (
  'Chin Tucks',
  'Sit or stand with good posture. Gently draw your chin straight back, creating a "double chin" appearance. Hold for 5 seconds, then release. This exercise strengthens the deep neck flexors and improves posture by counteracting forward head position.',
  '7rnlAVhAK-8',
  'Beginner',
  ARRAY['Neck'],
  ARRAY['neck pain', 'forward head posture', 'cervical strain', 'tech neck'],
  ARRAY['chin tuck', 'posture', 'deep neck flexors', 'cervical', 'office exercise'],
  3, 15, 'Multiple times daily',
  ARRAY['Keep eyes level - do not look down', 'Move chin straight back, not down', 'Hold for 5 seconds each rep'],
  50, true
) ON CONFLICT (title) DO UPDATE SET
  youtube_video_id = EXCLUDED.youtube_video_id,
  description = EXCLUDED.description,
  is_active = true;

-- Levator Scapula Stretch
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_hold_seconds, recommended_frequency, safety_notes, display_order, is_active
) VALUES (
  'Levator Scapula Stretch',
  'Sit upright and turn your head 45 degrees to one side. Gently tilt your head forward, looking toward your armpit. Use your hand to apply gentle pressure for a deeper stretch. You should feel the stretch along the back and side of your neck. Hold for 30 seconds, then repeat on the other side.',
  'GSoXPJRnR6E',
  'Beginner',
  ARRAY['Neck', 'Upper Back'],
  ARRAY['neck pain', 'neck stiffness', 'tension headaches', 'upper back tightness'],
  ARRAY['stretch', 'levator scapulae', 'neck stretch', 'tension relief', 'flexibility'],
  3, 30, 'Daily',
  ARRAY['Do not force the stretch', 'Keep shoulders relaxed', 'Breathe deeply throughout'],
  51, true
) ON CONFLICT (title) DO UPDATE SET
  youtube_video_id = EXCLUDED.youtube_video_id,
  description = EXCLUDED.description,
  is_active = true;

-- ============================================
-- ENSURE ALL EXERCISES ARE ACTIVE
-- ============================================
UPDATE exercise_videos SET is_active = true WHERE youtube_video_id IS NOT NULL AND youtube_video_id != '';
