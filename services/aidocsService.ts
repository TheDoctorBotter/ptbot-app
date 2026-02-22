/**
 * AIDOCS EMR Document Service
 *
 * Pushes documents (consent forms, referrals, etc.) to the AIDOCS EMR system.
 * Endpoint: POST {AIDOCS_API_URL}/api/ptbot/documents
 *
 * Environment variables (set as Supabase Secrets or EXPO_PUBLIC_ for client use):
 *   EXPO_PUBLIC_AIDOCS_API_URL  — base URL of the AIDOCS EMR
 *   EXPO_PUBLIC_PTBOT_API_KEY   — shared bearer token
 *
 * Falls back to the existing EMR vars if the AIDOCS-specific ones aren't set:
 *   EXPO_PUBLIC_EMR_BASE_URL / EMR_BASE_URL
 *   EXPO_PUBLIC_EMR_API_KEY  / EMR_API_KEY
 */

export type AidocsFileType = 'consent_form' | 'referral';

export interface AidocsDocumentPayload {
  patient_email: string;
  patient_name: string;
  /** Supabase auth UID */
  patient_external_id: string;
  file_type: AidocsFileType;
  file_name: string;
  /** Base64-encoded file contents */
  file_data: string;
  mime_type: string;
  notes: string;
}

export interface AidocsDocumentResult {
  success: boolean;
  file_id?: string;
  patient_id?: string;
  error?: string;
}

// -----------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------

function getConfig(): { baseUrl: string | null; apiKey: string | null } {
  const baseUrl =
    process.env.EXPO_PUBLIC_AIDOCS_API_URL ||
    process.env.EXPO_PUBLIC_EMR_BASE_URL ||
    process.env.EMR_BASE_URL ||
    null;

  const apiKey =
    process.env.EXPO_PUBLIC_PTBOT_API_KEY ||
    process.env.EXPO_PUBLIC_EMR_API_KEY ||
    process.env.EMR_API_KEY ||
    null;

  return { baseUrl, apiKey };
}

// -----------------------------------------------------------------------
// Base64 helpers
// -----------------------------------------------------------------------

/**
 * Safely encode a UTF-8 string to base64.
 * Works in both browser/RN (btoa) and Node (Buffer).
 */
export function encodeBase64(str: string): string {
  if (typeof btoa !== 'undefined') {
    // Handle multi-byte UTF-8 characters
    const bytes = new TextEncoder().encode(str);
    const latin = Array.from(bytes)
      .map((b) => String.fromCharCode(b))
      .join('');
    return btoa(latin);
  }
  // Node.js fallback (Edge Functions)
  return Buffer.from(str, 'utf-8').toString('base64');
}

/**
 * Build a base64-encoded HTML document representing a signed telehealth
 * consent form. Used as the file payload when no PDF generator is available.
 */
export function buildConsentFormBase64(params: {
  patientName: string;
  patientEmail: string;
  consentVersion: string;
  consentText: string;
  acceptedAt: string;
}): { fileData: string; mimeType: string; fileName: string } {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Telehealth Consent Form – ${params.patientName}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #1a1a1a; }
    h1 { font-size: 22px; border-bottom: 2px solid #4f7ef7; padding-bottom: 8px; }
    .meta { background: #f3f6ff; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .meta p { margin: 4px 0; font-size: 14px; }
    .consent-body { white-space: pre-wrap; font-size: 13px; line-height: 1.7; }
    .signed-box { margin-top: 32px; border-top: 2px solid #22c55e; padding-top: 16px; background: #f0fdf4; border-radius: 8px; padding: 16px; }
    .signed-box h2 { color: #15803d; font-size: 16px; margin-top: 0; }
  </style>
</head>
<body>
  <h1>Telehealth Consent Form</h1>
  <div class="meta">
    <p><strong>Patient Name:</strong> ${params.patientName}</p>
    <p><strong>Patient Email:</strong> ${params.patientEmail}</p>
    <p><strong>Consent Version:</strong> ${params.consentVersion}</p>
    <p><strong>Accepted At:</strong> ${params.acceptedAt}</p>
  </div>
  <div class="consent-body">${params.consentText}</div>
  <div class="signed-box">
    <h2>✓ Electronically Signed</h2>
    <p>The patient acknowledged all required checkboxes and accepted this agreement on ${params.acceptedAt}.</p>
  </div>
</body>
</html>`;

  const safeName = params.patientName.toLowerCase().replace(/\s+/g, '_');
  return {
    fileData: encodeBase64(html),
    mimeType: 'text/html',
    fileName: `telehealth_consent_${safeName}.html`,
  };
}

// -----------------------------------------------------------------------
// Main push function
// -----------------------------------------------------------------------

/**
 * Push a document to the AIDOCS EMR.
 *
 * Never throws — on failure, logs the error and returns a failed result.
 * This allows callers to fire-and-forget without blocking the user flow.
 */
export async function pushDocumentToAidocs(
  payload: AidocsDocumentPayload
): Promise<AidocsDocumentResult> {
  const { baseUrl, apiKey } = getConfig();

  if (!baseUrl || !apiKey) {
    console.warn(
      '[aidocsService] AIDOCS not configured (missing EXPO_PUBLIC_AIDOCS_API_URL or EXPO_PUBLIC_PTBOT_API_KEY). Skipping document push.'
    );
    return { success: false, error: 'AIDOCS not configured' };
  }

  try {
    const response = await fetch(`${baseUrl}/api/ptbot/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data: AidocsDocumentResult = await response.json();

    if (!response.ok || !data.success) {
      const errMsg = data.error || `HTTP ${response.status}`;
      console.error('[aidocsService] Document push failed:', errMsg);
      return { success: false, error: errMsg };
    }

    console.log('[aidocsService] Document pushed successfully:', data.file_id);
    return data;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[aidocsService] Document push exception:', errMsg);
    return { success: false, error: errMsg };
  }
}
