-- Migration: Replace detailed PDMS-2 items with simplified key milestones
-- Date: 2026-03-01
-- ~20 key gross motor milestones in chronological order for adaptive screening

-- Clear old PDMS-2 detailed items (keep original simple milestones as-is,
-- but add the new simplified set with 'simple_' prefix keys)

INSERT INTO pediatric_milestones (age_group_id, milestone_key, display_name, description, expected_by_month, concern_if_missing_by_month, red_flag, display_order, category, age_equivalent_months)
SELECT ag.id, v.key, v.name, v.descr, v.expected, v.concern_by, v.is_red, v.ord, 'gross_motor', v.expected
FROM pediatric_age_groups ag,
(VALUES
  -- 0-3 months
  ('0_3m', 'simple_head_lift',       'Lifts head during tummy time',         'Lifts head to 45-90 degrees when placed on tummy',                                 2, 4, true, 1),
  ('0_3m', 'simple_pushes_up_arms',  'Pushes up on arms',                    'Pushes chest off the floor using arms during tummy time',                            3, 5, false, 2),

  -- 3-6 months
  ('3_6m', 'simple_rolls_over',      'Rolls over',                           'Rolls from back to tummy or tummy to back',                                          5, 7, true, 3),
  ('3_6m', 'simple_sits_support',    'Sits with support',                    'Sits upright when supported at hips or in a tripod (hands on floor)',                 5, 7, false, 4),

  -- 6-9 months
  ('6_9m', 'simple_sits_alone',      'Sits independently',                   'Sits on the floor without any support and plays with toys',                           7, 9, true, 5),
  ('6_9m', 'simple_gets_to_sitting', 'Gets to sitting on their own',         'Moves from lying down or all-fours into a sitting position without help',             8, 10, false, 6),
  ('6_9m', 'simple_crawls',          'Crawls',                               'Moves forward on hands and knees (or belly crawls)',                                  9, 12, false, 7),
  ('6_9m', 'simple_pulls_to_stand',  'Pulls to stand',                       'Pulls up to standing using furniture or a person',                                    9, 12, false, 8),

  -- 9-12 months
  ('9_12m', 'simple_cruises',         'Cruises along furniture',             'Walks sideways while holding onto furniture',                                         10, 13, false, 9),
  ('9_12m', 'simple_stands_alone',    'Stands without holding on',           'Stands independently for several seconds without holding anything',                   12, 15, true, 10),

  -- 12-18 months
  ('12_18m', 'simple_walks',          'Walks independently',                 'Takes multiple steps and walks across the room without holding on',                   13, 18, true, 11),
  ('12_18m', 'simple_walks_backward', 'Walks backward',                      'Takes several steps backward without falling',                                        15, 20, false, 12),
  ('12_18m', 'simple_stoops',         'Bends down and stands back up',       'Squats or bends to pick up a toy from the floor and returns to standing',             14, 18, false, 13),

  -- 18-24 months
  ('18_24m', 'simple_runs',           'Runs',                                'Runs forward (may be a bit unsteady)',                                                20, 24, false, 14),
  ('18_24m', 'simple_stairs_up_help', 'Walks up stairs with help',           'Walks up stairs holding a railing or adult hand',                                     20, 26, false, 15),
  ('18_24m', 'simple_kicks_ball',     'Kicks a ball',                        'Kicks a ball forward while standing',                                                 22, 28, false, 16),
  ('18_24m', 'simple_jumps',          'Jumps with both feet',                'Jumps with both feet leaving the ground at the same time',                            24, 30, false, 17),

  -- 2-3 years
  ('2_3y', 'simple_stairs_alt',       'Walks up stairs alternating feet',    'Walks up stairs placing one foot per step (may hold rail)',                            30, 36, false, 18),
  ('2_3y', 'simple_pedals',           'Pedals a tricycle',                   'Pedals a tricycle forward',                                                           30, 36, false, 19),
  ('2_3y', 'simple_stands_1ft',       'Stands on one foot briefly',          'Balances on one foot for 1-3 seconds',                                                30, 36, false, 20),
  ('2_3y', 'simple_jumps_forward',    'Jumps forward',                       'Jumps forward with both feet, landing without falling',                                28, 34, false, 21),

  -- 3-5 years
  ('3_5y', 'simple_hops',             'Hops on one foot',                    'Hops forward on one foot 3 or more times',                                            42, 50, false, 22),
  ('3_5y', 'simple_gallops',          'Gallops',                             'Gallops forward with a lead foot',                                                    44, 52, false, 23),
  ('3_5y', 'simple_catches_ball',     'Catches a ball',                      'Catches a ball thrown from 5 feet using hands',                                       42, 50, false, 24),
  ('3_5y', 'simple_stairs_alt_down',  'Walks down stairs alternating feet',  'Walks down stairs placing one foot per step without holding rail',                    42, 50, false, 25),
  ('3_5y', 'simple_skips',            'Skips',                               'Skips forward with alternating feet',                                                 54, 60, false, 26)
) AS v(ag_key, key, name, descr, expected, concern_by, is_red, ord)
WHERE ag.age_key = v.ag_key
ON CONFLICT (milestone_key) DO NOTHING;
