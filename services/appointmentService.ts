/**
 * Appointment Service
 *
 * Handles scheduling PTBot Zoom Calls through the calendar Edge Functions.
 * Integrates with Google Calendar for availability checking and booking.
 */

import { supabase } from '../lib/supabase';

// Get Supabase URL from environment
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  (typeof globalThis !== 'undefined' &&
    (globalThis as any).import?.meta?.env?.VITE_SUPABASE_URL) ||
  '';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof globalThis !== 'undefined' &&
    (globalThis as any).import?.meta?.env?.VITE_SUPABASE_ANON_KEY) ||
  '';

// Types
export interface TimeSlot {
  startISO: string;
  timeDisplay: string;
}

export interface DaySlots {
  date: string;
  dateDisplay: string;
  slots: TimeSlot[];
}

export interface AvailabilityResponse {
  ok: boolean;
  timezone: string;
  durationMinutes: number;
  days: number;
  totalSlots: number;
  slotsByDay: DaySlots[];
}

export interface Appointment {
  id: string;
  user_id: string | null;
  patient_name: string;
  patient_email: string | null;
  patient_phone: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  google_event_id: string | null;
  google_event_link: string | null;
  zoom_meeting_id: string | null;
  zoom_meeting_url: string | null;
  zoom_meeting_passcode: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  auto_confirmed: boolean;
  confirmed_at: string | null;
  confirmed_by: string | null;
  patient_notes: string | null;
  pt_notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingRequest {
  startISO: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  notes?: string;
}

export interface BookingResponse {
  ok: boolean;
  appointment: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    autoConfirmed: boolean;
    googleEventLink: string | null;
  };
  message: string;
}

export class AppointmentService {
  private static instance: AppointmentService;

  private constructor() {}

  static getInstance(): AppointmentService {
    if (!AppointmentService.instance) {
      AppointmentService.instance = new AppointmentService();
    }
    return AppointmentService.instance;
  }

  private async getAccessToken(): Promise<string | null> {
    if (!supabase) {
      console.warn('[AppointmentService] Supabase client not initialized');
      return null;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (err) {
      console.error('[AppointmentService] Error getting access token:', err);
      return null;
    }
  }

  private async callFunction(
    functionName: string,
    method: 'GET' | 'POST' = 'GET',
    body?: Record<string, unknown>,
    queryParams?: Record<string, string>
  ): Promise<unknown> {
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    const accessToken = await this.getAccessToken();

    let url = `${supabaseUrl}/functions/v1/${functionName}`;
    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }

    const headers: Record<string, string> = {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.reason || `Request failed with status ${response.status}`);
    }

    return data;
  }

  /**
   * Fetch available appointment slots
   * @param days Number of days to fetch (1-14, default 7)
   * @param startFrom Optional ISO date to start from
   */
  async getAvailability(days = 7, startFrom?: string): Promise<AvailabilityResponse> {
    const queryParams: Record<string, string> = {
      days: String(Math.min(Math.max(days, 1), 14)),
    };

    if (startFrom) {
      queryParams.startFrom = startFrom;
    }

    const response = await this.callFunction('calendar-availability', 'GET', undefined, queryParams);
    return response as AvailabilityResponse;
  }

  /**
   * Book an appointment
   */
  async bookAppointment(request: BookingRequest): Promise<BookingResponse> {
    const response = await this.callFunction('calendar-book', 'POST', {
      startISO: request.startISO,
      patientName: request.patientName,
      patientEmail: request.patientEmail,
      patientPhone: request.patientPhone,
      notes: request.notes,
    });

    return response as BookingResponse;
  }

  /**
   * Get user's appointments
   */
  async getMyAppointments(options?: {
    status?: string;
    upcoming?: boolean;
    limit?: number;
  }): Promise<{ ok: boolean; appointments: Appointment[]; count: number }> {
    const queryParams: Record<string, string> = {};

    if (options?.status) {
      queryParams.status = options.status;
    }
    if (options?.upcoming) {
      queryParams.upcoming = 'true';
    }
    if (options?.limit) {
      queryParams.limit = String(options.limit);
    }

    const response = await this.callFunction('calendar-appointments', 'GET', undefined, queryParams);
    return response as { ok: boolean; appointments: Appointment[]; count: number };
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string, reason?: string): Promise<{ ok: boolean; message: string; appointment: Appointment }> {
    const response = await this.callFunction('calendar-appointments', 'POST', {
      action: 'cancel',
      appointmentId,
      reason,
    });

    return response as { ok: boolean; message: string; appointment: Appointment };
  }

  /**
   * Confirm an appointment (PT only)
   */
  async confirmAppointment(
    appointmentId: string,
    zoomDetails?: {
      zoomMeetingId?: string;
      zoomMeetingUrl?: string;
      zoomMeetingPasscode?: string;
    }
  ): Promise<{ ok: boolean; message: string; appointment: Appointment }> {
    const response = await this.callFunction('calendar-appointments', 'POST', {
      action: 'confirm',
      appointmentId,
      ...zoomDetails,
    });

    return response as { ok: boolean; message: string; appointment: Appointment };
  }

  /**
   * Add Zoom details to an appointment (PT only)
   */
  async addZoomDetails(
    appointmentId: string,
    zoomMeetingUrl: string,
    zoomMeetingId?: string,
    zoomMeetingPasscode?: string
  ): Promise<{ ok: boolean; message: string; appointment: Appointment }> {
    const response = await this.callFunction('calendar-appointments', 'POST', {
      action: 'add_zoom',
      appointmentId,
      zoomMeetingId,
      zoomMeetingUrl,
      zoomMeetingPasscode,
    });

    return response as { ok: boolean; message: string; appointment: Appointment };
  }

  /**
   * Mark appointment as completed (PT only)
   */
  async completeAppointment(
    appointmentId: string,
    ptNotes?: string
  ): Promise<{ ok: boolean; message: string; appointment: Appointment }> {
    const response = await this.callFunction('calendar-appointments', 'POST', {
      action: 'complete',
      appointmentId,
      ptNotes,
    });

    return response as { ok: boolean; message: string; appointment: Appointment };
  }

  /**
   * Mark appointment as no-show (PT only)
   */
  async markNoShow(appointmentId: string): Promise<{ ok: boolean; message: string; appointment: Appointment }> {
    const response = await this.callFunction('calendar-appointments', 'POST', {
      action: 'no_show',
      appointmentId,
    });

    return response as { ok: boolean; message: string; appointment: Appointment };
  }

  /**
   * Format appointment time for display
   */
  formatAppointmentTime(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const dateStr = start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const startTimeStr = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    const endTimeStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    return `${dateStr}, ${startTimeStr} - ${endTimeStr}`;
  }

  /**
   * Get status display info
   */
  getStatusInfo(status: Appointment['status']): { label: string; color: string } {
    switch (status) {
      case 'pending':
        return { label: 'Pending Confirmation', color: '#F59E0B' };
      case 'confirmed':
        return { label: 'Confirmed', color: '#10B981' };
      case 'cancelled':
        return { label: 'Cancelled', color: '#EF4444' };
      case 'completed':
        return { label: 'Completed', color: '#6B7280' };
      case 'no_show':
        return { label: 'No Show', color: '#EF4444' };
      default:
        return { label: status, color: '#6B7280' };
    }
  }
}

// Export singleton instance
export const appointmentService = AppointmentService.getInstance();
