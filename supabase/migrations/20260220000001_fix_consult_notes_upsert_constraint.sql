-- Migration: Fix consult_notes upsert by restoring proper unique constraint
-- Date: 2026-02-20
--
-- Background:
--   Migration 20260219400000 replaced the UNIQUE CONSTRAINT on appointment_id
--   with a PARTIAL UNIQUE INDEX (WHERE appointment_id IS NOT NULL) to allow
--   PTBot-generated notes (appointment_id IS NULL) to coexist. However:
--
--   1. PostgreSQL UNIQUE constraints already treat NULLs as distinct — multiple
--      rows with appointment_id IS NULL are ALWAYS allowed without a partial
--      index. The partial index was unnecessary.
--
--   2. The partial index breaks PostgREST's upsert. PostgREST generates:
--        INSERT ... ON CONFLICT (appointment_id) DO UPDATE ...
--      PostgreSQL requires a unique CONSTRAINT (not just an index) to resolve
--      ON CONFLICT clauses. The partial index causes:
--        ERROR: there is no unique or exclusion constraint matching
--               the ON CONFLICT specification
--      making every save attempt fail.
--
-- Fix:
--   Drop the partial index and restore the full unique constraint.

-- 1. Drop the partial unique index added in 20260219400000
DROP INDEX IF EXISTS consult_notes_appointment_id_unique;

-- 2. Restore the unique constraint.
--    NULLs are never considered equal by PostgreSQL's UNIQUE constraint,
--    so multiple PTBot notes with appointment_id IS NULL are still permitted.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'consult_notes_appointment_id_key'
      AND conrelid = 'consult_notes'::regclass
  ) THEN
    ALTER TABLE consult_notes
      ADD CONSTRAINT consult_notes_appointment_id_key UNIQUE (appointment_id);
  END IF;
END $$;
