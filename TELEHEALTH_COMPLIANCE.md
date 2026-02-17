# PTBOT Telehealth Compliance Layer

## Overview

This document describes the HIPAA-compliant telehealth features implemented in PTBOT for paid Zoom consultations. The system supports deterministic workflows and complete auditability.

## Table of Contents

1. [Implementation Summary](#implementation-summary)
2. [Database Schema](#database-schema)
3. [Patient Workflow](#patient-workflow)
4. [Admin Workflow](#admin-workflow)
5. [EMR Integration](#emr-integration)
6. [Testing Checklist](#testing-checklist)
7. [External Requirements](#external-requirements)

---

## Implementation Summary

### Files Created

#### Database Migrations
- `supabase/migrations/20260217100000_create_telehealth_compliance.sql`
  - `telehealth_consents` table
  - `consult_location_verifications` table
  - `consult_notes` table
  - RLS policies for all tables
  - Admin overview view

#### Types
- `types/telehealth.ts` - TypeScript interfaces and consent text

#### Services
- `services/telehealthService.ts` - Consent, location, and notes services
- `services/emrAdapter.ts` - Buckeye EMR integration adapter
- `lib/hipaaLogger.ts` - HIPAA-compliant logging utility

#### Components
- `components/telehealth/TelehealthConsentScreen.tsx` - Patient consent UI
- `components/telehealth/LocationVerificationModal.tsx` - Location verification UI
- `components/telehealth/AdminConsultList.tsx` - Admin consult management
- `components/telehealth/AdminConsultNoteScreen.tsx` - SOAP note editor
- `components/telehealth/index.ts` - Component exports

#### Modified Files
- `app/(tabs)/schedule.tsx` - Consent guard + location verification
- `app/(tabs)/account.tsx` - Admin tools section

---

## Database Schema

### telehealth_consents
Stores patient acceptance of telehealth terms with version tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Patient user ID |
| consent_version | TEXT | Version string (e.g., "v1.0_2026-02-17") |
| consent_text_hash | TEXT | SHA256 hash for integrity |
| accepted_at | TIMESTAMP | When consent was recorded |
| accepted_ip | TEXT | Optional IP for audit |
| user_agent | TEXT | Optional browser info |

**RLS**: Users read/write own; admin/clinician read all.

### consult_location_verifications
Pre-consult location confirmation for state licensure compliance.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| appointment_id | UUID | FK to appointments |
| user_id | UUID | Patient user ID |
| confirmed_state | TEXT | Must be 'TX' |
| confirmed_city | TEXT | Optional city |
| confirmed_at | TIMESTAMP | Verification time |
| method | TEXT | 'self_attest' or 'gps' |

**RLS**: Users insert/read for own appointments; admin/clinician read all.

### consult_notes
Clinical SOAP documentation (admin-only visibility).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| appointment_id | UUID | FK to appointments |
| patient_user_id | UUID | Patient ID |
| clinician_user_id | UUID | Documenting clinician |
| subjective | TEXT | S - Patient reports |
| objective | TEXT | O - Observations |
| assessment | TEXT | A - Assessment |
| plan | TEXT | P - Plan |
| recommendations | TEXT | Additional notes |
| red_flags | BOOLEAN | Safety concerns |
| follow_up_recommended | BOOLEAN | Needs follow-up |
| in_person_referral_recommended | BOOLEAN | Needs in-person |
| duration_minutes | INT | Session length |
| emr_synced | BOOLEAN | Sync status |
| emr_record_id | TEXT | External EMR ID |

**RLS**: ONLY admin/clinician can read/write. Patients CANNOT view.

---

## Patient Workflow

### 1. Before Booking
- Patient must accept telehealth consent (if not already accepted)
- Consent stored with version + timestamp + hash
- If consent version changes, patient must re-consent

### 2. Before Joining Consult
- Patient must confirm physical location in Texas
- Location verification stored per-appointment
- If not in Texas, consult is blocked with message

### 3. During Consult
- Patient joins via Zoom link
- Admin documents in real-time or after

### 4. After Consult
- Admin completes SOAP note
- Export to EMR available
- Patient cannot view clinical notes

---

## Admin Workflow

### Accessing Admin Tools
1. Sign in with admin/clinician role
2. Go to Account > Admin Tools
3. Select "Consult Management"

### Documenting a Consult
1. Filter by "Needs Notes" to find undocumented consults
2. Select a consult
3. Review patient info, consent status, location verification
4. Complete SOAP fields
5. Set clinical flags (red flags, follow-up, in-person referral)
6. Enter session duration
7. Save note
8. Optional: Export to Buckeye EMR

### Red Flag Handling
- When red_flags = true, consult appears in "Red Flags" filter
- Requires immediate attention
- Documented in note for follow-up

---

## EMR Integration

### Buckeye EMR (https://github.com/TheDoctorBotter/AIDOCS)

The EMR adapter is ready for integration. Currently returns success=false with TODO.

#### Configuration Required
```env
EMR_BASE_URL=https://your-buckeye-emr-instance.com
EMR_API_KEY=your-api-key
```

#### Expected Endpoints
- `POST /api/ptbot/consult-notes` - Push consult notes
- `POST /api/ptbot/patients` - Upsert patient records

#### Integration Steps
1. Provide Buckeye EMR API documentation
2. Update `emrAdapter.ts` payload format
3. Test with staging EMR
4. Deploy with production credentials

---

## Testing Checklist

### Patient Consent Flow

- [ ] **New User Booking**: Patient without consent cannot book without seeing consent screen
- [ ] **Consent Display**: Consent text displays correctly with version number
- [ ] **Checkbox Validation**: All three checkboxes required before accepting
- [ ] **Consent Storage**: Acceptance stored in `telehealth_consents` table
- [ ] **Skip If Valid**: Already-consented patients skip consent screen
- [ ] **Re-Consent**: Updated consent version triggers re-consent flow
- [ ] **View Consent**: Patient can view consent from Account screen

### Location Verification Flow

- [ ] **Join Requires Verification**: Patient cannot join without location verification
- [ ] **Texas Only**: Only TX accepted as valid state
- [ ] **City Optional**: City selection is optional but stored
- [ ] **Error on Non-TX**: Clear error message for non-Texas locations
- [ ] **Per-Appointment**: Verification required for each appointment
- [ ] **Verification Storage**: Stored in `consult_location_verifications` table

### Admin Note Flow

- [ ] **Admin Access Only**: Non-admin users cannot see Admin Tools section
- [ ] **Consult List Loads**: All consults display with status indicators
- [ ] **Filter Works**: "Needs Notes", "Upcoming", "Red Flags" filters function
- [ ] **Note Editor Opens**: SOAP form displays patient info
- [ ] **Compliance Auto-Populate**: Consent version and location status shown
- [ ] **Save Works**: Note saved to `consult_notes` table
- [ ] **Flags Saved**: Red flags, follow-up, in-person flags stored
- [ ] **Patient Cannot View**: Patients cannot see consult_notes (RLS enforced)

### EMR Export Flow

- [ ] **Save Before Export**: Must save note before EMR export
- [ ] **Export Calls Adapter**: Button triggers emrAdapter.pushConsultNoteToEMR
- [ ] **Success Marks Synced**: On success, emr_synced = true
- [ ] **EMR ID Stored**: emr_record_id populated from response
- [ ] **Error Displayed**: On failure, error shown to admin

### HIPAA Compliance

- [ ] **No PHI in Logs**: Console logs redact names, emails, phones, notes
- [ ] **RLS Enforced**: Direct database queries respect RLS policies
- [ ] **Consent Versioned**: Consent text hash matches stored hash
- [ ] **Audit Trail**: All operations timestamped

---

## External Requirements

These items require external setup and cannot be implemented in code:

### 1. Zoom BAA
- [ ] Sign Business Associate Agreement with Zoom
- [ ] Use Zoom for Healthcare plan

### 2. Supabase BAA
- [ ] Sign Business Associate Agreement with Supabase
- [ ] Enable Supabase Pro/Enterprise for HIPAA support

### 3. Hosting BAA
- [ ] If using Vercel/Netlify, ensure BAA coverage
- [ ] Or use HIPAA-compliant hosting (AWS HIPAA eligible, etc.)

### 4. EMR BAA
- [ ] Sign BAA with Buckeye EMR system
- [ ] Configure secure API credentials

### 5. SSL/TLS
- [ ] All connections use HTTPS
- [ ] Certificate properly configured

### 6. Data Retention Policy
- [ ] Define retention period for consult notes
- [ ] Implement automated deletion if required

### 7. Staff Training
- [ ] Train staff on telehealth documentation
- [ ] Review HIPAA procedures

### 8. Incident Response Plan
- [ ] Document breach response procedures
- [ ] Designate privacy officer

---

## Environment Variables

Required for full functionality:

```env
# Supabase (required)
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# EMR Integration (optional - for Buckeye EMR)
EXPO_PUBLIC_EMR_BASE_URL=https://emr-api.example.com
EXPO_PUBLIC_EMR_API_KEY=your-emr-api-key

# Or server-side only:
EMR_BASE_URL=https://emr-api.example.com
EMR_API_KEY=your-emr-api-key
```

---

## Support

For questions about this telehealth compliance implementation:
- Review code comments for implementation details
- Check `types/telehealth.ts` for data structure documentation
- See `services/emrAdapter.ts` for EMR integration notes

---

*Document Version: 1.0*
*Last Updated: 2026-02-17*
