import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { getGoogleCalendar } from '../_shared/googleCalendar.ts';
import {
  generateSlotsByDay,
  APPOINTMENT_DURATION_MIN,
  TZ,
} from '../_shared/schedule.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    // Optional: Authenticate user (not required for viewing availability)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Parse request parameters
    let days = 7;
    let startFromISO: string | undefined;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        days = Math.min(Math.max(body.days || 7, 1), 14);
        startFromISO = body.startFromISO;
      } catch {
        // Use defaults
      }
    } else {
      const url = new URL(req.url);
      const daysParam = url.searchParams.get('days');
      if (daysParam) {
        days = Math.min(Math.max(parseInt(daysParam, 10) || 7, 1), 14);
      }
      startFromISO = url.searchParams.get('startFrom') || undefined;
    }

    console.log(`[calendar-availability] Fetching availability for ${days} days, user: ${userId?.slice(0, 8) || 'anonymous'}`);

    // Get calendar instance
    const calendar = getGoogleCalendar();

    // Calculate time window for Google Calendar query
    const now = startFromISO ? new Date(startFromISO) : new Date();
    const windowStart = new Date(now);
    windowStart.setHours(0, 0, 0, 0);

    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + days);
    windowEnd.setHours(23, 59, 59, 999);

    // Fetch existing events from Google Calendar
    const existingEvents = await calendar.listEventsBetween(
      windowStart.toISOString(),
      windowEnd.toISOString()
    );

    console.log(`[calendar-availability] Found ${existingEvents.length} existing events`);

    // Generate available slots
    const slotsByDay = generateSlotsByDay({
      days,
      startFromISO,
      existingEvents: existingEvents.map(ev => ({
        startISO: ev.startISO,
        endISO: ev.endISO,
        id: ev.id,
        summary: ev.summary,
      })),
    });

    // Count total available slots
    const totalSlots = slotsByDay.reduce((sum, day) => sum + day.slots.length, 0);

    return corsResponse({
      ok: true,
      timezone: TZ,
      durationMinutes: APPOINTMENT_DURATION_MIN,
      days,
      totalSlots,
      slotsByDay,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[calendar-availability] Error: ${message}`);
    // Surface 404 as a calendar-not-shared hint
    const isNotFound = message.includes('404') || message.includes('Not Found');
    const hint = isNotFound
      ? 'Calendar not accessible. Ensure the calendar is shared with the service account email in Google Calendar settings.'
      : undefined;
    return corsResponse({ error: 'Failed to fetch availability', details: message, hint }, 500);
  }
});
