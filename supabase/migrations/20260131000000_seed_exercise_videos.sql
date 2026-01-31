/*
  # Seed Exercise Videos

  Adds sample YouTube exercise videos for:
  - Lower Back Pain
  - Shoulder Pain
  - Neck Pain

  Note: These are curated educational videos. Replace with your own content as needed.
*/

-- ============================================
-- Lower Back Pain Videos
-- ============================================
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
-- Video 1: McKenzie Extension
(
  (SELECT id FROM exercise_sections WHERE slug = 'lower-back'),
  '4BOTvaRaDjI',
  'McKenzie Press Up Exercise for Lower Back Pain',
  'The McKenzie press up is one of the most effective exercises for disc-related lower back pain. This exercise helps centralize pain and improve lumbar extension.',
  'Beginner',
  ARRAY['lower back', 'lumbar spine'],
  ARRAY['herniated disc', 'bulging disc', 'sciatica', 'lower back pain'],
  ARRAY['mckenzie', 'press up', 'extension', 'disc', 'lumbar'],
  3,
  10,
  NULL,
  '3-4x daily',
  ARRAY['spinal stenosis', 'severe nerve compression', 'fracture'],
  ARRAY['Stop if pain increases or moves further down the leg', 'Start gently and progress slowly', 'Keep hips on the ground'],
  true,
  1
),
-- Video 2: Cat-Cow Stretch
(
  (SELECT id FROM exercise_sections WHERE slug = 'lower-back'),
  'kqnua4rHVVA',
  'Cat-Cow Stretch for Spinal Mobility',
  'Gentle spinal flexion and extension exercise to improve lower back mobility and reduce stiffness.',
  'Beginner',
  ARRAY['lower back', 'thoracic spine', 'lumbar spine'],
  ARRAY['back stiffness', 'lower back pain', 'muscle tension'],
  ARRAY['cat cow', 'spinal mobility', 'flexibility', 'yoga'],
  2,
  10,
  NULL,
  '2x daily',
  ARRAY['acute disc herniation', 'severe pain with movement'],
  ARRAY['Move slowly and controlled', 'Breathe deeply throughout', 'Stay within pain-free range'],
  false,
  2
),
-- Video 3: Bird Dog Exercise
(
  (SELECT id FROM exercise_sections WHERE slug = 'lower-back'),
  'wiFNA3sqjCA',
  'Bird Dog Exercise for Core Stability',
  'Core stabilization exercise that strengthens the muscles supporting the lower back while improving balance and coordination.',
  'Beginner',
  ARRAY['lower back', 'core', 'glutes'],
  ARRAY['core weakness', 'lower back pain', 'instability'],
  ARRAY['bird dog', 'core stability', 'back strengthening'],
  3,
  10,
  5,
  'Daily',
  ARRAY['severe back pain', 'inability to maintain neutral spine'],
  ARRAY['Keep spine neutral throughout', 'Move slowly and controlled', 'Engage core before lifting'],
  true,
  3
),
-- Video 4: Sciatic Nerve Glide
(
  (SELECT id FROM exercise_sections WHERE slug = 'lower-back'),
  'pxvOQxUmrxI',
  'Sciatic Nerve Glide for Sciatica Relief',
  'Neural mobilization technique to reduce sciatic nerve tension and improve mobility for those with sciatica symptoms.',
  'Beginner',
  ARRAY['lower back', 'hip', 'leg'],
  ARRAY['sciatica', 'nerve pain', 'leg pain', 'numbness'],
  ARRAY['nerve glide', 'sciatic', 'neural mobilization', 'flossing'],
  2,
  15,
  NULL,
  '2-3x daily',
  ARRAY['severe nerve compression', 'cauda equina syndrome', 'progressive weakness'],
  ARRAY['Should not increase pain', 'Gentle oscillating movements only', 'Stop if symptoms worsen'],
  false,
  4
),

-- ============================================
-- Shoulder Pain Videos
-- ============================================
-- Video 5: Pendulum Exercise
(
  (SELECT id FROM exercise_sections WHERE slug = 'shoulder'),
  'zH5IDzXP0KY',
  'Pendulum Exercise for Shoulder Pain',
  'Gentle shoulder mobilization exercise ideal for early-stage shoulder rehabilitation. Uses gravity to create passive movement.',
  'Beginner',
  ARRAY['shoulder', 'rotator cuff'],
  ARRAY['frozen shoulder', 'rotator cuff injury', 'shoulder stiffness', 'post-surgery'],
  ARRAY['pendulum', 'codman', 'shoulder mobility', 'gentle'],
  3,
  NULL,
  60,
  '3-4x daily',
  ARRAY['shoulder dislocation', 'unstable shoulder'],
  ARRAY['Let arm hang relaxed', 'Movement comes from body not arm', 'Should be pain-free'],
  true,
  1
),
-- Video 6: Wall Angels
(
  (SELECT id FROM exercise_sections WHERE slug = 'shoulder'),
  'M_ooIhKYs7c',
  'Wall Angels for Posture and Shoulder Mobility',
  'Excellent exercise for improving shoulder mobility and correcting rounded shoulder posture. Strengthens scapular muscles.',
  'Beginner',
  ARRAY['shoulder', 'upper back', 'scapula'],
  ARRAY['poor posture', 'rounded shoulders', 'shoulder impingement'],
  ARRAY['wall angels', 'posture', 'scapular', 'mobility'],
  3,
  10,
  NULL,
  'Daily',
  ARRAY['acute shoulder injury', 'severe impingement'],
  ARRAY['Keep entire back against wall', 'Only go as high as comfortable', 'Focus on squeezing shoulder blades'],
  true,
  2
),
-- Video 7: Shoulder External Rotation
(
  (SELECT id FROM exercise_sections WHERE slug = 'shoulder'),
  'fEQvB6GxPLg',
  'Shoulder External Rotation with Resistance Band',
  'Strengthening exercise for the rotator cuff muscles. Essential for shoulder stability and preventing injury.',
  'Beginner',
  ARRAY['shoulder', 'rotator cuff'],
  ARRAY['rotator cuff weakness', 'shoulder instability', 'impingement'],
  ARRAY['external rotation', 'rotator cuff', 'strengthening', 'band'],
  3,
  15,
  NULL,
  '3x per week',
  ARRAY['acute rotator cuff tear', 'severe pain with resistance'],
  ARRAY['Keep elbow at side', 'Control the movement both ways', 'Start with light resistance'],
  false,
  3
),
-- Video 8: Sleeper Stretch
(
  (SELECT id FROM exercise_sections WHERE slug = 'shoulder'),
  'Uj1hZrpNpJY',
  'Sleeper Stretch for Shoulder Internal Rotation',
  'Stretch for improving internal rotation of the shoulder. Particularly helpful for throwing athletes and those with posterior capsule tightness.',
  'Intermediate',
  ARRAY['shoulder', 'posterior capsule'],
  ARRAY['shoulder stiffness', 'internal rotation deficit', 'throwing injuries'],
  ARRAY['sleeper stretch', 'internal rotation', 'posterior capsule'],
  3,
  NULL,
  30,
  'Daily',
  ARRAY['shoulder instability', 'labral tear', 'acute injury'],
  ARRAY['Gentle pressure only', 'Should feel stretch not pain', 'Keep shoulder blade flat'],
  false,
  4
),

-- ============================================
-- Neck Pain Videos
-- ============================================
-- Video 9: Chin Tucks
(
  (SELECT id FROM exercise_sections WHERE slug = 'neck'),
  'wQylqaCl8Zo',
  'Chin Tuck Exercise for Neck Pain and Posture',
  'The chin tuck is the most important exercise for neck pain and forward head posture. Strengthens deep neck flexors and improves cervical alignment.',
  'Beginner',
  ARRAY['neck', 'cervical spine'],
  ARRAY['neck pain', 'forward head posture', 'tech neck', 'headaches'],
  ARRAY['chin tuck', 'posture', 'deep neck flexors', 'cervical'],
  3,
  10,
  5,
  '3-4x daily',
  ARRAY['cervical radiculopathy with increased symptoms', 'severe arthritis'],
  ARRAY['Make a double chin', 'Keep eyes level', 'Should not cause pain'],
  true,
  1
),
-- Video 10: Neck Stretches
(
  (SELECT id FROM exercise_sections WHERE slug = 'neck'),
  'TI6sTgAqwbo',
  'Neck Stretches for Pain Relief',
  'Gentle stretching routine for the neck muscles including upper trapezius, levator scapulae, and scalenes.',
  'Beginner',
  ARRAY['neck', 'upper trapezius', 'scalenes'],
  ARRAY['neck stiffness', 'muscle tension', 'headaches', 'stress'],
  ARRAY['neck stretch', 'trapezius', 'levator scapulae', 'flexibility'],
  2,
  NULL,
  30,
  '2-3x daily',
  ARRAY['cervical instability', 'severe disc herniation'],
  ARRAY['Stretch gently', 'No bouncing', 'Breathe and relax into stretch'],
  true,
  2
),
-- Video 11: Cervical Rotation Stretch
(
  (SELECT id FROM exercise_sections WHERE slug = 'neck'),
  'PnMSJSTYdYk',
  'Neck Rotation Mobility Exercise',
  'Exercise to improve cervical rotation and reduce stiffness. Important for driving, checking blind spots, and daily activities.',
  'Beginner',
  ARRAY['neck', 'cervical spine'],
  ARRAY['neck stiffness', 'limited rotation', 'muscle tension'],
  ARRAY['rotation', 'mobility', 'range of motion', 'cervical'],
  2,
  10,
  3,
  '2x daily',
  ARRAY['cervical stenosis', 'vertebral artery insufficiency', 'dizziness with movement'],
  ARRAY['Move slowly', 'Stay within comfortable range', 'Stop if dizzy'],
  false,
  3
),
-- Video 12: Upper Trap Release
(
  (SELECT id FROM exercise_sections WHERE slug = 'neck'),
  'HmyU8xAMNGM',
  'Upper Trapezius Self-Release Technique',
  'Self-massage technique using a ball to release tension in the upper trapezius muscle, a common source of neck pain and headaches.',
  'Beginner',
  ARRAY['neck', 'upper trapezius', 'shoulder'],
  ARRAY['muscle knots', 'trigger points', 'tension headaches', 'neck pain'],
  ARRAY['self massage', 'trigger point', 'trapezius', 'release'],
  1,
  NULL,
  60,
  'As needed',
  ARRAY['acute injury', 'bruising', 'blood thinners'],
  ARRAY['Start with light pressure', 'Breathe deeply', 'Should hurt good not bad'],
  false,
  4
)
ON CONFLICT (youtube_video_id) DO NOTHING;
