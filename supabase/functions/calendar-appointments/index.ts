import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { getGoogleCalendar } from '../_shared/googleCalendar.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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

// Check if user is PT/admin
async function isPTOrAdmin(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile?.role === 'pt' || profile?.role === 'admin';
}

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return corsResponse({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return corsResponse({ error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    const isPT = await isPTOrAdmin(userId);

    // GET - List appointments
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const status = url.searchParams.get('status');
      const upcoming = url.searchParams.get('upcoming') === 'true';
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);

      let query = supabase
        .from('appointments')
        .select('*')
        .order('start_time', { ascending: true })
        .limit(limit);

      // PT can see all, patients only see their own
      if (!isPT) {
        query = query.eq('user_id', userId);
      }

      // Filter by status if specified
      if (status) {
        query = query.eq('status', status);
      }

      // Filter to upcoming appointments only
      if (upcoming) {
        query = query.gte('start_time', new Date().toISOString());
      }

      const { data: appointments, error: queryError } = await query;

      if (queryError) {
        console.error(`[calendar-appointments] Query error: ${queryError.message}`);
        return corsResponse({ error: 'Failed to fetch appointments' }, 500);
      }

      return corsResponse({
        ok: true,
        appointments,
        count: appointments?.length || 0,
      });
    }

    // POST - Actions on appointments (confirm, cancel, add zoom details)
    if (req.method === 'POST') {
      let body: Record<string, unknown>;
      try {
        body = await req.json();
      } catch {
        return corsResponse({ error: 'Invalid JSON body' }, 400);
      }

      const action = body.action as string;
      const appointmentId = body.appointmentId as string;

      if (!action || !appointmentId) {
        return corsResponse({ error: 'Missing action or appointmentId' }, 400);
      }

      // Fetch the appointment
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (fetchError || !appointment) {
        return corsResponse({ error: 'Appointment not found' }, 404);
      }

      // Check permissions (PT can manage all, patients can only cancel their own)
      const isOwner = appointment.user_id === userId;
      if (!isPT && !isOwner) {
        return corsResponse({ error: 'Not authorized to manage this appointment' }, 403);
      }

      switch (action) {
        case 'confirm': {
          // Only PT can confirm
          if (!isPT) {
            return corsResponse({ error: 'Only PT can confirm appointments' }, 403);
          }

          const zoomMeetingId = body.zoomMeetingId as string | undefined;
          const zoomMeetingUrl = body.zoomMeetingUrl as string | undefined;
          const zoomMeetingPasscode = body.zoomMeetingPasscode as string | undefined;

          const { data: updated, error: updateError } = await supabase
            .from('appointments')
            .update({
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
              confirmed_by: userId,
              zoom_meeting_id: zoomMeetingId,
              zoom_meeting_url: zoomMeetingUrl,
              zoom_meeting_passcode: zoomMeetingPasscode,
            })
            .eq('id', appointmentId)
            .select()
            .single();

          if (updateError) {
            return corsResponse({ error: 'Failed to confirm appointment' }, 500);
          }

          // Update Google Calendar event with Zoom details if provided
          if (appointment.google_event_id && zoomMeetingUrl) {
            try {
              const calendar = getGoogleCalendar();
              await calendar.updateEvent(appointment.google_event_id, {
                summary: `PTBot Zoom Call - ${appointment.patient_name} (CONFIRMED)`,
                location: zoomMeetingUrl,
                description: `Zoom Meeting URL: ${zoomMeetingUrl}\nPasscode: ${zoomMeetingPasscode || 'N/A'}\n\nNotes: ${appointment.patient_notes || 'None'}`,
              });
            } catch (calError) {
              console.error(`[calendar-appointments] Failed to update calendar: ${calError}`);
            }
          }

          return corsResponse({
            ok: true,
            message: 'Appointment confirmed',
            appointment: updated,
          });
        }

        case 'cancel': {
          const cancellationReason = body.reason as string | undefined;

          // Patients can only cancel their own appointments
          if (!isPT && !isOwner) {
            return corsResponse({ error: 'Not authorized to cancel this appointment' }, 403);
          }

          const { data: updated, error: updateError } = await supabase
            .from('appointments')
            .update({
              status: 'cancelled',
              cancellation_reason: cancellationReason || (isPT ? 'Cancelled by PT' : 'Cancelled by patient'),
            })
            .eq('id', appointmentId)
            .select()
            .single();

          if (updateError) {
            return corsResponse({ error: 'Failed to cancel appointment' }, 500);
          }

          // Delete from Google Calendar
          if (appointment.google_event_id) {
            try {
              const calendar = getGoogleCalendar();
              await calendar.deleteEvent(appointment.google_event_id);
            } catch (calError) {
              console.error(`[calendar-appointments] Failed to delete calendar event: ${calError}`);
            }
          }

          return corsResponse({
            ok: true,
            message: 'Appointment cancelled',
            appointment: updated,
          });
        }

        case 'complete': {
          // Only PT can mark as completed
          if (!isPT) {
            return corsResponse({ error: 'Only PT can complete appointments' }, 403);
          }

          const ptNotes = body.ptNotes as string | undefined;

          const { data: updated, error: updateError } = await supabase
            .from('appointments')
            .update({
              status: 'completed',
              pt_notes: ptNotes,
            })
            .eq('id', appointmentId)
            .select()
            .single();

          if (updateError) {
            return corsResponse({ error: 'Failed to complete appointment' }, 500);
          }

          return corsResponse({
            ok: true,
            message: 'Appointment marked as completed',
            appointment: updated,
          });
        }

        case 'no_show': {
          // Only PT can mark as no-show
          if (!isPT) {
            return corsResponse({ error: 'Only PT can mark no-shows' }, 403);
          }

          const { data: updated, error: updateError } = await supabase
            .from('appointments')
            .update({
              status: 'no_show',
            })
            .eq('id', appointmentId)
            .select()
            .single();

          if (updateError) {
            return corsResponse({ error: 'Failed to update appointment' }, 500);
          }

          return corsResponse({
            ok: true,
            message: 'Appointment marked as no-show',
            appointment: updated,
          });
        }

        case 'add_zoom': {
          // Only PT can add Zoom details
          if (!isPT) {
            return corsResponse({ error: 'Only PT can add Zoom details' }, 403);
          }

          const zoomMeetingId = body.zoomMeetingId as string;
          const zoomMeetingUrl = body.zoomMeetingUrl as string;
          const zoomMeetingPasscode = body.zoomMeetingPasscode as string | undefined;

          if (!zoomMeetingUrl) {
            return corsResponse({ error: 'Missing zoomMeetingUrl' }, 400);
          }

          const { data: updated, error: updateError } = await supabase
            .from('appointments')
            .update({
              zoom_meeting_id: zoomMeetingId,
              zoom_meeting_url: zoomMeetingUrl,
              zoom_meeting_passcode: zoomMeetingPasscode,
            })
            .eq('id', appointmentId)
            .select()
            .single();

          if (updateError) {
            return corsResponse({ error: 'Failed to add Zoom details' }, 500);
          }

          // Update Google Calendar event
          if (appointment.google_event_id) {
            try {
              const calendar = getGoogleCalendar();
              await calendar.updateEvent(appointment.google_event_id, {
                location: zoomMeetingUrl,
                description: `Zoom Meeting URL: ${zoomMeetingUrl}\nPasscode: ${zoomMeetingPasscode || 'N/A'}\n\nNotes: ${appointment.patient_notes || 'None'}`,
              });
            } catch (calError) {
              console.error(`[calendar-appointments] Failed to update calendar: ${calError}`);
            }
          }

          return corsResponse({
            ok: true,
            message: 'Zoom details added',
            appointment: updated,
          });
        }

        default:
          return corsResponse({ error: `Unknown action: ${action}` }, 400);
      }
    }

    return corsResponse({ error: 'Method not allowed' }, 405);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[calendar-appointments] Error: ${message}`);
    return corsResponse({ error: 'Internal server error', details: message }, 500);
  }
});
