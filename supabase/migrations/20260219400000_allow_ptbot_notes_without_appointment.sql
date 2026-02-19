-- Allow consult_notes to be created without an appointment or clinician
-- This enables PTBot AI-generated notes (imports) that are not tied to a
-- telehealth appointment and have no human clinician.

-- 1. Drop NOT NULL on appointment_id
ALTER TABLE consult_notes
  ALTER COLUMN appointment_id DROP NOT NULL;

-- 2. Drop NOT NULL on clinician_user_id (PTBot notes have no human clinician)
ALTER TABLE consult_notes
  ALTER COLUMN clinician_user_id DROP NOT NULL;

-- 3. Drop the old unique constraint on appointment_id
ALTER TABLE consult_notes
  DROP CONSTRAINT IF EXISTS consult_notes_appointment_id_key;

-- 4. Add a partial unique index so telehealth consults still enforce
--    one-note-per-appointment, but PTBot notes (appointment_id IS NULL)
--    are unconstrained
CREATE UNIQUE INDEX IF NOT EXISTS consult_notes_appointment_id_unique
  ON consult_notes(appointment_id)
  WHERE appointment_id IS NOT NULL;

COMMENT ON COLUMN consult_notes.appointment_id IS
  'References a telehealth appointment. NULL for PTBot AI-generated import notes that are not linked to a scheduled consult.';

COMMENT ON COLUMN consult_notes.clinician_user_id IS
  'The clinician who created the note. NULL for PTBot AI-generated import notes (note_type = ''ptbot_import'').';
