import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { getGoogleCalendar } from '../_shared/googleCalendar.ts';
import { createZoomMeeting } from '../_shared/zoom.ts';
import {
  isSlotAvailable,
  isBusinessHours,
  APPOINTMENT_DURATION_MIN,
  addMinMs,
  toISO,
  toMs,
} from '../_shared/schedule.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

interface BookingRequest {
  startISO: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  notes?: string;
}

function validateBookingRequest(body: unknown): { valid: true; data: BookingRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const request = body as Record<string, unknown>;

  if (!request.startISO || typeof request.startISO !== 'string') {
    return { valid: false, error: 'Missing or invalid startISO' };
  }

  // Validate ISO date format
  const startDate = new Date(request.startISO);
  if (isNaN(startDate.getTime())) {
    return { valid: false, error: 'Invalid startISO format' };
  }

  // Must be in the future
  if (startDate.getTime() < Date.now()) {
    return { valid: false, error: 'Appointment time must be in the future' };
  }

  if (!request.patientName || typeof request.patientName !== 'string' || request.patientName.length < 2) {
    return { valid: false, error: 'Missing or invalid patientName (min 2 characters)' };
  }

  if (request.patientName.length > 100) {
    return { valid: false, error: 'patientName too long (max 100 characters)' };
  }

  if (request.patientEmail && typeof request.patientEmail === 'string') {
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.patientEmail)) {
      return { valid: false, error: 'Invalid email format' };
    }
  }

  if (request.patientPhone && typeof request.patientPhone === 'string') {
    // Basic phone validation (at least 10 digits)
    const digits = request.patientPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      return { valid: false, error: 'Invalid phone number (min 10 digits)' };
    }
  }

  if (request.notes && typeof request.notes === 'string' && request.notes.length > 1000) {
    return { valid: false, error: 'Notes too long (max 1000 characters)' };
  }

  return {
    valid: true,
    data: {
      startISO: request.startISO as string,
      patientName: request.patientName as string,
      patientEmail: request.patientEmail as string | undefined,
      patientPhone: request.patientPhone as string | undefined,
      notes: request.notes as string | undefined,
    },
  };
}

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    // Authenticate user (optional - can book without account)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
      userEmail = user?.email || null;
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return corsResponse({ error: 'Invalid JSON body' }, 400);
    }

    const validation = validateBookingRequest(body);
    if (!validation.valid) {
      return corsResponse({ error: validation.error }, 400);
    }

    const { startISO, patientName, patientEmail, patientPhone, notes } = validation.data;

    console.log(`[calendar-book] Booking request: ${patientName} at ${startISO}, user: ${userId?.slice(0, 8) || 'anonymous'}`);

    // Get calendar instance
    const calendar = getGoogleCalendar();

    // Calculate time window for conflict check (±1 day)
    const startMs = toMs(startISO);
    const timeMinISO = toISO(startMs - 24 * 60 * 60_000);
    const timeMaxISO = toISO(startMs + 24 * 60 * 60_000);

    // Fetch existing events
    const existingEvents = await calendar.listEventsBetween(timeMinISO, timeMaxISO);

    // Check if slot is available
    const slotCheck = isSlotAvailable({
      proposedStartISO: startISO,
      existingEvents: existingEvents.map(ev => ({
        startISO: ev.startISO,
        endISO: ev.endISO,
      })),
    });

    if (!slotCheck.ok) {
      console.log(`[calendar-book] Slot not available: ${slotCheck.reason}`);
      return corsResponse({ error: 'Slot not available', reason: slotCheck.reason }, 409);
    }

    // Calculate end time
    const endISO = toISO(addMinMs(startMs, APPOINTMENT_DURATION_MIN));

    // Determine if auto-confirm (during business hours)
    const autoConfirm = isBusinessHours(startISO);
    const status = autoConfirm ? 'confirmed' : 'pending';

    // Create Zoom meeting first so we can include the link in the calendar event
    let zoomMeetingId: string | null = null;
    let zoomMeetingUrl: string | null = null;
    let zoomMeetingPasscode: string | null = null;

    console.log(`[calendar-book] Attempting Zoom meeting creation...`);
    try {
      const zoomMeeting = await createZoomMeeting(
        patientName,
        startISO,
        APPOINTMENT_DURATION_MIN
      );
      zoomMeetingId = String(zoomMeeting.id);
      zoomMeetingUrl = zoomMeeting.join_url;
      zoomMeetingPasscode = zoomMeeting.password || null;
      console.log(`[calendar-book] Created Zoom meeting: ${zoomMeetingId}`);
    } catch (zoomErr) {
      // Log at info level so it appears in standard Supabase logs (console.error goes to a separate stream)
      const zoomErrMsg = zoomErr instanceof Error ? zoomErr.message : String(zoomErr);
      console.log(`[calendar-book] WARNING: Zoom meeting creation failed (non-blocking): ${zoomErrMsg}`);
    }

    // Create Google Calendar event (with Zoom link if available)
    const summary = `PTBot Zoom Call - ${patientName}`;
    const descriptionParts: string[] = [];
    if (zoomMeetingUrl) {
      descriptionParts.push(`Join Zoom Meeting: ${zoomMeetingUrl}`);
      if (zoomMeetingPasscode) {
        descriptionParts.push(`Passcode: ${zoomMeetingPasscode}`);
      }
      descriptionParts.push('');
    }
    if (notes) {
      descriptionParts.push(`Notes: ${notes}`);
    }
    const description = descriptionParts.join('\n');

    const calendarEvent = await calendar.createEvent({
      summary,
      description,
      startISO,
      endISO,
      location: zoomMeetingUrl || undefined,
      patientName,
      phone: patientPhone,
      userId: userId || undefined,
    });

    console.log(`[calendar-book] Created Google Calendar event: ${calendarEvent.id}`);

    // Save appointment to database
    const { data: appointment, error: dbError } = await supabase
      .from('appointments')
      .insert({
        user_id: userId,
        patient_name: patientName,
        patient_email: patientEmail || userEmail,
        patient_phone: patientPhone,
        start_time: startISO,
        end_time: endISO,
        duration_minutes: APPOINTMENT_DURATION_MIN,
        google_event_id: calendarEvent.id,
        google_event_link: calendarEvent.htmlLink,
        zoom_meeting_id: zoomMeetingId,
        zoom_meeting_url: zoomMeetingUrl,
        zoom_meeting_passcode: zoomMeetingPasscode,
        status,
        auto_confirmed: autoConfirm,
        confirmed_at: autoConfirm ? new Date().toISOString() : null,
        patient_notes: notes,
      })
      .select()
      .single();

    if (dbError) {
      console.error(`[calendar-book] Database error: ${dbError.message}`);
      // Try to delete the calendar event since DB insert failed
      try {
        await calendar.deleteEvent(calendarEvent.id);
      } catch (deleteErr) {
        console.error(`[calendar-book] Failed to rollback calendar event: ${deleteErr}`);
      }
      return corsResponse({ error: 'Failed to save appointment' }, 500);
    }

    console.log(`[calendar-book] Appointment saved: ${appointment.id}, status: ${status}`);

    // Build an honest message based on what actually succeeded
    let message: string;
    if (autoConfirm && zoomMeetingUrl) {
      message = 'Your appointment has been confirmed! A Zoom link has been created for your session.';
    } else if (autoConfirm && !zoomMeetingUrl) {
      message = 'Your appointment has been confirmed, but we could not create a Zoom link automatically. One will be provided before your session.';
    } else if (!autoConfirm && zoomMeetingUrl) {
      message = 'Your appointment is pending confirmation. A Zoom link is ready and will be available once confirmed.';
    } else {
      message = 'Your appointment is pending confirmation. You will receive a Zoom link once your appointment is confirmed.';
    }

    return corsResponse({
      ok: true,
      appointment: {
        id: appointment.id,
        startTime: appointment.start_time,
        endTime: appointment.end_time,
        status: appointment.status,
        autoConfirmed: appointment.auto_confirmed,
        googleEventLink: appointment.google_event_link,
        zoomMeetingUrl: appointment.zoom_meeting_url,
        zoomMeetingId: appointment.zoom_meeting_id,
      },
      zoomCreated: !!zoomMeetingUrl,
      message,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[calendar-book] Error: ${message}`);
    return corsResponse({ error: 'Failed to book appointment', details: message }, 500);
  }
});
