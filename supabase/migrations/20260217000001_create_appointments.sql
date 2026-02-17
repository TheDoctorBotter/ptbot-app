-- Migration: Create appointments table for PTBot Zoom Call scheduling
-- Date: 2026-02-17

-- ============================================
-- CREATE APPOINTMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User/Patient info
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT,
  patient_phone TEXT,

  -- Appointment details
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,

  -- Google Calendar integration
  google_event_id TEXT,
  google_event_link TEXT,

  -- Zoom meeting details (optional - can be added when PT confirms)
  zoom_meeting_id TEXT,
  zoom_meeting_url TEXT,
  zoom_meeting_passcode TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),

  -- Auto-confirm logic
  auto_confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users(id),

  -- Notes
  patient_notes TEXT,
  pt_notes TEXT,
  cancellation_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_google_event_id ON appointments(google_event_id);

-- Composite index for finding appointments in a time range
CREATE INDEX idx_appointments_time_range ON appointments(start_time, end_time);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Users can view their own appointments
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own appointments
CREATE POLICY "Users can insert own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own appointments (e.g., cancel)
CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = user_id);

-- PT/Admin can view all appointments (role-based)
CREATE POLICY "PT can view all appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('pt', 'admin')
    )
  );

-- PT/Admin can update any appointment
CREATE POLICY "PT can update any appointment" ON appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('pt', 'admin')
    )
  );

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ADMIN VIEW
-- ============================================

CREATE OR REPLACE VIEW admin_appointments AS
SELECT
  a.id,
  a.user_id,
  u.email as user_email,
  a.patient_name,
  a.patient_email,
  a.patient_phone,
  a.start_time,
  a.end_time,
  a.duration_minutes,
  a.google_event_id,
  a.google_event_link,
  a.zoom_meeting_id,
  a.zoom_meeting_url,
  a.status,
  a.auto_confirmed,
  a.confirmed_at,
  a.patient_notes,
  a.pt_notes,
  a.created_at,
  a.updated_at
FROM appointments a
LEFT JOIN auth.users u ON a.user_id = u.id
ORDER BY a.start_time DESC;
