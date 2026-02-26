/**
 * Zoom API Service for PTBot
 *
 * Uses Zoom Server-to-Server OAuth to automatically create meetings
 * when appointments are booked. Requires three environment variables:
 *
 *   ZOOM_ACCOUNT_ID    — from the Zoom Server-to-Server app
 *   ZOOM_CLIENT_ID     — from the Zoom Server-to-Server app
 *   ZOOM_CLIENT_SECRET — from the Zoom Server-to-Server app
 *
 * The app must have the meeting:write:meeting scope.
 *
 * Docs: https://developers.zoom.us/docs/internal-apps/s2s-oauth/
 */

const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE = 'https://api.zoom.us/v2';

// Module-level token cache (persists across invocations in the same Deno isolate)
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

interface ZoomMeeting {
  id: number;
  join_url: string;
  password: string;
  topic: string;
  start_time: string;
  duration: number;
}

/**
 * Get a Zoom access token using Server-to-Server OAuth.
 * Tokens are cached and reused until 60 seconds before expiry.
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 60s margin)
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const accountId = Deno.env.get('ZOOM_ACCOUNT_ID');
  const clientId = Deno.env.get('ZOOM_CLIENT_ID');
  const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');

  if (!accountId || !clientId || !clientSecret) {
    throw new Error(
      'Missing Zoom credentials. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.'
    );
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch(
    `${ZOOM_TOKEN_URL}?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom token request failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // Zoom tokens typically last 1 hour (3600s)
  tokenExpiresAt = now + (data.expires_in ?? 3600) * 1000;

  return cachedToken!;
}

/**
 * Create a Zoom meeting for a PTBot consultation.
 *
 * @param patientName  — used in the meeting topic
 * @param startISO     — ISO 8601 start time
 * @param durationMin  — meeting length in minutes (default 30)
 * @returns Zoom meeting details (id, join_url, password)
 */
export async function createZoomMeeting(
  patientName: string,
  startISO: string,
  durationMin = 30
): Promise<ZoomMeeting> {
  const token = await getAccessToken();

  const res = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: `PTBot Consultation - ${patientName}`,
      type: 2, // Scheduled meeting
      start_time: startISO,
      duration: durationMin,
      timezone: 'America/Chicago',
      settings: {
        join_before_host: false,
        waiting_room: true,
        audio: 'both',
        auto_recording: 'none',
        mute_upon_entry: true,
        approval_type: 0, // Automatically approve
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom meeting creation failed (${res.status}): ${body}`);
  }

  const meeting = await res.json();

  return {
    id: meeting.id,
    join_url: meeting.join_url,
    password: meeting.password || '',
    topic: meeting.topic,
    start_time: meeting.start_time,
    duration: meeting.duration,
  };
}
