-- Migration: Add post-op assessment fields to assessments table
-- Date: 2026-02-03
-- Purpose: Support post-operative rehabilitation protocol selection in assessments

-- Add new columns for post-op data
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS surgery_status TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS post_op_region TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS surgery_type TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS procedure_modifier TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS weeks_since_surgery TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS weight_bearing_status TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS surgeon_precautions TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS protocol_key_selected TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS phase_number_selected INT;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assessments_surgery_status ON assessments(surgery_status);
CREATE INDEX IF NOT EXISTS idx_assessments_protocol_key ON assessments(protocol_key_selected);

-- Add comment to table
COMMENT ON COLUMN assessments.surgery_status IS 'User surgery status: no_surgery, post_op, or not_sure';
COMMENT ON COLUMN assessments.post_op_region IS 'Body region of surgery: Shoulder, Knee, Hip, Elbow, Foot/Ankle';
COMMENT ON COLUMN assessments.surgery_type IS 'Type of surgery performed (e.g., acl_reconstruction, rotator_cuff_repair)';
COMMENT ON COLUMN assessments.procedure_modifier IS 'Additional procedure details (e.g., Grade 1, Grade 2, Grade 3 for rotator cuff)';
COMMENT ON COLUMN assessments.weeks_since_surgery IS 'Time since surgery: 0-2 weeks, 2-6 weeks, 6-12 weeks, 12+ weeks';
COMMENT ON COLUMN assessments.weight_bearing_status IS 'Weight bearing status for lower extremity surgeries';
COMMENT ON COLUMN assessments.surgeon_precautions IS 'Whether user has surgeon-specified restrictions';
COMMENT ON COLUMN assessments.protocol_key_selected IS 'Generated protocol key matching protocols table';
COMMENT ON COLUMN assessments.phase_number_selected IS 'Determined phase number based on time and safety gates';
