-- Migration: Add expanded pediatric concerns + placeholder exercise videos
-- Date: 2026-03-01
-- Adds 17 new developmental areas of concern and 3–4 placeholder videos each

-- ============================================
-- NEW CONCERNS
-- ============================================
INSERT INTO pediatric_concerns (concern_key, display_name, description, red_flags, display_order) VALUES

  -- Tone & Neuromotor
  ('high_tone', 'High Muscle Tone (Hypertonia)',
   'Stiffness or rigidity in muscles. Baby may feel stiff when picked up, have clenched fists, or scissor their legs.',
   ARRAY['Persistent fisting beyond 3 months', 'Scissoring of legs when held upright', 'Arching backward when held', 'Difficulty bending joints during dressing/diaper changes'],
   15),

  ('asymmetric_movement', 'Asymmetric Movement Patterns',
   'Consistent preference for using one side of the body. Early hand dominance before 12 months may signal a concern.',
   ARRAY['Strong hand preference before 12 months', 'One arm or leg moves significantly less', 'Asymmetric crawling or dragging one side', 'Fisting on one side only'],
   16),

  -- Head/Skull
  ('plagiocephaly', 'Plagiocephaly / Flat Head',
   'Flattening of one side or the back of the skull, often from positional preference or limited tummy time.',
   ARRAY['Worsening asymmetry despite repositioning', 'Facial asymmetry (ear or eye alignment shift)', 'Associated torticollis not improving'],
   17),

  -- Gross Motor Gaps
  ('delayed_standing', 'Delayed Standing',
   'Not pulling to stand or standing with support by expected age. Pull-to-stand typically emerges by 9–10 months.',
   ARRAY['No attempt to pull up by 12 months', 'Legs collapse when placed in standing', 'Only stands on toes when supported'],
   18),

  ('delayed_running_jumping', 'Delayed Running / Jumping',
   'Not running or attempting to jump by expected ages. Running typically emerges by 18–20 months; jumping by 24 months.',
   ARRAY['No running attempts by 24 months', 'Cannot jump with both feet off ground by 30 months', 'Frequent falls during running beyond age 2'],
   19),

  -- Balance & Coordination
  ('poor_balance', 'Poor Balance / Frequent Falls',
   'Falling more than expected for age, difficulty on uneven surfaces, or inability to recover balance.',
   ARRAY['Falls significantly more than peers', 'Cannot stand on one foot briefly by age 3', 'Avoids playground equipment due to instability', 'Falls without protective reactions'],
   20),

  ('coordination_difficulties', 'Coordination Difficulties (Dyspraxia/DCD)',
   'Difficulty planning and executing new motor tasks. May appear clumsy or have trouble learning physical activities.',
   ARRAY['Significantly behind peers in motor skills', 'Difficulty with bike riding, ball skills, or climbing', 'Avoids physical play', 'Trouble imitating movements or following motor sequences'],
   21),

  -- Gait Abnormalities
  ('knock_knees', 'Knock Knees (Genu Valgum)',
   'Knees angle inward and touch when standing with feet apart. Normal in the 2–5 year range but may need evaluation if severe.',
   ARRAY['Severe or worsening after age 7', 'Asymmetric (one side only)', 'Pain with walking or running', 'Causing tripping or gait difficulty'],
   22),

  ('bow_legs', 'Bow Legs (Genu Varum)',
   'Legs curve outward at the knees when standing with feet together. Normal under age 2 but a concern if persistent or worsening.',
   ARRAY['Worsening after age 2', 'Asymmetric (one side only)', 'Pain or limping', 'Gap between knees increasing'],
   23),

  ('limping', 'Limping / Asymmetric Gait',
   'Any asymmetric walking pattern including favoring one leg, hip drop, or circumduction.',
   ARRAY['Acute onset limping (seek immediate evaluation)', 'Limping with fever or refusal to walk', 'Progressive worsening over days/weeks', 'Associated pain, swelling, or redness'],
   24),

  -- Upper Extremity
  ('delayed_grasp', 'Delayed Hand / Grasp Development',
   'Not reaching for or grasping objects by expected age. Palmar grasp typically emerges by 4–5 months; pincer grasp by 9–10 months.',
   ARRAY['Not reaching for objects by 5 months', 'No palmar grasp by 6 months', 'No pincer grasp by 12 months', 'Drops objects immediately after grasping'],
   25),

  ('poor_ue_weight_bearing', 'Poor Upper Extremity Weight Bearing',
   'Difficulty supporting body weight through arms during tummy time, propping, or crawling.',
   ARRAY['Arms collapse during tummy time beyond 4 months', 'Cannot prop on extended arms by 6 months', 'Avoids hands-and-knees position', 'Asymmetric arm use during weight bearing'],
   26),

  -- Specific Conditions
  ('down_syndrome_motor', 'Down Syndrome Motor Support',
   'Children with trisomy 21 often have low muscle tone and joint hypermobility that affect motor milestone progression.',
   ARRAY['Significant delay beyond adjusted expectations', 'Loss of previously gained skills', 'Atlantoaxial instability symptoms (neck pain, head tilt, gait change)', 'Respiratory distress during activity'],
   27),

  ('prematurity_motor', 'Prematurity / NICU Graduate Follow-Up',
   'Premature infants may need adjusted-age milestone tracking and targeted motor support for catch-up development.',
   ARRAY['Not meeting milestones for adjusted age', 'Persistent asymmetry in tone or movement', 'Feeding difficulties alongside motor delays', 'Loss of previously gained skills'],
   28),

  ('cerebral_palsy_motor', 'Cerebral Palsy (Gross Motor)',
   'A group of disorders affecting movement and posture caused by brain injury. Presentation varies widely from mild to severe.',
   ARRAY['Persistent abnormal muscle tone (high or low)', 'Delayed motor milestones beyond adjusted age', 'Loss of skills or regression', 'Difficulty with feeding or swallowing', 'Seizures'],
   29),

  ('brachial_plexus_injury', 'Brachial Plexus Injury (Erb''s Palsy)',
   'Birth injury affecting nerves of the arm. May present as decreased movement, asymmetric arm position, or weakness in one arm.',
   ARRAY['No improvement in arm movement by 3 months', 'Completely limp arm', 'Wrist drop or hand weakness', 'Lack of bicep function by 6 months'],
   30),

  -- Common Parent Concern
  ('w_sitting', 'W-Sitting',
   'Sitting with knees bent and feet splayed out to the sides forming a "W". Occasional W-sitting is normal but habitual use may affect hip and core development.',
   ARRAY['W-sitting is the ONLY sitting position used', 'Associated with hip pain or difficulty walking', 'Unable to sit in any other position', 'Accompanied by in-toeing or tripping'],
   31)

ON CONFLICT (concern_key) DO NOTHING;

-- ============================================
-- PLACEHOLDER EXERCISE VIDEOS FOR NEW CONCERNS
-- ============================================

-- High Tone
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('0_3m', 'Gentle Range of Motion for Stiff Muscles',
   'Slow, rhythmic stretching to reduce muscle stiffness in arms and legs.',
   ARRAY['Move slowly and gently through available range', 'Use a calm voice and soothing environment', 'Stretch after a warm bath when muscles are more relaxed'],
   ARRAY['Never force through resistance', 'Stop if baby cries or shows distress', 'Follow your therapists prescribed hold times'],
   1),
  ('0_3m', 'Positioning for Tone Reduction',
   'Side-lying and supported positions that help reduce stiffness and promote relaxation.',
   ARRAY['Side-lying with a rolled blanket for support', 'Flexion-based positions (knees tucked, arms forward)', 'Gentle rocking in a curled position'],
   ARRAY['Avoid positions that increase arching', 'Supervise all positioning', 'Consult PT for individualized positioning plan'],
   2),
  ('3_6m', 'Weight Bearing Activities for High Tone',
   'Graded weight bearing through arms and legs to normalize tone and build functional strength.',
   ARRAY['Supported standing on flat feet — gently press heels down', 'Tummy time on forearms to open hands', 'Bouncing on a therapy ball to modulate tone'],
   ARRAY['Ensure feet are flat, not pointed', 'Stop if baby becomes more stiff or distressed', 'Work within ranges recommended by your PT'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'high_tone' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Asymmetric Movement
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('0_3m', 'Encouraging Two-Sided Movement',
   'Activities to promote equal use of both arms and legs during play.',
   ARRAY['Offer toys at midline to encourage both hands', 'Alternate which side you hold and carry baby', 'Place toys on the less-active side to encourage reaching'],
   ARRAY['Report persistent one-sided weakness to your pediatrician', 'Do not restrict the stronger side'],
   1),
  ('3_6m', 'Bilateral Reaching and Grasping Games',
   'Play-based activities that encourage reaching and grasping with both hands.',
   ARRAY['Use large toys that require two hands', 'Shake rattles on both sides alternately', 'Guide the less-active hand to toys gently'],
   ARRAY['If one hand remains fisted, seek evaluation', 'Observe for asymmetry during feeding as well'],
   2),
  ('6_9m', 'Symmetrical Crawling Support',
   'Activities to encourage equal use of both sides during crawling and floor play.',
   ARRAY['Position toys to encourage weight shift to both sides', 'Gently support the weaker side during crawling', 'Practice reaching across midline'],
   ARRAY['Persistent asymmetry in crawling needs PT evaluation', 'Do not force use of the weaker side'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'asymmetric_movement' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Plagiocephaly
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('0_3m', 'Repositioning Strategies for Flat Head',
   'Techniques to reduce pressure on the flat spot and encourage head turning.',
   ARRAY['Alternate head position with each nap', 'Use toys/light to attract attention to the non-flat side', 'Alternate which end of the crib baby sleeps at'],
   ARRAY['Always follow safe sleep guidelines — back to sleep', 'Never use positioning wedges or pillows in the crib', 'Consult pediatrician if flat spot is worsening'],
   1),
  ('0_3m', 'Tummy Time for Plagiocephaly',
   'Supervised tummy time to relieve pressure on the back of the head and strengthen neck muscles.',
   ARRAY['Aim for 30–60 minutes total tummy time per day by 2 months', 'Use chest-to-chest tummy time if baby is fussy', 'Place on a firm, flat surface'],
   ARRAY['Always supervise tummy time', 'Stop if baby shows distress signs', 'Never leave baby on tummy to sleep'],
   2),
  ('3_6m', 'Active Head Turning and Neck Strengthening',
   'Activities that encourage head rotation and build neck strength to improve head shape.',
   ARRAY['Attract attention to both sides equally during play', 'Supported sitting to reduce flat-spot pressure', 'Encourage tracking toys across midline'],
   ARRAY['If flat spot is not improving by 4 months, discuss helmet evaluation', 'Combine with torticollis stretches if applicable'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'plagiocephaly' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Delayed Standing
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('6_9m', 'Supported Standing at Furniture',
   'Building comfort and strength in supported standing positions.',
   ARRAY['Use a sturdy couch or coffee table', 'Place favorite toys on the surface', 'Support at hips initially, then reduce as confidence grows'],
   ARRAY['Ensure furniture is stable and edges are padded', 'Stay within arms reach at all times'],
   1),
  ('9_12m', 'Pull-to-Stand Progression',
   'Step-by-step activities to help baby learn to pull up to standing from the floor.',
   ARRAY['Start from kneeling at a low surface', 'Place motivating toys just out of reach on the surface', 'Practice on both sides — pulling up with either leg leading'],
   ARRAY['Pad the floor around practice area', 'Avoid baby walkers', 'Watch for toe standing — feet should be flat'],
   2),
  ('9_12m', 'Standing Balance Activities',
   'Games to build standing endurance and balance once baby can pull up.',
   ARRAY['Play patty-cake at a standing surface', 'Place toys at different heights to encourage weight shifting', 'Gently reduce hand support as balance improves'],
   ARRAY['Let baby lower themselves — do not pull them down', 'Ensure safe landing area'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'delayed_standing' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Delayed Running/Jumping
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('18_24m', 'Fast Walking to Running Progression',
   'Activities to help transition from walking to running with confidence.',
   ARRAY['Chase games — run after bubbles or a rolling ball', 'Walk fast on grass (softer surface for falls)', 'Run while holding hands initially'],
   ARRAY['Use open spaces free of obstacles', 'Barefoot on soft surfaces is best for developing runners'],
   1),
  ('18_24m', 'Pre-Jumping Activities',
   'Building the leg strength and coordination needed for jumping.',
   ARRAY['Bounce on a mattress or trampoline with support', 'Step off a low step (2 inches) with both feet', 'Squat and stand quickly — "ready, set, GO!"'],
   ARRAY['Use soft landing surfaces', 'Hold hands during early attempts', 'Do not force — let it develop through play'],
   2),
  ('2_3y', 'Running and Jumping Games',
   'Fun games that build running speed, coordination, and jumping ability.',
   ARRAY['Obstacle courses with running and jumping stations', 'Jump over lines or flat objects on the ground', 'Animal walks — frog jumps, bunny hops'],
   ARRAY['Ensure clear, safe play area', 'Watch for excessive fatigue or frustration'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'delayed_running_jumping' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Poor Balance
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('18_24m', 'Early Balance Activities',
   'Simple balance challenges for toddlers who fall more than expected.',
   ARRAY['Walk on different surfaces — grass, sand, pillows', 'Step over low objects (pool noodles on the ground)', 'Stand on one foot while holding your hands'],
   ARRAY['Stay close to provide support', 'Practice on soft surfaces initially'],
   1),
  ('2_3y', 'Balance Beam and Stepping Games',
   'Activities that challenge balance on narrow surfaces and unstable ground.',
   ARRAY['Walk along a line of tape on the floor', 'Step from cushion to cushion', 'Walk along a low curb while holding one hand'],
   ARRAY['Use low surfaces only — under 6 inches', 'Spot from behind, not in front'],
   2),
  ('3_5y', 'Single Leg Balance and Dynamic Balance',
   'Progressive balance challenges for preschool-age children.',
   ARRAY['Stand on one foot — try to count to 5', 'Walk heel-to-toe along a line', 'Kick a ball while standing on one foot', 'Balance on a wobble cushion'],
   ARRAY['Practice near a wall for safety', 'Make it a game, not a drill'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'poor_balance' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Coordination Difficulties
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('2_3y', 'Motor Planning Activities for Toddlers',
   'Simple sequenced activities to build motor planning skills.',
   ARRAY['Obstacle courses with 2–3 stations', 'Simon Says with simple actions', 'Copy my movement games', 'Stacking, pouring, and building tasks'],
   ARRAY['Keep activities fun and low-pressure', 'Break tasks into smaller steps if frustrated', 'Celebrate effort, not just success'],
   1),
  ('3_5y', 'Coordination and Motor Planning Games',
   'Activities that challenge the ability to plan, sequence, and execute motor tasks.',
   ARRAY['Obstacle courses with varied challenges', 'Ball skills — catching, throwing, kicking progression', 'Riding a balance bike or tricycle', 'Jumping patterns — follow a path of shapes'],
   ARRAY['Allow extra time for learning new skills', 'Demonstrate slowly then let child try', 'Avoid comparing to peers'],
   2),
  ('3_5y', 'Body Awareness and Spatial Activities',
   'Activities to build proprioception and understanding of where the body is in space.',
   ARRAY['Wheelbarrow walking', 'Crashing into cushion piles', 'Heavy work — carrying groceries, pushing a laundry basket', 'Yoga poses for kids'],
   ARRAY['Supervise crash activities closely', 'Adjust difficulty to avoid repeated failure', 'Consult OT if fine motor is also affected'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'coordination_difficulties' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Knock Knees
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('2_3y', 'Hip and Leg Strengthening for Knock Knees',
   'Activities to strengthen hip abductors and improve leg alignment.',
   ARRAY['Crab walks (sideways walking)', 'Monster walks with a light resistance band', 'Side-lying leg lifts as a game', 'Standing on one leg with support'],
   ARRAY['Some knock-knee appearance is normal at this age', 'Consult PT if severe, asymmetric, or painful', 'Do not use braces or orthotics without professional guidance'],
   1),
  ('3_5y', 'Alignment and Strengthening Activities',
   'Progressive exercises to support proper leg alignment in preschoolers.',
   ARRAY['Squats with feet hip-width apart', 'Climbing stairs emphasizing knee alignment', 'Balance activities on one leg', 'Riding a tricycle or bike for hip strength'],
   ARRAY['Knock knees typically self-correct by age 7', 'Seek evaluation if worsening, asymmetric, or causing pain', 'Avoid forced correction — focus on strengthening'],
   2)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'knock_knees' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Bow Legs
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('12_18m', 'Strengthening for Bow Legs in Early Walkers',
   'Activities to support leg development and monitor bow leg progression.',
   ARRAY['Encourage barefoot walking on varied surfaces', 'Supported squatting to pick up toys', 'Standing at a surface with feet flat and parallel'],
   ARRAY['Bow legs are normal in early walkers', 'Seek evaluation if worsening after age 2', 'Severe or asymmetric bowing needs prompt evaluation'],
   1),
  ('18_24m', 'Leg Alignment Activities for Toddlers',
   'Play-based activities to promote proper leg alignment as bow legs should begin to resolve.',
   ARRAY['Walking up gentle inclines', 'Squatting to play with feet flat', 'Stepping over low objects to encourage knee flexion'],
   ARRAY['If bowing is worsening or only on one side, see your pediatrician', 'Vitamin D supplementation may be recommended — ask your doctor'],
   2)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'bow_legs' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Limping
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('12_18m', 'Gait Symmetry Activities for Toddlers',
   'Activities to promote equal weight bearing and symmetrical walking.',
   ARRAY['Encourage walking on flat, even surfaces', 'Push toys that require even stepping', 'Walking between two caregivers'],
   ARRAY['NEW onset limping needs medical evaluation FIRST', 'Limping with fever — seek immediate care', 'Do not attempt exercises until a cause is identified'],
   1),
  ('2_3y', 'Symmetrical Walking and Strengthening',
   'Exercises to improve gait symmetry once a cause has been identified and cleared for activity.',
   ARRAY['Marching in place — lift knees evenly', 'Walking over evenly spaced obstacles', 'Stair climbing with alternating feet', 'Standing balance on each leg'],
   ARRAY['Only do these after clearance from your medical provider', 'Stop if pain increases', 'Report any worsening to your doctor immediately'],
   2),
  ('3_5y', 'Gait Training Activities',
   'Structured activities to normalize walking pattern in older children.',
   ARRAY['Walking on a line — heel to toe', 'Marching with exaggerated steps', 'Obstacle course with varied terrain', 'Backward walking for awareness'],
   ARRAY['Must have medical clearance before starting', 'Monitor for pain during and after activities', 'Persistent limping always requires medical investigation'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'limping' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Delayed Grasp
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('0_3m', 'Early Hand Awareness Activities',
   'Activities to help baby discover their hands and begin reaching.',
   ARRAY['Place bright toys within visual range', 'Gently place baby''s hand on toys', 'Use textured objects to stimulate hand awareness', 'Bring hands to midline during play'],
   ARRAY['Persistent fisting beyond 3 months needs evaluation', 'Do not pry open clenched hands'],
   1),
  ('3_6m', 'Reaching and Grasping Practice',
   'Activities to encourage voluntary reaching and palmar grasp development.',
   ARRAY['Offer toys of different sizes and textures', 'Hold toys where baby must reach to get them', 'Use rattles that reward grasping with sound', 'Practice in supported sitting for better reach'],
   ARRAY['If not reaching by 5 months, consult your pediatrician', 'Use age-appropriate, non-choking-hazard toys'],
   2),
  ('6_9m', 'Pincer Grasp and Fine Motor Development',
   'Activities to progress from palmar grasp to more precise finger use.',
   ARRAY['Offer small, safe foods to pick up (puffs, soft fruit)', 'Play with stacking cups and nesting toys', 'Practice poking and pointing games', 'Use containers to practice putting objects in and out'],
   ARRAY['Supervise all small object play to prevent choking', 'Not all babies develop pincer grasp at the same rate', 'Consult OT if no pincer grasp by 12 months'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'delayed_grasp' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Poor UE Weight Bearing
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('0_3m', 'Supported Tummy Time for Arm Strength',
   'Gentle tummy time positions to build upper body strength and tolerance.',
   ARRAY['Prop on a nursing pillow or rolled towel under chest', 'Place toys directly in front to encourage lifting', 'Try tummy time on your chest for comfort'],
   ARRAY['Start with short sessions (1–2 minutes) and increase', 'Stop if arms are trembling excessively', 'Always supervise'],
   1),
  ('3_6m', 'Forearm and Extended Arm Propping',
   'Progressions from forearm propping to straight arm weight bearing.',
   ARRAY['Elbow prop during tummy time with toys to engage', 'Gently push down through shoulders to activate arms', 'Use a mirror in front for motivation'],
   ARRAY['Watch for one arm doing more work than the other', 'Support at chest if arms collapse repeatedly'],
   2),
  ('6_9m', 'Hands and Knees Weight Bearing',
   'Activities in quadruped to build upper extremity strength for crawling.',
   ARRAY['Rocking on hands and knees', 'Reaching for toys from quadruped — weight shifting through arms', 'Wheelbarrow walking with full support at hips'],
   ARRAY['Use a padded surface', 'Support at hips if arms are too weak initially', 'Report persistent arm weakness to your PT'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'poor_ue_weight_bearing' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Down Syndrome Motor Support
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('0_3m', 'Early Motor Activities for Down Syndrome',
   'Gentle activities to build strength and promote motor development, accounting for low tone and joint laxity.',
   ARRAY['Extra support at trunk and hips during all positions', 'Shorter, more frequent tummy time sessions', 'Midline hand play to build awareness'],
   ARRAY['Joint laxity means extra care with positioning', 'Follow your early intervention PT''s individualized plan', 'Celebrate every milestone — timing varies widely'],
   1),
  ('3_6m', 'Strength Building for Low Tone (DS)',
   'Activities specifically designed for the tone and laxity profile of Down syndrome.',
   ARRAY['Supported sitting with trunk support at hips', 'Bouncing gently on your lap to build core strength', 'Reaching activities in supported recline'],
   ARRAY['Avoid W-sitting due to joint laxity', 'Use firm support rather than soft surfaces', 'Consult PT for orthotic recommendations if needed'],
   2),
  ('9_12m', 'Pre-Walking Activities for Down Syndrome',
   'Building the prerequisite strength for standing and walking, which typically develops later in children with DS.',
   ARRAY['Supported standing with hips and knees aligned', 'Cruising along stable furniture', 'Push toys with a wide base of support', 'Stair climbing on all fours'],
   ARRAY['Walking often emerges between 24–36 months in DS — be patient', 'Orthotics may be recommended for flat feet', 'Atlantoaxial precautions — avoid somersaults and excessive neck flexion'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'down_syndrome_motor' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Prematurity Motor Follow-Up
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('0_3m', 'NICU Graduate Tummy Time Progression',
   'Gentle tummy time for premature infants, starting from adjusted age considerations.',
   ARRAY['Use adjusted age when gauging readiness', 'Start with chest-to-chest tummy time', 'Very short sessions — 30 seconds to 1 minute initially', 'Swaddle transition to supported prone'],
   ARRAY['Follow NICU discharge guidelines', 'Monitor oxygen saturation if prescribed', 'Preemies may tire more quickly — watch for stress cues'],
   1),
  ('3_6m', 'Adjusted-Age Motor Activities',
   'Developmentally appropriate activities based on adjusted age for premature infants.',
   ARRAY['Track milestones by adjusted age until age 2', 'Gentle supported sitting and reaching', 'Rolling encouragement appropriate to adjusted age'],
   ARRAY['Do not compare to full-term peers', 'Report concerns about tone (too stiff or too floppy) to your pediatrician', 'Continue early intervention services as recommended'],
   2),
  ('6_9m', 'Catch-Up Motor Development',
   'Activities to support motor catch-up for premature infants in the second half of the first year.',
   ARRAY['Floor play in varied positions', 'Supported standing to build leg strength', 'Encourage transitional movements (rolling to sitting, sitting to crawling)'],
   ARRAY['Some catch-up continues through age 2', 'Persistent delays beyond adjusted age need evaluation', 'Work closely with your early intervention team'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'prematurity_motor' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Cerebral Palsy Motor
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('0_3m', 'Early Positioning and Movement for CP',
   'Positioning strategies and gentle movement activities for infants with or at risk for cerebral palsy.',
   ARRAY['Midline positioning to reduce asymmetry', 'Supported side-lying for symmetric hand play', 'Gentle range of motion to prevent contractures'],
   ARRAY['MUST be guided by your pediatric PT', 'Positioning needs vary based on type and severity', 'Never force range of motion against spasticity'],
   1),
  ('6_9m', 'Functional Movement for Cerebral Palsy',
   'Activities focused on functional skills like reaching, sitting, and transitioning.',
   ARRAY['Adaptive seating for supported sitting if needed', 'Reaching activities at varied heights', 'Weight bearing through both sides equally'],
   ARRAY['Activities should be individualized by your PT', 'Use adaptive equipment as prescribed', 'Monitor for skin breakdown from equipment'],
   2),
  ('12_18m', 'Standing and Mobility for CP',
   'Supported standing and early mobility activities adapted for children with cerebral palsy.',
   ARRAY['Stander use as prescribed by your PT', 'Supported stepping with appropriate device', 'Weight shifting activities in standing'],
   ARRAY['Use prescribed AFOs and orthotics during activities', 'Follow your PT''s specific exercise plan', 'Report increased tone or new movement concerns promptly'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'cerebral_palsy_motor' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- Brachial Plexus Injury
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('0_3m', 'Gentle Range of Motion for Brachial Plexus',
   'Daily stretching to maintain range of motion in the affected arm while nerves recover.',
   ARRAY['Gentle shoulder flexion — raise arm overhead slowly', 'Elbow extension and supination (turning palm up)', 'Perform during every diaper change — 5–10 repetitions each direction'],
   ARRAY['Never force through resistance', 'Support the arm fully during stretches', 'This must be taught by your pediatric PT first'],
   1),
  ('0_3m', 'Encouraging Active Movement of Affected Arm',
   'Activities to stimulate voluntary movement in the affected arm.',
   ARRAY['Tickle or stroke the affected arm to stimulate movement', 'Place toys on the affected side', 'Guide affected hand to touch toys and face'],
   ARRAY['Do not ignore the unaffected arm — it needs development too', 'No improvement by 3 months may require specialist referral', 'Avoid pulling baby up by their arms'],
   2),
  ('3_6m', 'Bilateral Arm Activities for BPI',
   'Activities to encourage use of both arms together as nerve recovery progresses.',
   ARRAY['Two-hand toy play — holding a ball, banging toys together', 'Supported weight bearing through both arms in tummy time', 'Reaching across midline to the affected side'],
   ARRAY['If no bicep recovery by 6 months, surgical evaluation may be recommended', 'Continue daily ROM even as active movement improves', 'Follow-up with your specialist as scheduled'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'brachial_plexus_injury' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;

-- W-Sitting
INSERT INTO pediatric_exercise_videos (concern_id, age_group_id, title, description, coaching_cues, safety_notes, display_order)
SELECT c.id, ag.id, v.title, v.descr, v.cues, v.safety, v.ord
FROM pediatric_concerns c, pediatric_age_groups ag,
(VALUES
  ('12_18m', 'Alternative Sitting Positions',
   'Teaching and encouraging sitting positions other than W-sitting.',
   ARRAY['Ring sitting (legs in a circle in front)', 'Side-sitting (legs to one side)', 'Long sitting (legs straight out)', 'Gently reposition out of W — "fix your feet!"'],
   ARRAY['Occasional W-sitting is normal — focus on habitual W-sitters', 'Do not create anxiety around sitting — keep corrections gentle', 'Address underlying weakness if W-sitting is the only option'],
   1),
  ('18_24m', 'Core and Hip Strengthening to Reduce W-Sitting',
   'Building the core and hip strength needed to maintain alternative sitting positions.',
   ARRAY['Tall kneeling play at a low table', 'Half-kneeling to stand transitions', 'Sitting on a small stool or chair instead of the floor', 'Bear walking and animal walks for hip strength'],
   ARRAY['If child cannot sit any other way, evaluate core and hip strength', 'W-sitting alone is rarely harmful — it is the exclusivity that concerns PTs'],
   2),
  ('2_3y', 'Hip Rotation and Flexibility Activities',
   'Activities to improve hip range of motion and reduce reliance on W-sitting.',
   ARRAY['Cross-legged sitting during circle time', 'Butterfly stretch as a game', 'Squatting to play with feet flat', 'Climbing activities for hip strength and rotation'],
   ARRAY['If W-sitting is associated with tripping or in-toeing, seek evaluation', 'Some children W-sit due to skeletal alignment — PT can assess'],
   3)
) AS v(ag_key, title, descr, cues, safety, ord)
WHERE c.concern_key = 'w_sitting' AND ag.age_key = v.ag_key
ON CONFLICT DO NOTHING;
