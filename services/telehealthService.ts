/**
 * Telehealth Service
 *
 * Handles all telehealth compliance operations including:
 * - Telehealth consent management
 * - Location verification
 * - Consult notes (admin-only)
 *
 * HIPAA Compliance Notes:
 * - All database operations use Supabase RLS
 * - PHI is never logged directly (uses hipaaLogger)
 * - Consent and location data stored with audit timestamps
 */

import { supabase } from '../lib/supabase';
import { createLogger } from '../lib/hipaaLogger';
import {
  TelehealthConsent,
  ConsentStatus,
  ConsultLocationVerification,
  LocationVerificationStatus,
  ConsultNote,
  UpsertConsultNotePayload,
  AdminConsultOverview,
  CURRENT_CONSENT_VERSION,
  TELEHEALTH_CONSENT_TEXT,
  computeConsentHash,
  ALLOWED_STATES,
} from '../types/telehealth';

const logger = createLogger('telehealthService');

// ============================================
// TELEHEALTH CONSENT SERVICE
// ============================================

export class TelehealthConsentService {
  private static instance: TelehealthConsentService;

  private constructor() {}

  static getInstance(): TelehealthConsentService {
    if (!TelehealthConsentService.instance) {
      TelehealthConsentService.instance = new TelehealthConsentService();
    }
    return TelehealthConsentService.instance;
  }

  /**
   * Check if user has valid telehealth consent
   */
  async getConsentStatus(userId: string): Promise<ConsentStatus> {
    if (!supabase) {
      logger.error('Supabase not initialized');
      return {
        hasValidConsent: false,
        currentVersion: CURRENT_CONSENT_VERSION,
        acceptedVersion: null,
        acceptedAt: null,
        needsReConsent: true,
      };
    }

    try {
      const { data, error } = await supabase
        .from('telehealth_consents')
        .select('*')
        .eq('user_id', userId)
        .eq('consent_version', CURRENT_CONSENT_VERSION)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching consent status', { error: error.message });
        throw error;
      }

      if (data) {
        return {
          hasValidConsent: true,
          currentVersion: CURRENT_CONSENT_VERSION,
          acceptedVersion: data.consent_version,
          acceptedAt: data.accepted_at,
          needsReConsent: false,
        };
      }

      // Check if they have any older consent
      const { data: oldConsent } = await supabase
        .from('telehealth_consents')
        .select('consent_version, accepted_at')
        .eq('user_id', userId)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        hasValidConsent: false,
        currentVersion: CURRENT_CONSENT_VERSION,
        acceptedVersion: oldConsent?.consent_version || null,
        acceptedAt: oldConsent?.accepted_at || null,
        needsReConsent: oldConsent !== null,
      };
    } catch (error) {
      logger.error('Error in getConsentStatus', { error });
      throw error;
    }
  }

  /**
   * Record user's acceptance of telehealth consent
   */
  async acceptConsent(userId: string): Promise<TelehealthConsent> {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    try {
      const consentHash = await computeConsentHash(TELEHEALTH_CONSENT_TEXT);

      const { data, error } = await supabase
        .from('telehealth_consents')
        .insert({
          user_id: userId,
          consent_version: CURRENT_CONSENT_VERSION,
          consent_text_hash: consentHash,
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation (already accepted)
        if (error.code === '23505') {
          logger.info('User has already accepted current consent version');
          const existing = await this.getConsent(userId, CURRENT_CONSENT_VERSION);
          if (existing) return existing;
        }
        logger.error('Error accepting consent', { error: error.message });
        throw error;
      }

      logger.audit('Telehealth consent accepted', {
        userId,
        consentVersion: CURRENT_CONSENT_VERSION,
      });

      return data;
    } catch (error) {
      logger.error('Error in acceptConsent', { error });
      throw error;
    }
  }

  /**
   * Get a specific consent record
   */
  async getConsent(userId: string, version: string): Promise<TelehealthConsent | null> {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('telehealth_consents')
      .select('*')
      .eq('user_id', userId)
      .eq('consent_version', version)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching consent', { error: error.message });
      return null;
    }

    return data;
  }

  /**
   * Get all consent records for a user
   */
  async getUserConsents(userId: string): Promise<TelehealthConsent[]> {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('telehealth_consents')
      .select('*')
      .eq('user_id', userId)
      .order('accepted_at', { ascending: false });

    if (error) {
      logger.error('Error fetching user consents', { error: error.message });
      return [];
    }

    return data || [];
  }

  /**
   * Check if consent is required before booking/joining
   * Returns true if user needs to accept consent
   */
  async requiresConsent(userId: string): Promise<boolean> {
    const status = await this.getConsentStatus(userId);
    return !status.hasValidConsent;
  }
}

// ============================================
// LOCATION VERIFICATION SERVICE
// ============================================

export class LocationVerificationService {
  private static instance: LocationVerificationService;

  private constructor() {}

  static getInstance(): LocationVerificationService {
    if (!LocationVerificationService.instance) {
      LocationVerificationService.instance = new LocationVerificationService();
    }
    return LocationVerificationService.instance;
  }

  /**
   * Get location verification status for an appointment
   */
  async getVerificationStatus(appointmentId: string): Promise<LocationVerificationStatus> {
    if (!supabase) {
      return {
        isVerified: false,
        verification: null,
        isAllowedState: false,
        errorMessage: 'Service not available',
      };
    }

    try {
      const { data, error } = await supabase
        .from('consult_location_verifications')
        .select('*')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching location verification', { error: error.message });
        throw error;
      }

      if (!data) {
        return {
          isVerified: false,
          verification: null,
          isAllowedState: false,
          errorMessage: null,
        };
      }

      const isAllowedState = ALLOWED_STATES.includes(data.confirmed_state as any);

      return {
        isVerified: true,
        verification: data,
        isAllowedState,
        errorMessage: isAllowedState
          ? null
          : 'PTBOT consults are currently available only when you are physically located in Texas.',
      };
    } catch (error) {
      logger.error('Error in getVerificationStatus', { error });
      throw error;
    }
  }

  /**
   * Submit location verification for an appointment
   */
  async verifyLocation(
    appointmentId: string,
    userId: string,
    state: string,
    city?: string
  ): Promise<LocationVerificationStatus> {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    // Validate state
    if (!ALLOWED_STATES.includes(state as any)) {
      return {
        isVerified: false,
        verification: null,
        isAllowedState: false,
        errorMessage: 'PTBOT consults are currently available only when you are physically located in Texas.',
      };
    }

    try {
      const { data, error } = await supabase
        .from('consult_location_verifications')
        .insert({
          appointment_id: appointmentId,
          user_id: userId,
          confirmed_state: state,
          confirmed_city: city || null,
          method: 'self_attest',
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate verification
        if (error.code === '23505') {
          logger.info('Location already verified for this appointment');
          return this.getVerificationStatus(appointmentId);
        }
        logger.error('Error verifying location', { error: error.message });
        throw error;
      }

      logger.audit('Location verification submitted', {
        appointmentId,
        state,
      });

      return {
        isVerified: true,
        verification: data,
        isAllowedState: true,
        errorMessage: null,
      };
    } catch (error) {
      logger.error('Error in verifyLocation', { error });
      throw error;
    }
  }

  /**
   * Check if location verification is required for an appointment
   */
  async requiresVerification(appointmentId: string): Promise<boolean> {
    const status = await this.getVerificationStatus(appointmentId);
    return !status.isVerified || !status.isAllowedState;
  }
}

// ============================================
// CONSULT NOTES SERVICE (ADMIN ONLY)
// ============================================

export class ConsultNotesService {
  private static instance: ConsultNotesService;

  private constructor() {}

  static getInstance(): ConsultNotesService {
    if (!ConsultNotesService.instance) {
      ConsultNotesService.instance = new ConsultNotesService();
    }
    return ConsultNotesService.instance;
  }

  /**
   * Get consult note for an appointment
   */
  async getNote(appointmentId: string): Promise<ConsultNote | null> {
    if (!supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('consult_notes')
        .select('*')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching consult note', { error: error.message });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error in getNote', { error });
      throw error;
    }
  }

  /**
   * Create or update a consult note
   */
  async upsertNote(
    payload: UpsertConsultNotePayload,
    clinicianUserId: string
  ): Promise<ConsultNote> {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    try {
      // Get consent and location verification status for the appointment
      const [consentStatus, locationStatus] = await Promise.all([
        this.getPatientConsentVersion(payload.patient_user_id),
        locationVerificationService.getVerificationStatus(payload.appointment_id),
      ]);

      const noteData = {
        appointment_id: payload.appointment_id,
        patient_user_id: payload.patient_user_id,
        clinician_user_id: clinicianUserId,
        note_type: payload.note_type || 'telehealth_consult',
        subjective: payload.subjective ?? null,
        objective: payload.objective ?? null,
        assessment: payload.assessment ?? null,
        plan: payload.plan ?? null,
        recommendations: payload.recommendations ?? null,
        red_flags: payload.red_flags ?? false,
        follow_up_recommended: payload.follow_up_recommended ?? false,
        in_person_referral_recommended: payload.in_person_referral_recommended ?? false,
        duration_minutes: payload.duration_minutes ?? null,
        location_confirmed: locationStatus.isVerified && locationStatus.isAllowedState,
        consent_version: consentStatus,
      };

      const { data, error } = await supabase
        .from('consult_notes')
        .upsert(noteData, {
          onConflict: 'appointment_id',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error upserting consult note', { error: error.message });
        throw error;
      }

      logger.audit('Consult note saved', {
        appointmentId: payload.appointment_id,
        noteId: data.id,
        hasRedFlags: payload.red_flags,
      });

      return data;
    } catch (error) {
      logger.error('Error in upsertNote', { error });
      throw error;
    }
  }

  /**
   * Get patient's consent version for note documentation
   */
  private async getPatientConsentVersion(patientUserId: string): Promise<string | null> {
    if (!supabase) return null;

    const { data } = await supabase
      .from('telehealth_consents')
      .select('consent_version')
      .eq('user_id', patientUserId)
      .order('accepted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.consent_version || null;
  }

  /**
   * Mark consult note as synced to EMR
   */
  async markEMRSynced(noteId: string, emrRecordId: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .from('consult_notes')
      .update({
        emr_synced: true,
        emr_record_id: emrRecordId,
        emr_synced_at: new Date().toISOString(),
      })
      .eq('id', noteId);

    if (error) {
      logger.error('Error marking note as EMR synced', { error: error.message });
      throw error;
    }

    logger.audit('Consult note marked as EMR synced', {
      noteId,
      emrRecordId,
    });
  }

  /**
   * Get all notes for a patient
   */
  async getPatientNotes(patientUserId: string): Promise<ConsultNote[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('consult_notes')
      .select('*')
      .eq('patient_user_id', patientUserId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching patient notes', { error: error.message });
      return [];
    }

    return data || [];
  }

  /**
   * Get notes pending EMR sync
   */
  async getNotesPendingSync(): Promise<ConsultNote[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('consult_notes')
      .select('*')
      .eq('emr_synced', false)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching notes pending sync', { error: error.message });
      return [];
    }

    return data || [];
  }
}

// ============================================
// ADMIN OVERVIEW SERVICE
// ============================================

export class AdminConsultService {
  private static instance: AdminConsultService;

  private constructor() {}

  static getInstance(): AdminConsultService {
    if (!AdminConsultService.instance) {
      AdminConsultService.instance = new AdminConsultService();
    }
    return AdminConsultService.instance;
  }

  /**
   * Get consult overview for admin dashboard
   */
  async getConsultOverview(options?: {
    status?: string;
    hasNote?: boolean;
    limit?: number;
  }): Promise<AdminConsultOverview[]> {
    if (!supabase) return [];

    try {
      let query = supabase
        .from('admin_consult_overview')
        .select('*')
        .order('start_time', { ascending: false });

      if (options?.status) {
        query = query.eq('appointment_status', options.status);
      }

      if (options?.hasNote !== undefined) {
        query = query.eq('has_note', options.hasNote);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching admin consult overview', { error: error.message });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getConsultOverview', { error });
      return [];
    }
  }

  /**
   * Get consults needing documentation
   */
  async getConsultsNeedingNotes(): Promise<AdminConsultOverview[]> {
    return this.getConsultOverview({
      status: 'completed',
      hasNote: false,
    });
  }

  /**
   * Get upcoming consults
   */
  async getUpcomingConsults(limit = 10): Promise<AdminConsultOverview[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('admin_consult_overview')
      .select('*')
      .in('appointment_status', ['scheduled', 'confirmed'])
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) {
      logger.error('Error fetching upcoming consults', { error: error.message });
      return [];
    }

    return data || [];
  }
}

// ============================================
// SINGLETON EXPORTS
// ============================================

export const telehealthConsentService = TelehealthConsentService.getInstance();
export const locationVerificationService = LocationVerificationService.getInstance();
export const consultNotesService = ConsultNotesService.getInstance();
export const adminConsultService = AdminConsultService.getInstance();

// ============================================
// UTILITY EXPORTS
// ============================================

/**
 * Get current consent text and version
 */
export function getCurrentConsentInfo() {
  return {
    version: CURRENT_CONSENT_VERSION,
    text: TELEHEALTH_CONSENT_TEXT,
  };
}

/**
 * Check all pre-consult requirements
 * Use this before allowing a patient to join a consult
 */
export async function checkPreConsultRequirements(
  userId: string,
  appointmentId: string
): Promise<{
  canProceed: boolean;
  needsConsent: boolean;
  needsLocationVerification: boolean;
  locationError: string | null;
}> {
  const [requiresConsent, locationStatus] = await Promise.all([
    telehealthConsentService.requiresConsent(userId),
    locationVerificationService.getVerificationStatus(appointmentId),
  ]);

  const needsLocationVerification = !locationStatus.isVerified;
  const locationBlocked = locationStatus.isVerified && !locationStatus.isAllowedState;

  return {
    canProceed: !requiresConsent && locationStatus.isVerified && locationStatus.isAllowedState,
    needsConsent: requiresConsent,
    needsLocationVerification,
    locationError: locationBlocked ? locationStatus.errorMessage : null,
  };
}
