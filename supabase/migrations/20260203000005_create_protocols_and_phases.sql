-- Migration: Create protocols and protocol_phases tables with seed data
-- Date: 2026-02-03
-- Purpose: Store post-operative rehabilitation protocol definitions and phases

-- ============================================
-- TABLE: protocols
-- ============================================
CREATE TABLE IF NOT EXISTS protocols (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_key TEXT UNIQUE NOT NULL,
  region TEXT NOT NULL,
  surgery_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_protocols_key ON protocols(protocol_key);
CREATE INDEX IF NOT EXISTS idx_protocols_region ON protocols(region);

-- ============================================
-- TABLE: protocol_phases
-- ============================================
CREATE TABLE IF NOT EXISTS protocol_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  phase_number INT NOT NULL,
  phase_name TEXT NOT NULL,
  display_order INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(protocol_id, phase_number)
);

CREATE INDEX IF NOT EXISTS idx_protocol_phases_protocol_id ON protocol_phases(protocol_id);

-- ============================================
-- SEED: SHOULDER PROTOCOLS
-- ============================================

-- Rotator Cuff Repair - Grade 1 (Small Tear)
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('shoulder_rotator_cuff_repair_grade1', 'shoulder', 'Rotator Cuff Repair – Grade 1 (Small Tear)', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection / Immobilization', 1
FROM protocols p WHERE p.protocol_key = 'shoulder_rotator_cuff_repair_grade1'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Passive and Assisted Motion', 2
FROM protocols p WHERE p.protocol_key = 'shoulder_rotator_cuff_repair_grade1'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Active Motion and Early Strength', 3
FROM protocols p WHERE p.protocol_key = 'shoulder_rotator_cuff_repair_grade1'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Advanced Strength and Functional Use', 4
FROM protocols p WHERE p.protocol_key = 'shoulder_rotator_cuff_repair_grade1'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Rotator Cuff Repair - Grade 2 (Medium Tear)
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('shoulder_rotator_cuff_repair_grade2', 'shoulder', 'Rotator Cuff Repair – Grade 2 (Medium Tear)', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection / Immobilization', 1
FROM protocols p WHERE p.protocol_key = 'shoulder_rotator_cuff_repair_grade2'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Passive Motion', 2
FROM protocols p WHERE p.protocol_key = 'shoulder_rotator_cuff_repair_grade2'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Active Motion', 3
FROM protocols p WHERE p.protocol_key = 'shoulder_rotator_cuff_repair_grade2'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Progressive Strengthening', 4
FROM protocols p WHERE p.protocol_key = 'shoulder_rotator_cuff_repair_grade2'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 5, 'Functional and Return to Activity', 5
FROM protocols p WHERE p.protocol_key = 'shoulder_rotator_cuff_repair_grade2'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Rotator Cuff Repair - Grade 3 (Large/Massive Tear)
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('shoulder_rotator_cuff_repair_grade3', 'shoulder', 'Rotator Cuff Repair – Grade 3 (Large/Massive Tear)', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Extended Protection', 1
FROM protocols p WHERE p.protocol_key = 'shoulder_rotator_cuff_repair_grade3'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Passive Motion', 2
FROM protocols p WHERE p.protocol_key = 'shoulder_rotator_cuff_repair_grade3'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Assisted to Active Motion', 3
FROM protocols p WHERE p.protocol_key = 'shoulder_rotator_cuff_repair_grade3'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Gradual Strengthening', 4
FROM protocols p WHERE p.protocol_key = 'shoulder_rotator_cuff_repair_grade3'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 5, 'Functional Reintegration', 5
FROM protocols p WHERE p.protocol_key = 'shoulder_rotator_cuff_repair_grade3'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Labral Repair (SLAP / Bankart)
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('shoulder_labral_repair', 'shoulder', 'Labral Repair (SLAP / Bankart)', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection', 1
FROM protocols p WHERE p.protocol_key = 'shoulder_labral_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Gradual Range of Motion', 2
FROM protocols p WHERE p.protocol_key = 'shoulder_labral_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Strength and Dynamic Stability', 3
FROM protocols p WHERE p.protocol_key = 'shoulder_labral_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Functional and Sport-Specific Control', 4
FROM protocols p WHERE p.protocol_key = 'shoulder_labral_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Shoulder Stabilization (Anterior / Posterior)
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('shoulder_stabilization', 'shoulder', 'Shoulder Stabilization (Anterior / Posterior)', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection', 1
FROM protocols p WHERE p.protocol_key = 'shoulder_stabilization'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Mobility Restoration', 2
FROM protocols p WHERE p.protocol_key = 'shoulder_stabilization'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Strength and Neuromuscular Control', 3
FROM protocols p WHERE p.protocol_key = 'shoulder_stabilization'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Return to Functional Activity', 4
FROM protocols p WHERE p.protocol_key = 'shoulder_stabilization'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Total Shoulder Arthroplasty
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('shoulder_total_shoulder_arthroplasty', 'shoulder', 'Total Shoulder Arthroplasty', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection and Early Motion', 1
FROM protocols p WHERE p.protocol_key = 'shoulder_total_shoulder_arthroplasty'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Range of Motion Restoration', 2
FROM protocols p WHERE p.protocol_key = 'shoulder_total_shoulder_arthroplasty'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Strength and Stability', 3
FROM protocols p WHERE p.protocol_key = 'shoulder_total_shoulder_arthroplasty'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Functional Use', 4
FROM protocols p WHERE p.protocol_key = 'shoulder_total_shoulder_arthroplasty'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Reverse Total Shoulder Arthroplasty
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('shoulder_reverse_total_shoulder_arthroplasty', 'shoulder', 'Reverse Total Shoulder Arthroplasty', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection and Deltoid Activation', 1
FROM protocols p WHERE p.protocol_key = 'shoulder_reverse_total_shoulder_arthroplasty'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Controlled Range of Motion', 2
FROM protocols p WHERE p.protocol_key = 'shoulder_reverse_total_shoulder_arthroplasty'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Functional Strength', 3
FROM protocols p WHERE p.protocol_key = 'shoulder_reverse_total_shoulder_arthroplasty'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Activity Optimization', 4
FROM protocols p WHERE p.protocol_key = 'shoulder_reverse_total_shoulder_arthroplasty'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- ============================================
-- SEED: KNEE PROTOCOLS
-- ============================================

-- Total Knee Arthroplasty
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('knee_total_knee_arthroplasty', 'knee', 'Total Knee Arthroplasty', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Pain Control and Early Mobility', 1
FROM protocols p WHERE p.protocol_key = 'knee_total_knee_arthroplasty'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Range of Motion and Strength', 2
FROM protocols p WHERE p.protocol_key = 'knee_total_knee_arthroplasty'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Functional Strength and Gait', 3
FROM protocols p WHERE p.protocol_key = 'knee_total_knee_arthroplasty'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Advanced Function', 4
FROM protocols p WHERE p.protocol_key = 'knee_total_knee_arthroplasty'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- ACL Reconstruction
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('knee_acl_reconstruction', 'knee', 'ACL Reconstruction', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection and Early Motion', 1
FROM protocols p WHERE p.protocol_key = 'knee_acl_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Strength and Neuromuscular Control', 2
FROM protocols p WHERE p.protocol_key = 'knee_acl_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Advanced Strength and Agility', 3
FROM protocols p WHERE p.protocol_key = 'knee_acl_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Return to Sport / Activity', 4
FROM protocols p WHERE p.protocol_key = 'knee_acl_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- PCL Reconstruction
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('knee_pcl_reconstruction', 'knee', 'PCL Reconstruction', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection', 1
FROM protocols p WHERE p.protocol_key = 'knee_pcl_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Progressive Motion', 2
FROM protocols p WHERE p.protocol_key = 'knee_pcl_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Strength and Control', 3
FROM protocols p WHERE p.protocol_key = 'knee_pcl_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Functional Performance', 4
FROM protocols p WHERE p.protocol_key = 'knee_pcl_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Meniscus Repair
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('knee_meniscus_repair', 'knee', 'Meniscus Repair', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection', 1
FROM protocols p WHERE p.protocol_key = 'knee_meniscus_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Controlled Motion', 2
FROM protocols p WHERE p.protocol_key = 'knee_meniscus_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Strength and Stability', 3
FROM protocols p WHERE p.protocol_key = 'knee_meniscus_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Functional Reintegration', 4
FROM protocols p WHERE p.protocol_key = 'knee_meniscus_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Partial Meniscectomy
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('knee_partial_meniscectomy', 'knee', 'Partial Meniscectomy', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Symptom Control and Mobility', 1
FROM protocols p WHERE p.protocol_key = 'knee_partial_meniscectomy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Strength and Movement Restoration', 2
FROM protocols p WHERE p.protocol_key = 'knee_partial_meniscectomy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Functional Progression', 3
FROM protocols p WHERE p.protocol_key = 'knee_partial_meniscectomy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Patellar Tendon Repair
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('knee_patellar_tendon_repair', 'knee', 'Patellar Tendon Repair', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection', 1
FROM protocols p WHERE p.protocol_key = 'knee_patellar_tendon_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Controlled Mobility', 2
FROM protocols p WHERE p.protocol_key = 'knee_patellar_tendon_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Progressive Strength', 3
FROM protocols p WHERE p.protocol_key = 'knee_patellar_tendon_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Functional Activity', 4
FROM protocols p WHERE p.protocol_key = 'knee_patellar_tendon_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- ============================================
-- SEED: HIP PROTOCOLS
-- ============================================

-- Total Hip Arthroplasty (Anterior)
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('hip_total_hip_arthroplasty_anterior', 'hip', 'Total Hip Arthroplasty (Anterior)', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection and Mobility', 1
FROM protocols p WHERE p.protocol_key = 'hip_total_hip_arthroplasty_anterior'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Strength and Gait Training', 2
FROM protocols p WHERE p.protocol_key = 'hip_total_hip_arthroplasty_anterior'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Functional Strength', 3
FROM protocols p WHERE p.protocol_key = 'hip_total_hip_arthroplasty_anterior'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Activity Reintegration', 4
FROM protocols p WHERE p.protocol_key = 'hip_total_hip_arthroplasty_anterior'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Total Hip Arthroplasty (Posterior)
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('hip_total_hip_arthroplasty_posterior', 'hip', 'Total Hip Arthroplasty (Posterior)', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection with Precautions', 1
FROM protocols p WHERE p.protocol_key = 'hip_total_hip_arthroplasty_posterior'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Range of Motion and Strength', 2
FROM protocols p WHERE p.protocol_key = 'hip_total_hip_arthroplasty_posterior'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Functional Strength', 3
FROM protocols p WHERE p.protocol_key = 'hip_total_hip_arthroplasty_posterior'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Activity Reintegration', 4
FROM protocols p WHERE p.protocol_key = 'hip_total_hip_arthroplasty_posterior'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Hip Labral Repair
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('hip_labral_repair', 'hip', 'Hip Labral Repair', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection', 1
FROM protocols p WHERE p.protocol_key = 'hip_labral_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Controlled Mobility', 2
FROM protocols p WHERE p.protocol_key = 'hip_labral_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Strength and Stability', 3
FROM protocols p WHERE p.protocol_key = 'hip_labral_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Functional Progression', 4
FROM protocols p WHERE p.protocol_key = 'hip_labral_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- FAI Surgery
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('hip_fai_surgery', 'hip', 'Femoroacetabular Impingement (FAI) Surgery', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection and Mobility', 1
FROM protocols p WHERE p.protocol_key = 'hip_fai_surgery'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Movement Re-education', 2
FROM protocols p WHERE p.protocol_key = 'hip_fai_surgery'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Strength and Control', 3
FROM protocols p WHERE p.protocol_key = 'hip_fai_surgery'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Return to Activity', 4
FROM protocols p WHERE p.protocol_key = 'hip_fai_surgery'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- ============================================
-- SEED: ELBOW PROTOCOLS
-- ============================================

-- UCL Reconstruction (Tommy John)
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('elbow_ucl_reconstruction', 'elbow', 'Ulnar Collateral Ligament Reconstruction (Tommy John)', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection', 1
FROM protocols p WHERE p.protocol_key = 'elbow_ucl_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Range of Motion Restoration', 2
FROM protocols p WHERE p.protocol_key = 'elbow_ucl_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Strength and Kinetic Chain Integration', 3
FROM protocols p WHERE p.protocol_key = 'elbow_ucl_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Functional Progression', 4
FROM protocols p WHERE p.protocol_key = 'elbow_ucl_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 5, 'Return to Sport', 5
FROM protocols p WHERE p.protocol_key = 'elbow_ucl_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- UCL Repair
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('elbow_ucl_repair', 'elbow', 'Ulnar Collateral Ligament Repair', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection', 1
FROM protocols p WHERE p.protocol_key = 'elbow_ucl_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Controlled Motion', 2
FROM protocols p WHERE p.protocol_key = 'elbow_ucl_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Strength', 3
FROM protocols p WHERE p.protocol_key = 'elbow_ucl_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Functional Use', 4
FROM protocols p WHERE p.protocol_key = 'elbow_ucl_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Distal Biceps Tendon Repair
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('elbow_distal_biceps_repair', 'elbow', 'Distal Biceps Tendon Repair', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection', 1
FROM protocols p WHERE p.protocol_key = 'elbow_distal_biceps_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Range of Motion', 2
FROM protocols p WHERE p.protocol_key = 'elbow_distal_biceps_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Strength', 3
FROM protocols p WHERE p.protocol_key = 'elbow_distal_biceps_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Functional Reintegration', 4
FROM protocols p WHERE p.protocol_key = 'elbow_distal_biceps_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Lateral Epicondyle Debridement / Repair
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('elbow_lateral_epicondyle_repair', 'elbow', 'Lateral Epicondyle Debridement / Repair', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection', 1
FROM protocols p WHERE p.protocol_key = 'elbow_lateral_epicondyle_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Mobility', 2
FROM protocols p WHERE p.protocol_key = 'elbow_lateral_epicondyle_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Strength', 3
FROM protocols p WHERE p.protocol_key = 'elbow_lateral_epicondyle_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Functional Activity', 4
FROM protocols p WHERE p.protocol_key = 'elbow_lateral_epicondyle_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- ============================================
-- SEED: FOOT & ANKLE PROTOCOLS
-- ============================================

-- Achilles Tendon Repair
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('foot_ankle_achilles_tendon_repair', 'foot_ankle', 'Achilles Tendon Repair', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection', 1
FROM protocols p WHERE p.protocol_key = 'foot_ankle_achilles_tendon_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Controlled Mobility', 2
FROM protocols p WHERE p.protocol_key = 'foot_ankle_achilles_tendon_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Strength and Endurance', 3
FROM protocols p WHERE p.protocol_key = 'foot_ankle_achilles_tendon_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Functional Progression', 4
FROM protocols p WHERE p.protocol_key = 'foot_ankle_achilles_tendon_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Ankle Ligament Reconstruction
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('foot_ankle_ankle_ligament_reconstruction', 'foot_ankle', 'Ankle Ligament Reconstruction', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection', 1
FROM protocols p WHERE p.protocol_key = 'foot_ankle_ankle_ligament_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Range of Motion', 2
FROM protocols p WHERE p.protocol_key = 'foot_ankle_ankle_ligament_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Strength and Proprioception', 3
FROM protocols p WHERE p.protocol_key = 'foot_ankle_ankle_ligament_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Return to Activity', 4
FROM protocols p WHERE p.protocol_key = 'foot_ankle_ankle_ligament_reconstruction'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Ankle Arthroscopy
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('foot_ankle_ankle_arthroscopy', 'foot_ankle', 'Ankle Arthroscopy', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Symptom Control and Mobility', 1
FROM protocols p WHERE p.protocol_key = 'foot_ankle_ankle_arthroscopy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Strength and Balance', 2
FROM protocols p WHERE p.protocol_key = 'foot_ankle_ankle_arthroscopy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Functional Activity', 3
FROM protocols p WHERE p.protocol_key = 'foot_ankle_ankle_arthroscopy'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Plantar Fascia Release
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('foot_ankle_plantar_fascia_release', 'foot_ankle', 'Plantar Fascia Release', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection', 1
FROM protocols p WHERE p.protocol_key = 'foot_ankle_plantar_fascia_release'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Mobility and Load Tolerance', 2
FROM protocols p WHERE p.protocol_key = 'foot_ankle_plantar_fascia_release'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Functional Strength', 3
FROM protocols p WHERE p.protocol_key = 'foot_ankle_plantar_fascia_release'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- Lisfranc Repair
INSERT INTO protocols (protocol_key, region, surgery_name, is_active)
VALUES ('foot_ankle_lisfranc_repair', 'foot_ankle', 'Lisfranc Repair', true)
ON CONFLICT (protocol_key) DO UPDATE SET
  region = EXCLUDED.region,
  surgery_name = EXCLUDED.surgery_name,
  is_active = EXCLUDED.is_active;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 1, 'Protection', 1
FROM protocols p WHERE p.protocol_key = 'foot_ankle_lisfranc_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 2, 'Controlled Mobility', 2
FROM protocols p WHERE p.protocol_key = 'foot_ankle_lisfranc_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 3, 'Strength and Stability', 3
FROM protocols p WHERE p.protocol_key = 'foot_ankle_lisfranc_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

INSERT INTO protocol_phases (protocol_id, phase_number, phase_name, display_order)
SELECT p.id, 4, 'Functional Reintegration', 4
FROM protocols p WHERE p.protocol_key = 'foot_ankle_lisfranc_repair'
ON CONFLICT (protocol_id, phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, display_order = EXCLUDED.display_order;

-- ============================================
-- EXAMPLE QUERY: Fetch protocol with phases
-- ============================================
-- SELECT
--   p.protocol_key,
--   p.surgery_name,
--   p.region,
--   ph.phase_number,
--   ph.phase_name
-- FROM protocols p
-- JOIN protocol_phases ph ON ph.protocol_id = p.id
-- WHERE p.protocol_key = 'knee_acl_reconstruction'
-- ORDER BY ph.phase_number;
