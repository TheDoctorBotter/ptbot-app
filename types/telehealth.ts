/**
 * Telehealth Compliance Types
 *
 * Type definitions for HIPAA-compliant telehealth features including
 * consent management, location verification, and clinical documentation.
 *
 * HIPAA Compliance Note: These types support PHI handling.
 * Never log or expose patient data except through secure channels.
 */

// ============================================
// TELEHEALTH CONSENT TYPES
// ============================================

/**
 * Current consent version - update this when consent text changes
 * Format: v{major}.{minor}_{YYYY-MM-DD}
 */
export const CURRENT_CONSENT_VERSION = 'v1.0_2026-02-17';

/**
 * Telehealth consent record
 */
export interface TelehealthConsent {
  id: string;
  user_id: string;
  consent_version: string;
  consent_text_hash: string;
  accepted_at: string;
  accepted_ip: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Payload for accepting telehealth consent
 */
export interface AcceptConsentPayload {
  consent_version: string;
  consent_text_hash: string;
  accepted_ip?: string;
  user_agent?: string;
}

/**
 * Consent status for a user
 */
export interface ConsentStatus {
  hasValidConsent: boolean;
  currentVersion: string;
  acceptedVersion: string | null;
  acceptedAt: string | null;
  needsReConsent: boolean;
}

// ============================================
// LOCATION VERIFICATION TYPES
// ============================================

/**
 * Allowed states for telehealth consults
 * Currently only Texas (TX) is supported
 */
export const ALLOWED_STATES = ['TX'] as const;
export type AllowedState = typeof ALLOWED_STATES[number];

/**
 * Texas cities for optional city selection
 */
export const TEXAS_CITIES = [
  'Austin',
  'Houston',
  'Dallas',
  'San Antonio',
  'Fort Worth',
  'El Paso',
  'Arlington',
  'Corpus Christi',
  'Plano',
  'Laredo',
  'Lubbock',
  'Irving',
  'Garland',
  'Amarillo',
  'Other',
] as const;

/**
 * Location verification method
 */
export type LocationVerificationMethod = 'self_attest' | 'gps';

/**
 * Location verification record
 */
export interface ConsultLocationVerification {
  id: string;
  appointment_id: string;
  user_id: string;
  confirmed_state: string;
  confirmed_city: string | null;
  confirmed_at: string;
  method: LocationVerificationMethod;
  confirmed_ip: string | null;
  created_at: string;
}

/**
 * Payload for submitting location verification
 */
export interface VerifyLocationPayload {
  appointment_id: string;
  confirmed_state: string;
  confirmed_city?: string;
  method?: LocationVerificationMethod;
}

/**
 * Location verification status for an appointment
 */
export interface LocationVerificationStatus {
  isVerified: boolean;
  verification: ConsultLocationVerification | null;
  isAllowedState: boolean;
  errorMessage: string | null;
}

// ============================================
// CONSULT NOTE TYPES (ADMIN ONLY)
// ============================================

/**
 * Note type classification
 */
export type ConsultNoteType =
  | 'telehealth_consult'
  | 'follow_up'
  | 'initial_evaluation'
  | 'progress_note';

/**
 * SOAP note structure for clinical documentation
 */
export interface SOAPNote {
  subjective: string | null;   // Patient's reported symptoms/concerns
  objective: string | null;    // Clinician observations
  assessment: string | null;   // Clinical assessment
  plan: string | null;         // Treatment plan
  recommendations: string | null; // Additional recommendations
}

/**
 * Clinical flags for the consult
 */
export interface ClinicalFlags {
  red_flags: boolean;                    // Safety concerns
  follow_up_recommended: boolean;         // Needs follow-up
  in_person_referral_recommended: boolean; // Needs in-person care
}

/**
 * Full consult note record
 */
export interface ConsultNote {
  id: string;
  appointment_id: string;
  patient_user_id: string;
  clinician_user_id: string;
  note_type: ConsultNoteType;

  // SOAP content
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  recommendations: string | null;

  // Clinical flags
  red_flags: boolean;
  follow_up_recommended: boolean;
  in_person_referral_recommended: boolean;

  // Session metadata
  duration_minutes: number | null;

  // Compliance verification
  location_confirmed: boolean;
  consent_version: string | null;

  // EMR integration
  emr_synced: boolean;
  emr_record_id: string | null;
  emr_synced_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Payload for creating/updating a consult note
 */
export interface UpsertConsultNotePayload {
  appointment_id: string;
  patient_user_id: string;

  // SOAP content
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  recommendations?: string | null;

  // Clinical flags
  red_flags?: boolean;
  follow_up_recommended?: boolean;
  in_person_referral_recommended?: boolean;

  // Session metadata
  duration_minutes?: number | null;

  // Auto-populated
  note_type?: ConsultNoteType;
}

// ============================================
// ADMIN VIEW TYPES
// ============================================

/**
 * Consult overview for admin dashboard
 */
export interface AdminConsultOverview {
  appointment_id: string;
  patient_user_id: string | null;
  patient_first_name: string | null;
  patient_last_name: string | null;
  patient_name: string;
  patient_email: string | null;
  start_time: string;
  end_time: string;
  appointment_status: string;
  zoom_meeting_url: string | null;

  // Consent status
  consent_version: string | null;
  consent_accepted_at: string | null;
  has_consent: boolean;

  // Location verification
  confirmed_state: string | null;
  confirmed_city: string | null;
  location_confirmed_at: string | null;
  location_verified: boolean;

  // Note status
  note_id: string | null;
  has_note: boolean;
  red_flags: boolean | null;
  follow_up_recommended: boolean | null;
  emr_synced: boolean | null;
  note_created_at: string | null;
}

// ============================================
// EMR INTEGRATION TYPES
// ============================================

/**
 * Payload for pushing consult note to EMR
 */
export interface ConsultNoteEMRPayload {
  note_id: string;
  appointment_id: string;
  patient_user_id: string;
  patient_name: string;
  patient_email: string | null;

  // Clinical data
  note_type: ConsultNoteType;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  recommendations: string | null;

  // Flags
  red_flags: boolean;
  follow_up_recommended: boolean;
  in_person_referral_recommended: boolean;

  // Metadata
  duration_minutes: number | null;
  consult_date: string;
  clinician_user_id: string;

  // Compliance
  location_verified: boolean;
  location_state: string | null;
  consent_version: string | null;
}

/**
 * Patient payload for EMR sync
 */
export interface PatientEMRPayload {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
}

/**
 * Response from EMR sync operations
 */
export interface EMRSyncResponse {
  success: boolean;
  emr_record_id?: string;
  error?: string;
  timestamp: string;
}

// ============================================
// CONSENT TEXT CONTENT
// ============================================

/**
 * Telehealth consent text content
 * This is the actual consent that patients must agree to.
 * Update CURRENT_CONSENT_VERSION when this changes.
 */
export const TELEHEALTH_CONSENT_TEXT = `
TELEHEALTH INFORMED CONSENT

PTBOT Telehealth Services - Informed Consent Agreement

By agreeing to this consent, you acknowledge and understand the following:

1. NATURE OF TELEHEALTH SERVICES
Telehealth involves the use of electronic communications to enable healthcare providers to deliver services remotely. This includes video conferencing, messaging, and other communication technologies.

2. BENEFITS AND LIMITATIONS
Telehealth services offer convenience and accessibility. However, telehealth has limitations compared to in-person visits:
- Physical examinations cannot be performed remotely
- Technical issues may interrupt or prevent services
- Some conditions require in-person evaluation

3. RISKS
Potential risks include:
- Technical failures or security breaches
- Limitations in the provider's ability to assess your condition
- Delays in treatment if technology fails

4. PATIENT RESPONSIBILITIES
You agree to:
- Provide accurate and complete health information
- Be physically located in Texas during each telehealth session
- Inform your provider of any changes in your condition
- Follow up with in-person care when recommended

5. PRIVACY AND SECURITY
Your telehealth sessions are conducted using secure, HIPAA-compliant technology. However, no technology is 100% secure. We take reasonable precautions to protect your information.

6. EMERGENCY SITUATIONS
Telehealth is NOT appropriate for medical emergencies. If you experience a medical emergency, call 911 or go to the nearest emergency room immediately.

7. LOCATION REQUIREMENTS
Due to state licensing requirements, you must be physically located in Texas during each telehealth consultation. You will be asked to confirm your location before each session.

8. CONSENT TO TREATMENT
By accepting this consent, you authorize PTBOT and its healthcare providers to provide telehealth services as deemed appropriate.

9. RIGHT TO WITHDRAW
You may withdraw this consent at any time by notifying PTBOT in writing. Withdrawal of consent will not affect any services provided before withdrawal.

This consent is valid for one year from the date of acceptance or until you withdraw consent in writing.
`.trim();

/**
 * Compute hash of consent text for integrity verification
 */
export async function computeConsentHash(text: string): Promise<string> {
  // Use SubtleCrypto for secure hashing when available
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback: simple hash for environments without SubtleCrypto
  // This is NOT cryptographically secure but works for basic integrity checks
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `fallback_${Math.abs(hash).toString(16)}`;
}
