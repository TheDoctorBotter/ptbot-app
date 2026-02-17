// Scheduling utilities for PTBot Zoom Calls
// Adapted from buckeye-scheduler for 30-minute appointments with 5-minute buffer

export const TZ = 'America/Chicago';

// Configuration for PTBot Zoom Calls
export const GRID_MINUTES = 15; // Slot intervals
export const APPOINTMENT_DURATION_MIN = 30; // 30-minute appointments
export const BUFFER_MIN = 5; // 5-minute buffer after each call

// Business hours (Central Time)
export const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 17, // 5 PM
  days: [1, 2, 3, 4, 5], // Monday-Friday (0=Sunday)
};

// Time helpers
export function toMs(iso: string): number {
  return new Date(iso).getTime();
}

export function addMinMs(ms: number, minutes: number): number {
  return ms + minutes * 60_000;
}

export function toISO(ms: number): string {
  return new Date(ms).toISOString();
}

export function roundToGridCeil(ms: number, gridMin = GRID_MINUTES): number {
  const g = gridMin * 60_000;
  return Math.ceil(ms / g) * g;
}

export function isOnGrid(ms: number, gridMin = GRID_MINUTES): boolean {
  const g = gridMin * 60_000;
  return ms % g === 0;
}

// Check if two intervals overlap
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// Check if a time is within business hours
export function isBusinessHours(isoTime: string): boolean {
  const date = new Date(isoTime);

  // Convert to Central Time for business hours check
  const centralTime = new Date(date.toLocaleString('en-US', { timeZone: TZ }));
  const hour = centralTime.getHours();
  const dayOfWeek = centralTime.getDay();

  return (
    BUSINESS_HOURS.days.includes(dayOfWeek) &&
    hour >= BUSINESS_HOURS.start &&
    hour < BUSINESS_HOURS.end
  );
}

export interface ExistingEvent {
  startISO: string;
  endISO: string;
  id?: string;
  summary?: string;
}

export interface SlotCheckResult {
  ok: boolean;
  reason?: string;
}

// Calculate the blocked interval for an existing event (includes buffer)
function effectiveBlockedInterval(event: ExistingEvent): { start: number; end: number } {
  const start = toMs(event.startISO);
  const end = toMs(event.endISO);

  // Add buffer after the event
  return { start, end: addMinMs(end, BUFFER_MIN) };
}

// Check if a specific slot is available
export function isSlotAvailable({
  proposedStartISO,
  durationMin = APPOINTMENT_DURATION_MIN,
  existingEvents,
}: {
  proposedStartISO: string;
  durationMin?: number;
  existingEvents: ExistingEvent[];
}): SlotCheckResult {
  const start = toMs(proposedStartISO);

  // Must be on 15-minute boundary
  if (!isOnGrid(start)) {
    return { ok: false, reason: 'Start time must be on a 15-minute boundary.' };
  }

  // Check if within business hours
  if (!isBusinessHours(proposedStartISO)) {
    return { ok: false, reason: 'Appointment must be during business hours (9 AM - 5 PM CT, Mon-Fri).' };
  }

  const end = addMinMs(start, durationMin);

  // Check against all existing events
  for (const ev of existingEvents || []) {
    const blocked = effectiveBlockedInterval(ev);

    if (overlaps(start, end, blocked.start, blocked.end)) {
      return {
        ok: false,
        reason: `Conflicts with existing appointment at ${ev.startISO}`,
      };
    }
  }

  return { ok: true };
}

// Generate all available slots in a time window
export function generateAvailableSlots({
  windowStartISO,
  windowEndISO,
  durationMin = APPOINTMENT_DURATION_MIN,
  existingEvents,
}: {
  windowStartISO: string;
  windowEndISO: string;
  durationMin?: number;
  existingEvents: ExistingEvent[];
}): string[] {
  const startMs = roundToGridCeil(toMs(windowStartISO));
  const endMs = toMs(windowEndISO);

  const slots: string[] = [];

  for (let t = startMs; t <= endMs - durationMin * 60_000; t = addMinMs(t, GRID_MINUTES)) {
    const proposedStartISO = toISO(t);
    const check = isSlotAvailable({
      proposedStartISO,
      durationMin,
      existingEvents,
    });
    if (check.ok) {
      slots.push(proposedStartISO);
    }
  }

  return slots;
}

// Get slots organized by day
export interface DaySlots {
  date: string; // YYYY-MM-DD
  dateDisplay: string; // e.g., "Monday, Feb 17"
  slots: Array<{
    startISO: string;
    timeDisplay: string; // e.g., "9:00 AM"
  }>;
}

export function generateSlotsByDay({
  days = 7,
  startFromISO,
  existingEvents,
}: {
  days?: number;
  startFromISO?: string;
  existingEvents: ExistingEvent[];
}): DaySlots[] {
  const now = startFromISO ? new Date(startFromISO) : new Date();
  const result: DaySlots[] = [];

  for (let d = 0; d < days; d++) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() + d);
    dayStart.setHours(BUSINESS_HOURS.start, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(BUSINESS_HOURS.end, 0, 0, 0);

    // Skip weekends
    if (!BUSINESS_HOURS.days.includes(dayStart.getDay())) {
      continue;
    }

    const slots = generateAvailableSlots({
      windowStartISO: dayStart.toISOString(),
      windowEndISO: dayEnd.toISOString(),
      existingEvents,
    });

    if (slots.length > 0) {
      result.push({
        date: dayStart.toISOString().split('T')[0],
        dateDisplay: dayStart.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          timeZone: TZ,
        }),
        slots: slots.map(startISO => ({
          startISO,
          timeDisplay: new Date(startISO).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: TZ,
          }),
        })),
      });
    }
  }

  return result;
}
