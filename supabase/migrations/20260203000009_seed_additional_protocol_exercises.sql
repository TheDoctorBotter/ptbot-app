-- Seed Additional Protocol Exercises
-- Includes: Rotator Cuff (grades 1-3), ACL, Total Shoulder, Total Hip (Ant/Post),
-- Meniscus, Achilles, Distal Biceps, PCL

-- ============================================================================
-- STEP 1: Insert all exercise videos
-- ============================================================================

INSERT INTO exercise_videos (
  youtube_video_id, title, description, difficulty, body_parts, conditions, keywords,
  recommended_sets, recommended_reps, recommended_hold_seconds, recommended_frequency,
  contraindications, safety_notes, display_order, is_active
) VALUES
-- ROTATOR CUFF REPAIR (5 phases)
(
  'Qw4CWf-woSo',
  'Rotator Cuff Repair - Phase 1 Exercises',
  'Phase 1 rehabilitation following rotator cuff repair. Focus on protecting the repair, controlling pain and swelling, and beginning passive range of motion. Sling use required.',
  'Beginner',
  ARRAY['Shoulder'],
  ARRAY['Rotator Cuff Repair', 'Shoulder Surgery', 'Post-Op Shoulder'],
  ARRAY['rotator cuff', 'phase 1', 'passive ROM', 'pendulums', 'sling'],
  2, 10, 30, '3x daily',
  ARRAY['Active shoulder motion', 'Lifting objects', 'Reaching behind back'],
  ARRAY['Keep arm in sling except during exercises', 'Only passive motion allowed', 'Sleep in reclined position'],
  101, true
),
(
  'HuFoHFQ5sk4',
  'Rotator Cuff Repair - Phase 2 Exercises',
  'Phase 2 rehabilitation following rotator cuff repair. Progress to active-assisted range of motion while continuing to protect the healing tissue.',
  'Beginner',
  ARRAY['Shoulder'],
  ARRAY['Rotator Cuff Repair', 'Shoulder Surgery', 'Post-Op Shoulder'],
  ARRAY['rotator cuff', 'phase 2', 'active-assisted', 'AAROM', 'pulley'],
  2, 10, 30, '2-3x daily',
  ARRAY['Resistive exercises', 'Heavy lifting', 'Sudden movements'],
  ARRAY['Use opposite arm to assist movement', 'Move within pain-free range', 'May begin weaning from sling'],
  102, true
),
(
  'kS3jBBeSp6Q',
  'Rotator Cuff Repair - Phase 3 Exercises',
  'Phase 3 rehabilitation following rotator cuff repair. Transition to active range of motion and begin gentle strengthening as tissue healing allows.',
  'Intermediate',
  ARRAY['Shoulder'],
  ARRAY['Rotator Cuff Repair', 'Shoulder Surgery', 'Post-Op Shoulder'],
  ARRAY['rotator cuff', 'phase 3', 'active ROM', 'AROM', 'isometrics'],
  3, 10, 5, '2x daily',
  ARRAY['Heavy resistance', 'Overhead lifting', 'Throwing motions'],
  ARRAY['Progress slowly', 'No pain with exercises', 'Focus on scapular control'],
  103, true
),
(
  'KItyrvjV0Jo',
  'Rotator Cuff Repair - Phase 4 Exercises',
  'Phase 4 rehabilitation following rotator cuff repair. Progressive strengthening with resistance bands and light weights. Focus on rotator cuff and scapular strengthening.',
  'Intermediate',
  ARRAY['Shoulder'],
  ARRAY['Rotator Cuff Repair', 'Shoulder Surgery', 'Post-Op Shoulder'],
  ARRAY['rotator cuff', 'phase 4', 'strengthening', 'resistance bands', 'scapular'],
  3, 12, NULL, 'Daily',
  ARRAY['Heavy overhead lifting', 'High-speed movements', 'Contact activities'],
  ARRAY['Start with light resistance', 'Maintain proper posture', 'No pain during exercises'],
  104, true
),
(
  '4SmsmkjQIN8',
  'Rotator Cuff Repair - Phase 5 Exercises',
  'Phase 5 rehabilitation following rotator cuff repair. Advanced strengthening and return to full activity. Sport-specific training if applicable.',
  'Advanced',
  ARRAY['Shoulder'],
  ARRAY['Rotator Cuff Repair', 'Shoulder Surgery', 'Post-Op Shoulder'],
  ARRAY['rotator cuff', 'phase 5', 'advanced', 'return to sport', 'functional'],
  3, 15, NULL, 'Daily',
  ARRAY['Return to sport without clearance', 'Ignoring pain'],
  ARRAY['Surgeon clearance required for sport', 'Continue maintenance exercises long-term'],
  105, true
),

-- ACL RECONSTRUCTION (4 phases)
(
  'GlmphYGAyBg',
  'ACL Reconstruction - Phase 1 Exercises',
  'Phase 1 rehabilitation following ACL reconstruction. Focus on reducing swelling, restoring knee extension, and quadriceps activation.',
  'Beginner',
  ARRAY['Knee'],
  ARRAY['ACL Reconstruction', 'ACL Surgery', 'Knee Surgery'],
  ARRAY['ACL', 'phase 1', 'quad sets', 'extension', 'heel slides'],
  2, 10, 10, '4-6x daily',
  ARRAY['Deep knee flexion past 90°', 'Twisting motions', 'Running or jumping'],
  ARRAY['Ice 20 min after exercises', 'Keep leg elevated', 'Brace locked in extension for walking'],
  111, true
),
(
  '0r4jJMxIKew',
  'ACL Reconstruction - Phase 2 Exercises',
  'Phase 2 rehabilitation following ACL reconstruction. Progress range of motion, begin closed-chain strengthening, and normalize gait.',
  'Beginner',
  ARRAY['Knee'],
  ARRAY['ACL Reconstruction', 'ACL Surgery', 'Knee Surgery'],
  ARRAY['ACL', 'phase 2', 'closed chain', 'mini squats', 'balance'],
  3, 10, NULL, '2x daily',
  ARRAY['Open chain knee extension', 'Deep squats', 'Pivoting activities'],
  ARRAY['Brace may be unlocked for walking', 'Progress weight bearing as tolerated', 'Focus on normal gait pattern'],
  112, true
),
(
  'IvGwMEdBiY4',
  'ACL Reconstruction - Phase 3 Exercises',
  'Phase 3 rehabilitation following ACL reconstruction. Progressive strengthening, advanced balance training, and begin sport-specific activities.',
  'Intermediate',
  ARRAY['Knee'],
  ARRAY['ACL Reconstruction', 'ACL Surgery', 'Knee Surgery'],
  ARRAY['ACL', 'phase 3', 'strengthening', 'balance', 'proprioception'],
  3, 12, NULL, 'Daily',
  ARRAY['Cutting and pivoting', 'Full sport participation', 'Single leg jumping'],
  ARRAY['May begin stationary bike', 'Progress to elliptical', 'No brace needed typically'],
  113, true
),
(
  'dAyfCvPpk4g',
  'ACL Reconstruction - Phase 4 Exercises',
  'Phase 4 rehabilitation following ACL reconstruction. Return to sport preparation with plyometrics, agility, and sport-specific drills.',
  'Advanced',
  ARRAY['Knee'],
  ARRAY['ACL Reconstruction', 'ACL Surgery', 'Knee Surgery'],
  ARRAY['ACL', 'phase 4', 'plyometrics', 'agility', 'return to sport'],
  3, 15, NULL, 'Daily',
  ARRAY['Return to sport without functional testing', 'Ignoring instability'],
  ARRAY['Must pass return-to-sport testing', 'Consider sport brace initially', 'Continue prevention exercises'],
  114, true
),

-- TOTAL SHOULDER ARTHROPLASTY (4 phases)
(
  '3fP0RKKLRUc',
  'Total Shoulder Arthroplasty - Phase 1 Exercises',
  'Phase 1 rehabilitation following total shoulder replacement. Focus on protecting the surgical repair and beginning gentle passive range of motion.',
  'Beginner',
  ARRAY['Shoulder'],
  ARRAY['Total Shoulder Arthroplasty', 'Shoulder Replacement', 'TSA'],
  ARRAY['shoulder replacement', 'TSA', 'phase 1', 'passive ROM', 'pendulums'],
  2, 10, 30, '3x daily',
  ARRAY['Active shoulder motion', 'Lifting anything', 'Reaching behind back', 'External rotation past neutral'],
  ARRAY['Sling at all times except exercises', 'Only passive motion', 'Sleep semi-reclined'],
  121, true
),
(
  '7asp5IGATWI',
  'Total Shoulder Arthroplasty - Phase 2 Exercises',
  'Phase 2 rehabilitation following total shoulder replacement. Progress to active-assisted and begin gentle active motion.',
  'Beginner',
  ARRAY['Shoulder'],
  ARRAY['Total Shoulder Arthroplasty', 'Shoulder Replacement', 'TSA'],
  ARRAY['shoulder replacement', 'TSA', 'phase 2', 'AAROM', 'active-assisted'],
  2, 10, 30, '2-3x daily',
  ARRAY['Resistive exercises', 'Heavy lifting', 'Sudden jerking motions'],
  ARRAY['May begin weaning from sling', 'Progress motion gradually', 'No pain during exercises'],
  122, true
),
(
  '1Ao3HcUfMAo',
  'Total Shoulder Arthroplasty - Phase 3 Exercises',
  'Phase 3 rehabilitation following total shoulder replacement. Active motion in all planes and begin gentle strengthening.',
  'Intermediate',
  ARRAY['Shoulder'],
  ARRAY['Total Shoulder Arthroplasty', 'Shoulder Replacement', 'TSA'],
  ARRAY['shoulder replacement', 'TSA', 'phase 3', 'active ROM', 'strengthening'],
  3, 10, 5, '2x daily',
  ARRAY['Heavy resistance', 'High-impact activities', 'Contact sports'],
  ARRAY['Light resistance only', 'Focus on functional movements', 'Full ROM before strengthening'],
  123, true
),
(
  'XGAZmqoP8Fw',
  'Total Shoulder Arthroplasty - Phase 4 Exercises',
  'Phase 4 rehabilitation following total shoulder replacement. Progressive strengthening and return to normal activities.',
  'Intermediate',
  ARRAY['Shoulder'],
  ARRAY['Total Shoulder Arthroplasty', 'Shoulder Replacement', 'TSA'],
  ARRAY['shoulder replacement', 'TSA', 'phase 4', 'advanced strengthening', 'return to activity'],
  3, 12, NULL, 'Daily',
  ARRAY['Heavy overhead lifting', 'Contact sports', 'Repetitive high-force activities'],
  ARRAY['Lifetime precautions for joint protection', 'Continue maintenance exercises', 'Annual follow-up'],
  124, true
),

-- TOTAL HIP ARTHROPLASTY - ANTERIOR (3 phases)
(
  '9eU8G038zFo',
  'Total Hip Arthroplasty (Anterior) - Phase 1 Exercises',
  'Phase 1 rehabilitation following anterior approach total hip replacement. Fewer precautions than posterior approach. Focus on mobility and gait.',
  'Beginner',
  ARRAY['Hip'],
  ARRAY['Total Hip Arthroplasty', 'Hip Replacement', 'THA', 'Anterior Approach'],
  ARRAY['hip replacement', 'THA', 'anterior', 'phase 1', 'gait training'],
  2, 10, 5, '3x daily',
  ARRAY['Excessive hip extension', 'Pivoting on surgical leg'],
  ARRAY['Weight bearing as tolerated typically', 'Use walker/crutches initially', 'Ice for swelling'],
  131, true
),
(
  '1GEnWTeTcIk',
  'Total Hip Arthroplasty (Anterior) - Phase 2 Exercises',
  'Phase 2 rehabilitation following anterior approach total hip replacement. Progressive strengthening and weaning from assistive device.',
  'Beginner',
  ARRAY['Hip'],
  ARRAY['Total Hip Arthroplasty', 'Hip Replacement', 'THA', 'Anterior Approach'],
  ARRAY['hip replacement', 'THA', 'anterior', 'phase 2', 'strengthening'],
  3, 10, NULL, '2x daily',
  ARRAY['High-impact activities', 'Deep squatting'],
  ARRAY['Progress to cane', 'Focus on normal gait', 'May begin stationary bike'],
  132, true
),
(
  'QwOXFelsPBA',
  'Total Hip Arthroplasty (Anterior) - Phase 3 Exercises',
  'Phase 3 rehabilitation following anterior approach total hip replacement. Advanced strengthening and return to recreational activities.',
  'Intermediate',
  ARRAY['Hip'],
  ARRAY['Total Hip Arthroplasty', 'Hip Replacement', 'THA', 'Anterior Approach'],
  ARRAY['hip replacement', 'THA', 'anterior', 'phase 3', 'advanced', 'return to activity'],
  3, 12, NULL, 'Daily',
  ARRAY['High-impact sports', 'Contact sports', 'Heavy repetitive lifting'],
  ARRAY['Low-impact activities preferred', 'Continue hip strengthening long-term', 'Annual follow-up'],
  133, true
),

-- TOTAL HIP ARTHROPLASTY - POSTERIOR (1 phase shown)
(
  'tPeJe5xJ09A',
  'Total Hip Arthroplasty (Posterior) - Phase 1 Exercises',
  'Phase 1 rehabilitation following posterior approach total hip replacement. Strict hip precautions required to protect the repair.',
  'Beginner',
  ARRAY['Hip'],
  ARRAY['Total Hip Arthroplasty', 'Hip Replacement', 'THA', 'Posterior Approach'],
  ARRAY['hip replacement', 'THA', 'posterior', 'phase 1', 'precautions'],
  2, 10, 5, '3x daily',
  ARRAY['Hip flexion past 90°', 'Crossing legs', 'Internal rotation', 'Bending forward past 90°'],
  ARRAY['STRICT HIP PRECAUTIONS', 'Use raised toilet seat', 'Do not cross legs', 'Sleep with pillow between legs'],
  141, true
),

-- MENISCUS REPAIR (2 phases)
(
  'hfHhVDW0aVE',
  'Meniscus Repair - Phase 1 Exercises',
  'Phase 1 rehabilitation following meniscus repair. Protect the repair while maintaining quad activation and gentle ROM.',
  'Beginner',
  ARRAY['Knee'],
  ARRAY['Meniscus Repair', 'Knee Surgery', 'Meniscus Surgery'],
  ARRAY['meniscus', 'phase 1', 'quad sets', 'limited ROM'],
  2, 10, 10, '4x daily',
  ARRAY['Deep knee flexion past 90°', 'Squatting', 'Twisting', 'Full weight bearing (depends on repair)'],
  ARRAY['Weight bearing per surgeon protocol', 'ROM limited per surgeon', 'Brace locked for walking typically'],
  151, true
),
(
  'vS9FtDQjgXk',
  'Meniscus Repair - Phase 2 Exercises',
  'Phase 2 rehabilitation following meniscus repair. Progress ROM and begin strengthening as healing allows.',
  'Beginner',
  ARRAY['Knee'],
  ARRAY['Meniscus Repair', 'Knee Surgery', 'Meniscus Surgery'],
  ARRAY['meniscus', 'phase 2', 'ROM progression', 'strengthening'],
  3, 10, NULL, '2x daily',
  ARRAY['Deep squatting', 'High-impact activities', 'Pivoting'],
  ARRAY['Progress ROM gradually', 'Avoid deep flexion loading', 'May begin bike when ROM allows'],
  152, true
),

-- ACHILLES TENDON REPAIR (3 phases)
(
  '8_CUUQKEx-M',
  'Achilles Tendon Repair - Phase 1 Exercises',
  'Phase 1 rehabilitation following Achilles tendon repair. Protect the repair in boot, non-weight bearing or partial weight bearing.',
  'Beginner',
  ARRAY['Ankle'],
  ARRAY['Achilles Tendon Repair', 'Achilles Surgery', 'Ankle Surgery'],
  ARRAY['achilles', 'phase 1', 'non-weight bearing', 'boot'],
  2, 10, NULL, '3x daily',
  ARRAY['Weight bearing without boot', 'Dorsiflexion stretching', 'Walking without boot'],
  ARRAY['Boot at all times', 'Keep leg elevated', 'NWB or PWB per surgeon', 'Sleep in boot'],
  161, true
),
(
  'VFEUc0KYUp0',
  'Achilles Tendon Repair - Phase 2 Exercises',
  'Phase 2 rehabilitation following Achilles tendon repair. Progress weight bearing and begin gentle ROM.',
  'Beginner',
  ARRAY['Ankle'],
  ARRAY['Achilles Tendon Repair', 'Achilles Surgery', 'Ankle Surgery'],
  ARRAY['achilles', 'phase 2', 'weight bearing', 'ROM'],
  2, 10, 30, '2-3x daily',
  ARRAY['Aggressive stretching', 'Heel raises', 'Running'],
  ARRAY['Progress to WBAT in boot', 'Gradual wedge removal', 'Begin gentle plantarflexion'],
  162, true
),
(
  'CteKOmI37d8',
  'Achilles Tendon Repair - Phase 3 Exercises',
  'Phase 3 rehabilitation following Achilles tendon repair. Transition out of boot, progressive strengthening and return to walking.',
  'Intermediate',
  ARRAY['Ankle'],
  ARRAY['Achilles Tendon Repair', 'Achilles Surgery', 'Ankle Surgery'],
  ARRAY['achilles', 'phase 3', 'strengthening', 'heel raises', 'gait'],
  3, 10, NULL, 'Daily',
  ARRAY['Jumping', 'Running before cleared', 'Aggressive calf stretching'],
  ARRAY['Heel lift in shoe initially', 'Progress heel raises gradually', 'Normalize gait pattern'],
  163, true
),

-- DISTAL BICEPS TENDON REPAIR (single video)
(
  '9jMkfDsbWR4',
  'Distal Biceps Tendon Repair - Rehabilitation Exercises',
  'Rehabilitation exercises following distal biceps tendon repair. Phased progression from protection through strengthening.',
  'Beginner',
  ARRAY['Elbow'],
  ARRAY['Distal Biceps Repair', 'Biceps Tendon', 'Elbow Surgery'],
  ARRAY['distal biceps', 'elbow', 'biceps repair', 'rehabilitation'],
  2, 10, NULL, '2-3x daily',
  ARRAY['Resisted elbow flexion (early)', 'Heavy lifting', 'Forceful supination'],
  ARRAY['Sling for 1-2 weeks', 'No resisted flexion for 6 weeks typically', 'Progress per surgeon protocol'],
  171, true
),

-- PCL RECONSTRUCTION (3 phases)
(
  'lzxqsNqSm1w',
  'PCL Reconstruction - Phase 1 Exercises',
  'Phase 1 rehabilitation following PCL reconstruction. Protect the graft while maintaining quad activation and gentle motion.',
  'Beginner',
  ARRAY['Knee'],
  ARRAY['PCL Reconstruction', 'PCL Surgery', 'Knee Surgery'],
  ARRAY['PCL', 'phase 1', 'quad sets', 'protected motion'],
  2, 10, 10, '4x daily',
  ARRAY['Active hamstring exercises', 'Prone knee flexion', 'Posterior tibial translation'],
  ARRAY['AVOID HAMSTRING ACTIVATION', 'Brace locked for walking', 'Quad sets emphasized'],
  181, true
),
(
  'ruMuibCX2CU',
  'PCL Reconstruction - Phase 2 Exercises',
  'Phase 2 rehabilitation following PCL reconstruction. Progress ROM and begin careful strengthening avoiding hamstring loading.',
  'Beginner',
  ARRAY['Knee'],
  ARRAY['PCL Reconstruction', 'PCL Surgery', 'Knee Surgery'],
  ARRAY['PCL', 'phase 2', 'ROM', 'quad strengthening'],
  3, 10, NULL, '2x daily',
  ARRAY['Isolated hamstring exercises', 'Deep squatting', 'Posterior tibial stress'],
  ARRAY['Continue avoiding hamstring isolation', 'Progress closed chain exercises', 'May unlock brace'],
  182, true
),
(
  'AzEgJ0sE1x8',
  'PCL Reconstruction - Phase 3 Exercises',
  'Phase 3 rehabilitation following PCL reconstruction. Progressive strengthening and preparation for return to activity.',
  'Intermediate',
  ARRAY['Knee'],
  ARRAY['PCL Reconstruction', 'PCL Surgery', 'Knee Surgery'],
  ARRAY['PCL', 'phase 3', 'strengthening', 'return to activity'],
  3, 12, NULL, 'Daily',
  ARRAY['High-impact activities before cleared', 'Sport without functional testing'],
  ARRAY['May begin sport-specific training', 'Functional testing before return', 'Consider PCL brace for sport'],
  183, true
)
ON CONFLICT (youtube_video_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty,
  body_parts = EXCLUDED.body_parts,
  conditions = EXCLUDED.conditions,
  keywords = EXCLUDED.keywords,
  contraindications = EXCLUDED.contraindications,
  safety_notes = EXCLUDED.safety_notes;

-- ============================================================================
-- STEP 2: Ensure all protocols exist
-- ============================================================================

INSERT INTO protocols (protocol_key, region, surgery_name, is_active) VALUES
('shoulder_rotator_cuff_repair_grade1', 'Shoulder', 'Rotator Cuff Repair - Grade 1 (Small Tear)', true),
('shoulder_rotator_cuff_repair_grade2', 'Shoulder', 'Rotator Cuff Repair - Grade 2 (Medium Tear)', true),
('shoulder_rotator_cuff_repair_grade3', 'Shoulder', 'Rotator Cuff Repair - Grade 3 (Large/Massive Tear)', true),
('knee_acl_reconstruction', 'Knee', 'ACL Reconstruction', true),
('shoulder_total_shoulder_arthroplasty', 'Shoulder', 'Total Shoulder Arthroplasty', true),
('hip_total_hip_arthroplasty_anterior', 'Hip', 'Total Hip Arthroplasty (Anterior)', true),
('hip_total_hip_arthroplasty_posterior', 'Hip', 'Total Hip Arthroplasty (Posterior)', true),
('knee_meniscus_repair', 'Knee', 'Meniscus Repair', true),
('foot_ankle_achilles_tendon_repair', 'Foot/Ankle', 'Achilles Tendon Repair', true),
('elbow_distal_biceps_repair', 'Elbow', 'Distal Biceps Tendon Repair', true),
('knee_pcl_reconstruction', 'Knee', 'PCL Reconstruction', true)
ON CONFLICT (protocol_key) DO UPDATE SET surgery_name = EXCLUDED.surgery_name;

-- ============================================================================
-- STEP 3: Link exercises to protocol phases
-- ============================================================================

DO $$
DECLARE
  -- Protocol IDs
  v_rcr_g1_id UUID;
  v_rcr_g2_id UUID;
  v_rcr_g3_id UUID;
  v_acl_id UUID;
  v_tsa_id UUID;
  v_tha_ant_id UUID;
  v_tha_post_id UUID;
  v_meniscus_id UUID;
  v_achilles_id UUID;
  v_biceps_id UUID;
  v_pcl_id UUID;

  -- Exercise IDs
  v_rcr_p1 UUID; v_rcr_p2 UUID; v_rcr_p3 UUID; v_rcr_p4 UUID; v_rcr_p5 UUID;
  v_acl_p1 UUID; v_acl_p2 UUID; v_acl_p3 UUID; v_acl_p4 UUID;
  v_tsa_p1 UUID; v_tsa_p2 UUID; v_tsa_p3 UUID; v_tsa_p4 UUID;
  v_tha_ant_p1 UUID; v_tha_ant_p2 UUID; v_tha_ant_p3 UUID;
  v_tha_post_p1 UUID;
  v_meniscus_p1 UUID; v_meniscus_p2 UUID;
  v_achilles_p1 UUID; v_achilles_p2 UUID; v_achilles_p3 UUID;
  v_biceps_p1 UUID;
  v_pcl_p1 UUID; v_pcl_p2 UUID; v_pcl_p3 UUID;
BEGIN
  -- Get Protocol IDs
  SELECT id INTO v_rcr_g1_id FROM protocols WHERE protocol_key = 'shoulder_rotator_cuff_repair_grade1';
  SELECT id INTO v_rcr_g2_id FROM protocols WHERE protocol_key = 'shoulder_rotator_cuff_repair_grade2';
  SELECT id INTO v_rcr_g3_id FROM protocols WHERE protocol_key = 'shoulder_rotator_cuff_repair_grade3';
  SELECT id INTO v_acl_id FROM protocols WHERE protocol_key = 'knee_acl_reconstruction';
  SELECT id INTO v_tsa_id FROM protocols WHERE protocol_key = 'shoulder_total_shoulder_arthroplasty';
  SELECT id INTO v_tha_ant_id FROM protocols WHERE protocol_key = 'hip_total_hip_arthroplasty_anterior';
  SELECT id INTO v_tha_post_id FROM protocols WHERE protocol_key = 'hip_total_hip_arthroplasty_posterior';
  SELECT id INTO v_meniscus_id FROM protocols WHERE protocol_key = 'knee_meniscus_repair';
  SELECT id INTO v_achilles_id FROM protocols WHERE protocol_key = 'foot_ankle_achilles_tendon_repair';
  SELECT id INTO v_biceps_id FROM protocols WHERE protocol_key = 'elbow_distal_biceps_repair';
  SELECT id INTO v_pcl_id FROM protocols WHERE protocol_key = 'knee_pcl_reconstruction';

  -- Get Exercise IDs
  SELECT id INTO v_rcr_p1 FROM exercise_videos WHERE youtube_video_id = 'Qw4CWf-woSo';
  SELECT id INTO v_rcr_p2 FROM exercise_videos WHERE youtube_video_id = 'HuFoHFQ5sk4';
  SELECT id INTO v_rcr_p3 FROM exercise_videos WHERE youtube_video_id = 'kS3jBBeSp6Q';
  SELECT id INTO v_rcr_p4 FROM exercise_videos WHERE youtube_video_id = 'KItyrvjV0Jo';
  SELECT id INTO v_rcr_p5 FROM exercise_videos WHERE youtube_video_id = '4SmsmkjQIN8';

  SELECT id INTO v_acl_p1 FROM exercise_videos WHERE youtube_video_id = 'GlmphYGAyBg';
  SELECT id INTO v_acl_p2 FROM exercise_videos WHERE youtube_video_id = '0r4jJMxIKew';
  SELECT id INTO v_acl_p3 FROM exercise_videos WHERE youtube_video_id = 'IvGwMEdBiY4';
  SELECT id INTO v_acl_p4 FROM exercise_videos WHERE youtube_video_id = 'dAyfCvPpk4g';

  SELECT id INTO v_tsa_p1 FROM exercise_videos WHERE youtube_video_id = '3fP0RKKLRUc';
  SELECT id INTO v_tsa_p2 FROM exercise_videos WHERE youtube_video_id = '7asp5IGATWI';
  SELECT id INTO v_tsa_p3 FROM exercise_videos WHERE youtube_video_id = '1Ao3HcUfMAo';
  SELECT id INTO v_tsa_p4 FROM exercise_videos WHERE youtube_video_id = 'XGAZmqoP8Fw';

  SELECT id INTO v_tha_ant_p1 FROM exercise_videos WHERE youtube_video_id = '9eU8G038zFo';
  SELECT id INTO v_tha_ant_p2 FROM exercise_videos WHERE youtube_video_id = '1GEnWTeTcIk';
  SELECT id INTO v_tha_ant_p3 FROM exercise_videos WHERE youtube_video_id = 'QwOXFelsPBA';

  SELECT id INTO v_tha_post_p1 FROM exercise_videos WHERE youtube_video_id = 'tPeJe5xJ09A';

  SELECT id INTO v_meniscus_p1 FROM exercise_videos WHERE youtube_video_id = 'hfHhVDW0aVE';
  SELECT id INTO v_meniscus_p2 FROM exercise_videos WHERE youtube_video_id = 'vS9FtDQjgXk';

  SELECT id INTO v_achilles_p1 FROM exercise_videos WHERE youtube_video_id = '8_CUUQKEx-M';
  SELECT id INTO v_achilles_p2 FROM exercise_videos WHERE youtube_video_id = 'VFEUc0KYUp0';
  SELECT id INTO v_achilles_p3 FROM exercise_videos WHERE youtube_video_id = 'CteKOmI37d8';

  SELECT id INTO v_biceps_p1 FROM exercise_videos WHERE youtube_video_id = '9jMkfDsbWR4';

  SELECT id INTO v_pcl_p1 FROM exercise_videos WHERE youtube_video_id = 'lzxqsNqSm1w';
  SELECT id INTO v_pcl_p2 FROM exercise_videos WHERE youtube_video_id = 'ruMuibCX2CU';
  SELECT id INTO v_pcl_p3 FROM exercise_videos WHERE youtube_video_id = 'AzEgJ0sE1x8';

  -- ========================================
  -- ROTATOR CUFF REPAIR - GRADE 1, 2, 3
  -- Same exercises, different timeline expectations
  -- ========================================

  -- Grade 1 (Small Tear) - Faster progression expected
  INSERT INTO protocol_phase_exercises (protocol_id, phase_number, exercise_id, display_order, phase_sets, phase_reps, phase_frequency, phase_notes)
  VALUES
  (v_rcr_g1_id, 1, v_rcr_p1, 1, 2, 10, '3x daily', E'**PHASE 1: Maximum Protection (Weeks 0-4)**\n\n**Goals:**\n• Protect surgical repair\n• Control pain and swelling\n• Maintain elbow/wrist ROM\n• Begin passive shoulder ROM\n\n**TO PROGRESS TO PHASE 2:**\n✓ Pain ≤ 3/10 at rest\n✓ Minimal swelling\n✓ Passive forward flexion to 120°\n✓ Passive external rotation to 30°\n✓ 4 weeks post-op minimum\n\n**⚠️ CONTACT SURGEON IF:**\n• Sudden increase in pain\n• New numbness/tingling in arm\n• Signs of infection\n• Unable to perform passive ROM'),
  (v_rcr_g1_id, 2, v_rcr_p2, 1, 2, 10, '2-3x daily', E'**PHASE 2: Protected Motion (Weeks 4-8)**\n\n**Goals:**\n• Progress to active-assisted ROM\n• Begin weaning from sling\n• Improve scapular control\n\n**TO PROGRESS TO PHASE 3:**\n✓ Pain-free AAROM\n✓ AAROM forward flexion to 140°\n✓ AAROM external rotation to 45°\n✓ Good scapular mechanics\n✓ 8 weeks post-op minimum\n\n**⚠️ PRECAUTIONS:**\n• No active shoulder motion yet\n• No lifting objects\n• Continue sling in crowds'),
  (v_rcr_g1_id, 3, v_rcr_p3, 1, 3, 10, '2x daily', E'**PHASE 3: Active Motion (Weeks 8-12)**\n\n**Goals:**\n• Achieve full active ROM\n• Begin gentle isometrics\n• Discontinue sling\n\n**TO PROGRESS TO PHASE 4:**\n✓ Full active ROM (equal to opposite side)\n✓ Pain-free daily activities\n✓ Good scapular control with movement\n✓ 12 weeks post-op minimum\n\n**⚠️ PRECAUTIONS:**\n• No resistance training yet\n• No lifting > 5 lbs'),
  (v_rcr_g1_id, 4, v_rcr_p4, 1, 3, 12, 'Daily', E'**PHASE 4: Strengthening (Weeks 12-16)**\n\n**Goals:**\n• Progressive rotator cuff strengthening\n• Scapular strengthening\n• Return to light activities\n\n**TO PROGRESS TO PHASE 5:**\n✓ Pain-free strengthening exercises\n✓ 4/5 strength in all planes\n✓ No pain with daily activities\n✓ 16 weeks post-op minimum\n\n**⚠️ PRECAUTIONS:**\n• Light resistance only (bands/1-3 lb)\n• No overhead lifting > 10 lbs'),
  (v_rcr_g1_id, 5, v_rcr_p5, 1, 3, 15, 'Daily', E'**PHASE 5: Return to Activity (Weeks 16+)**\n\n**Goals:**\n• Full strength\n• Return to sport/work\n• Maintenance program\n\n**ACTIVITY GUIDELINES:**\n✓ CLEARED: Swimming, golf, light tennis\n⚠️ ASK SURGEON: Overhead sports, heavy lifting\n❌ AVOID: Contact sports (discuss with surgeon)\n\n**MAINTENANCE:**\n• Continue rotator cuff exercises 2-3x/week\n• Warm up before activities\n• Ice after intense activity if needed')
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET phase_notes = EXCLUDED.phase_notes;

  -- Grade 2 (Medium Tear) - Standard progression
  INSERT INTO protocol_phase_exercises (protocol_id, phase_number, exercise_id, display_order, phase_sets, phase_reps, phase_frequency, phase_notes)
  VALUES
  (v_rcr_g2_id, 1, v_rcr_p1, 1, 2, 10, '3x daily', E'**PHASE 1: Maximum Protection (Weeks 0-6)**\n\n**Goals:**\n• Protect surgical repair\n• Control pain and swelling\n• Maintain elbow/wrist ROM\n• Begin passive shoulder ROM\n\n**TO PROGRESS TO PHASE 2:**\n✓ Pain ≤ 3/10 at rest\n✓ Minimal swelling\n✓ Passive forward flexion to 120°\n✓ Passive external rotation to 30°\n✓ 6 weeks post-op minimum\n\n**⚠️ CONTACT SURGEON IF:**\n• Sudden increase in pain\n• New numbness/tingling in arm\n• Signs of infection\n• Unable to perform passive ROM'),
  (v_rcr_g2_id, 2, v_rcr_p2, 1, 2, 10, '2-3x daily', E'**PHASE 2: Protected Motion (Weeks 6-10)**\n\n**Goals:**\n• Progress to active-assisted ROM\n• Begin weaning from sling\n• Improve scapular control\n\n**TO PROGRESS TO PHASE 3:**\n✓ Pain-free AAROM\n✓ AAROM forward flexion to 140°\n✓ AAROM external rotation to 45°\n✓ Good scapular mechanics\n✓ 10 weeks post-op minimum\n\n**⚠️ PRECAUTIONS:**\n• No active shoulder motion yet\n• No lifting objects\n• Continue sling in crowds'),
  (v_rcr_g2_id, 3, v_rcr_p3, 1, 3, 10, '2x daily', E'**PHASE 3: Active Motion (Weeks 10-14)**\n\n**Goals:**\n• Achieve full active ROM\n• Begin gentle isometrics\n• Discontinue sling\n\n**TO PROGRESS TO PHASE 4:**\n✓ Full active ROM (equal to opposite side)\n✓ Pain-free daily activities\n✓ Good scapular control with movement\n✓ 14 weeks post-op minimum\n\n**⚠️ PRECAUTIONS:**\n• No resistance training yet\n• No lifting > 5 lbs'),
  (v_rcr_g2_id, 4, v_rcr_p4, 1, 3, 12, 'Daily', E'**PHASE 4: Strengthening (Weeks 14-20)**\n\n**Goals:**\n• Progressive rotator cuff strengthening\n• Scapular strengthening\n• Return to light activities\n\n**TO PROGRESS TO PHASE 5:**\n✓ Pain-free strengthening exercises\n✓ 4/5 strength in all planes\n✓ No pain with daily activities\n✓ 20 weeks post-op minimum\n\n**⚠️ PRECAUTIONS:**\n• Light resistance only (bands/1-3 lb)\n• No overhead lifting > 10 lbs'),
  (v_rcr_g2_id, 5, v_rcr_p5, 1, 3, 15, 'Daily', E'**PHASE 5: Return to Activity (Weeks 20+)**\n\n**Goals:**\n• Full strength\n• Return to sport/work\n• Maintenance program\n\n**ACTIVITY GUIDELINES:**\n✓ CLEARED: Swimming, golf, light tennis\n⚠️ ASK SURGEON: Overhead sports, heavy lifting\n❌ AVOID: Contact sports (discuss with surgeon)\n\n**MAINTENANCE:**\n• Continue rotator cuff exercises 2-3x/week\n• Warm up before activities\n• Ice after intense activity if needed')
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET phase_notes = EXCLUDED.phase_notes;

  -- Grade 3 (Large/Massive Tear) - Slower progression
  INSERT INTO protocol_phase_exercises (protocol_id, phase_number, exercise_id, display_order, phase_sets, phase_reps, phase_frequency, phase_notes)
  VALUES
  (v_rcr_g3_id, 1, v_rcr_p1, 1, 2, 10, '3x daily', E'**PHASE 1: Maximum Protection (Weeks 0-8)**\n\n**Goals:**\n• Protect surgical repair - CRITICAL for large tears\n• Control pain and swelling\n• Maintain elbow/wrist ROM\n• Begin gentle passive shoulder ROM\n\n**TO PROGRESS TO PHASE 2:**\n✓ Pain ≤ 3/10 at rest\n✓ Minimal swelling\n✓ Passive forward flexion to 100-120°\n✓ Passive external rotation to 20-30°\n✓ 8 weeks post-op minimum\n✓ Surgeon clearance required\n\n**⚠️ CONTACT SURGEON IF:**\n• Sudden increase in pain\n• New numbness/tingling\n• Signs of infection\n• Any popping or giving way sensation'),
  (v_rcr_g3_id, 2, v_rcr_p2, 1, 2, 10, '2-3x daily', E'**PHASE 2: Protected Motion (Weeks 8-12)**\n\n**Goals:**\n• Progress to active-assisted ROM SLOWLY\n• Begin weaning from sling\n• Improve scapular control\n\n**TO PROGRESS TO PHASE 3:**\n✓ Pain-free AAROM\n✓ AAROM forward flexion to 130-140°\n✓ AAROM external rotation to 40°\n✓ Good scapular mechanics\n✓ 12 weeks post-op minimum\n\n**⚠️ PRECAUTIONS:**\n• NO active shoulder motion\n• NO lifting anything\n• Continue sling protection\n• Large tears need MORE time'),
  (v_rcr_g3_id, 3, v_rcr_p3, 1, 3, 10, '2x daily', E'**PHASE 3: Active Motion (Weeks 12-18)**\n\n**Goals:**\n• Achieve full active ROM gradually\n• Begin gentle isometrics\n• Discontinue sling\n\n**TO PROGRESS TO PHASE 4:**\n✓ Near-full active ROM\n✓ Pain-free daily activities\n✓ Good scapular control with movement\n✓ 18 weeks post-op minimum\n✓ Surgeon clearance\n\n**⚠️ PRECAUTIONS:**\n• NO resistance training\n• NO lifting > 2 lbs\n• Large repairs heal slower - be patient'),
  (v_rcr_g3_id, 4, v_rcr_p4, 1, 3, 10, 'Daily', E'**PHASE 4: Strengthening (Weeks 18-26)**\n\n**Goals:**\n• GENTLE progressive strengthening\n• Scapular strengthening\n• Return to light activities\n\n**TO PROGRESS TO PHASE 5:**\n✓ Pain-free strengthening exercises\n✓ 4/5 strength (may not achieve full)\n✓ No pain with daily activities\n✓ 26 weeks (6 months) post-op minimum\n\n**⚠️ PRECAUTIONS:**\n• Very light resistance only\n• NO overhead lifting > 5 lbs\n• Expect longer recovery for large tears'),
  (v_rcr_g3_id, 5, v_rcr_p5, 1, 3, 12, 'Daily', E'**PHASE 5: Return to Activity (Weeks 26+)**\n\n**Goals:**\n• Maximize strength (may have some limitation)\n• Return to modified activities\n• Lifetime maintenance program\n\n**ACTIVITY GUIDELINES:**\n✓ CLEARED: Swimming, light recreational activities\n⚠️ CAUTION: Golf, tennis (discuss with surgeon)\n❌ AVOID: Heavy overhead work, contact sports\n\n**IMPORTANT FOR LARGE REPAIRS:**\n• Full recovery may take 9-12 months\n• Some strength limitation may persist\n• Continue maintenance exercises PERMANENTLY\n• Annual follow-up with surgeon')
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET phase_notes = EXCLUDED.phase_notes;

  -- ========================================
  -- ACL RECONSTRUCTION
  -- ========================================
  INSERT INTO protocol_phase_exercises (protocol_id, phase_number, exercise_id, display_order, phase_sets, phase_reps, phase_frequency, phase_notes)
  VALUES
  (v_acl_id, 1, v_acl_p1, 1, 2, 10, '4-6x daily', E'**PHASE 1: Protection (Weeks 0-2)**\n\n**Goals:**\n• Control swelling\n• Achieve full knee extension (CRITICAL)\n• Restore quad activation\n• Weight bearing as tolerated\n\n**TO PROGRESS TO PHASE 2:**\n✓ Full passive knee extension (0°)\n✓ Flexion to 90°\n✓ Good quad contraction (can do SLR without lag)\n✓ Minimal swelling\n✓ Can walk with minimal limp using crutches\n\n**⚠️ RED FLAGS - CONTACT SURGEON:**\n• Cannot achieve full extension\n• Calf pain/swelling (possible DVT)\n• Fever or wound drainage\n• Knee feels unstable'),
  (v_acl_id, 2, v_acl_p2, 1, 3, 10, '2x daily', E'**PHASE 2: Early Strengthening (Weeks 2-6)**\n\n**Goals:**\n• Full ROM (0-130°)\n• Normalize gait pattern\n• Progress closed-chain strengthening\n• Improve balance\n\n**TO PROGRESS TO PHASE 3:**\n✓ Full ROM\n✓ Walking without limp\n✓ Can walk without crutches\n✓ Single leg balance > 30 sec\n✓ No swelling after activity\n\n**⚠️ PRECAUTIONS:**\n• Avoid open chain knee extension 0-45°\n• No running or jumping\n• No pivoting or cutting'),
  (v_acl_id, 3, v_acl_p3, 1, 3, 12, 'Daily', E'**PHASE 3: Progressive Strengthening (Weeks 6-12)**\n\n**Goals:**\n• Build quad and hamstring strength\n• Advance balance/proprioception\n• Begin sport-specific movements\n• Start jogging program (if cleared)\n\n**TO PROGRESS TO PHASE 4:**\n✓ Quad strength > 70% of other leg\n✓ Single leg squat with good control\n✓ Can jog pain-free\n✓ No instability\n✓ 12 weeks post-op minimum\n\n**⚠️ PRECAUTIONS:**\n• No cutting or pivoting\n• No sport participation\n• Progress running gradually'),
  (v_acl_id, 4, v_acl_p4, 1, 3, 15, 'Daily', E'**PHASE 4: Return to Sport (Weeks 12+)**\n\n**Goals:**\n• Achieve full strength (>90% of other leg)\n• Complete agility progression\n• Pass return-to-sport testing\n• Sport-specific training\n\n**RETURN TO SPORT CRITERIA:**\n✓ Quad strength > 90% of other leg\n✓ Hop test > 90% of other leg\n✓ No pain or swelling\n✓ Full confidence in knee\n✓ Passed functional testing\n✓ Minimum 9 months post-op (typically)\n\n**⚠️ IMPORTANT:**\n• Most surgeons require 9-12 months before return\n• ACL re-tear risk highest in first 2 years\n• Continue prevention exercises after return\n• Consider sport brace initially')
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET phase_notes = EXCLUDED.phase_notes;

  -- ========================================
  -- TOTAL SHOULDER ARTHROPLASTY
  -- ========================================
  INSERT INTO protocol_phase_exercises (protocol_id, phase_number, exercise_id, display_order, phase_sets, phase_reps, phase_frequency, phase_notes)
  VALUES
  (v_tsa_id, 1, v_tsa_p1, 1, 2, 10, '3x daily', E'**PHASE 1: Protection (Weeks 0-6)**\n\n**Goals:**\n• Protect surgical repair\n• Control pain and swelling\n• Begin gentle passive ROM\n• Maintain elbow/wrist mobility\n\n**TO PROGRESS TO PHASE 2:**\n✓ Pain ≤ 3/10 at rest\n✓ Passive forward flexion to 120°\n✓ Passive external rotation to 30°\n✓ 6 weeks post-op\n\n**⚠️ STRICT PRECAUTIONS:**\n• NO active shoulder motion\n• NO lifting anything\n• NO reaching behind back\n• Sling at all times except exercises\n• Sleep semi-reclined'),
  (v_tsa_id, 2, v_tsa_p2, 1, 2, 10, '2-3x daily', E'**PHASE 2: Active-Assisted Motion (Weeks 6-12)**\n\n**Goals:**\n• Progress to AAROM\n• Begin weaning from sling\n• Improve scapular control\n\n**TO PROGRESS TO PHASE 3:**\n✓ AAROM forward flexion to 140°\n✓ AAROM external rotation to 45°\n✓ Pain-free movement\n✓ Good scapular mechanics\n✓ 12 weeks post-op\n\n**⚠️ PRECAUTIONS:**\n• No resistance exercises\n• No lifting\n• May discontinue sling at 6-8 weeks'),
  (v_tsa_id, 3, v_tsa_p3, 1, 3, 10, '2x daily', E'**PHASE 3: Active Motion & Early Strengthening (Weeks 12-16)**\n\n**Goals:**\n• Full active ROM\n• Begin light strengthening\n• Return to light daily activities\n\n**TO PROGRESS TO PHASE 4:**\n✓ Full active ROM\n✓ Pain-free movement\n✓ Can perform ADLs independently\n✓ 16 weeks post-op\n\n**⚠️ PRECAUTIONS:**\n• Light resistance only\n• No lifting > 5-10 lbs\n• Avoid repetitive overhead activities'),
  (v_tsa_id, 4, v_tsa_p4, 1, 3, 12, 'Daily', E'**PHASE 4: Progressive Strengthening (Weeks 16+)**\n\n**Goals:**\n• Progressive strengthening\n• Return to recreational activities\n• Establish maintenance program\n\n**ACTIVITY GUIDELINES:**\n✓ SAFE: Swimming, golf, light tennis, daily activities\n⚠️ DISCUSS: Overhead sports, heavy yard work\n❌ LIFETIME PRECAUTIONS:\n• No lifting > 25-50 lbs overhead\n• No contact sports\n• Avoid high-impact repetitive activities\n\n**MAINTENANCE:**\n• Continue strengthening 2-3x/week\n• Annual follow-up with surgeon\n• Protect your replacement for life')
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET phase_notes = EXCLUDED.phase_notes;

  -- ========================================
  -- TOTAL HIP ARTHROPLASTY - ANTERIOR
  -- ========================================
  INSERT INTO protocol_phase_exercises (protocol_id, phase_number, exercise_id, display_order, phase_sets, phase_reps, phase_frequency, phase_notes)
  VALUES
  (v_tha_ant_id, 1, v_tha_ant_p1, 1, 2, 10, '3x daily', E'**PHASE 1: Early Mobility (Weeks 0-2)**\n\n**Goals:**\n• Weight bearing as tolerated (typically)\n• Normalize gait with walker\n• Control swelling\n• Maintain ROM\n\n**TO PROGRESS TO PHASE 2:**\n✓ Walking with walker, minimal limp\n✓ Pain ≤ 4/10 with activity\n✓ Can do transfers independently\n✓ 2 weeks post-op\n\n**ANTERIOR APPROACH BENEFITS:**\n• Fewer hip precautions than posterior\n• Faster return to activities\n• Still avoid extremes of motion\n\n**⚠️ PRECAUTIONS:**\n• Avoid excessive hip extension\n• Don''t pivot on surgical leg\n• Use walker as instructed'),
  (v_tha_ant_id, 2, v_tha_ant_p2, 1, 3, 10, '2x daily', E'**PHASE 2: Strengthening (Weeks 2-6)**\n\n**Goals:**\n• Progress to cane\n• Build hip strength\n• Normalize gait pattern\n• Improve balance\n\n**TO PROGRESS TO PHASE 3:**\n✓ Walking with cane or no device\n✓ Normal gait pattern\n✓ Good hip strength (can do SLR easily)\n✓ Stairs reciprocally with rail\n✓ 6 weeks post-op\n\n**⚠️ PRECAUTIONS:**\n• Continue avoiding extremes\n• No high-impact activities\n• May begin stationary bike'),
  (v_tha_ant_id, 3, v_tha_ant_p3, 1, 3, 12, 'Daily', E'**PHASE 3: Return to Activity (Weeks 6+)**\n\n**Goals:**\n• Full strength and endurance\n• Return to recreational activities\n• Establish maintenance program\n\n**ACTIVITY GUIDELINES:**\n✓ SAFE: Walking, swimming, cycling, golf, doubles tennis\n⚠️ DISCUSS: Hiking, skiing, singles tennis\n❌ LIFETIME PRECAUTIONS:\n• Avoid high-impact sports (running, basketball)\n• No contact sports\n• Maintain healthy weight\n\n**MAINTENANCE:**\n• Continue hip strengthening 2-3x/week\n• Stay active with low-impact activities\n• Annual follow-up with surgeon\n• Most replacements last 20+ years with proper care')
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET phase_notes = EXCLUDED.phase_notes;

  -- ========================================
  -- TOTAL HIP ARTHROPLASTY - POSTERIOR
  -- ========================================
  INSERT INTO protocol_phase_exercises (protocol_id, phase_number, exercise_id, display_order, phase_sets, phase_reps, phase_frequency, phase_notes)
  VALUES
  (v_tha_post_id, 1, v_tha_post_p1, 1, 2, 10, '3x daily', E'**PHASE 1: Protection with STRICT HIP PRECAUTIONS (Weeks 0-6)**\n\n**⚠️⚠️ CRITICAL HIP PRECAUTIONS ⚠️⚠️**\n• NO hip flexion past 90°\n• NO crossing legs or ankles\n• NO internal rotation (turning toes inward)\n• NO bending forward past 90°\n\n**Goals:**\n• Protect the hip from dislocation\n• Weight bearing as prescribed\n• Maintain mobility within precautions\n\n**REQUIRED EQUIPMENT:**\n• Raised toilet seat\n• Shower chair\n• Reacher/grabber\n• Long-handled shoe horn\n• Pillow between legs when sleeping\n\n**TO PROGRESS:**\n✓ Following all precautions consistently\n✓ Walking safely with assistive device\n✓ 6-12 weeks post-op (surgeon dependent)\n✓ Surgeon clearance to reduce precautions\n\n**⚠️ DISLOCATION SIGNS - ER IMMEDIATELY:**\n• Sudden severe pain\n• Leg appears shorter\n• Leg rotated outward\n• Unable to bear weight')
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET phase_notes = EXCLUDED.phase_notes;

  -- ========================================
  -- MENISCUS REPAIR
  -- ========================================
  INSERT INTO protocol_phase_exercises (protocol_id, phase_number, exercise_id, display_order, phase_sets, phase_reps, phase_frequency, phase_notes)
  VALUES
  (v_meniscus_id, 1, v_meniscus_p1, 1, 2, 10, '4x daily', E'**PHASE 1: Protection (Weeks 0-6)**\n\n**Goals:**\n• Protect the meniscus repair\n• Maintain quad activation\n• Control swelling\n• Limited ROM as prescribed\n\n**⚠️ CRITICAL - FOLLOW SURGEON PROTOCOL:**\n• Weight bearing: varies (NWB to WBAT)\n• ROM limits: typically 0-90° initially\n• Brace: usually locked for walking\n\n**TO PROGRESS TO PHASE 2:**\n✓ 6 weeks post-op minimum\n✓ Following WB and ROM restrictions\n✓ Good quad control\n✓ Minimal swelling\n✓ Surgeon clearance\n\n**⚠️ PRECAUTIONS:**\n• NO deep squatting\n• NO twisting on the knee\n• NO full flexion loading\n• Meniscus repairs need TIME to heal'),
  (v_meniscus_id, 2, v_meniscus_p2, 1, 3, 10, '2x daily', E'**PHASE 2: Progressive Loading (Weeks 6-12)**\n\n**Goals:**\n• Progress ROM gradually\n• Begin strengthening\n• Wean from brace\n• Normalize gait\n\n**TO PROGRESS:**\n✓ Full ROM achieved\n✓ Walking without limp\n✓ Good quad strength\n✓ No swelling after activity\n✓ 12 weeks post-op\n\n**⚠️ PRECAUTIONS:**\n• Progress ROM slowly\n• Avoid deep squat loading\n• No pivoting or cutting\n• No impact activities\n\n**RETURN TO ACTIVITY:**\n• Most return to sport 4-6 months\n• Functional testing required\n• Higher re-tear risk than meniscectomy')
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET phase_notes = EXCLUDED.phase_notes;

  -- ========================================
  -- ACHILLES TENDON REPAIR
  -- ========================================
  INSERT INTO protocol_phase_exercises (protocol_id, phase_number, exercise_id, display_order, phase_sets, phase_reps, phase_frequency, phase_notes)
  VALUES
  (v_achilles_id, 1, v_achilles_p1, 1, 2, 10, '3x daily', E'**PHASE 1: Maximum Protection (Weeks 0-6)**\n\n**Goals:**\n• Protect the repair\n• Control swelling\n• Maintain ankle mobility within boot\n\n**⚠️ STRICT PRECAUTIONS:**\n• Boot at ALL times (including sleep)\n• NWB or PWB as prescribed\n• NO dorsiflexion (pulling toes up)\n• NO walking without boot\n\n**TO PROGRESS TO PHASE 2:**\n✓ 6 weeks post-op\n✓ Following all precautions\n✓ Wound healed\n✓ Surgeon clearance\n\n**⚠️ RED FLAGS - CONTACT SURGEON:**\n• Sudden pop or snap\n• Increase in pain\n• Wound drainage\n• Calf swelling (DVT risk)'),
  (v_achilles_id, 2, v_achilles_p2, 1, 2, 10, '2-3x daily', E'**PHASE 2: Progressive Weight Bearing (Weeks 6-12)**\n\n**Goals:**\n• Progress to full weight bearing in boot\n• Begin gentle ROM\n• Gradual wedge removal\n\n**TO PROGRESS TO PHASE 3:**\n✓ Full weight bearing in boot\n✓ All wedges removed\n✓ Gentle plantarflexion ROM\n✓ 12 weeks post-op\n✓ Surgeon clearance to transition from boot\n\n**⚠️ PRECAUTIONS:**\n• NO aggressive stretching\n• NO heel raises yet\n• Keep boot on for walking\n• Progress gradually'),
  (v_achilles_id, 3, v_achilles_p3, 1, 3, 10, 'Daily', E'**PHASE 3: Strengthening (Weeks 12+)**\n\n**Goals:**\n• Transition out of boot\n• Progressive calf strengthening\n• Normalize gait\n• Return to activities\n\n**PROGRESSION:**\n• Heel lift in shoe initially\n• Progress from bilateral to single leg heel raises\n• Begin walking program\n• Stationary bike for cardio\n\n**RETURN TO RUNNING:**\n• Typically 6+ months post-op\n• Must have full ROM\n• Single leg heel raise x 20\n• No pain with hopping\n\n**⚠️ LIFETIME CONSIDERATIONS:**\n• Re-rupture risk highest in first year\n• May never achieve full push-off strength\n• Continue calf strengthening long-term\n• Warm up before activities')
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET phase_notes = EXCLUDED.phase_notes;

  -- ========================================
  -- DISTAL BICEPS REPAIR
  -- ========================================
  INSERT INTO protocol_phase_exercises (protocol_id, phase_number, exercise_id, display_order, phase_sets, phase_reps, phase_frequency, phase_notes)
  VALUES
  (v_biceps_id, 1, v_biceps_p1, 1, 2, 10, '2-3x daily', E'**DISTAL BICEPS REPAIR REHABILITATION**\n\n**PHASE 1: Protection (Weeks 0-2)**\n• Sling for comfort\n• Gentle elbow/wrist ROM (no resistance)\n• NO resisted elbow flexion or supination\n\n**PHASE 2: Early Motion (Weeks 2-6)**\n• Progress ROM\n• Continue avoiding resistance\n• May begin gentle grip strengthening\n\n**PHASE 3: Early Strengthening (Weeks 6-10)**\n• Begin gentle resisted flexion\n• Progress supination gradually\n• Light resistance only\n\n**PHASE 4: Progressive Strengthening (Weeks 10-16)**\n• Progressive resistance training\n• Functional activities\n• Return to light lifting\n\n**TO RETURN TO FULL ACTIVITY:**\n✓ Full ROM\n✓ Strength > 80% of other arm\n✓ 4+ months post-op typically\n✓ Surgeon clearance\n\n**⚠️ PRECAUTIONS:**\n• NO heavy lifting for 4 months\n• Avoid sudden forceful flexion\n• Progress gradually\n• Re-rupture risk with early loading')
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET phase_notes = EXCLUDED.phase_notes;

  -- ========================================
  -- PCL RECONSTRUCTION
  -- ========================================
  INSERT INTO protocol_phase_exercises (protocol_id, phase_number, exercise_id, display_order, phase_sets, phase_reps, phase_frequency, phase_notes)
  VALUES
  (v_pcl_id, 1, v_pcl_p1, 1, 2, 10, '4x daily', E'**PHASE 1: Protection (Weeks 0-6)**\n\n**Goals:**\n• Protect the PCL graft\n• Restore quad activation (CRITICAL)\n• Control swelling\n• Begin gentle ROM\n\n**⚠️⚠️ CRITICAL PCL PRECAUTION ⚠️⚠️**\n**AVOID ALL HAMSTRING ACTIVATION**\n• NO active hamstring exercises\n• NO prone knee flexion\n• NO resisted hamstring curls\n• Hamstrings pull tibia backward = stress on PCL\n\n**TO PROGRESS TO PHASE 2:**\n✓ Pain ≤ 3/10\n✓ Full extension, flexion to 90°\n✓ Good quad activation\n✓ 6 weeks post-op\n\n**⚠️ CONTACT SURGEON IF:**\n• Knee feels unstable\n• Increased swelling\n• Unable to activate quads'),
  (v_pcl_id, 2, v_pcl_p2, 1, 3, 10, '2x daily', E'**PHASE 2: Progressive Motion (Weeks 6-12)**\n\n**Goals:**\n• Progress ROM to full\n• Quad strengthening emphasis\n• Begin closed-chain exercises\n• Wean from brace\n\n**TO PROGRESS TO PHASE 3:**\n✓ Full ROM\n✓ Good quad strength\n✓ Walking without limp\n✓ 12 weeks post-op\n\n**⚠️ CONTINUED PRECAUTIONS:**\n• Still avoid isolated hamstring exercises\n• No open chain hamstring curls\n• Closed chain exercises OK (squats, leg press)\n• Focus on QUAD strengthening'),
  (v_pcl_id, 3, v_pcl_p3, 1, 3, 12, 'Daily', E'**PHASE 3: Strengthening & Return to Activity (Weeks 12+)**\n\n**Goals:**\n• Progressive strengthening\n• Sport-specific training\n• Return to activity\n\n**RETURN TO SPORT CRITERIA:**\n✓ Full ROM\n✓ Quad strength > 85% of other leg\n✓ No instability\n✓ Passed functional testing\n✓ 6-9 months post-op typically\n\n**⚠️ LONG-TERM CONSIDERATIONS:**\n• PCL injuries may have some residual laxity\n• Continue quad strengthening permanently\n• May need brace for sport\n• Higher re-injury risk than ACL\n• Avoid positions of extreme flexion with load')
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET phase_notes = EXCLUDED.phase_notes;

  RAISE NOTICE 'Successfully linked all protocol exercises';
END $$;
