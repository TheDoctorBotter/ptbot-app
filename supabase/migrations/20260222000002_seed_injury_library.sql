-- Migration: Seed injury library data
-- Date: 2026-02-22
-- Purpose: Idempotent seed for 34 conservative rehab injuries across all body regions
-- All statements use upserts (ON CONFLICT) so this migration is safe to re-run.

-- ============================================
-- LOWER BACK INJURIES (section slug: lower-back)
-- ============================================

-- 1. Lumbar Strain / Sprain
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'lowback_lumbar_strain', 'Lumbar Strain / Sprain', 1, true
FROM exercise_sections es WHERE es.slug = 'lower-back'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_lowback_lumbar_strain', 'lower_back', 'Lumbar Strain / Sprain Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'lowback_lumbar_strain'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm Symptoms + Mobility', 1,
  ARRAY['Reduce pain to manageable levels', 'Restore basic ROM'],
  ARRAY[]::TEXT[],
  ARRAY['Pain ≤4/10', 'Tolerates gentle movement']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_lumbar_strain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Core Activation + Hip Hinge Basics', 2,
  ARRAY['Activate deep stabilizers', 'Learn safe hip hinge'],
  ARRAY[]::TEXT[],
  ARRAY['Bird dog without pain', 'Hip hinge with neutral spine']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_lumbar_strain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Strength + Endurance', 3,
  ARRAY['Build lumbar and hip strength'],
  ARRAY[]::TEXT[],
  ARRAY['Completes 3x10 exercises without pain flare']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_lumbar_strain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 4, 'Return to Lifting / Work', 4,
  ARRAY['Return to full occupational demands'],
  ARRAY[]::TEXT[],
  ARRAY['Pain ≤2/10 with lifting', 'Full work duties resumed']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_lumbar_strain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'lowback_lumbar_strain'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 2. Disc-Related Pain / Sciatica
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'lowback_disc_radicular', 'Disc-Related Pain / Sciatica', 2, true
FROM exercise_sections es WHERE es.slug = 'lower-back'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_lowback_disc_radicular', 'lower_back', 'Disc-Related Pain / Sciatica Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'lowback_disc_radicular'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Directional Preference + Symptom Centralization', 1,
  ARRAY['Identify directional preference', 'Centralize symptoms'],
  ARRAY[]::TEXT[],
  ARRAY['Leg symptoms centralizing', 'Pain decreasing']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_disc_radicular'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Mobility + Neural Tolerance', 2,
  ARRAY['Restore lumbar ROM', 'Improve nerve mobility'],
  ARRAY[]::TEXT[],
  ARRAY['Neural tension tests improving', 'Full lumbar ROM']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_disc_radicular'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Strength + Control', 3,
  ARRAY['Lumbar and core strengthening'],
  ARRAY[]::TEXT[],
  ARRAY['Strength 4/5 key muscles', 'No radicular symptoms with exercise']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_disc_radicular'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 4, 'Return to Function', 4,
  ARRAY['Return to full activity'],
  ARRAY[]::TEXT[],
  ARRAY['Full ADLs', 'Pain ≤2/10']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_disc_radicular'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'lowback_disc_radicular'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 3. Lumbar Spinal Stenosis
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'lowback_stenosis', 'Lumbar Spinal Stenosis', 3, true
FROM exercise_sections es WHERE es.slug = 'lower-back'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_lowback_stenosis', 'lower_back', 'Lumbar Spinal Stenosis Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'lowback_stenosis'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Symptom Management + Flexion Bias Tolerance', 1,
  ARRAY['Reduce neurogenic claudication', 'Establish flexion-biased positions'],
  ARRAY[]::TEXT[],
  ARRAY['Walking tolerance increased 25%', 'Symptom-free position identified']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_stenosis'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Mobility + Walking Tolerance', 2,
  ARRAY['Increase walking distance', 'Improve mobility'],
  ARRAY[]::TEXT[],
  ARRAY['Walks 15+ min without symptoms']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_stenosis'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Strength + Endurance', 3,
  ARRAY['Core and hip strengthening'],
  ARRAY[]::TEXT[],
  ARRAY['Completes 20-min exercise session']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_stenosis'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 4, 'Functional Conditioning', 4,
  ARRAY['Maintain independence with daily activities'],
  ARRAY[]::TEXT[],
  ARRAY['Community ambulation achieved']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_stenosis'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'lowback_stenosis'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 4. Spondylolysis / Spondylolisthesis
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'lowback_spondy', 'Spondylolysis / Spondylolisthesis', 4, true
FROM exercise_sections es WHERE es.slug = 'lower-back'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_lowback_spondy', 'lower_back', 'Spondylolysis / Spondylolisthesis Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'lowback_spondy'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Pain Control + Neutral Spine', 1,
  ARRAY['Reduce pain', 'Establish neutral spine posture'],
  ARRAY[]::TEXT[],
  ARRAY['Pain ≤3/10', 'Neutral spine maintained during basic tasks']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_spondy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Core Stabilization', 2,
  ARRAY['Deep core activation', 'Anti-extension control'],
  ARRAY[]::TEXT[],
  ARRAY['Dead bug 3x10 without lumbar movement']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_spondy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Progressive Strength', 3,
  ARRAY['Progressive loading of lumbar spine'],
  ARRAY[]::TEXT[],
  ARRAY['Hip hinge loaded', 'Pain ≤2/10']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_spondy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 4, 'Return to Sport / Work', 4,
  ARRAY['Full return to pre-injury activity'],
  ARRAY[]::TEXT[],
  ARRAY['Sport/work demands met without pain']
FROM protocols p WHERE p.protocol_key = 'conservative_lowback_spondy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'lowback_spondy'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- ============================================
-- UPPER BACK INJURIES (section slug: upper-back)
-- ============================================

-- 5. Thoracic Mobility Restriction / Postural Pain
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'thoracic_postural_pain', 'Thoracic Mobility Restriction / Postural Pain', 1, true
FROM exercise_sections es WHERE es.slug = 'upper-back'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_thoracic_postural_pain', 'upper_back', 'Thoracic Mobility Restriction / Postural Pain Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'thoracic_postural_pain'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Mobility + Symptom Calm', 1,
  ARRAY['Restore thoracic rotation and extension'],
  ARRAY[]::TEXT[],
  ARRAY['Thoracic rotation 40°+', 'Pain ≤3/10']
FROM protocols p WHERE p.protocol_key = 'conservative_thoracic_postural_pain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Scapular Endurance', 2,
  ARRAY['Mid-trap and serratus endurance'],
  ARRAY[]::TEXT[],
  ARRAY['3x15 scapular exercises without fatigue']
FROM protocols p WHERE p.protocol_key = 'conservative_thoracic_postural_pain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Strength + Posture Integration', 3,
  ARRAY['Sustained postural endurance'],
  ARRAY[]::TEXT[],
  ARRAY['Maintains neutral posture 30+ min']
FROM protocols p WHERE p.protocol_key = 'conservative_thoracic_postural_pain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'thoracic_postural_pain'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 6. Rib / Thoracic Strain
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'thoracic_rib_strain', 'Rib / Thoracic Strain', 2, true
FROM exercise_sections es WHERE es.slug = 'upper-back'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_thoracic_rib_strain', 'upper_back', 'Rib / Thoracic Strain Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'thoracic_rib_strain'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Breathing + Gentle Mobility', 1,
  ARRAY['Pain-free deep breathing', 'Gentle thoracic mobility'],
  ARRAY[]::TEXT[],
  ARRAY['Full breath without sharp pain']
FROM protocols p WHERE p.protocol_key = 'conservative_thoracic_rib_strain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Range + Light Strength', 2,
  ARRAY['Restore thoracic ROM', 'Light strengthening'],
  ARRAY[]::TEXT[],
  ARRAY['Full thoracic rotation', '3x10 rows']
FROM protocols p WHERE p.protocol_key = 'conservative_thoracic_rib_strain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Functional Return', 3,
  ARRAY['Return to pre-injury demands'],
  ARRAY[]::TEXT[],
  ARRAY['Full work/sport duties resumed']
FROM protocols p WHERE p.protocol_key = 'conservative_thoracic_rib_strain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'thoracic_rib_strain'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- ============================================
-- NECK INJURIES (section slug: neck)
-- ============================================

-- 7. Cervical Strain / Tech Neck
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'neck_cervical_strain', 'Cervical Strain / Tech Neck', 1, true
FROM exercise_sections es WHERE es.slug = 'neck'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_neck_cervical_strain', 'neck', 'Cervical Strain / Tech Neck Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'neck_cervical_strain'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Pain Relief + Mobility', 1,
  ARRAY['Reduce pain', 'Restore cervical ROM'],
  ARRAY[]::TEXT[],
  ARRAY['Full AROM pain ≤3/10']
FROM protocols p WHERE p.protocol_key = 'conservative_neck_cervical_strain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Deep Neck Flexor Endurance', 2,
  ARRAY['DNF activation and endurance'],
  ARRAY[]::TEXT[],
  ARRAY['Craniocervical flexion test improved', 'Holds 10s']
FROM protocols p WHERE p.protocol_key = 'conservative_neck_cervical_strain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Scapular + Postural Strength', 3,
  ARRAY['Mid-trap and deep neck flexor strength'],
  ARRAY[]::TEXT[],
  ARRAY['3x15 scapular exercises']
FROM protocols p WHERE p.protocol_key = 'conservative_neck_cervical_strain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 4, 'Return to Activity', 4,
  ARRAY['Full return to work/sport'],
  ARRAY[]::TEXT[],
  ARRAY['Full workday without pain increase']
FROM protocols p WHERE p.protocol_key = 'conservative_neck_cervical_strain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'neck_cervical_strain'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 8. Cervicogenic Headache
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'neck_cervicogenic_headache', 'Cervicogenic Headache', 2, true
FROM exercise_sections es WHERE es.slug = 'neck'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_neck_cervicogenic_headache', 'neck', 'Cervicogenic Headache Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'neck_cervicogenic_headache'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Symptom Calm + Mobility', 1,
  ARRAY['Reduce headache frequency', 'Restore upper cervical mobility'],
  ARRAY[]::TEXT[],
  ARRAY['Headache frequency reduced 50%']
FROM protocols p WHERE p.protocol_key = 'conservative_neck_cervicogenic_headache'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Motor Control (DNF) + Scapula', 2,
  ARRAY['Deep neck flexor control', 'Scapular stability'],
  ARRAY[]::TEXT[],
  ARRAY['DNF endurance 10x10s', 'Scapular symmetry']
FROM protocols p WHERE p.protocol_key = 'conservative_neck_cervicogenic_headache'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Endurance + Trigger Management', 3,
  ARRAY['Sustained postural endurance', 'Self-management of triggers'],
  ARRAY[]::TEXT[],
  ARRAY['Independent home program']
FROM protocols p WHERE p.protocol_key = 'conservative_neck_cervicogenic_headache'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'neck_cervicogenic_headache'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 9. Whiplash-Associated Disorder
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'neck_whiplash', 'Whiplash-Associated Disorder', 3, true
FROM exercise_sections es WHERE es.slug = 'neck'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_neck_whiplash', 'neck', 'Whiplash-Associated Disorder Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'neck_whiplash'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + Gentle ROM', 1,
  ARRAY['Pain education', 'Restore gentle cervical mobility'],
  ARRAY[]::TEXT[],
  ARRAY['Pain ≤4/10', 'Active ROM improving']
FROM protocols p WHERE p.protocol_key = 'conservative_neck_whiplash'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Motor Control + Tolerance', 2,
  ARRAY['Cervical motor control', 'Load tolerance'],
  ARRAY[]::TEXT[],
  ARRAY['Sustained cervical flexion 10s', 'No dizziness']
FROM protocols p WHERE p.protocol_key = 'conservative_neck_whiplash'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Strength + Functional Return', 3,
  ARRAY['Cervical and scapular strength', 'Return to driving/work'],
  ARRAY[]::TEXT[],
  ARRAY['Full work duties', 'Driving without pain']
FROM protocols p WHERE p.protocol_key = 'conservative_neck_whiplash'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'neck_whiplash'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- ============================================
-- SHOULDER INJURIES (section slug: shoulder)
-- ============================================

-- 10. Rotator Cuff Tendinopathy / Impingement
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'shoulder_rc_tendinopathy', 'Rotator Cuff Tendinopathy / Impingement', 1, true
FROM exercise_sections es WHERE es.slug = 'shoulder'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_shoulder_rc_tendinopathy', 'shoulder', 'Rotator Cuff Tendinopathy / Impingement Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'shoulder_rc_tendinopathy'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Pain Control + Scapular Positioning', 1,
  ARRAY['Reduce pain', 'Correct scapular position'],
  ARRAY[]::TEXT[],
  ARRAY['Pain ≤3/10 at rest', 'Scapular dyskinesis improved']
FROM protocols p WHERE p.protocol_key = 'conservative_shoulder_rc_tendinopathy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'RC Isometrics + ROM', 2,
  ARRAY['Pain-free RC isometrics', 'Restore full ROM'],
  ARRAY[]::TEXT[],
  ARRAY['Isometrics pain-free', 'Full shoulder ROM']
FROM protocols p WHERE p.protocol_key = 'conservative_shoulder_rc_tendinopathy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Strength + Overhead Tolerance', 3,
  ARRAY['RC and scapular strengthening', 'Overhead tolerance'],
  ARRAY[]::TEXT[],
  ARRAY['3x15 external rotation', 'Overhead reach pain-free']
FROM protocols p WHERE p.protocol_key = 'conservative_shoulder_rc_tendinopathy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 4, 'Return to Sport / Work', 4,
  ARRAY['Full return to overhead activities'],
  ARRAY[]::TEXT[],
  ARRAY['Sport/work demands met pain-free']
FROM protocols p WHERE p.protocol_key = 'conservative_shoulder_rc_tendinopathy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'shoulder_rc_tendinopathy'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 11. Adhesive Capsulitis (Frozen Shoulder)
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'shoulder_frozen_shoulder', 'Adhesive Capsulitis (Frozen Shoulder)', 2, true
FROM exercise_sections es WHERE es.slug = 'shoulder'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_shoulder_frozen_shoulder', 'shoulder', 'Adhesive Capsulitis (Frozen Shoulder) Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'shoulder_frozen_shoulder'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Pain Relief + Gentle Mobility', 1,
  ARRAY['Pain control', 'Pendulum and passive ROM'],
  ARRAY[]::TEXT[],
  ARRAY['Pain ≤4/10', 'Tolerates passive ROM']
FROM protocols p WHERE p.protocol_key = 'conservative_shoulder_frozen_shoulder'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Progressive Mobility', 2,
  ARRAY['Restore glenohumeral mobility progressively'],
  ARRAY[]::TEXT[],
  ARRAY['ER 40°+', 'Flexion 140°+']
FROM protocols p WHERE p.protocol_key = 'conservative_shoulder_frozen_shoulder'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Strength + Function', 3,
  ARRAY['RC strengthening', 'Return to ADLs'],
  ARRAY[]::TEXT[],
  ARRAY['Full functional ROM', 'Pain ≤2/10']
FROM protocols p WHERE p.protocol_key = 'conservative_shoulder_frozen_shoulder'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'shoulder_frozen_shoulder'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 12. Shoulder Instability (Non-op)
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'shoulder_instability', 'Shoulder Instability (Non-op)', 3, true
FROM exercise_sections es WHERE es.slug = 'shoulder'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_shoulder_instability', 'shoulder', 'Shoulder Instability (Non-op) Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'shoulder_instability'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Protection + Scapular Control', 1,
  ARRAY['Protect joint', 'Establish scapular stability'],
  ARRAY[]::TEXT[],
  ARRAY['No apprehension with daily tasks', 'Scapular control achieved']
FROM protocols p WHERE p.protocol_key = 'conservative_shoulder_instability'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Rotator Cuff + Dynamic Stability', 2,
  ARRAY['RC strengthening', 'Neuromuscular control'],
  ARRAY[]::TEXT[],
  ARRAY['3x15 ER/IR', 'Dynamic stability tests passed']
FROM protocols p WHERE p.protocol_key = 'conservative_shoulder_instability'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Advanced Stability + Return to Sport', 3,
  ARRAY['Sport-specific stability', 'Return to activity'],
  ARRAY[]::TEXT[],
  ARRAY['Sport demands met', 'No instability episodes']
FROM protocols p WHERE p.protocol_key = 'conservative_shoulder_instability'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'shoulder_instability'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 13. AC Joint Sprain
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'shoulder_ac_sprain', 'AC Joint Sprain', 4, true
FROM exercise_sections es WHERE es.slug = 'shoulder'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_shoulder_ac_sprain', 'shoulder', 'AC Joint Sprain Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'shoulder_ac_sprain'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + Protected ROM', 1,
  ARRAY['Pain control', 'Protected ROM'],
  ARRAY[]::TEXT[],
  ARRAY['Pain ≤3/10', 'ROM within protected range']
FROM protocols p WHERE p.protocol_key = 'conservative_shoulder_ac_sprain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Tolerance', 2,
  ARRAY['Periscapular strengthening', 'Progressive loading'],
  ARRAY[]::TEXT[],
  ARRAY['3x10 rows and press without pain']
FROM protocols p WHERE p.protocol_key = 'conservative_shoulder_ac_sprain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Return to Load', 3,
  ARRAY['Full return to lifting and sport'],
  ARRAY[]::TEXT[],
  ARRAY['Full overhead and loaded activities pain-free']
FROM protocols p WHERE p.protocol_key = 'conservative_shoulder_ac_sprain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'shoulder_ac_sprain'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- ============================================
-- ELBOW INJURIES (section slug: elbow)
-- ============================================

-- 14. Lateral Epicondylalgia (Tennis Elbow)
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'elbow_lateral_epicondylalgia', 'Lateral Epicondylalgia (Tennis Elbow)', 1, true
FROM exercise_sections es WHERE es.slug = 'elbow'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_elbow_lateral_epicondylalgia', 'elbow', 'Lateral Epicondylalgia (Tennis Elbow) Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'elbow_lateral_epicondylalgia'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + Isometrics', 1,
  ARRAY['Reduce pain', 'Introduce isometric wrist extension'],
  ARRAY[]::TEXT[],
  ARRAY['Isometrics pain ≤3/10', 'Daily tasks manageable']
FROM protocols p WHERE p.protocol_key = 'conservative_elbow_lateral_epicondylalgia'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Eccentric / Heavy Slow Resistance', 2,
  ARRAY['Tendon loading via HSR or eccentric'],
  ARRAY[]::TEXT[],
  ARRAY['Completes 3x15 HSR pain ≤4/10']
FROM protocols p WHERE p.protocol_key = 'conservative_elbow_lateral_epicondylalgia'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Functional Return', 3,
  ARRAY['Return to sport/grip demands'],
  ARRAY[]::TEXT[],
  ARRAY['Grip strength 90% of unaffected side', 'Sport-specific tasks pain-free']
FROM protocols p WHERE p.protocol_key = 'conservative_elbow_lateral_epicondylalgia'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'elbow_lateral_epicondylalgia'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 15. Medial Epicondylalgia (Golfer's Elbow)
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'elbow_medial_epicondylalgia', 'Medial Epicondylalgia (Golfer''s Elbow)', 2, true
FROM exercise_sections es WHERE es.slug = 'elbow'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_elbow_medial_epicondylalgia', 'elbow', 'Medial Epicondylalgia (Golfer''s Elbow) Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'elbow_medial_epicondylalgia'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + Isometrics', 1,
  ARRAY['Reduce pain', 'Wrist flexor isometrics'],
  ARRAY[]::TEXT[],
  ARRAY['Isometrics pain ≤3/10']
FROM protocols p WHERE p.protocol_key = 'conservative_elbow_medial_epicondylalgia'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Progressive Loading', 2,
  ARRAY['HSR wrist flexion', 'Grip loading'],
  ARRAY[]::TEXT[],
  ARRAY['3x15 wrist flexion loaded']
FROM protocols p WHERE p.protocol_key = 'conservative_elbow_medial_epicondylalgia'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Return to Sport / Grip', 3,
  ARRAY['Full grip and throwing/swing demands'],
  ARRAY[]::TEXT[],
  ARRAY['Grip and sport tasks pain-free']
FROM protocols p WHERE p.protocol_key = 'conservative_elbow_medial_epicondylalgia'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'elbow_medial_epicondylalgia'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 16. Cubital Tunnel Irritation
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'elbow_cubital_tunnel', 'Cubital Tunnel Irritation', 3, true
FROM exercise_sections es WHERE es.slug = 'elbow'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_elbow_cubital_tunnel', 'elbow', 'Cubital Tunnel Irritation Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'elbow_cubital_tunnel'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Irritation Reduction + Nerve Hygiene', 1,
  ARRAY['Reduce ulnar nerve irritation', 'Nerve glides'],
  ARRAY[]::TEXT[],
  ARRAY['Tingling reduced', 'Nerve glides tolerated']
FROM protocols p WHERE p.protocol_key = 'conservative_elbow_cubital_tunnel'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Mobility', 2,
  ARRAY['Intrinsic hand strength', 'Elbow ROM'],
  ARRAY[]::TEXT[],
  ARRAY['Full elbow ROM', 'Grip strength improving']
FROM protocols p WHERE p.protocol_key = 'conservative_elbow_cubital_tunnel'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Functional Return', 3,
  ARRAY['Return to typing/sport demands'],
  ARRAY[]::TEXT[],
  ARRAY['Sustained keyboard use pain-free', 'Sport tasks achieved']
FROM protocols p WHERE p.protocol_key = 'conservative_elbow_cubital_tunnel'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'elbow_cubital_tunnel'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- ============================================
-- WRIST & HAND INJURIES (section slug: wrist-hand)
-- ============================================

-- 17. Carpal Tunnel Syndrome
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'wrist_carpal_tunnel', 'Carpal Tunnel Syndrome', 1, true
FROM exercise_sections es WHERE es.slug = 'wrist-hand'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_wrist_carpal_tunnel', 'wrist_hand', 'Carpal Tunnel Syndrome Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'wrist_carpal_tunnel'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Symptom Calm + Nerve Glides', 1,
  ARRAY['Reduce night symptoms', 'Median nerve glides'],
  ARRAY[]::TEXT[],
  ARRAY['Night pain reduced', 'Glides tolerated without worsening']
FROM protocols p WHERE p.protocol_key = 'conservative_wrist_carpal_tunnel'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Ergonomics', 2,
  ARRAY['Intrinsic strengthening', 'Ergonomic corrections'],
  ARRAY[]::TEXT[],
  ARRAY['Grip strength 80%+', 'Workstation optimised']
FROM protocols p WHERE p.protocol_key = 'conservative_wrist_carpal_tunnel'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Functional Return', 3,
  ARRAY['Sustained computer and grip use pain-free'],
  ARRAY[]::TEXT[],
  ARRAY['8-hr workday without symptoms']
FROM protocols p WHERE p.protocol_key = 'conservative_wrist_carpal_tunnel'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'wrist_carpal_tunnel'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 18. De Quervain's Tenosynovitis
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'wrist_dequervain', 'De Quervain''s Tenosynovitis', 2, true
FROM exercise_sections es WHERE es.slug = 'wrist-hand'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_wrist_dequervain', 'wrist_hand', 'De Quervain''s Tenosynovitis Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'wrist_dequervain'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + Activity Modification', 1,
  ARRAY['Reduce pain with thumb activities', 'Load management'],
  ARRAY[]::TEXT[],
  ARRAY['Finkelstein pain ≤4/10']
FROM protocols p WHERE p.protocol_key = 'conservative_wrist_dequervain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Mobility + Loading', 2,
  ARRAY['Restore thumb and wrist mobility', 'Progressive loading'],
  ARRAY[]::TEXT[],
  ARRAY['Full thumb ROM', 'Pain-free resisted loading']
FROM protocols p WHERE p.protocol_key = 'conservative_wrist_dequervain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Return to Grip', 3,
  ARRAY['Return to pinch/grip tasks'],
  ARRAY[]::TEXT[],
  ARRAY['Pinch and grip pain-free']
FROM protocols p WHERE p.protocol_key = 'conservative_wrist_dequervain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'wrist_dequervain'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 19. Wrist Sprain
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'wrist_sprain', 'Wrist Sprain', 3, true
FROM exercise_sections es WHERE es.slug = 'wrist-hand'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_wrist_sprain', 'wrist_hand', 'Wrist Sprain Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'wrist_sprain'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + ROM', 1,
  ARRAY['Pain control', 'Restore wrist ROM'],
  ARRAY[]::TEXT[],
  ARRAY['Full wrist ROM', 'Pain ≤3/10']
FROM protocols p WHERE p.protocol_key = 'conservative_wrist_sprain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Proprioception', 2,
  ARRAY['Wrist and forearm strengthening', 'Proprioception'],
  ARRAY[]::TEXT[],
  ARRAY['3x15 wrist curl', 'Proprioception tests passing']
FROM protocols p WHERE p.protocol_key = 'conservative_wrist_sprain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Return to Sport / Work', 3,
  ARRAY['Return to weight-bearing and sport demands'],
  ARRAY[]::TEXT[],
  ARRAY['Push-up and grip pain-free']
FROM protocols p WHERE p.protocol_key = 'conservative_wrist_sprain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'wrist_sprain'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- ============================================
-- HIP INJURIES (section slug: hip)
-- ============================================

-- 20. Greater Trochanteric Pain Syndrome
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'hip_gtps', 'Greater Trochanteric Pain Syndrome', 1, true
FROM exercise_sections es WHERE es.slug = 'hip'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_hip_gtps', 'hip', 'Greater Trochanteric Pain Syndrome Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'hip_gtps'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + Load Management', 1,
  ARRAY['Reduce lateral hip pain', 'Avoid compressive postures'],
  ARRAY[]::TEXT[],
  ARRAY['Pain ≤3/10 with walking', 'No crossing legs']
FROM protocols p WHERE p.protocol_key = 'conservative_hip_gtps'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Glute Med Strength', 2,
  ARRAY['Progressive glute medius loading'],
  ARRAY[]::TEXT[],
  ARRAY['Side-lying hip abduction 3x15', 'Single-leg balance 10s']
FROM protocols p WHERE p.protocol_key = 'conservative_hip_gtps'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Functional Strength + Control', 3,
  ARRAY['Single-leg loading', 'Stair and slope tolerance'],
  ARRAY[]::TEXT[],
  ARRAY['Single-leg squat 3x10', 'Stairs pain-free']
FROM protocols p WHERE p.protocol_key = 'conservative_hip_gtps'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 4, 'Return to Running / Work', 4,
  ARRAY['Return to running or physical demands'],
  ARRAY[]::TEXT[],
  ARRAY['Run 20 min', 'Work duties pain-free']
FROM protocols p WHERE p.protocol_key = 'conservative_hip_gtps'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'hip_gtps'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 21. Hip Osteoarthritis
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'hip_osteoarthritis', 'Hip Osteoarthritis', 2, true
FROM exercise_sections es WHERE es.slug = 'hip'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_hip_osteoarthritis', 'hip', 'Hip Osteoarthritis Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'hip_osteoarthritis'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Mobility + Symptom Control', 1,
  ARRAY['Maintain hip ROM', 'Pain education'],
  ARRAY[]::TEXT[],
  ARRAY['Hip flexion 100°+', 'Pain manageable']
FROM protocols p WHERE p.protocol_key = 'conservative_hip_osteoarthritis'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Endurance', 2,
  ARRAY['Hip and quad strengthening'],
  ARRAY[]::TEXT[],
  ARRAY['3x12 hip strengthening', 'Walks 20 min']
FROM protocols p WHERE p.protocol_key = 'conservative_hip_osteoarthritis'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Functional Conditioning', 3,
  ARRAY['Community mobility', 'Stair and ADL confidence'],
  ARRAY[]::TEXT[],
  ARRAY['ADLs independent', 'Community ambulation achieved']
FROM protocols p WHERE p.protocol_key = 'conservative_hip_osteoarthritis'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'hip_osteoarthritis'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 22. Hip Flexor Strain / Tendinopathy
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'hip_flexor_strain', 'Hip Flexor Strain / Tendinopathy', 3, true
FROM exercise_sections es WHERE es.slug = 'hip'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_hip_flexor_strain', 'hip', 'Hip Flexor Strain / Tendinopathy Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'hip_flexor_strain'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + Gentle Mobility', 1,
  ARRAY['Reduce hip flexor pain', 'Gentle ROM'],
  ARRAY[]::TEXT[],
  ARRAY['Pain ≤3/10 with walking', 'Passive ROM restored']
FROM protocols p WHERE p.protocol_key = 'conservative_hip_flexor_strain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Progressive Strength', 2,
  ARRAY['Hip flexor and core progressive loading'],
  ARRAY[]::TEXT[],
  ARRAY['Resisted hip flexion 3x12', 'No pain with cycling']
FROM protocols p WHERE p.protocol_key = 'conservative_hip_flexor_strain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Return to Sprint / Load', 3,
  ARRAY['Return to running and sport'],
  ARRAY[]::TEXT[],
  ARRAY['Sprint pain-free', 'Sport demands met']
FROM protocols p WHERE p.protocol_key = 'conservative_hip_flexor_strain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'hip_flexor_strain'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 23. Femoroacetabular Impingement (Non-op)
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'hip_fai_nonop', 'Femoroacetabular Impingement (Non-op)', 4, true
FROM exercise_sections es WHERE es.slug = 'hip'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_hip_fai_nonop', 'hip', 'Femoroacetabular Impingement (Non-op) Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'hip_fai_nonop'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + ROM Strategy', 1,
  ARRAY['Identify pain-free ROM', 'Activity modification'],
  ARRAY[]::TEXT[],
  ARRAY['Pain-free arc of motion identified', 'Daily activities manageable']
FROM protocols p WHERE p.protocol_key = 'conservative_hip_fai_nonop'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Control', 2,
  ARRAY['Hip external rotator and abductor strengthening'],
  ARRAY[]::TEXT[],
  ARRAY['3x15 clamshell and hip ER', 'Single-leg balance 15s']
FROM protocols p WHERE p.protocol_key = 'conservative_hip_fai_nonop'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Return to Sport', 3,
  ARRAY['Sport-specific movement patterns'],
  ARRAY[]::TEXT[],
  ARRAY['Sport demands met', 'FAI symptoms ≤2/10']
FROM protocols p WHERE p.protocol_key = 'conservative_hip_fai_nonop'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'hip_fai_nonop'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- ============================================
-- KNEE INJURIES (section slug: knee)
-- ============================================

-- 24. Patellofemoral Pain
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'knee_pfp', 'Patellofemoral Pain', 1, true
FROM exercise_sections es WHERE es.slug = 'knee'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_knee_pfp', 'knee', 'Patellofemoral Pain Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'knee_pfp'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + Quad/Glute Activation', 1,
  ARRAY['Reduce anterior knee pain', 'Activate VMO and glutes'],
  ARRAY[]::TEXT[],
  ARRAY['Quad set and SLR pain-free', 'Pain ≤3/10 with stairs']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_pfp'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Control', 2,
  ARRAY['Progressive quad and hip strengthening'],
  ARRAY[]::TEXT[],
  ARRAY['Step-down 3x15', 'Single-leg press pain-free']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_pfp'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Return to Running / Jump', 3,
  ARRAY['Return to running and jumping'],
  ARRAY[]::TEXT[],
  ARRAY['Run 20 min pain-free', 'Hop test 90% limb symmetry']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_pfp'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'knee_pfp'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 25. Meniscus Irritation (Non-op)
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'knee_meniscus_nonop', 'Meniscus Irritation (Non-op)', 2, true
FROM exercise_sections es WHERE es.slug = 'knee'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_knee_meniscus_nonop', 'knee', 'Meniscus Irritation (Non-op) Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'knee_meniscus_nonop'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + ROM', 1,
  ARRAY['Reduce swelling', 'Restore knee ROM'],
  ARRAY[]::TEXT[],
  ARRAY['Full knee extension', 'Flexion 120°+', 'Effusion resolved']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_meniscus_nonop'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Stability', 2,
  ARRAY['Quad and hip strengthening'],
  ARRAY[]::TEXT[],
  ARRAY['3x15 leg press and step-down']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_meniscus_nonop'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Functional Return', 3,
  ARRAY['Return to sport and cutting'],
  ARRAY[]::TEXT[],
  ARRAY['Single-leg hop 90%', 'Sport tasks pain-free']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_meniscus_nonop'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'knee_meniscus_nonop'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 26. Knee Osteoarthritis
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'knee_osteoarthritis', 'Knee Osteoarthritis', 3, true
FROM exercise_sections es WHERE es.slug = 'knee'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_knee_osteoarthritis', 'knee', 'Knee Osteoarthritis Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'knee_osteoarthritis'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Symptom Control + Mobility', 1,
  ARRAY['Manage pain and stiffness', 'Maintain ROM'],
  ARRAY[]::TEXT[],
  ARRAY['Walks 10 min', 'Pain ≤4/10']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_osteoarthritis'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Endurance', 2,
  ARRAY['Quad and hip strengthening'],
  ARRAY[]::TEXT[],
  ARRAY['3x12 leg press', 'Walks 20 min']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_osteoarthritis'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Functional Conditioning', 3,
  ARRAY['Community mobility', 'Stair and ADL independence'],
  ARRAY[]::TEXT[],
  ARRAY['ADLs independent', 'Patient goals met']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_osteoarthritis'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'knee_osteoarthritis'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 27. MCL Sprain
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'knee_mcl_sprain', 'MCL Sprain', 4, true
FROM exercise_sections es WHERE es.slug = 'knee'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_knee_mcl_sprain', 'knee', 'MCL Sprain Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'knee_mcl_sprain'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Protection + ROM', 1,
  ARRAY['Protect MCL', 'Restore ROM in protected range'],
  ARRAY[]::TEXT[],
  ARRAY['Full extension', 'Flexion 90°+', 'Weight-bearing tolerated']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_mcl_sprain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Stability', 2,
  ARRAY['Quad, hip, and dynamic stability'],
  ARRAY[]::TEXT[],
  ARRAY['3x15 step-down', 'Single-leg balance 15s']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_mcl_sprain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Return to Cutting / Load', 3,
  ARRAY['Return to cutting and sport'],
  ARRAY[]::TEXT[],
  ARRAY['Hop test 90% symmetry', 'Sport demands met']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_mcl_sprain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'knee_mcl_sprain'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 28. IT Band Syndrome
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'knee_itbs', 'IT Band Syndrome', 5, true
FROM exercise_sections es WHERE es.slug = 'knee'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_knee_itbs', 'knee', 'IT Band Syndrome Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'knee_itbs'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + Load Management', 1,
  ARRAY['Reduce lateral knee pain', 'Load modification'],
  ARRAY[]::TEXT[],
  ARRAY['Pain ≤3/10 with walking', 'Provocative activities modified']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_itbs'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Hip Strength + Mechanics', 2,
  ARRAY['Glute and hip strengthening', 'Running mechanics'],
  ARRAY[]::TEXT[],
  ARRAY['3x15 hip abduction', 'Running cadence improved']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_itbs'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Return to Run', 3,
  ARRAY['Progressive return to running'],
  ARRAY[]::TEXT[],
  ARRAY['Run 30 min pain-free', 'Race demands met']
FROM protocols p WHERE p.protocol_key = 'conservative_knee_itbs'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'knee_itbs'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- ============================================
-- ANKLE INJURIES (section slug: ankle)
-- ============================================

-- 29. Lateral Ankle Sprain
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'ankle_lateral_sprain', 'Lateral Ankle Sprain', 1, true
FROM exercise_sections es WHERE es.slug = 'ankle'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_ankle_lateral_sprain', 'ankle', 'Lateral Ankle Sprain Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'ankle_lateral_sprain'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Swelling / Pain Control + ROM', 1,
  ARRAY['Reduce swelling and pain', 'Restore ankle ROM'],
  ARRAY[]::TEXT[],
  ARRAY['Effusion resolved', 'Full ROM', 'Full weight-bearing']
FROM protocols p WHERE p.protocol_key = 'conservative_ankle_lateral_sprain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Balance', 2,
  ARRAY['Peroneal and calf strengthening', 'Single-leg balance'],
  ARRAY[]::TEXT[],
  ARRAY['3x15 resisted eversion', 'Single-leg balance 20s']
FROM protocols p WHERE p.protocol_key = 'conservative_ankle_lateral_sprain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Plyo / Agility + Return to Sport', 3,
  ARRAY['Hop and agility demands', 'Return to sport'],
  ARRAY[]::TEXT[],
  ARRAY['Hop test 90%', 'Sport-specific drills pain-free']
FROM protocols p WHERE p.protocol_key = 'conservative_ankle_lateral_sprain'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'ankle_lateral_sprain'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 30. Achilles Tendinopathy
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'ankle_achilles_tendinopathy', 'Achilles Tendinopathy', 2, true
FROM exercise_sections es WHERE es.slug = 'ankle'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_ankle_achilles_tendinopathy', 'ankle', 'Achilles Tendinopathy Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'ankle_achilles_tendinopathy'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Load Management + Isometrics', 1,
  ARRAY['Manage load', 'Introduce isometric calf loading'],
  ARRAY[]::TEXT[],
  ARRAY['Isometrics pain ≤3/10', 'Morning stiffness reducing']
FROM protocols p WHERE p.protocol_key = 'conservative_ankle_achilles_tendinopathy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Progressive Strength (HSR / Eccentric)', 2,
  ARRAY['Progressive calf HSR or eccentric loading'],
  ARRAY[]::TEXT[],
  ARRAY['3x15 heavy slow calf raises', 'VISA-A improving']
FROM protocols p WHERE p.protocol_key = 'conservative_ankle_achilles_tendinopathy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Return to Running / Jumping', 3,
  ARRAY['Progressive return to running and jumping'],
  ARRAY[]::TEXT[],
  ARRAY['Run 30 min', 'Single-leg hop 90%']
FROM protocols p WHERE p.protocol_key = 'conservative_ankle_achilles_tendinopathy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'ankle_achilles_tendinopathy'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 31. Posterior Tibialis Tendinopathy
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'ankle_posterior_tib_tendinopathy', 'Posterior Tibialis Tendinopathy', 3, true
FROM exercise_sections es WHERE es.slug = 'ankle'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_ankle_posterior_tib_tendinopathy', 'ankle', 'Posterior Tibialis Tendinopathy Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'ankle_posterior_tib_tendinopathy'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + Support', 1,
  ARRAY['Reduce medial ankle pain', 'Off-load tendon'],
  ARRAY[]::TEXT[],
  ARRAY['Walking pain ≤3/10', 'Orthotic or taping tolerated']
FROM protocols p WHERE p.protocol_key = 'conservative_ankle_posterior_tib_tendinopathy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Foot Control', 2,
  ARRAY['Posterior tib and foot intrinsic strengthening'],
  ARRAY[]::TEXT[],
  ARRAY['Single-leg heel raise x10', 'Foot pronation reduced']
FROM protocols p WHERE p.protocol_key = 'conservative_ankle_posterior_tib_tendinopathy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Return to Walking / Run', 3,
  ARRAY['Progressive return to walking and running'],
  ARRAY[]::TEXT[],
  ARRAY['Run 20 min pain-free', 'Arch control maintained']
FROM protocols p WHERE p.protocol_key = 'conservative_ankle_posterior_tib_tendinopathy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'ankle_posterior_tib_tendinopathy'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- ============================================
-- FOOT INJURIES (section slug: foot)
-- ============================================

-- 32. Plantar Fasciitis
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'foot_plantar_fasciitis', 'Plantar Fasciitis', 1, true
FROM exercise_sections es WHERE es.slug = 'foot'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_foot_plantar_fasciitis', 'foot', 'Plantar Fasciitis Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'foot_plantar_fasciitis'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + Mobility', 1,
  ARRAY['Reduce first-step pain', 'Calf and plantar mobility'],
  ARRAY[]::TEXT[],
  ARRAY['First-step pain ≤4/10', 'Calf flexibility improving']
FROM protocols p WHERE p.protocol_key = 'conservative_foot_plantar_fasciitis'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Load Tolerance', 2,
  ARRAY['Intrinsic foot strength', 'Progressive calf loading'],
  ARRAY[]::TEXT[],
  ARRAY['3x12 single-leg heel raise', 'Plantar fascia load tolerated']
FROM protocols p WHERE p.protocol_key = 'conservative_foot_plantar_fasciitis'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Return to Walk / Run', 3,
  ARRAY['Return to full walking and running'],
  ARRAY[]::TEXT[],
  ARRAY['Walk 30 min', 'Run without pain flare']
FROM protocols p WHERE p.protocol_key = 'conservative_foot_plantar_fasciitis'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'foot_plantar_fasciitis'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 33. Metatarsalgia
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'foot_metatarsalgia', 'Metatarsalgia', 2, true
FROM exercise_sections es WHERE es.slug = 'foot'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_foot_metatarsalgia', 'foot', 'Metatarsalgia Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'foot_metatarsalgia'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Calm + Offload', 1,
  ARRAY['Reduce forefoot pain', 'Pressure redistribution'],
  ARRAY[]::TEXT[],
  ARRAY['Walking pain ≤3/10', 'Footwear modification tolerated']
FROM protocols p WHERE p.protocol_key = 'conservative_foot_metatarsalgia'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Mobility', 2,
  ARRAY['Intrinsic foot strengthening', 'Toe mobility'],
  ARRAY[]::TEXT[],
  ARRAY['Toe spread 3x15', 'Metatarsal mobility improved']
FROM protocols p WHERE p.protocol_key = 'conservative_foot_metatarsalgia'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Functional Return', 3,
  ARRAY['Return to sport and prolonged standing'],
  ARRAY[]::TEXT[],
  ARRAY['Prolonged weight-bearing and sport pain-free']
FROM protocols p WHERE p.protocol_key = 'conservative_foot_metatarsalgia'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'foot_metatarsalgia'
ON CONFLICT (injury_id, slot_number) DO NOTHING;

-- 34. Hallux Rigidus / Limitus
INSERT INTO injuries (section_id, injury_key, display_name, display_order, is_active)
SELECT es.id, 'foot_hallux_limitus', 'Hallux Rigidus / Limitus', 3, true
FROM exercise_sections es WHERE es.slug = 'foot'
ON CONFLICT (injury_key) DO UPDATE SET display_name = EXCLUDED.display_name, display_order = EXCLUDED.display_order;

INSERT INTO protocols (protocol_key, region, surgery_name, protocol_type, injury_id, is_active)
SELECT 'conservative_foot_hallux_limitus', 'foot', 'Hallux Rigidus / Limitus Conservative Rehab', 'conservative', i.id, true
FROM injuries i WHERE i.injury_key = 'foot_hallux_limitus'
ON CONFLICT (protocol_key) DO UPDATE SET protocol_type = 'conservative', injury_id = EXCLUDED.injury_id;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 1, 'Mobility + Symptom Calm', 1,
  ARRAY['Restore 1st MTP extension', 'Reduce pain'],
  ARRAY[]::TEXT[],
  ARRAY['1st MTP extension 20°+', 'Pain ≤3/10']
FROM protocols p WHERE p.protocol_key = 'conservative_foot_hallux_limitus'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 2, 'Strength + Foot Mechanics', 2,
  ARRAY['Intrinsic and calf strength', 'Gait retraining'],
  ARRAY[]::TEXT[],
  ARRAY['Single-leg heel raise x10', 'Gait mechanics improved']
FROM protocols p WHERE p.protocol_key = 'conservative_foot_hallux_limitus'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order, goals, precautions, progress_criteria)
SELECT p.id, 3, 'Return to Activity', 3,
  ARRAY['Return to walking, sport, and prolonged standing'],
  ARRAY[]::TEXT[],
  ARRAY['Prolonged activity pain-free']
FROM protocols p WHERE p.protocol_key = 'conservative_foot_hallux_limitus'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, goals = EXCLUDED.goals, precautions = EXCLUDED.precautions, progress_criteria = EXCLUDED.progress_criteria;

INSERT INTO injury_videos (injury_id, slot_number, display_order)
SELECT i.id, s, s FROM injuries i, generate_series(1,8) s
WHERE i.injury_key = 'foot_hallux_limitus'
ON CONFLICT (injury_id, slot_number) DO NOTHING;
