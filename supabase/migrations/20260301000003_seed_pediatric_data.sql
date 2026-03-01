-- Migration: Seed pediatric data (idempotent)
-- Date: 2026-03-01

-- ============================================
-- AGE GROUPS
-- ============================================
INSERT INTO pediatric_age_groups (age_key, display_name, min_months, max_months, display_order) VALUES
  ('0_3m',   '0–3 Months',   0,  3,  1),
  ('3_6m',   '3–6 Months',   3,  6,  2),
  ('6_9m',   '6–9 Months',   6,  9,  3),
  ('9_12m',  '9–12 Months',  9,  12, 4),
  ('12_18m', '12–18 Months', 12, 18, 5),
  ('18_24m', '18–24 Months', 18, 24, 6),
  ('2_3y',   '2–3 Years',    24, 36, 7),
  ('3_5y',   '3–5 Years',    36, 60, 8)
ON CONFLICT (age_key) DO NOTHING;

-- ============================================
-- CONCERNS
-- ============================================
INSERT INTO pediatric_concerns (concern_key, display_name, description, red_flags, display_order) VALUES
  ('torticollis', 'Torticollis',
   'Head tilt or preference to one side. Often noted in the first few months.',
   ARRAY['Facial asymmetry worsening', 'Hard lump in neck muscle', 'No improvement after 2 months of stretching'],
   1),
  ('positional_preference', 'Positional Preference',
   'Baby favors one side for lying, looking, or turning. May lead to flat spots on the skull.',
   ARRAY['Worsening skull asymmetry', 'Inability to turn head both directions'],
   2),
  ('low_tone', 'Low Muscle Tone (Hypotonia)',
   'Baby feels floppy or has difficulty holding positions against gravity.',
   ARRAY['Loss of previously gained skills', 'Difficulty feeding or swallowing', 'Persistent floppiness beyond 6 months'],
   3),
  ('poor_trunk_control', 'Poor Trunk Control',
   'Difficulty sitting upright or maintaining balance while seated.',
   ARRAY['Cannot prop sit by 6 months', 'Falls frequently without protective reactions', 'Asymmetric posture'],
   4),
  ('delayed_rolling', 'Delayed Rolling',
   'Not rolling by expected age. Rolling typically emerges between 4–6 months.',
   ARRAY['No rolling attempts by 7 months', 'Only rolls one direction', 'Stiffness when attempting to roll'],
   5),
  ('delayed_sitting', 'Delayed Sitting',
   'Not sitting independently by expected age. Independent sitting typically emerges by 6–9 months.',
   ARRAY['No sitting by 9 months', 'Uses hands for support beyond 8 months', 'W-sitting only'],
   6),
  ('delayed_crawling', 'Delayed Crawling',
   'Not crawling on hands and knees by expected age. Crawling typically emerges by 9–10 months.',
   ARRAY['Asymmetric crawling pattern', 'Dragging one side', 'No reciprocal limb movement'],
   7),
  ('delayed_walking', 'Delayed Walking',
   'Not walking independently by 15–18 months.',
   ARRAY['No independent steps by 18 months', 'Walking only on toes', 'Significant asymmetry when walking'],
   8),
  ('poor_transitions', 'Poor Transitions',
   'Difficulty moving between positions (e.g., lying to sitting, sitting to standing).',
   ARRAY['Cannot get to sitting from lying by 10 months', 'Always needs assistance to change positions'],
   9),
  ('weight_bearing_intolerance', 'Weight Bearing Intolerance',
   'Reluctance or inability to bear weight through legs when held in standing.',
   ARRAY['Legs collapse immediately', 'Refuses to place feet on surface', 'Legs remain stiff/scissored'],
   10),
  ('toe_walking', 'Toe Walking',
   'Walking on toes instead of flat feet. Common briefly after learning to walk but should resolve.',
   ARRAY['Persistent toe walking after age 2', 'Cannot put heels down voluntarily', 'Tight heel cords'],
   11),
  ('flat_feet', 'Flat Feet',
   'Absence of arch in foot. Normal in toddlers but may need attention if persistent with pain.',
   ARRAY['Pain with walking', 'Rapid shoe wear on inner edge', 'Stiffness in foot/ankle'],
   12),
  ('in_toeing', 'In-Toeing',
   'Feet turn inward when walking. Common in toddlers, often resolves on its own.',
   ARRAY['Persistent tripping', 'Worsening after age 3', 'Only one side affected'],
   13),
  ('out_toeing', 'Out-Toeing',
   'Feet turn outward when walking. May be related to hip rotation patterns.',
   ARRAY['Pain with walking', 'Significant asymmetry', 'Worsening over time'],
   14)
ON CONFLICT (concern_key) DO NOTHING;

-- ============================================
-- MILESTONES
-- ============================================

-- 0–3 Months
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order)
SELECT ag.id, vals.key, vals.name, vals.descr, vals.expected, vals.concern_by, vals.is_red, vals.ord
FROM pediatric_age_groups ag,
(VALUES
  ('0_3m_head_lift',    'Lifts head in prone',        'Able to lift head 45° during tummy time',           2, 3, false, 1),
  ('0_3m_hands_mouth',  'Brings hands to mouth',      'Discovers hands and brings them to midline/mouth',  3, 4, false, 2),
  ('0_3m_tummy_time',   'Tolerates tummy time',       'Can tolerate tummy time for short periods without distress', 2, 3, false, 3)
) AS vals(key, name, descr, expected, concern_by, is_red, ord)
WHERE ag.age_key = '0_3m'
ON CONFLICT (milestone_key) DO NOTHING;

-- 3–6 Months
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order)
SELECT ag.id, vals.key, vals.name, vals.descr, vals.expected, vals.concern_by, vals.is_red, vals.ord
FROM pediatric_age_groups ag,
(VALUES
  ('3_6m_rolls',          'Rolls over',              'Rolls from tummy to back and/or back to tummy',      5, 7, false, 1),
  ('3_6m_elbow_prop',     'Props on elbows',         'Supports upper body on elbows during tummy time',    4, 6, false, 2),
  ('3_6m_reaches',        'Reaches and grabs',       'Reaches for and grasps objects with one or both hands', 5, 6, false, 3),
  ('3_6m_supported_sit',  'Supported sitting',       'Sits with support, developing head and trunk control', 5, 7, false, 4)
) AS vals(key, name, descr, expected, concern_by, is_red, ord)
WHERE ag.age_key = '3_6m'
ON CONFLICT (milestone_key) DO NOTHING;

-- 6–9 Months
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order)
SELECT ag.id, vals.key, vals.name, vals.descr, vals.expected, vals.concern_by, vals.is_red, vals.ord
FROM pediatric_age_groups ag,
(VALUES
  ('6_9m_ind_sit',       'Independent sitting',     'Sits without support, can play with toys while sitting', 7, 9, false, 1),
  ('6_9m_pivots',        'Pivots in prone',         'Turns in a circle on tummy reaching for toys',          7, 9, false, 2),
  ('6_9m_hands_knees',   'Gets to hands and knees', 'Achieves quadruped (all fours) position',               8, 10, false, 3),
  ('6_9m_weight_bear',   'Bears weight standing',   'Supports weight through legs when held in standing',    7, 9, false, 4)
) AS vals(key, name, descr, expected, concern_by, is_red, ord)
WHERE ag.age_key = '6_9m'
ON CONFLICT (milestone_key) DO NOTHING;

-- 9–12 Months
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order)
SELECT ag.id, vals.key, vals.name, vals.descr, vals.expected, vals.concern_by, vals.is_red, vals.ord
FROM pediatric_age_groups ag,
(VALUES
  ('9_12m_crawls',       'Crawls',                   'Moves forward on hands and knees in reciprocal pattern', 10, 12, false, 1),
  ('9_12m_pulls_stand',  'Pulls to stand',            'Pulls up to standing using furniture',                   10, 12, false, 2),
  ('9_12m_cruises',      'Cruises along furniture',   'Walks sideways holding onto furniture',                  11, 13, false, 3)
) AS vals(key, name, descr, expected, concern_by, is_red, ord)
WHERE ag.age_key = '9_12m'
ON CONFLICT (milestone_key) DO NOTHING;

-- 12–18 Months
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order)
SELECT ag.id, vals.key, vals.name, vals.descr, vals.expected, vals.concern_by, vals.is_red, vals.ord
FROM pediatric_age_groups ag,
(VALUES
  ('12_18m_stands',  'Stands independently',   'Stands without holding onto anything for several seconds', 12, 15, false, 1),
  ('12_18m_walks',   'Walks independently',    'Takes independent steps and walks across the room',       14, 18, true,  2)
) AS vals(key, name, descr, expected, concern_by, is_red, ord)
WHERE ag.age_key = '12_18m'
ON CONFLICT (milestone_key) DO NOTHING;

-- 18–24 Months
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order)
SELECT ag.id, vals.key, vals.name, vals.descr, vals.expected, vals.concern_by, vals.is_red, vals.ord
FROM pediatric_age_groups ag,
(VALUES
  ('18_24m_runs',     'Runs',                   'Runs with a wide base, may be uncoordinated',          20, 24, false, 1),
  ('18_24m_stairs',   'Stairs with help',        'Walks up/down stairs holding railing or hand',         20, 24, false, 2),
  ('18_24m_jumps',    'Jump initiation',         'Begins to jump with both feet leaving the ground',     22, 26, false, 3)
) AS vals(key, name, descr, expected, concern_by, is_red, ord)
WHERE ag.age_key = '18_24m'
ON CONFLICT (milestone_key) DO NOTHING;

-- 2–3 Years
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order)
SELECT ag.id, vals.key, vals.name, vals.descr, vals.expected, vals.concern_by, vals.is_red, vals.ord
FROM pediatric_age_groups ag,
(VALUES
  ('2_3y_stairs_alt',  'Stairs alternating feet', 'Walks up stairs alternating feet (may hold rail)',  30, 36, false, 1),
  ('2_3y_jumps',       'Jumps forward',           'Jumps forward with both feet leaving the ground',   28, 34, false, 2),
  ('2_3y_kicks_ball',  'Kicks a ball',            'Kicks a ball forward without losing balance',       26, 30, false, 3)
) AS vals(key, name, descr, expected, concern_by, is_red, ord)
WHERE ag.age_key = '2_3y'
ON CONFLICT (milestone_key) DO NOTHING;

-- 3–5 Years
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order)
SELECT ag.id, vals.key, vals.name, vals.descr, vals.expected, vals.concern_by, vals.is_red, vals.ord
FROM pediatric_age_groups ag,
(VALUES
  ('3_5y_single_leg',  'Single leg balance',   'Balances on one foot for 3–5 seconds',               42, 48, false, 1),
  ('3_5y_hops',        'Hops on one foot',     'Hops forward on one foot several times',              48, 54, false, 2),
  ('3_5y_coord_run',   'Coordinated running',  'Runs with coordinated arm swing and narrow base',     42, 48, false, 3)
) AS vals(key, name, descr, expected, concern_by, is_red, ord)
WHERE ag.age_key = '3_5y'
ON CONFLICT (milestone_key) DO NOTHING;

-- ============================================
-- PLACEHOLDER EXERCISE VIDEOS (3–6 per top concern)
-- ============================================

-- Torticollis videos
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('0_3m', 'Gentle Neck Stretches for Torticollis',
   'Side-bending and rotation stretches to improve neck range of motion.',
   ARRAY['Hold stretch for 10–15 seconds', 'Perform during diaper changes', 'Use toys to encourage head turning'],
   ARRAY['Stop if baby is in distress', 'Never force the stretch', 'Support head and neck at all times'],
   1),
  ('0_3m', 'Tummy Time Positioning for Torticollis',
   'Tummy time positions that encourage turning toward the tight side.',
   ARRAY['Place toys on the tight side', 'Position yourself on the side baby needs to turn to', 'Use a rolled towel under chest if needed'],
   ARRAY['Always supervise tummy time', 'Stop if baby is overly fussy'],
   2),
  ('3_6m', 'Active Neck Range of Motion Activities',
   'Play-based activities to encourage active neck movement in both directions.',
   ARRAY['Use bright toys to attract attention', 'Sing or make sounds from the target side', 'Practice during feeding and play'],
   ARRAY['Follow your therapists guidance on frequency', 'Monitor for facial asymmetry changes'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'torticollis' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Low Tone videos
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('0_3m', 'Supported Tummy Time for Low Tone',
   'Gentle tummy time with support to build neck and shoulder strength.',
   ARRAY['Use a boppy or rolled towel for chest support', 'Start with short sessions', 'Gradually increase time as tolerated'],
   ARRAY['Always supervise', 'Watch for signs of fatigue'],
   1),
  ('3_6m', 'Supported Sitting Activities',
   'Activities to develop trunk control and postural strength while seated.',
   ARRAY['Use your legs or a boppy for support', 'Encourage reaching for toys', 'Slowly reduce support as baby improves'],
   ARRAY['Stay close to catch baby if they topple', 'Use soft surfaces'],
   2),
  ('6_9m', 'Hands and Knees Play for Core Strength',
   'Activities in quadruped to strengthen core, shoulders, and hips.',
   ARRAY['Place toys just out of reach', 'Gently support at hips if needed', 'Rock back and forth to build strength'],
   ARRAY['Use padded surface', 'Stop if baby becomes frustrated'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'low_tone' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Delayed Walking videos
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('9_12m', 'Pull to Stand Activities',
   'Fun ways to practice pulling up to standing at furniture.',
   ARRAY['Place motivating toys on couch or coffee table', 'Let baby use your hands for support initially', 'Encourage both sides equally'],
   ARRAY['Ensure furniture is stable', 'Pad sharp corners', 'Stay within arms reach'],
   1),
  ('9_12m', 'Cruising and Side-Stepping Practice',
   'Activities to encourage walking sideways along furniture.',
   ARRAY['Place toys along the length of furniture', 'Use push toys for support', 'Celebrate each step'],
   ARRAY['Clear path of obstacles', 'Use non-slip surfaces'],
   2),
  ('12_18m', 'Supported Walking Practice',
   'Transitioning from cruising to independent steps.',
   ARRAY['Hold one or both hands', 'Gradually reduce support', 'Walk between two adults'],
   ARRAY['Avoid baby walkers', 'Use supportive shoes outdoors only', 'Barefoot is best indoors'],
   3),
  ('12_18m', 'Balance and Standing Activities',
   'Games that challenge balance to build confidence for independent walking.',
   ARRAY['Stand at a small table with toys', 'Practice standing without holding on briefly', 'Blow bubbles to encourage reaching while standing'],
   ARRAY['Stay close for safety', 'Use soft surfaces for falls'],
   4)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'delayed_walking' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Delayed Crawling videos
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('6_9m', 'Quadruped Rocking and Reaching',
   'Building crawling readiness through rocking on hands and knees.',
   ARRAY['Place toys just out of reach', 'Gently support hips to maintain position', 'Rock forward and back rhythmically'],
   ARRAY['Use padded surface', 'Support baby if they collapse'],
   1),
  ('6_9m', 'Belly Crawling Encouragement',
   'Activities to encourage army crawling as a precursor to hands-and-knees crawling.',
   ARRAY['Place favorite toys just ahead', 'Provide a push surface at feet', 'Keep sessions fun and short'],
   ARRAY['Clear area of small objects', 'Supervise on elevated surfaces'],
   2),
  ('9_12m', 'Hands and Knees Obstacle Course',
   'Simple crawling courses to build strength and coordination.',
   ARRAY['Use pillows as obstacles to crawl over', 'Create tunnels with blankets', 'Crawl alongside your baby'],
   ARRAY['Remove hazards from crawl path', 'Supervise at all times'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'delayed_crawling' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Toe Walking videos
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('18_24m', 'Heel Walking Games',
   'Fun activities that encourage walking on heels to stretch calf muscles.',
   ARRAY['Walk like a penguin', 'Use stickers on heels as targets', 'Walk on heels to music'],
   ARRAY['If persistent toe walking, consult your pediatric PT', 'Do not force flat foot walking'],
   1),
  ('2_3y', 'Calf Stretching for Toddlers',
   'Playful stretches to improve ankle flexibility and reduce toe walking.',
   ARRAY['Squat play at a low table', 'Climb up small inclines', 'Bear walking (hands and feet)'],
   ARRAY['Consult PT if toe walking is rigid or painful', 'Monitor for regression'],
   2),
  ('2_3y', 'Flat Foot Walking Activities',
   'Games and exercises that promote heel-toe walking pattern.',
   ARRAY['Walk uphill', 'Stomp walk to music', 'Practice squatting to pick up toys'],
   ARRAY['Avoid high-heeled shoes', 'See PT if no improvement after consistent practice'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'toe_walking' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Delayed Sitting videos
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('3_6m', 'Supported Sitting Practice',
   'Activities to develop trunk strength and balance for sitting.',
   ARRAY['Sit baby between your legs for support', 'Use a Boppy pillow ring', 'Offer toys at chest height to encourage upright posture'],
   ARRAY['Never leave baby unattended in sitting', 'Use soft surfaces around baby'],
   1),
  ('6_9m', 'Tripod to Independent Sitting',
   'Transitioning from propping on hands to sitting without support.',
   ARRAY['Start in tripod (hands on floor) and entice with toys to lift hands', 'Sit on different surfaces for challenge', 'Practice protective reactions by gently tilting'],
   ARRAY['Surround with pillows during practice', 'Stay close to prevent falls'],
   2),
  ('6_9m', 'Sitting Balance Games',
   'Fun games to build sitting balance and protective reactions.',
   ARRAY['Roll a ball back and forth', 'Place toys to the side to encourage reaching', 'Sing action songs with gentle movements'],
   ARRAY['Keep sessions short and fun', 'Watch for fatigue signs'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'delayed_sitting' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;
