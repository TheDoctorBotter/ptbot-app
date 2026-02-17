/**
 * EMR Adapter Module
 *
 * Integration layer for connecting PTBOT to external EMR systems.
 * Currently designed for Buckeye EMR (https://github.com/TheDoctorBotter/AIDOCS)
 *
 * HIPAA Compliance Notes:
 * - All EMR communications should use HTTPS/TLS
 * - API keys must be stored securely in environment variables
 * - PHI transmitted must be encrypted in transit
 * - Audit logs should track all EMR sync operations
 *
 * TODO: Wire to real Buckeye EMR endpoints once API is available
 */

import { createLogger, containsPHI, stripPHI } from '../lib/hipaaLogger';
import {
  ConsultNoteEMRPayload,
  PatientEMRPayload,
  EMRSyncResponse,
} from '../types/telehealth';

const logger = createLogger('emrAdapter');

// ============================================
// CONFIGURATION
// ============================================

/**
 * EMR Configuration from environment variables
 */
interface EMRConfig {
  baseUrl: string | null;
  apiKey: string | null;
  enabled: boolean;
}

function getEMRConfig(): EMRConfig {
  // Try to get config from environment
  const baseUrl = process.env.EXPO_PUBLIC_EMR_BASE_URL ||
    process.env.EMR_BASE_URL ||
    null;

  const apiKey = process.env.EXPO_PUBLIC_EMR_API_KEY ||
    process.env.EMR_API_KEY ||
    null;

  return {
    baseUrl,
    apiKey,
    enabled: Boolean(baseUrl && apiKey),
  };
}

// ============================================
// ADAPTER INTERFACE
// ============================================

/**
 * EMR Adapter interface - implement this for different EMR systems
 */
export interface IEMRAdapter {
  /**
   * Check if EMR integration is configured and available
   */
  isAvailable(): boolean;

  /**
   * Push a consult note to the EMR
   */
  pushConsultNoteToEMR(note: ConsultNoteEMRPayload): Promise<EMRSyncResponse>;

  /**
   * Create or update a patient record in the EMR
   */
  upsertPatientToEMR(patient: PatientEMRPayload): Promise<EMRSyncResponse>;

  /**
   * Get the adapter type/name
   */
  getAdapterType(): string;
}

// ============================================
// STUB ADAPTER (Default)
// ============================================

/**
 * Stub adapter that logs operations but doesn't sync
 * Used when no EMR is configured
 */
class StubEMRAdapter implements IEMRAdapter {
  isAvailable(): boolean {
    return false;
  }

  getAdapterType(): string {
    return 'stub';
  }

  async pushConsultNoteToEMR(note: ConsultNoteEMRPayload): Promise<EMRSyncResponse> {
    logger.warn('EMR stub adapter: pushConsultNoteToEMR called but no EMR configured', {
      noteId: note.note_id,
      appointmentId: note.appointment_id,
    });

    // TODO: Implement real EMR sync when Buckeye EMR API is available
    // See: https://github.com/TheDoctorBotter/AIDOCS

    return {
      success: false,
      error: 'EMR integration not configured. Set EMR_BASE_URL and EMR_API_KEY environment variables.',
      timestamp: new Date().toISOString(),
    };
  }

  async upsertPatientToEMR(patient: PatientEMRPayload): Promise<EMRSyncResponse> {
    logger.warn('EMR stub adapter: upsertPatientToEMR called but no EMR configured', {
      userId: patient.user_id,
    });

    return {
      success: false,
      error: 'EMR integration not configured.',
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// HTTP ADAPTER (Buckeye EMR)
// ============================================

/**
 * HTTP-based adapter for Buckeye EMR
 * Expects endpoints at:
 *   POST /api/ptbot/consult-notes
 *   POST /api/ptbot/patients
 */
class BuckeyeEMRAdapter implements IEMRAdapter {
  private config: EMRConfig;

  constructor() {
    this.config = getEMRConfig();
  }

  isAvailable(): boolean {
    return this.config.enabled;
  }

  getAdapterType(): string {
    return 'buckeye_emr';
  }

  /**
   * Make authenticated request to EMR API
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown
  ): Promise<T> {
    if (!this.config.baseUrl || !this.config.apiKey) {
      throw new Error('EMR not configured');
    }

    // PHI Safety check before sending
    if (body) {
      const phiCheck = containsPHI(body);
      if (phiCheck.hasPHI) {
        logger.audit('EMR request contains PHI fields', {
          endpoint,
          phiFields: phiCheck.fields,
        });
      }
    }

    const url = `${this.config.baseUrl}${endpoint}`;

    logger.info('Making EMR API request', {
      endpoint,
      method,
    });

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-PTBOT-Source': 'telehealth-compliance',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('EMR API error response', {
          endpoint,
          status: response.status,
          error: data.error || data.message,
        });
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      logger.info('EMR API request successful', {
        endpoint,
        status: response.status,
      });

      return data as T;
    } catch (error) {
      logger.error('EMR API request failed', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async pushConsultNoteToEMR(note: ConsultNoteEMRPayload): Promise<EMRSyncResponse> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'EMR not configured',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      logger.audit('Pushing consult note to EMR', {
        noteId: note.note_id,
        appointmentId: note.appointment_id,
      });

      // Transform payload for Buckeye EMR format
      // TODO: Adjust based on actual Buckeye EMR API schema
      const emrPayload = {
        external_id: note.note_id,
        appointment_external_id: note.appointment_id,
        patient_external_id: note.patient_user_id,
        patient_name: note.patient_name,
        patient_email: note.patient_email,

        note_type: note.note_type,
        soap: {
          subjective: note.subjective,
          objective: note.objective,
          assessment: note.assessment,
          plan: note.plan,
        },
        recommendations: note.recommendations,

        flags: {
          red_flags: note.red_flags,
          follow_up_recommended: note.follow_up_recommended,
          in_person_referral: note.in_person_referral_recommended,
        },

        session: {
          duration_minutes: note.duration_minutes,
          date: note.consult_date,
          clinician_id: note.clinician_user_id,
          delivery_method: 'telehealth_zoom',
        },

        compliance: {
          location_verified: note.location_verified,
          location_state: note.location_state,
          consent_version: note.consent_version,
        },

        source: 'ptbot_telehealth',
        synced_at: new Date().toISOString(),
      };

      const result = await this.makeRequest<{
        success: boolean;
        record_id?: string;
        error?: string;
      }>('/api/ptbot/consult-notes', 'POST', emrPayload);

      logger.audit('Consult note pushed to EMR', {
        noteId: note.note_id,
        emrRecordId: result.record_id,
        success: result.success,
      });

      return {
        success: result.success,
        emr_record_id: result.record_id,
        error: result.error,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Failed to push consult note to EMR', {
        noteId: note.note_id,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async upsertPatientToEMR(patient: PatientEMRPayload): Promise<EMRSyncResponse> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'EMR not configured',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      logger.audit('Upserting patient to EMR', {
        userId: patient.user_id,
      });

      // Transform payload for Buckeye EMR format
      const emrPayload = {
        external_id: patient.user_id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        email: patient.email,
        phone: patient.phone,
        date_of_birth: patient.date_of_birth,
        source: 'ptbot_telehealth',
        synced_at: new Date().toISOString(),
      };

      const result = await this.makeRequest<{
        success: boolean;
        record_id?: string;
        error?: string;
      }>('/api/ptbot/patients', 'POST', emrPayload);

      logger.audit('Patient upserted to EMR', {
        userId: patient.user_id,
        emrRecordId: result.record_id,
        success: result.success,
      });

      return {
        success: result.success,
        emr_record_id: result.record_id,
        error: result.error,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Failed to upsert patient to EMR', {
        userId: patient.user_id,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// ============================================
// ADAPTER FACTORY
// ============================================

/**
 * Create the appropriate EMR adapter based on configuration
 */
function createEMRAdapter(): IEMRAdapter {
  const config = getEMRConfig();

  if (config.enabled) {
    logger.info('Using Buckeye EMR adapter', {
      baseUrl: config.baseUrl?.replace(/\/.*$/, '/***'), // Redact path
    });
    return new BuckeyeEMRAdapter();
  }

  logger.info('Using stub EMR adapter (no EMR configured)');
  return new StubEMRAdapter();
}

// ============================================
// SINGLETON EXPORT
// ============================================

/**
 * Default EMR adapter instance
 */
export const emrAdapter = createEMRAdapter();

/**
 * Check if EMR integration is available
 */
export function isEMRAvailable(): boolean {
  return emrAdapter.isAvailable();
}

/**
 * Get the current adapter type
 */
export function getEMRAdapterType(): string {
  return emrAdapter.getAdapterType();
}

// ============================================
// BUCKEYE EMR INTEGRATION NOTES
// ============================================

/**
 * Buckeye EMR Integration TODO:
 *
 * Repository: https://github.com/TheDoctorBotter/AIDOCS
 *
 * When connecting to Buckeye EMR, implement the following:
 *
 * 1. API Endpoints (expected):
 *    - POST /api/ptbot/consult-notes - Create/update consult notes
 *    - POST /api/ptbot/patients - Create/update patient records
 *    - GET /api/ptbot/consult-notes/:id - Get consult note
 *    - GET /api/ptbot/patients/:id - Get patient record
 *
 * 2. Authentication:
 *    - Bearer token authentication
 *    - Set EMR_API_KEY in environment
 *
 * 3. Environment Variables:
 *    - EMR_BASE_URL: Base URL of Buckeye EMR API
 *    - EMR_API_KEY: API authentication key
 *
 * 4. Payload Schema:
 *    - Adjust emrPayload objects in adapter methods to match
 *      actual Buckeye EMR API schema
 *
 * 5. HIPAA Requirements:
 *    - Ensure Buckeye EMR has signed BAA
 *    - Use HTTPS for all communications
 *    - Implement proper error handling to avoid PHI exposure
 *
 * 6. Error Handling:
 *    - Implement retry logic for transient failures
 *    - Queue failed syncs for later retry
 *    - Alert on repeated failures
 */
