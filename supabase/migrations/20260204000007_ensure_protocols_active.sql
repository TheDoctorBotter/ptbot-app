-- Migration: Ensure all protocols are active
-- Date: 2026-02-04
-- Purpose: Fix any protocols that may have been inadvertently set to inactive

-- Set all protocols to active
UPDATE protocols SET is_active = true WHERE is_active = false OR is_active IS NULL;

-- Verify
-- SELECT protocol_key, is_active FROM protocols ORDER BY protocol_key;
