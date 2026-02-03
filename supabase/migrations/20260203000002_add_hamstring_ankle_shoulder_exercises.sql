-- Migration: Add Hamstring, Ankle, and Shoulder exercises
-- Date: 2026-02-03

-- ============================================
-- HAMSTRING EXERCISES
-- ============================================

-- Hamstring Bridge (Short Lever)
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Hamstring Bridge (Short Lever)',
  'Lie on your back with knees bent and feet flat on the floor close to your glutes. Drive through your heels to lift your hips toward the ceiling, squeezing your glutes and hamstrings at the top. Lower slowly with control. This short lever variation reduces hamstring load, making it ideal for beginners or early rehabilitation.',
  'lbV2P9HvY7A',
  'Beginner',
  ARRAY['Hip', 'Knee'],
  ARRAY['hamstring strain', 'hamstring weakness', 'glute weakness', 'lower back pain'],
  ARRAY['bridge', 'hamstring', 'glute', 'strengthening', 'rehabilitation', 'beginner'],
  3, 10, 'Daily',
  ARRAY['Perform slow, controlled reps', 'Keep movements pain-free', 'Do not hyperextend your lower back', 'Stop if you feel cramping in the hamstrings'],
  60, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Hamstring Bridge (Short Lever)');

-- Hamstring Bridge (Long Lever)
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Hamstring Bridge (Long Lever)',
  'Lie on your back with legs extended further from your body than the short lever version. Drive through your heels to lift your hips, engaging your hamstrings more intensely due to the longer lever arm. Lower with control. This progression increases hamstring demand compared to the short lever variation.',
  'oSGMsbo_5Qs',
  'Intermediate',
  ARRAY['Hip', 'Knee'],
  ARRAY['hamstring strain', 'hamstring weakness', 'athletic performance', 'injury prevention'],
  ARRAY['bridge', 'hamstring', 'glute', 'strengthening', 'progression', 'long lever'],
  3, 10, 'Daily',
  ARRAY['Perform slow, controlled reps', 'Ensure pain-free movement throughout', 'Master short lever bridge first', 'Do not force range of motion'],
  61, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Hamstring Bridge (Long Lever)');

-- Anti-Extension Dead Bug
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Anti-Extension Dead Bug',
  'Lie on your back with arms extended toward the ceiling and knees bent at 90 degrees. Slowly lower one arm overhead while extending the opposite leg, maintaining a flat lower back pressed into the floor. Return to start and alternate sides. This exercise builds core stability and teaches proper spinal control.',
  'iW_CtYtzbeU',
  'Beginner',
  ARRAY['Lower Back', 'Hip'],
  ARRAY['lower back pain', 'core weakness', 'poor stability', 'postural dysfunction'],
  ARRAY['core', 'stability', 'dead bug', 'anti-extension', 'lumbar', 'control'],
  3, 10, 'Daily',
  ARRAY['Perform slow, controlled reps', 'Keep lower back pressed flat against floor', 'Stop if back arches off the ground', 'Ensure pain-free movement'],
  62, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Anti-Extension Dead Bug');

-- Partial Hip Hinge
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Partial Hip Hinge',
  'Stand with feet hip-width apart and knees slightly bent. Push your hips back while keeping your spine neutral, lowering your torso only partway down. Return to standing by driving hips forward. This teaches proper hip hinge mechanics essential for protecting the lower back during daily activities and exercise.',
  '5Q_RP-UpB44',
  'Beginner',
  ARRAY['Hip', 'Lower Back'],
  ARRAY['lower back pain', 'hamstring tightness', 'hip mobility', 'movement dysfunction'],
  ARRAY['hip hinge', 'hamstring', 'posterior chain', 'movement pattern', 'mechanics'],
  3, 10, 'Daily',
  ARRAY['Perform slow, controlled reps', 'Keep spine neutral throughout', 'Do not round your lower back', 'Ensure pain-free movement'],
  63, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Partial Hip Hinge');

-- ============================================
-- ANKLE EXERCISES
-- ============================================

-- Resisted Ankle Eversion
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Resisted Ankle Eversion',
  'Sit with your leg extended and a resistance band wrapped around your forefoot. Anchor the band on the outside of your foot. Turn your foot outward against the resistance, then slowly return. This strengthens the peroneal muscles which help stabilize the ankle and prevent inversion sprains.',
  'xfrncpP5ONQ',
  'Beginner',
  ARRAY['Ankle'],
  ARRAY['ankle sprain', 'ankle instability', 'peroneal weakness', 'lateral ankle pain'],
  ARRAY['eversion', 'peroneal', 'ankle strengthening', 'resistance band', 'stability'],
  3, 10, 'Daily',
  ARRAY['Perform slow, controlled reps', 'Use light resistance to start', 'Ensure pain-free movement', 'Avoid jerky movements'],
  70, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Resisted Ankle Eversion');

-- Resisted Ankle Inversion
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Resisted Ankle Inversion',
  'Sit with your leg extended and a resistance band wrapped around your forefoot. Anchor the band on the inside of your foot. Turn your foot inward against the resistance, then slowly return. This strengthens the tibialis posterior and other muscles that support the inner ankle.',
  '50YDq8_OA_w',
  'Beginner',
  ARRAY['Ankle'],
  ARRAY['ankle weakness', 'flat feet', 'posterior tibial dysfunction', 'medial ankle pain'],
  ARRAY['inversion', 'tibialis posterior', 'ankle strengthening', 'resistance band', 'arch support'],
  3, 10, 'Daily',
  ARRAY['Perform slow, controlled reps', 'Use light resistance to start', 'Ensure pain-free movement', 'Move through full range of motion'],
  71, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Resisted Ankle Inversion');

-- Soleus Stretch
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_hold_seconds, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Soleus Stretch',
  'Stand facing a wall with both feet pointing forward. Step one foot back and bend both knees while keeping heels on the ground. You should feel a stretch deep in the lower calf of the back leg. The bent knee position specifically targets the soleus muscle, which is important for ankle mobility.',
  '9qxc8eML0SA',
  'Beginner',
  ARRAY['Ankle'],
  ARRAY['calf tightness', 'Achilles tendinopathy', 'ankle stiffness', 'limited dorsiflexion'],
  ARRAY['soleus', 'calf stretch', 'flexibility', 'dorsiflexion', 'Achilles'],
  3, 30, 'Daily',
  ARRAY['Hold stretch gently - do not bounce', 'Keep heel on ground throughout', 'Ensure pain-free stretching', 'Breathe deeply and relax into stretch'],
  72, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Soleus Stretch');

-- Seated Midfoot Inversion
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Seated Midfoot Inversion',
  'Sit with your foot flat on the floor. Without moving your heel or toes, try to lift the arch of your foot by rolling the midfoot inward. This exercise activates the intrinsic foot muscles and tibialis posterior to improve arch control and foot stability.',
  'V7VuwGAdUzk',
  'Beginner',
  ARRAY['Ankle'],
  ARRAY['flat feet', 'plantar fasciitis', 'foot weakness', 'arch collapse'],
  ARRAY['midfoot', 'arch', 'intrinsic muscles', 'foot strengthening', 'stability'],
  3, 10, 'Daily',
  ARRAY['Perform slow, controlled reps', 'Keep heel and toes on ground', 'Focus on feeling the arch lift', 'Ensure pain-free movement'],
  73, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Seated Midfoot Inversion');

-- ============================================
-- SHOULDER EXERCISES
-- ============================================

-- Dumbbell Scaption
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Dumbbell Scaption',
  'Stand holding light dumbbells with thumbs pointing up. Raise arms in the scapular plane (about 30-45 degrees forward from your sides) to shoulder height, then lower with control. This angle is more joint-friendly than straight lateral raises and effectively strengthens the rotator cuff and deltoids.',
  '4Y3H0Qzah6U',
  'Beginner',
  ARRAY['Shoulder'],
  ARRAY['shoulder weakness', 'rotator cuff weakness', 'shoulder impingement', 'deltoid strengthening'],
  ARRAY['scaption', 'rotator cuff', 'deltoid', 'strengthening', 'dumbbell', 'scapular plane'],
  3, 10, 'Daily',
  ARRAY['Perform slow, controlled reps', 'Use light weight to start', 'Keep thumbs pointing up', 'Stop if you feel pinching or pain'],
  80, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Dumbbell Scaption');

-- Rotator Cuff Isometrics
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_hold_seconds, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Rotator Cuff Isometrics',
  'Stand next to a wall or doorframe. With your elbow bent at 90 degrees, press your forearm into the wall in different directions (inward, outward, forward) without moving. Hold each contraction for 5-10 seconds. These isometric exercises safely strengthen the rotator cuff with minimal joint stress.',
  'ohEfGiRbP_Q',
  'Beginner',
  ARRAY['Shoulder'],
  ARRAY['rotator cuff injury', 'shoulder pain', 'post-surgical', 'shoulder weakness'],
  ARRAY['isometric', 'rotator cuff', 'gentle', 'rehabilitation', 'early stage'],
  3, 10, 'Daily',
  ARRAY['Perform slow, controlled contractions', 'Start with light pressure', 'Ensure pain-free throughout', 'Do not hold breath during holds'],
  81, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Rotator Cuff Isometrics');

-- Four-Way Shoulder Stability
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Four-Way Shoulder Stability',
  'Using a resistance band or light weight, perform shoulder movements in four directions: forward flexion, extension, abduction, and horizontal movements. This comprehensive exercise strengthens all the muscles surrounding the shoulder for complete joint stability.',
  'STCC2DY96Mo',
  'Intermediate',
  ARRAY['Shoulder'],
  ARRAY['shoulder instability', 'shoulder weakness', 'athletic performance', 'injury prevention'],
  ARRAY['stability', 'rotator cuff', 'comprehensive', 'four-way', 'strengthening'],
  3, 10, '3x per week',
  ARRAY['Perform slow, controlled reps', 'Use light resistance initially', 'Maintain good posture throughout', 'Ensure pain-free movement in all directions'],
  82, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Four-Way Shoulder Stability');

-- Prone Y's
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Prone Y''s',
  'Lie face down on a bench or floor with arms hanging down. Raise both arms up and out at a 45-degree angle to form a Y shape, thumbs pointing up. Squeeze your shoulder blades together at the top, then lower with control. This exercise strengthens the lower trapezius and improves scapular stability.',
  'cYLucJwoiFI',
  'Beginner',
  ARRAY['Shoulder', 'Upper Back'],
  ARRAY['poor posture', 'scapular weakness', 'shoulder pain', 'rounded shoulders'],
  ARRAY['prone', 'Y raise', 'lower trapezius', 'scapular', 'posture', 'strengthening'],
  3, 10, 'Daily',
  ARRAY['Perform slow, controlled reps', 'Keep thumbs pointing toward ceiling', 'Do not shrug shoulders', 'Ensure pain-free movement'],
  83, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Prone Y''s');

-- Shoulder Horizontal Abduction
INSERT INTO exercise_videos (
  title, description, youtube_video_id, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_frequency, safety_notes, display_order, is_active
) SELECT
  'Shoulder Horizontal Abduction',
  'Lie face down on a bench or stand bent forward. With arms hanging down, raise them out to the sides until parallel with the floor, squeezing your shoulder blades together. Lower with control. This exercise targets the posterior deltoid and rhomboids for improved posture and shoulder balance.',
  'BtivOoTrcps',
  'Beginner',
  ARRAY['Shoulder', 'Upper Back'],
  ARRAY['rounded shoulders', 'posterior deltoid weakness', 'poor posture', 'shoulder imbalance'],
  ARRAY['horizontal abduction', 'posterior deltoid', 'rhomboids', 'posture', 'strengthening'],
  3, 10, 'Daily',
  ARRAY['Perform slow, controlled reps', 'Squeeze shoulder blades at top', 'Use light weight or bodyweight', 'Ensure pain-free range of motion'],
  84, true
WHERE NOT EXISTS (SELECT 1 FROM exercise_videos WHERE title = 'Shoulder Horizontal Abduction');

-- ============================================
-- ENSURE ALL NEW EXERCISES ARE ACTIVE
-- ============================================
UPDATE exercise_videos SET is_active = true WHERE youtube_video_id IN (
  'lbV2P9HvY7A', 'oSGMsbo_5Qs', 'iW_CtYtzbeU', '5Q_RP-UpB44',
  'xfrncpP5ONQ', '50YDq8_OA_w', '9qxc8eML0SA', 'V7VuwGAdUzk',
  '4Y3H0Qzah6U', 'ohEfGiRbP_Q', 'STCC2DY96Mo', 'cYLucJwoiFI', 'BtivOoTrcps'
);
