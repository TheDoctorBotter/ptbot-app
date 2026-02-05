/*
  # Seed Questionnaires and Placeholder Items

  Seeds the following standardized outcome measures:
  - ODI (Oswestry Disability Index) - 10 items for back pain
  - KOOS (Knee Outcome Score) - 12 core items for knee pain (MVP subset)
  - QuickDASH - 11 items for shoulder/upper extremity
  - NPRS (Numeric Pain Rating Scale) - 1 item for general pain
  - GROC (Global Rating of Change) - 1 item for final assessment

  IMPORTANT: Item prompt_text values are placeholders.
  TODO: Replace with licensed questionnaire text when obtained.
*/

-- ============================================
-- QUESTIONNAIRE DEFINITIONS
-- ============================================
INSERT INTO questionnaires (key, display_name, body_region, version, scoring_type, min_score, max_score, mcid, notes)
VALUES
  (
    'odi',
    'Oswestry Disability Index',
    'back',
    '2.1a',
    'percent_0_100',
    0,
    100,
    10,
    'Higher scores indicate greater disability. MCID is typically 10 points. TODO: Insert licensed ODI item text.'
  ),
  (
    'koos',
    'Knee Injury and Osteoarthritis Outcome Score',
    'knee',
    'MVP-12',
    'percent_0_100',
    0,
    100,
    8,
    'MVP implementation with 12 core items. Higher scores indicate BETTER function. TODO: Insert licensed KOOS item text.'
  ),
  (
    'quickdash',
    'Quick Disabilities of the Arm, Shoulder and Hand',
    'shoulder',
    '1.0',
    'percent_0_100',
    0,
    100,
    8,
    'Higher scores indicate greater disability. TODO: Insert licensed QuickDASH item text.'
  ),
  (
    'nprs',
    'Numeric Pain Rating Scale',
    'general',
    '1.0',
    'nprs_0_10',
    0,
    10,
    2,
    'Standard 0-10 pain scale. MCID is typically 2 points.'
  ),
  (
    'groc',
    'Global Rating of Change',
    'general',
    '1.0',
    'groc_-7_7',
    -7,
    7,
    2,
    'Measures perceived change from -7 (very much worse) to +7 (very much better). MCID is typically ±2.'
  )
ON CONFLICT (key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  scoring_type = EXCLUDED.scoring_type,
  min_score = EXCLUDED.min_score,
  max_score = EXCLUDED.max_score,
  mcid = EXCLUDED.mcid,
  notes = EXCLUDED.notes,
  updated_at = now();

-- ============================================
-- ODI ITEMS (10 questions, likert 0-5)
-- ============================================
INSERT INTO questionnaire_items (questionnaire_id, item_key, prompt_text, response_type, display_order)
SELECT
  q.id,
  item.key,
  item.prompt,
  'likert_0_5',
  item.ord
FROM questionnaires q
CROSS JOIN (VALUES
  ('ODI_Q1', 'PLACEHOLDER: Pain Intensity - Insert licensed ODI Section 1 text', 1),
  ('ODI_Q2', 'PLACEHOLDER: Personal Care - Insert licensed ODI Section 2 text', 2),
  ('ODI_Q3', 'PLACEHOLDER: Lifting - Insert licensed ODI Section 3 text', 3),
  ('ODI_Q4', 'PLACEHOLDER: Walking - Insert licensed ODI Section 4 text', 4),
  ('ODI_Q5', 'PLACEHOLDER: Sitting - Insert licensed ODI Section 5 text', 5),
  ('ODI_Q6', 'PLACEHOLDER: Standing - Insert licensed ODI Section 6 text', 6),
  ('ODI_Q7', 'PLACEHOLDER: Sleeping - Insert licensed ODI Section 7 text', 7),
  ('ODI_Q8', 'PLACEHOLDER: Social Life - Insert licensed ODI Section 8 text', 8),
  ('ODI_Q9', 'PLACEHOLDER: Traveling - Insert licensed ODI Section 9 text', 9),
  ('ODI_Q10', 'PLACEHOLDER: Employment/Homemaking - Insert licensed ODI Section 10 text', 10)
) AS item(key, prompt, ord)
WHERE q.key = 'odi'
ON CONFLICT (questionnaire_id, item_key) DO UPDATE SET
  prompt_text = EXCLUDED.prompt_text,
  display_order = EXCLUDED.display_order;

-- ============================================
-- KOOS ITEMS (12 core items for MVP, likert 0-4)
-- Full KOOS has 42 items across 5 subscales
-- ============================================
INSERT INTO questionnaire_items (questionnaire_id, item_key, prompt_text, response_type, display_order)
SELECT
  q.id,
  item.key,
  item.prompt,
  'likert_0_4',
  item.ord
FROM questionnaires q
CROSS JOIN (VALUES
  ('KOOS_P1', 'PLACEHOLDER: Pain - Twisting/pivoting on knee', 1),
  ('KOOS_P2', 'PLACEHOLDER: Pain - Straightening knee fully', 2),
  ('KOOS_P3', 'PLACEHOLDER: Pain - Bending knee fully', 3),
  ('KOOS_P4', 'PLACEHOLDER: Pain - Walking on flat surface', 4),
  ('KOOS_P5', 'PLACEHOLDER: Pain - Going up/down stairs', 5),
  ('KOOS_A1', 'PLACEHOLDER: Function - Rising from sitting', 6),
  ('KOOS_A2', 'PLACEHOLDER: Function - Standing', 7),
  ('KOOS_A3', 'PLACEHOLDER: Function - Bending to floor', 8),
  ('KOOS_A4', 'PLACEHOLDER: Function - Walking on flat surface', 9),
  ('KOOS_A5', 'PLACEHOLDER: Function - Getting in/out of car', 10),
  ('KOOS_A6', 'PLACEHOLDER: Function - Going shopping', 11),
  ('KOOS_A7', 'PLACEHOLDER: Function - Heavy domestic duties', 12)
) AS item(key, prompt, ord)
WHERE q.key = 'koos'
ON CONFLICT (questionnaire_id, item_key) DO UPDATE SET
  prompt_text = EXCLUDED.prompt_text,
  display_order = EXCLUDED.display_order;

-- ============================================
-- QuickDASH ITEMS (11 questions, likert 1-5)
-- ============================================
INSERT INTO questionnaire_items (questionnaire_id, item_key, prompt_text, response_type, display_order)
SELECT
  q.id,
  item.key,
  item.prompt,
  'likert_1_5',
  item.ord
FROM questionnaires q
CROSS JOIN (VALUES
  ('QD_Q1', 'PLACEHOLDER: Open a tight or new jar', 1),
  ('QD_Q2', 'PLACEHOLDER: Do heavy household chores', 2),
  ('QD_Q3', 'PLACEHOLDER: Carry a shopping bag or briefcase', 3),
  ('QD_Q4', 'PLACEHOLDER: Wash your back', 4),
  ('QD_Q5', 'PLACEHOLDER: Use a knife to cut food', 5),
  ('QD_Q6', 'PLACEHOLDER: Recreational activities with arm force/impact', 6),
  ('QD_Q7', 'PLACEHOLDER: Arm/shoulder/hand problem interfering with social activities', 7),
  ('QD_Q8', 'PLACEHOLDER: Arm/shoulder/hand problem limiting work or daily activities', 8),
  ('QD_Q9', 'PLACEHOLDER: Severity of arm/shoulder/hand pain', 9),
  ('QD_Q10', 'PLACEHOLDER: Tingling (pins and needles) in arm/shoulder/hand', 10),
  ('QD_Q11', 'PLACEHOLDER: Difficulty sleeping due to arm/shoulder/hand pain', 11)
) AS item(key, prompt, ord)
WHERE q.key = 'quickdash'
ON CONFLICT (questionnaire_id, item_key) DO UPDATE SET
  prompt_text = EXCLUDED.prompt_text,
  display_order = EXCLUDED.display_order;

-- ============================================
-- NPRS ITEM (1 question, 0-10 scale)
-- ============================================
INSERT INTO questionnaire_items (questionnaire_id, item_key, prompt_text, response_type, response_options, display_order)
SELECT
  q.id,
  'NPRS_Q1',
  'Please rate your current pain on a scale of 0 to 10, where 0 is "No Pain" and 10 is "Worst Pain Imaginable".',
  'nprs_0_10',
  '{"labels": {"0": "No Pain", "5": "Moderate Pain", "10": "Worst Pain Imaginable"}}',
  1
FROM questionnaires q
WHERE q.key = 'nprs'
ON CONFLICT (questionnaire_id, item_key) DO UPDATE SET
  prompt_text = EXCLUDED.prompt_text,
  response_options = EXCLUDED.response_options;

-- ============================================
-- GROC ITEM (1 question, -7 to +7 scale)
-- ============================================
INSERT INTO questionnaire_items (questionnaire_id, item_key, prompt_text, response_type, response_options, display_order)
SELECT
  q.id,
  'GROC_Q1',
  'Compared to when you first started treatment, how would you describe your condition now?',
  'groc_-7_7',
  '{
    "labels": {
      "-7": "A very great deal worse",
      "-6": "A great deal worse",
      "-5": "Quite a bit worse",
      "-4": "Moderately worse",
      "-3": "Somewhat worse",
      "-2": "A little bit worse",
      "-1": "A tiny bit worse",
      "0": "About the same",
      "1": "A tiny bit better",
      "2": "A little bit better",
      "3": "Somewhat better",
      "4": "Moderately better",
      "5": "Quite a bit better",
      "6": "A great deal better",
      "7": "A very great deal better"
    }
  }',
  1
FROM questionnaires q
WHERE q.key = 'groc'
ON CONFLICT (questionnaire_id, item_key) DO UPDATE SET
  prompt_text = EXCLUDED.prompt_text,
  response_options = EXCLUDED.response_options;
