-- Seed Total Knee Arthroplasty (TKA) Protocol Exercises
-- Each phase has one comprehensive video with all exercises for that phase

-- First, insert the exercise videos for each phase
INSERT INTO exercise_videos (
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
  display_order,
  is_active
) VALUES
-- Phase 1: Protection Phase (Weeks 0-2)
(
  'BBAXDzXW-nc',
  'Total Knee Replacement - Phase 1 Exercises',
  'Phase 1 rehabilitation exercises for total knee replacement. Focus on reducing swelling, restoring quad activation, and beginning range of motion. Includes ankle pumps, quad sets, heel slides, and gentle knee extension stretches.',
  'Beginner',
  ARRAY['Knee'],
  ARRAY['Total Knee Replacement', 'TKA', 'Post-Op Knee', 'Knee Surgery'],
  ARRAY['knee replacement', 'TKA', 'post-op', 'phase 1', 'quad sets', 'ankle pumps', 'heel slides'],
  2,
  10,
  5,
  '3x daily',
  ARRAY['Active infection', 'DVT symptoms', 'Wound dehiscence'],
  ARRAY['Ice after exercises for 15-20 minutes', 'Keep leg elevated when resting', 'Use walker/crutches as instructed'],
  1,
  true
),
-- Phase 2: Early Strengthening (Weeks 2-6)
(
  'sWDjyBmh2N4',
  'Total Knee Replacement - Phase 2 Exercises',
  'Phase 2 rehabilitation exercises for total knee replacement. Progress to active range of motion and early strengthening. Includes short arc quads, standing exercises, mini squats, and low step-ups.',
  'Beginner',
  ARRAY['Knee'],
  ARRAY['Total Knee Replacement', 'TKA', 'Post-Op Knee', 'Knee Surgery'],
  ARRAY['knee replacement', 'TKA', 'post-op', 'phase 2', 'short arc quads', 'mini squats', 'step ups'],
  3,
  10,
  5,
  '2x daily',
  ARRAY['Active infection', 'Significant swelling increase', 'Pain greater than 6/10 during exercise'],
  ARRAY['May use resistance band for added challenge', 'Hold onto stable surface for standing exercises', 'Stop if sharp pain occurs'],
  2,
  true
),
-- Phase 3: Progressive Strengthening (Weeks 6-12)
(
  'EcU9ZwMDWQs',
  'Total Knee Replacement - Phase 3 Exercises',
  'Phase 3 rehabilitation exercises for total knee replacement. Focus on progressive strengthening and functional activities. Includes full squats, lunges, higher step-ups, stationary bike, and balance exercises.',
  'Intermediate',
  ARRAY['Knee'],
  ARRAY['Total Knee Replacement', 'TKA', 'Post-Op Knee', 'Knee Surgery'],
  ARRAY['knee replacement', 'TKA', 'post-op', 'phase 3', 'squats', 'lunges', 'balance', 'bike'],
  3,
  12,
  NULL,
  'Daily',
  ARRAY['Unstable knee', 'Significant effusion', 'Pain greater than 5/10 at rest'],
  ARRAY['Use mirror to check form', 'Progress resistance gradually', 'Stationary bike: start with minimal resistance'],
  3,
  true
),
-- Phase 4: Return to Activity (Weeks 12+)
(
  '0ChA291UHiw',
  'Total Knee Replacement - Phase 4 Exercises',
  'Phase 4 rehabilitation exercises for total knee replacement. Advanced strengthening and return to recreational activities. Includes single-leg exercises, dynamic balance, sport-specific movements, and light plyometrics.',
  'Advanced',
  ARRAY['Knee'],
  ARRAY['Total Knee Replacement', 'TKA', 'Post-Op Knee', 'Knee Surgery'],
  ARRAY['knee replacement', 'TKA', 'post-op', 'phase 4', 'single leg', 'plyometrics', 'sports', 'return to activity'],
  3,
  15,
  NULL,
  'Daily',
  ARRAY['Knee instability', 'Persistent swelling', 'Pain with weight bearing'],
  ARRAY['Clear with surgeon before high-impact activities', 'Warm up thoroughly before exercises', 'Listen to your body - some discomfort is normal but sharp pain is not'],
  4,
  true
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
  display_order = EXCLUDED.display_order;

-- Now link these exercises to the Total Knee Replacement protocol phases
-- First, get the protocol ID and exercise IDs, then insert into junction table

DO $$
DECLARE
  v_protocol_id UUID;
  v_phase1_exercise_id UUID;
  v_phase2_exercise_id UUID;
  v_phase3_exercise_id UUID;
  v_phase4_exercise_id UUID;
BEGIN
  -- Get the TKA protocol ID
  SELECT id INTO v_protocol_id
  FROM protocols
  WHERE protocol_key = 'knee_total_knee_replacement';

  IF v_protocol_id IS NULL THEN
    RAISE EXCEPTION 'Protocol knee_total_knee_replacement not found. Run protocol seed migration first.';
  END IF;

  -- Get exercise IDs
  SELECT id INTO v_phase1_exercise_id FROM exercise_videos WHERE youtube_video_id = 'BBAXDzXW-nc';
  SELECT id INTO v_phase2_exercise_id FROM exercise_videos WHERE youtube_video_id = 'sWDjyBmh2N4';
  SELECT id INTO v_phase3_exercise_id FROM exercise_videos WHERE youtube_video_id = 'EcU9ZwMDWQs';
  SELECT id INTO v_phase4_exercise_id FROM exercise_videos WHERE youtube_video_id = '0ChA291UHiw';

  -- Insert Phase 1 exercise with progression criteria
  INSERT INTO protocol_phase_exercises (
    protocol_id, phase_number, exercise_id, display_order,
    phase_sets, phase_reps, phase_hold_seconds, phase_frequency, phase_notes
  ) VALUES (
    v_protocol_id, 1, v_phase1_exercise_id, 1,
    2, 10, 5, '3x daily',
    E'**PHASE 1: Protection Phase (Weeks 0-2)**\n\n' ||
    E'**Goals:**\n' ||
    E'• Control swelling and pain\n' ||
    E'• Restore quadriceps activation\n' ||
    E'• Achieve 0° extension and 90° flexion\n' ||
    E'• Safe transfers and ambulation with walker\n\n' ||
    E'**TO PROGRESS TO PHASE 2, you must have:**\n' ||
    E'✓ Pain ≤ 4/10 at rest\n' ||
    E'✓ Minimal swelling (slight puffiness OK)\n' ||
    E'✓ Active quad contraction (can do straight leg raise without lag)\n' ||
    E'✓ ROM: Full extension (0°) and at least 90° flexion\n' ||
    E'✓ Independent with walker/crutches\n' ||
    E'✓ Wound healing well with no signs of infection\n\n' ||
    E'**⚠️ STOP AND CONTACT YOUR SURGEON IF:**\n' ||
    E'• Pain suddenly increases to 8/10 or higher\n' ||
    E'• Calf becomes red, hot, or significantly swollen (possible DVT)\n' ||
    E'• Fever above 101°F\n' ||
    E'• Wound drainage increases or becomes foul-smelling\n' ||
    E'• You cannot bear any weight as instructed'
  )
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET
    phase_sets = EXCLUDED.phase_sets,
    phase_reps = EXCLUDED.phase_reps,
    phase_hold_seconds = EXCLUDED.phase_hold_seconds,
    phase_frequency = EXCLUDED.phase_frequency,
    phase_notes = EXCLUDED.phase_notes;

  -- Insert Phase 2 exercise with progression criteria
  INSERT INTO protocol_phase_exercises (
    protocol_id, phase_number, exercise_id, display_order,
    phase_sets, phase_reps, phase_hold_seconds, phase_frequency, phase_notes
  ) VALUES (
    v_protocol_id, 2, v_phase2_exercise_id, 1,
    3, 10, 5, '2x daily',
    E'**PHASE 2: Early Strengthening (Weeks 2-6)**\n\n' ||
    E'**Goals:**\n' ||
    E'• Progress to active range of motion\n' ||
    E'• Build early quad and hip strength\n' ||
    E'• Achieve 0° extension and 110° flexion\n' ||
    E'• Wean from walker to cane (if cleared)\n' ||
    E'• Independent with daily activities\n\n' ||
    E'**TO PROGRESS TO PHASE 3, you must have:**\n' ||
    E'✓ Pain ≤ 3/10 during exercises\n' ||
    E'✓ Minimal to no swelling after activity\n' ||
    E'✓ ROM: Full extension (0°) and at least 110° flexion\n' ||
    E'✓ Can walk with cane or no assistive device\n' ||
    E'✓ Good quad strength (can do 10 straight leg raises easily)\n' ||
    E'✓ Can go up/down stairs with rail (step-to pattern OK)\n' ||
    E'✓ Surgeon clearance at follow-up visit\n\n' ||
    E'**⚠️ STOP AND CONTACT YOUR SURGEON IF:**\n' ||
    E'• Sharp pain during exercise that doesn''t resolve\n' ||
    E'• Knee feels unstable or gives way\n' ||
    E'• Significant increase in swelling after exercises\n' ||
    E'• Unable to straighten knee fully\n' ||
    E'• Popping or clicking with pain'
  )
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET
    phase_sets = EXCLUDED.phase_sets,
    phase_reps = EXCLUDED.phase_reps,
    phase_hold_seconds = EXCLUDED.phase_hold_seconds,
    phase_frequency = EXCLUDED.phase_frequency,
    phase_notes = EXCLUDED.phase_notes;

  -- Insert Phase 3 exercise with progression criteria
  INSERT INTO protocol_phase_exercises (
    protocol_id, phase_number, exercise_id, display_order,
    phase_sets, phase_reps, phase_hold_seconds, phase_frequency, phase_notes
  ) VALUES (
    v_protocol_id, 3, v_phase3_exercise_id, 1,
    3, 12, NULL, 'Daily',
    E'**PHASE 3: Progressive Strengthening (Weeks 6-12)**\n\n' ||
    E'**Goals:**\n' ||
    E'• Progressive lower extremity strengthening\n' ||
    E'• Achieve functional ROM (0-120° or greater)\n' ||
    E'• Normalize gait pattern (no limp)\n' ||
    E'• Stairs reciprocally (alternating feet)\n' ||
    E'• Return to low-impact activities\n\n' ||
    E'**TO PROGRESS TO PHASE 4, you must have:**\n' ||
    E'✓ Pain ≤ 2/10 with activities\n' ||
    E'✓ No swelling after prolonged activity\n' ||
    E'✓ ROM: 0-120° or greater\n' ||
    E'✓ Normal gait without assistive device\n' ||
    E'✓ Can climb stairs reciprocally\n' ||
    E'✓ Single leg stance > 30 seconds\n' ||
    E'✓ Good quad/hip strength (can do single leg squat with control)\n' ||
    E'✓ 12-week post-op surgeon clearance\n\n' ||
    E'**⚠️ STOP AND CONTACT YOUR SURGEON IF:**\n' ||
    E'• Pain increases with new activities\n' ||
    E'• Knee swells significantly after exercise\n' ||
    E'• Feeling of instability persists\n' ||
    E'• Unable to progress ROM despite consistent exercise\n' ||
    E'• Persistent night pain'
  )
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET
    phase_sets = EXCLUDED.phase_sets,
    phase_reps = EXCLUDED.phase_reps,
    phase_hold_seconds = EXCLUDED.phase_hold_seconds,
    phase_frequency = EXCLUDED.phase_frequency,
    phase_notes = EXCLUDED.phase_notes;

  -- Insert Phase 4 exercise with maintenance criteria
  INSERT INTO protocol_phase_exercises (
    protocol_id, phase_number, exercise_id, display_order,
    phase_sets, phase_reps, phase_hold_seconds, phase_frequency, phase_notes
  ) VALUES (
    v_protocol_id, 4, v_phase4_exercise_id, 1,
    3, 15, NULL, 'Daily',
    E'**PHASE 4: Return to Activity (Weeks 12+)**\n\n' ||
    E'**Goals:**\n' ||
    E'• Advanced strengthening and endurance\n' ||
    E'• Return to recreational activities\n' ||
    E'• Full, pain-free ROM\n' ||
    E'• Sport-specific training (if applicable)\n' ||
    E'• Long-term joint health maintenance\n\n' ||
    E'**ACTIVITY GUIDELINES:**\n' ||
    E'✓ LOW IMPACT SPORTS (Generally Safe):\n' ||
    E'  - Walking, hiking, swimming, cycling\n' ||
    E'  - Golf, doubles tennis, bowling\n' ||
    E'  - Elliptical, stationary bike\n\n' ||
    E'⚠️ HIGH IMPACT SPORTS (Discuss with Surgeon):\n' ||
    E'  - Running/jogging\n' ||
    E'  - Singles tennis, basketball\n' ||
    E'  - Skiing, high-impact aerobics\n\n' ||
    E'❌ GENERALLY NOT RECOMMENDED:\n' ||
    E'  - Contact sports (football, rugby)\n' ||
    E'  - High-impact jumping activities\n' ||
    E'  - Heavy squatting/leg press\n\n' ||
    E'**LONG-TERM MAINTENANCE:**\n' ||
    E'• Continue strengthening exercises 2-3x per week\n' ||
    E'• Maintain healthy weight to protect your joint\n' ||
    E'• Stay active with low-impact activities\n' ||
    E'• Annual follow-up with surgeon\n\n' ||
    E'**⚠️ CONTACT YOUR SURGEON IF:**\n' ||
    E'• New onset of pain or swelling\n' ||
    E'• Feeling of looseness or instability\n' ||
    E'• Grinding or catching sensation\n' ||
    E'• Decreased range of motion\n' ||
    E'• Any concerns about your knee replacement'
  )
  ON CONFLICT (protocol_id, phase_number, exercise_id) DO UPDATE SET
    phase_sets = EXCLUDED.phase_sets,
    phase_reps = EXCLUDED.phase_reps,
    phase_hold_seconds = EXCLUDED.phase_hold_seconds,
    phase_frequency = EXCLUDED.phase_frequency,
    phase_notes = EXCLUDED.phase_notes;

  RAISE NOTICE 'Successfully linked TKA exercises to protocol phases';
END $$;
