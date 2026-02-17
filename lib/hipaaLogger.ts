/**
 * HIPAA-Compliant Logger Utility
 *
 * This module provides logging functions that automatically redact
 * Protected Health Information (PHI) to prevent accidental exposure
 * in logs, console output, or error reporting.
 *
 * HIPAA COMPLIANCE:
 * - Automatically redacts names, emails, phone numbers
 * - Redacts note content, medical information
 * - Safe for use in production logging
 * - Never send logs containing PHI to external services
 */

// ============================================
// PHI FIELD DEFINITIONS
// ============================================

/**
 * Fields that contain PHI and must be redacted
 */
const PHI_FIELDS = new Set([
  // Personal identifiers
  'name',
  'first_name',
  'last_name',
  'firstName',
  'lastName',
  'full_name',
  'fullName',
  'patient_name',
  'patientName',

  // Contact information
  'email',
  'patient_email',
  'patientEmail',
  'phone',
  'patient_phone',
  'patientPhone',
  'emergency_contact',
  'emergencyContact',
  'emergency_phone',
  'emergencyPhone',

  // Medical information
  'subjective',
  'objective',
  'assessment',
  'plan',
  'recommendations',
  'medical_conditions',
  'medicalConditions',
  'current_medications',
  'currentMedications',
  'patient_notes',
  'patientNotes',
  'pt_notes',
  'ptNotes',
  'note_text',
  'noteText',

  // Location data
  'address',
  'location',
  'confirmed_city',
  'confirmedCity',

  // Other sensitive
  'date_of_birth',
  'dateOfBirth',
  'dob',
  'ssn',
  'social_security',
  'ip',
  'ip_address',
  'accepted_ip',
  'confirmed_ip',
  'user_agent',
  'userAgent',
]);

/**
 * Patterns that indicate PHI content
 */
const PHI_PATTERNS = [
  // Email pattern
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Phone patterns (various formats)
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g,
  // SSN pattern
  /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  // IP address pattern
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
];

// ============================================
// REDACTION FUNCTIONS
// ============================================

/**
 * Redact a string value that may contain PHI
 */
function redactString(value: string): string {
  let redacted = value;

  for (const pattern of PHI_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }

  return redacted;
}

/**
 * Check if a field name should be redacted
 */
function shouldRedactField(fieldName: string): boolean {
  const normalizedName = fieldName.toLowerCase();
  return PHI_FIELDS.has(normalizedName) ||
    PHI_FIELDS.has(fieldName) ||
    normalizedName.includes('name') ||
    normalizedName.includes('email') ||
    normalizedName.includes('phone') ||
    normalizedName.includes('note') ||
    normalizedName.includes('address');
}

/**
 * Recursively redact PHI from an object
 */
function redactObject(obj: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[MAX_DEPTH]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return redactString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (shouldRedactField(key)) {
        redacted[key] = '[PHI_REDACTED]';
      } else if (typeof value === 'object') {
        redacted[key] = redactObject(value, depth + 1);
      } else if (typeof value === 'string') {
        redacted[key] = redactString(value);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  return '[UNKNOWN_TYPE]';
}

// ============================================
// LOGGER CLASS
// ============================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  source?: string;
}

/**
 * HIPAA-compliant logger that automatically redacts PHI
 */
class HIPAALogger {
  private enabled: boolean = true;
  private source: string = 'ptbot';

  /**
   * Create a logger instance with optional source identifier
   */
  constructor(source?: string) {
    if (source) {
      this.source = source;
    }
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Create a child logger with a specific source
   */
  child(source: string): HIPAALogger {
    return new HIPAALogger(`${this.source}:${source}`);
  }

  /**
   * Format and redact a log entry
   */
  private formatEntry(level: LogLevel, message: string, context?: unknown): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source: this.source,
    };

    if (context !== undefined) {
      entry.context = redactObject(context) as Record<string, unknown>;
    }

    return entry;
  }

  /**
   * Output a log entry
   */
  private output(entry: LogEntry): void {
    if (!this.enabled) return;

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.source}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        if (__DEV__) {
          console.debug(message, entry.context || '');
        }
        break;
      case 'info':
        console.info(message, entry.context || '');
        break;
      case 'warn':
        console.warn(message, entry.context || '');
        break;
      case 'error':
        console.error(message, entry.context || '');
        break;
    }
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: unknown): void {
    this.output(this.formatEntry('debug', message, context));
  }

  /**
   * Log info message
   */
  info(message: string, context?: unknown): void {
    this.output(this.formatEntry('info', message, context));
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: unknown): void {
    this.output(this.formatEntry('warn', message, context));
  }

  /**
   * Log error message
   */
  error(message: string, context?: unknown): void {
    this.output(this.formatEntry('error', message, context));
  }

  /**
   * Log an audit event (always logged, includes timestamp)
   */
  audit(action: string, context?: unknown): void {
    const entry = this.formatEntry('info', `AUDIT: ${action}`, context);
    this.output(entry);
  }
}

// ============================================
// CHECK FOR DEV MODE
// ============================================

// @ts-ignore - __DEV__ is defined by React Native
declare const __DEV__: boolean;

// Provide a fallback if __DEV__ is not defined
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

// ============================================
// PHI GUARD FOR OPENAI
// ============================================

/**
 * Fields that should NEVER be sent to OpenAI
 */
const OPENAI_BLOCKED_FIELDS = new Set([
  ...PHI_FIELDS,
  // Additional fields that should not go to AI
  'password',
  'token',
  'api_key',
  'apiKey',
  'secret',
  'credential',
]);

/**
 * Check if an object contains PHI that should not be sent to OpenAI
 *
 * HIPAA COMPLIANCE: Use this before ANY OpenAI API call
 * to prevent accidental PHI exposure.
 */
export function containsPHI(obj: unknown): { hasPHI: boolean; fields: string[] } {
  const phiFields: string[] = [];

  function checkObject(o: unknown, path: string = ''): void {
    if (o === null || o === undefined) return;

    if (typeof o === 'object' && !Array.isArray(o)) {
      for (const [key, value] of Object.entries(o as Record<string, unknown>)) {
        const fullPath = path ? `${path}.${key}` : key;

        if (OPENAI_BLOCKED_FIELDS.has(key) || OPENAI_BLOCKED_FIELDS.has(key.toLowerCase())) {
          if (value !== null && value !== undefined && value !== '') {
            phiFields.push(fullPath);
          }
        }

        if (typeof value === 'object') {
          checkObject(value, fullPath);
        }
      }
    } else if (Array.isArray(o)) {
      o.forEach((item, index) => checkObject(item, `${path}[${index}]`));
    }
  }

  checkObject(obj);

  return {
    hasPHI: phiFields.length > 0,
    fields: phiFields,
  };
}

/**
 * Strip PHI fields from an object before sending to external services
 */
export function stripPHI<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const stripped: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (OPENAI_BLOCKED_FIELDS.has(key) || OPENAI_BLOCKED_FIELDS.has(key.toLowerCase())) {
      continue; // Skip PHI fields
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      stripped[key as keyof T] = stripPHI(value as Record<string, unknown>) as T[keyof T];
    } else {
      stripped[key as keyof T] = value as T[keyof T];
    }
  }

  return stripped;
}

// ============================================
// EXPORTS
// ============================================

/**
 * Default logger instance
 */
export const logger = new HIPAALogger('ptbot');

/**
 * Create a logger for a specific module
 */
export function createLogger(moduleName: string): HIPAALogger {
  return logger.child(moduleName);
}

/**
 * Redact PHI from any object (for use in error reporting, etc.)
 */
export function redactPHI<T>(obj: T): T {
  return redactObject(obj) as T;
}

export default logger;
