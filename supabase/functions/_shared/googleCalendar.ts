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

  constructor() {
    this.calendarId = Deno.env.get('GCAL_CALENDAR_ID') || '';
    const credentialsJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON') || '';

    console.log(`[GoogleCalendar] Calendar ID: "${this.calendarId}"`);
    console.log(`[GoogleCalendar] Credentials JSON length: ${credentialsJson.length}`);

    if (!this.calendarId || !credentialsJson) {
      throw new Error('Missing GCAL_CALENDAR_ID or GOOGLE_SERVICE_ACCOUNT_JSON');
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

  // Ensure the service account has the calendar in its calendarList.
  // When a user shares a calendar with a service account, the service account
  // must "subscribe" to it via calendarList.insert before it can access events.
  private calendarAccessEnsured = false;

  async ensureCalendarAccess(): Promise<void> {
    if (this.calendarAccessEnsured) return;

    const token = await this.getAccessToken();

    // First, list ALL calendars the service account can see
    try {
      const listResponse = await fetch(
        `${GOOGLE_CALENDAR_API}/users/me/calendarList`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const listData = await listResponse.json();
      const items = listData.items || [];
      console.log(`[GoogleCalendar] Service account has ${items.length} calendar(s) in list`);
      for (const cal of items) {
        console.log(`[GoogleCalendar]   - ${cal.id} (role: ${cal.accessRole})`);
      }

      // Check if our target calendar is already there
      const found = items.find((c: Record<string, string>) => c.id === this.calendarId);
      if (found) {
        console.log(`[GoogleCalendar] Target calendar already in list (role: ${found.accessRole})`);
        this.calendarAccessEnsured = true;
        return;
      }
    } catch (err) {
      console.error(`[GoogleCalendar] Error listing calendars:`, err);
    }

    // Try to subscribe the service account to the shared calendar
    console.log(`[GoogleCalendar] Attempting to subscribe to calendar: ${this.calendarId}`);
    try {
      const insertResponse = await fetch(
        `${GOOGLE_CALENDAR_API}/users/me/calendarList`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: this.calendarId }),
        }
      );

      const insertData = await insertResponse.json();

      if (insertResponse.ok) {
        console.log(`[GoogleCalendar] Successfully subscribed to calendar: ${insertData.summary || this.calendarId} (role: ${insertData.accessRole})`);
        this.calendarAccessEnsured = true;
      } else {
        const errMsg = JSON.stringify(insertData);
        console.error(`[GoogleCalendar] Subscribe failed (${insertResponse.status}): ${errMsg}`);
        if (insertResponse.status === 404) {
          console.error(`[GoogleCalendar] 404 = Calendar not found or not shared. The calendar owner must share it with: ${this.credentials.client_email}`);
        } else if (insertResponse.status === 403) {
          console.error(`[GoogleCalendar] 403 = Access denied. Check that the service account has the calendar scope.`);
        }
      }
    } catch (err) {
      console.error(`[GoogleCalendar] Error subscribing to calendar:`, err);
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
