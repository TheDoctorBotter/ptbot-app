// Google Calendar service for PTBot
// Uses Service Account (JWT) authentication

import { TZ, APPOINTMENT_DURATION_MIN, addMinMs, toISO } from './schedule.ts';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id?: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startISO: string;
  endISO: string;
  htmlLink?: string;
  location?: string;
}

interface CreateEventParams {
  summary: string;
  description?: string;
  startISO: string;
  endISO?: string;
  location?: string;
  patientName?: string;
  phone?: string;
  userId?: string;
}

// Build a tagged description with metadata
function buildTaggedDescription({
  description,
  patientName,
  phone,
  userId,
}: {
  description?: string;
  patientName?: string;
  phone?: string;
  userId?: string;
}): string {
  const tags: string[] = [];
  tags.push('TYPE=PTBOT_ZOOM');
  if (patientName) tags.push(`PATIENT=${patientName}`);
  if (phone) tags.push(`PHONE=${phone}`);
  if (userId) tags.push(`USER_ID=${userId}`);

  if (tags.length === 0) return description || '';

  const tagBlock = tags.join('\n');
  return `${description || ''}\n\n---\n${tagBlock}\n`;
}

// Parse event tags from description
function parseEventTags(description: string): Record<string, string> {
  const tags: Record<string, string> = {};
  if (!description) return tags;

  const lines = description.split('\n');
  for (const line of lines) {
    const match = line.match(/^(TYPE|PATIENT|PHONE|USER_ID|Name|Type)[:=]\s*(.+)/i);
    if (match) {
      const key = match[1].toLowerCase().replace(/[^a-z0-9_]/g, '');
      tags[key] = match[2].trim();
    }
  }
  return tags;
}

export class GoogleCalendarService {
  private calendarId: string;
  private credentials: ServiceAccountCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private ownerEmail: string;

  constructor() {
    this.calendarId = Deno.env.get('GCAL_CALENDAR_ID') || '';
    this.ownerEmail = Deno.env.get('GCAL_OWNER_EMAIL') || '';
    const credentialsJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON') || '';

    console.log(`[GoogleCalendar] Configured calendar ID: "${this.calendarId}"`);
    console.log(`[GoogleCalendar] Owner email: "${this.ownerEmail}"`);
    console.log(`[GoogleCalendar] Credentials JSON length: ${credentialsJson.length}`);

    if (!credentialsJson) {
      throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON');
    }

    this.credentials = JSON.parse(credentialsJson);
    console.log(`[GoogleCalendar] Service account email: ${this.credentials.client_email}`);
  }

  // Create a JWT and exchange it for an access token
  private async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    // Return cached token if still valid (with 60s buffer)
    if (this.accessToken && this.tokenExpiry > now + 60) {
      return this.accessToken;
    }

    // Create JWT header and claims
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const claims = {
      iss: this.credentials.client_email,
      scope: 'https://www.googleapis.com/auth/calendar',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    };

    // Encode header and claims
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedClaims = this.base64UrlEncode(JSON.stringify(claims));
    const signatureInput = `${encodedHeader}.${encodedClaims}`;

    // Sign with private key
    const signature = await this.signRS256(signatureInput, this.credentials.private_key);
    const jwt = `${signatureInput}.${signature}`;

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    const responseText = await response.text();
    console.log(`[GoogleCalendar] Token exchange status: ${response.status}`);

    if (!response.ok) {
      console.error(`[GoogleCalendar] Token exchange failed: ${responseText}`);
      throw new Error(`Failed to get access token: ${responseText}`);
    }

    const data = JSON.parse(responseText);
    this.accessToken = data.access_token;
    this.tokenExpiry = now + data.expires_in;
    console.log(`[GoogleCalendar] Got access token, expires in ${data.expires_in}s, scope: ${data.scope || 'not specified'}`);

    return this.accessToken!;
  }

  private base64UrlEncode(str: string): string {
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private async signRS256(input: string, privateKey: string): Promise<string> {
    // Import the private key
    const pemContents = privateKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\n/g, '');

    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // Sign the input
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(input)
    );

    // Convert to base64url
    const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // Ensure the service account has a working calendar.
  // Strategy:
  // 1. Check if we have a saved calendar ID in Supabase (from a previous auto-create)
  // 2. Try to access the configured/saved calendar
  // 3. If no access, create a new calendar owned by the service account
  // 4. Share the new calendar with the owner email
  // 5. Persist the new calendar ID in Supabase
  private calendarAccessEnsured = false;

  async ensureCalendarAccess(): Promise<void> {
    if (this.calendarAccessEnsured) return;

    const token = await this.getAccessToken();

    // Step 1: Check if we have a saved calendar ID in Supabase
    const savedCalendarId = await this.getSavedCalendarId();
    if (savedCalendarId && savedCalendarId !== this.calendarId) {
      console.log(`[GoogleCalendar] Found saved calendar ID in Supabase: ${savedCalendarId}`);
      this.calendarId = savedCalendarId;
    }

    // Step 2: Try to access the configured calendar
    if (this.calendarId) {
      const canAccess = await this.testCalendarAccess(token, this.calendarId);
      if (canAccess) {
        console.log(`[GoogleCalendar] Calendar accessible: ${this.calendarId}`);
        this.calendarAccessEnsured = true;
        return;
      }
      console.log(`[GoogleCalendar] Cannot access calendar: ${this.calendarId}`);
    }

    // Step 3: Create a new calendar owned by the service account
    console.log(`[GoogleCalendar] Creating new service-account-owned calendar...`);
    const newCalendarId = await this.createOwnedCalendar(token);
    if (!newCalendarId) {
      throw new Error('Failed to create calendar. Check service account permissions.');
    }

    this.calendarId = newCalendarId;
    this.calendarAccessEnsured = true;

    // Step 4: Share with owner email
    if (this.ownerEmail) {
      await this.shareCalendarWithOwner(token, newCalendarId, this.ownerEmail);
    }

    // Step 5: Persist to Supabase
    await this.saveCalendarId(newCalendarId);
  }

  private async testCalendarAccess(token: string, calendarId: string): Promise<boolean> {
    try {
      // Try a lightweight events query
      const params = new URLSearchParams({
        maxResults: '1',
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 86400000).toISOString(),
        singleEvents: 'true',
      });
      const response = await fetch(
        `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private async createOwnedCalendar(token: string): Promise<string | null> {
    try {
      const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: 'Buckeye PT Appointments',
          description: 'Appointment calendar managed by PTBot',
          timeZone: TZ,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`[GoogleCalendar] Created calendar: ${data.id} ("${data.summary}")`);
        return data.id;
      } else {
        console.error(`[GoogleCalendar] Failed to create calendar (${response.status}): ${JSON.stringify(data)}`);
        return null;
      }
    } catch (err) {
      console.error(`[GoogleCalendar] Error creating calendar:`, err);
      return null;
    }
  }

  private async shareCalendarWithOwner(token: string, calendarId: string, ownerEmail: string): Promise<void> {
    try {
      const response = await fetch(
        `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/acl`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'owner',
            scope: { type: 'user', value: ownerEmail },
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log(`[GoogleCalendar] Shared calendar with ${ownerEmail} as owner`);
      } else {
        console.error(`[GoogleCalendar] Failed to share calendar (${response.status}): ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error(`[GoogleCalendar] Error sharing calendar:`, err);
    }
  }

  private getSupabaseClient() {
    const url = Deno.env.get('SUPABASE_URL') || '';
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!url || !key) return null;
    return { url, key };
  }

  private async getSavedCalendarId(): Promise<string | null> {
    const sb = this.getSupabaseClient();
    if (!sb) return null;

    try {
      const response = await fetch(
        `${sb.url}/rest/v1/app_config?key=eq.gcal_calendar_id&select=value`,
        {
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
          },
        }
      );

      if (!response.ok) {
        console.log(`[GoogleCalendar] app_config table not ready (${response.status})`);
        return null;
      }

      const rows = await response.json();
      return rows?.[0]?.value || null;
    } catch (err) {
      console.log(`[GoogleCalendar] Could not read app_config:`, err);
      return null;
    }
  }

  private async saveCalendarId(calendarId: string): Promise<void> {
    const sb = this.getSupabaseClient();
    if (!sb) return;

    try {
      const response = await fetch(
        `${sb.url}/rest/v1/app_config`,
        {
          method: 'POST',
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            key: 'gcal_calendar_id',
            value: calendarId,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (response.ok || response.status === 201) {
        console.log(`[GoogleCalendar] Saved calendar ID to app_config: ${calendarId}`);
      } else {
        const text = await response.text();
        console.error(`[GoogleCalendar] Failed to save calendar ID (${response.status}): ${text}`);
      }
    } catch (err) {
      console.error(`[GoogleCalendar] Error saving calendar ID:`, err);
    }
  }

  // List events between two dates
  async listEventsBetween(timeMinISO: string, timeMaxISO: string): Promise<CalendarEvent[]> {
    await this.ensureCalendarAccess();
    const token = await this.getAccessToken();

    const params = new URLSearchParams({
      timeMin: timeMinISO,
      timeMax: timeMaxISO,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    });

    const url = `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(this.calendarId)}/events?${params}`;
    console.log(`[GoogleCalendar] Fetching events from: ${url.substring(0, 150)}...`);

    const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[GoogleCalendar] API error: ${error}`);
      throw new Error(`Failed to list events: ${error}`);
    }

    const data = await response.json();
    return (data.items || []).map((ev: Record<string, unknown>) => this.normalizeEvent(ev));
  }

  // Create a new event
  async createEvent(params: CreateEventParams): Promise<CalendarEvent> {
    await this.ensureCalendarAccess();
    const token = await this.getAccessToken();

    const endISO = params.endISO || toISO(addMinMs(new Date(params.startISO).getTime(), APPOINTMENT_DURATION_MIN));

    const event = {
      summary: params.summary,
      description: buildTaggedDescription({
        description: params.description,
        patientName: params.patientName,
        phone: params.phone,
        userId: params.userId,
      }),
      start: {
        dateTime: params.startISO,
        timeZone: TZ,
      },
      end: {
        dateTime: endISO,
        timeZone: TZ,
      },
      location: params.location,
    };

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(this.calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create event: ${error}`);
    }

    const data = await response.json();
    return this.normalizeEvent(data);
  }

  // Update an existing event
  async updateEvent(eventId: string, updates: Partial<CreateEventParams>): Promise<CalendarEvent> {
    await this.ensureCalendarAccess();
    const token = await this.getAccessToken();

    const patch: Record<string, unknown> = {};
    if (updates.summary) patch.summary = updates.summary;
    if (updates.description) patch.description = updates.description;
    if (updates.startISO) {
      patch.start = { dateTime: updates.startISO, timeZone: TZ };
    }
    if (updates.endISO) {
      patch.end = { dateTime: updates.endISO, timeZone: TZ };
    }
    if (updates.location) patch.location = updates.location;

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(this.calendarId)}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patch),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update event: ${error}`);
    }

    const data = await response.json();
    return this.normalizeEvent(data);
  }

  // Delete an event
  async deleteEvent(eventId: string): Promise<boolean> {
    await this.ensureCalendarAccess();
    const token = await this.getAccessToken();

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(this.calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 404) {
      return false;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete event: ${error}`);
    }

    return true;
  }

  // Get a single event by ID
  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    await this.ensureCalendarAccess();
    const token = await this.getAccessToken();

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(this.calendarId)}/events/${eventId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get event: ${error}`);
    }

    const data = await response.json();
    return this.normalizeEvent(data);
  }

  // Normalize event to common format
  private normalizeEvent(rawEvent: Record<string, unknown>): CalendarEvent {
    const start = rawEvent.start as Record<string, string> | undefined;
    const end = rawEvent.end as Record<string, string> | undefined;

    const startISO = start?.dateTime || (start?.date ? new Date(start.date).toISOString() : '');
    const endISO = end?.dateTime || (end?.date ? new Date(end.date).toISOString() : '');

    const description = (rawEvent.description as string) || '';
    const _tags = parseEventTags(description);

    return {
      id: rawEvent.id as string,
      summary: (rawEvent.summary as string) || '',
      description,
      startISO,
      endISO,
      htmlLink: rawEvent.htmlLink as string,
      location: rawEvent.location as string,
    };
  }
}

// Singleton instance
let instance: GoogleCalendarService | null = null;

export function getGoogleCalendar(): GoogleCalendarService {
  if (!instance) {
    instance = new GoogleCalendarService();
  }
  return instance;
}
