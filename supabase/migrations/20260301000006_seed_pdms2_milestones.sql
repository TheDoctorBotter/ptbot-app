-- Migration: Seed PDMS-2-based gross motor milestones
-- Date: 2026-03-01
-- Based on Peabody Developmental Motor Scales, Second Edition (PDMS-2)
-- Categories: reflexes (0-11m only), stationary, locomotion, object_manipulation (12m+)
--
-- Each milestone has a category, expected_by_month, age_equivalent_months (for scoring),
-- and is_red flag status.
-- Scoring: 0 = Cannot perform, 1 = Emerging/partial, 2 = Mastered
-- Age equivalency is calculated from the highest mastered item's age_equivalent_months.

-- ============================================
-- 0–3 MONTHS
-- ============================================
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order, category, age_equivalent_months)
SELECT ag.id, v.key, v.name, v.descr, v.expected, v.concern_by, v.is_red, v.ord, v.cat, v.age_eq
FROM pediatric_age_groups ag,
(VALUES
  -- Reflexes
  ('pdms_0_3m_stepping_reflex',    'Stepping reflex',               'When held upright with feet on surface, makes alternating stepping movements', 1, 2, false, 1, 'reflexes', 1),
  ('pdms_0_3m_atnr',              'ATNR present',                  'Asymmetric tonic neck reflex: when head turns, arm extends on face side', 1, 3, false, 2, 'reflexes', 1),
  ('pdms_0_3m_head_righting',     'Head righting reaction',        'When tilted to side, head rights itself to stay vertical', 2, 4, false, 3, 'reflexes', 2),

  -- Stationary
  ('pdms_0_3m_head_midline',      'Holds head in midline',         'On back, keeps head centered briefly without turning to one side', 1, 3, false, 4, 'stationary', 1),
  ('pdms_0_3m_head_45',           'Lifts head 45 degrees prone',   'On tummy, lifts head to 45 degrees and holds briefly', 2, 3, true, 5, 'stationary', 2),
  ('pdms_0_3m_head_90',           'Lifts head 90 degrees prone',   'On tummy, lifts head to 90 degrees with chest off surface', 3, 4, false, 6, 'stationary', 3),
  ('pdms_0_3m_forearm_prop',      'Props on forearms',             'On tummy, supports upper body on forearms with head up', 3, 5, false, 7, 'stationary', 3),

  -- Locomotion
  ('pdms_0_3m_kicks',             'Kicks legs reciprocally',       'On back, alternates kicking legs in a rhythmic pattern', 1, 3, false, 8, 'locomotion', 1),
  ('pdms_0_3m_rolls_side',        'Rolls to side',                 'Rolls from back to side-lying position', 3, 5, false, 9, 'locomotion', 3)
) AS v(key, name, descr, expected, concern_by, is_red, ord, cat, age_eq)
WHERE ag.age_key = '0_3m'
ON CONFLICT (milestone_key) DO NOTHING;

-- ============================================
-- 3–6 MONTHS
-- ============================================
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order, category, age_equivalent_months)
SELECT ag.id, v.key, v.name, v.descr, v.expected, v.concern_by, v.is_red, v.ord, v.cat, v.age_eq
FROM pediatric_age_groups ag,
(VALUES
  -- Reflexes
  ('pdms_3_6m_landau',            'Landau reflex',                 'When held in horizontal suspension, extends head, trunk, and legs', 4, 6, false, 1, 'reflexes', 4),
  ('pdms_3_6m_protective_fwd',    'Protective extension forward',  'When tipped forward, extends arms to catch self', 6, 8, false, 2, 'reflexes', 6),

  -- Stationary
  ('pdms_3_6m_extended_arms',     'Props on extended arms',        'On tummy, pushes up onto straight arms with chest fully off surface', 5, 7, false, 3, 'stationary', 5),
  ('pdms_3_6m_supported_sit',     'Sits with hand support',        'Sits on floor with hands on surface for support (tripod)', 5, 7, false, 4, 'stationary', 5),
  ('pdms_3_6m_holds_head_pull',   'Head control in pull to sit',   'Head stays in line with body when pulled to sitting — no head lag', 4, 6, true, 5, 'stationary', 4),

  -- Locomotion
  ('pdms_3_6m_rolls_back_tummy',  'Rolls back to tummy',          'Rolls completely from back to tummy', 5, 7, true, 6, 'locomotion', 5),
  ('pdms_3_6m_rolls_tummy_back',  'Rolls tummy to back',          'Rolls completely from tummy to back', 5, 7, false, 7, 'locomotion', 5),
  ('pdms_3_6m_pivots_prone',      'Pivots on tummy',              'Turns in a circle on tummy to reach toys', 6, 8, false, 8, 'locomotion', 6),
  ('pdms_3_6m_reaches_toys',      'Reaches for objects',           'Extends arm to grasp or bat at toys with purpose', 4, 6, false, 9, 'locomotion', 4)
) AS v(key, name, descr, expected, concern_by, is_red, ord, cat, age_eq)
WHERE ag.age_key = '3_6m'
ON CONFLICT (milestone_key) DO NOTHING;

-- ============================================
-- 6–9 MONTHS
-- ============================================
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order, category, age_equivalent_months)
SELECT ag.id, v.key, v.name, v.descr, v.expected, v.concern_by, v.is_red, v.ord, v.cat, v.age_eq
FROM pediatric_age_groups ag,
(VALUES
  -- Reflexes
  ('pdms_6_9m_protective_side',   'Protective extension sideways', 'When pushed to side while sitting, extends arm to catch self', 7, 9, false, 1, 'reflexes', 7),
  ('pdms_6_9m_righting_sit',      'Sitting righting reaction',     'When tilted in sitting, head and trunk right to stay upright', 7, 10, false, 2, 'reflexes', 7),

  -- Stationary
  ('pdms_6_9m_sits_independent',  'Sits independently',           'Sits without hand support for 30+ seconds, plays with toys', 7, 9, true, 3, 'stationary', 7),
  ('pdms_6_9m_sits_reaches',      'Sits and reaches',             'Maintains sitting balance while reaching for toys in all directions', 8, 10, false, 4, 'stationary', 8),
  ('pdms_6_9m_gets_to_sitting',   'Gets to sitting',              'Moves from lying or all-fours into a sitting position independently', 8, 10, false, 5, 'stationary', 8),

  -- Locomotion
  ('pdms_6_9m_belly_crawl',       'Belly crawls',                 'Moves forward on belly using arms, dragging legs (army crawl)', 7, 9, false, 6, 'locomotion', 7),
  ('pdms_6_9m_quadruped',         'Gets to hands and knees',      'Achieves hands-and-knees position and holds it', 8, 10, false, 7, 'locomotion', 8),
  ('pdms_6_9m_crawls',            'Crawls on hands and knees',    'Moves forward on hands and knees with alternating limb pattern', 9, 11, false, 8, 'locomotion', 9),
  ('pdms_6_9m_pulls_stand',       'Pulls to stand',               'Pulls up to standing using furniture or a person for support', 9, 12, false, 9, 'locomotion', 9),
  ('pdms_6_9m_wt_bear_stand',     'Bears weight in standing',     'Supports full weight through legs when held upright', 7, 9, true, 10, 'locomotion', 7)
) AS v(key, name, descr, expected, concern_by, is_red, ord, cat, age_eq)
WHERE ag.age_key = '6_9m'
ON CONFLICT (milestone_key) DO NOTHING;

-- ============================================
-- 9–12 MONTHS
-- ============================================
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order, category, age_equivalent_months)
SELECT ag.id, v.key, v.name, v.descr, v.expected, v.concern_by, v.is_red, v.ord, v.cat, v.age_eq
FROM pediatric_age_groups ag,
(VALUES
  -- Reflexes
  ('pdms_9_12m_protective_back',  'Protective extension backward', 'When pushed backward in sitting, extends arms behind to catch self', 10, 12, false, 1, 'reflexes', 10),

  -- Stationary
  ('pdms_9_12m_stands_support',   'Stands holding furniture',     'Stands at furniture holding on with one or two hands for 10+ seconds', 10, 12, false, 2, 'stationary', 10),
  ('pdms_9_12m_stands_brief',     'Stands momentarily alone',     'Stands independently for 1–3 seconds without holding on', 11, 13, false, 3, 'stationary', 11),
  ('pdms_9_12m_lowers_from_stand','Lowers from standing',          'Squats down from standing to pick up toy and returns to standing', 11, 14, false, 4, 'stationary', 11),

  -- Locomotion
  ('pdms_9_12m_cruises',          'Cruises along furniture',      'Walks sideways holding onto furniture, shifting weight side to side', 10, 12, false, 5, 'locomotion', 10),
  ('pdms_9_12m_walks_2_hands',    'Walks with two hands held',    'Walks forward with both hands held by an adult', 10, 13, false, 6, 'locomotion', 10),
  ('pdms_9_12m_walks_1_hand',     'Walks with one hand held',     'Walks forward with only one hand held by an adult', 11, 14, false, 7, 'locomotion', 11),
  ('pdms_9_12m_stands_alone',     'Stands independently 10 sec',  'Stands without any support for 10 or more seconds', 12, 14, true, 8, 'locomotion', 12)
) AS v(key, name, descr, expected, concern_by, is_red, ord, cat, age_eq)
WHERE ag.age_key = '9_12m'
ON CONFLICT (milestone_key) DO NOTHING;

-- ============================================
-- 12–18 MONTHS
-- ============================================
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order, category, age_equivalent_months)
SELECT ag.id, v.key, v.name, v.descr, v.expected, v.concern_by, v.is_red, v.ord, v.cat, v.age_eq
FROM pediatric_age_groups ag,
(VALUES
  -- Stationary
  ('pdms_12_18m_stands_10s',      'Stands 10+ seconds',           'Stands independently for 10 or more seconds with good balance', 12, 15, false, 1, 'stationary', 12),
  ('pdms_12_18m_stand_tiptoes',   'Stands on tiptoes',            'Rises up onto tiptoes and holds briefly while standing', 15, 18, false, 2, 'stationary', 15),
  ('pdms_12_18m_squats_play',     'Squats to play',               'Squats down to pick up a toy and returns to standing without falling', 13, 16, false, 3, 'stationary', 13),

  -- Locomotion
  ('pdms_12_18m_walks_alone',     'Walks independently',          'Takes multiple independent steps with a steady base', 13, 18, true, 4, 'locomotion', 13),
  ('pdms_12_18m_walks_backward',  'Walks backward',               'Takes several steps backward without falling', 15, 18, false, 5, 'locomotion', 15),
  ('pdms_12_18m_walks_sideways',  'Walks sideways',               'Takes several steps sideways without crossing feet', 16, 20, false, 6, 'locomotion', 16),
  ('pdms_12_18m_stoops_recovers', 'Stoops and recovers',          'Bends down to pick up object from floor without falling', 13, 16, false, 7, 'locomotion', 13),
  ('pdms_12_18m_stairs_creep',    'Creeps up stairs',             'Crawls up 2–3 stairs on hands and knees', 14, 18, false, 8, 'locomotion', 14),

  -- Object Manipulation (begins at 12m)
  ('pdms_12_18m_throws_ball',     'Throws ball forward',          'Throws a small ball forward in a standing position (any distance)', 14, 18, false, 9, 'object_manipulation', 14),
  ('pdms_12_18m_rolls_ball',      'Rolls ball to adult',          'Sits or squats and rolls a ball toward an adult', 13, 16, false, 10, 'object_manipulation', 13)
) AS v(key, name, descr, expected, concern_by, is_red, ord, cat, age_eq)
WHERE ag.age_key = '12_18m'
ON CONFLICT (milestone_key) DO NOTHING;

-- ============================================
-- 18–24 MONTHS
-- ============================================
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order, category, age_equivalent_months)
SELECT ag.id, v.key, v.name, v.descr, v.expected, v.concern_by, v.is_red, v.ord, v.cat, v.age_eq
FROM pediatric_age_groups ag,
(VALUES
  -- Stationary
  ('pdms_18_24m_stand_1ft_1s',    'Stands on one foot (1 sec)',   'Stands on one foot for 1 second with arms free', 22, 26, false, 1, 'stationary', 22),
  ('pdms_18_24m_walks_on_line',   'Walks on line',                'Walks forward along a line on the floor with general accuracy', 22, 26, false, 2, 'stationary', 22),
  ('pdms_18_24m_sits_small_chair','Sits on small chair',          'Lowers self onto a small chair and sits independently', 18, 22, false, 3, 'stationary', 18),

  -- Locomotion
  ('pdms_18_24m_runs',            'Runs',                         'Runs with a wide base, stopping with control', 20, 24, false, 4, 'locomotion', 20),
  ('pdms_18_24m_stairs_upright',  'Walks up stairs (hand held)',  'Walks up stairs in an upright position with one hand held or railing', 20, 24, false, 5, 'locomotion', 20),
  ('pdms_18_24m_stairs_down',     'Walks down stairs (hand held)','Walks down stairs with hand held or railing, placing both feet per step', 22, 26, false, 6, 'locomotion', 22),
  ('pdms_18_24m_jump_2ft',        'Jumps with both feet',         'Jumps with both feet leaving the ground simultaneously', 22, 28, false, 7, 'locomotion', 22),
  ('pdms_18_24m_walks_fast',      'Walks fast / hurried gait',    'Walks fast without running, maintaining balance', 19, 24, false, 8, 'locomotion', 19),

  -- Object Manipulation
  ('pdms_18_24m_kicks_fwd',       'Kicks ball forward',           'Kicks a stationary ball forward with one foot', 20, 24, false, 9, 'object_manipulation', 20),
  ('pdms_18_24m_throw_overhand',  'Throws ball overhand',         'Throws a small ball overhand in a forward direction', 22, 26, false, 10, 'object_manipulation', 22),
  ('pdms_18_24m_catches_body',    'Catches ball against body',    'Traps a large ball against chest/body when tossed from close range', 24, 28, false, 11, 'object_manipulation', 24)
) AS v(key, name, descr, expected, concern_by, is_red, ord, cat, age_eq)
WHERE ag.age_key = '18_24m'
ON CONFLICT (milestone_key) DO NOTHING;

-- ============================================
-- 2–3 YEARS
-- ============================================
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order, category, age_equivalent_months)
SELECT ag.id, v.key, v.name, v.descr, v.expected, v.concern_by, v.is_red, v.ord, v.cat, v.age_eq
FROM pediatric_age_groups ag,
(VALUES
  -- Stationary
  ('pdms_2_3y_stand_1ft_3s',      'Stands on one foot (3 sec)',   'Balances on one foot for 3 seconds', 30, 36, false, 1, 'stationary', 30),
  ('pdms_2_3y_stand_tiptoe_3s',   'Stands on tiptoes (3 sec)',    'Rises onto tiptoes and holds for 3 seconds', 28, 34, false, 2, 'stationary', 28),
  ('pdms_2_3y_walks_line_3ft',    'Walks along line (3 feet)',    'Walks forward on a line on the floor for at least 3 feet', 30, 36, false, 3, 'stationary', 30),
  ('pdms_2_3y_imitates_movements','Imitates gross motor actions', 'Copies demonstrated movements like arms up, squat, march', 26, 30, false, 4, 'stationary', 26),

  -- Locomotion
  ('pdms_2_3y_runs_coordinated',  'Runs with coordination',       'Runs with narrow base and reciprocal arm swing', 28, 34, false, 5, 'locomotion', 28),
  ('pdms_2_3y_jumps_forward',     'Jumps forward',                'Jumps forward with both feet, landing without falling', 28, 34, false, 6, 'locomotion', 28),
  ('pdms_2_3y_stairs_alt_up',     'Walks up stairs alternating',  'Walks up stairs with alternating feet (may hold rail)', 30, 36, false, 7, 'locomotion', 30),
  ('pdms_2_3y_stairs_down_both',  'Walks down stairs (both feet)','Walks down stairs placing both feet on each step independently', 28, 34, false, 8, 'locomotion', 28),
  ('pdms_2_3y_walks_backward_10', 'Walks backward 10 feet',       'Walks backward for at least 10 feet without looking', 26, 32, false, 9, 'locomotion', 26),
  ('pdms_2_3y_pedals_tricycle',   'Pedals tricycle',               'Pedals a tricycle forward for at least 10 feet', 30, 36, false, 10, 'locomotion', 30),

  -- Object Manipulation
  ('pdms_2_3y_kicks_roll_ball',   'Kicks rolling ball',           'Kicks a ball that is slowly rolling toward them', 28, 34, false, 11, 'object_manipulation', 28),
  ('pdms_2_3y_catches_bounce',    'Catches bounced ball',          'Catches a large ball that bounces once, using hands and body', 30, 36, false, 12, 'object_manipulation', 30),
  ('pdms_2_3y_throws_5ft',        'Throws ball 5 feet',            'Throws a small ball overhand at least 5 feet forward', 28, 34, false, 13, 'object_manipulation', 28)
) AS v(key, name, descr, expected, concern_by, is_red, ord, cat, age_eq)
WHERE ag.age_key = '2_3y'
ON CONFLICT (milestone_key) DO NOTHING;

-- ============================================
-- 3–5 YEARS
-- ============================================
INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order, category, age_equivalent_months)
SELECT ag.id, v.key, v.name, v.descr, v.expected, v.concern_by, v.is_red, v.ord, v.cat, v.age_eq
FROM pediatric_age_groups ag,
(VALUES
  -- Stationary
  ('pdms_3_5y_stand_1ft_5s',      'Stands on one foot (5 sec)',    'Balances on one foot for 5 seconds with arms free', 42, 48, false, 1, 'stationary', 42),
  ('pdms_3_5y_stand_1ft_10s',     'Stands on one foot (10 sec)',   'Balances on one foot for 10 seconds', 48, 54, false, 2, 'stationary', 48),
  ('pdms_3_5y_walks_beam',        'Walks on balance beam',         'Walks forward on a 4-inch wide beam for at least 4 feet', 42, 50, false, 3, 'stationary', 42),
  ('pdms_3_5y_tandem_walk',       'Tandem walks on line',          'Walks heel-to-toe along a line for at least 4 steps', 44, 52, false, 4, 'stationary', 44),
  ('pdms_3_5y_sits_up',           'Does a sit-up',                 'Performs a sit-up from lying on back with knees bent', 48, 56, false, 5, 'stationary', 48),

  -- Locomotion
  ('pdms_3_5y_hops_1ft_3x',      'Hops on one foot (3 times)',    'Hops forward on one foot 3 times without losing balance', 42, 50, false, 6, 'locomotion', 42),
  ('pdms_3_5y_hops_1ft_10x',     'Hops on one foot (10 times)',   'Hops forward on one foot 10 times consecutively', 54, 60, false, 7, 'locomotion', 54),
  ('pdms_3_5y_gallops',           'Gallops 10 feet',               'Gallops forward with a lead foot for at least 10 feet', 44, 52, false, 8, 'locomotion', 44),
  ('pdms_3_5y_skips',             'Skips',                         'Skips forward with alternating feet for at least 10 feet', 54, 60, false, 9, 'locomotion', 54),
  ('pdms_3_5y_stairs_alt_down',   'Walks down stairs alternating', 'Walks down stairs with alternating feet independently', 42, 48, false, 10, 'locomotion', 42),
  ('pdms_3_5y_jumps_over_obj',    'Jumps over object',             'Jumps over a small object (2–4 inches high) with two feet', 36, 44, false, 11, 'locomotion', 36),
  ('pdms_3_5y_broad_jump_2ft',    'Broad jumps 2 feet',            'Jumps forward at least 2 feet from standing', 48, 56, false, 12, 'locomotion', 48),

  -- Object Manipulation
  ('pdms_3_5y_catches_5ft',       'Catches ball from 5 feet',      'Catches a tennis-sized ball thrown from 5 feet using hands only', 42, 50, false, 13, 'object_manipulation', 42),
  ('pdms_3_5y_throws_10ft',       'Throws ball 10 feet',           'Throws a small ball overhand at least 10 feet with accuracy', 42, 50, false, 14, 'object_manipulation', 42),
  ('pdms_3_5y_bounces_catches',   'Bounces and catches ball',      'Bounces a ball and catches it with two hands', 48, 56, false, 15, 'object_manipulation', 48),
  ('pdms_3_5y_kicks_roll_5ft',    'Kicks rolling ball 5 feet',     'Kicks a rolling ball at least 5 feet with force and direction', 44, 52, false, 16, 'object_manipulation', 44),
  ('pdms_3_5y_dribbles_ball',     'Dribbles ball 3 times',         'Bounces (dribbles) a ball at least 3 times consecutively', 54, 60, false, 17, 'object_manipulation', 54)
) AS v(key, name, descr, expected, concern_by, is_red, ord, cat, age_eq)
WHERE ag.age_key = '3_5y'
ON CONFLICT (milestone_key) DO NOTHING;
