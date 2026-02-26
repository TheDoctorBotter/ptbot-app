/**
 * useTexasLocationGate
 *
 * React hook that manages GPS-based Texas location verification for Zoom
 * scheduling. Caches GRANTED results in sessionStorage so users are not
 * re-prompted within the same browser session. Denials are NOT cached so
 * users can retry (e.g. if they were traveling and are now in Texas).
 *
 * Privacy: coordinates are sent to /api/verify-texas and are NOT stored.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// Session-storage keys
const KEY_CHECKED = 'ptbot_zoom_location_checked';
const KEY_IN_TEXAS = 'ptbot_in_texas';

export type GateStatus =
  | 'idle'           // not yet checked this session
  | 'checking'       // geolocation / API call in progress
  | 'granted'        // verified in Texas
  | 'denied'         // verified NOT in Texas
  | 'permission_denied' // user denied browser location permission
  | 'error';         // network or other failure

interface UseTexasLocationGateReturn {
  /** Current verification status */
  status: GateStatus;
  /** True while the GPS / API call is running */
  loading: boolean;
  /** Human-readable error or denial message */
  message: string | null;
  /** Whether the modal should be shown */
  showModal: boolean;
  /** Open the location-gate modal (call when user taps "Book" or visits schedule) */
  requestCheck: () => void;
  /** Run the actual geolocation + API verification */
  verify: () => Promise<void>;
  /** Dismiss the modal without verifying */
  dismiss: () => void;
  /** Clear cached location data (call on sign-out) */
  clearCache: () => void;
}

/**
 * Read a session-storage value (web only; returns null on native).
 */
function sessionGet(key: string): string | null {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Write a session-storage value (web only; no-ops on native).
 */
function sessionSet(key: string, value: string): void {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // quota exceeded or private mode — silently ignore
  }
}

/**
 * Remove a session-storage value (web only; no-ops on native).
 */
function sessionRemove(key: string): void {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // silently ignore
  }
}

export function useTexasLocationGate(): UseTexasLocationGateReturn {
  const [status, setStatus] = useState<GateStatus>('idle');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Callback ref: called when verification succeeds (status → 'granted').
  // schedule.tsx sets this so booking auto-proceeds after the gate passes.
  const onGrantedRef = useRef<(() => void) | null>(null);

  // On mount, rehydrate from sessionStorage — only restore GRANTED status.
  // Denials are never cached, so user can always retry.
  useEffect(() => {
    const checked = sessionGet(KEY_CHECKED);
    if (checked === 'true') {
      const inTexas = sessionGet(KEY_IN_TEXAS);
      if (inTexas === 'true') {
        setStatus('granted');
      }
      // If not 'true', leave status as 'idle' so user can re-verify
    }
  }, []);

  /**
   * Called when the user reaches a scheduling entry point.
   * If already granted this session, does nothing.
   * Otherwise opens the modal to prompt for location access.
   */
  const requestCheck = useCallback(() => {
    if (status === 'granted') {
      return; // already passed — caller should proceed
    }
    // For any other status (idle, denied, error, permission_denied),
    // open the modal so user can (re-)verify
    setShowModal(true);
  }, [status]);

  /**
   * Runs the Browser Geolocation API → POST /api/verify-texas flow.
   */
  const verify = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    setStatus('checking');

    // 1. Check for Geolocation API availability
    if (
      Platform.OS !== 'web' ||
      typeof navigator === 'undefined' ||
      !navigator.geolocation
    ) {
      setStatus('error');
      setMessage(
        'Location services are not available in this browser. ' +
        'Please try a modern browser with location support.'
      );
      setLoading(false);
      return;
    }

    try {
      // 2. Get GPS coordinates
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 15_000,
            maximumAge: 300_000, // allow 5-minute cached position
          });
        }
      );

      const { latitude, longitude } = position.coords;

      // 3. Send to backend for verification
      const res = await fetch('/api/verify-texas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error (${res.status})`);
      }

      const { inTexas } = await res.json();

      if (inTexas) {
        // Cache GRANTED in sessionStorage so user isn't re-prompted
        sessionSet(KEY_CHECKED, 'true');
        sessionSet(KEY_IN_TEXAS, 'true');
        setStatus('granted');
        setMessage(null);
        setShowModal(false);

        // Fire the onGranted callback so the booking flow auto-proceeds
        onGrantedRef.current?.();
      } else {
        // Do NOT cache denial — user can retry immediately
        setStatus('denied');
        setMessage(
          'Zoom consultations are available only in Texas at this time. ' +
          'You can continue using PTBot features without booking a call.'
        );
      }
    } catch (err: any) {
      // Handle Geolocation permission errors
      if (err instanceof GeolocationPositionError) {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('permission_denied');
          setMessage(
            'Location access is required to book a Zoom consultation. ' +
            'You can continue using PTBot without booking a call.'
          );
        } else {
          setStatus('error');
          setMessage(
            'Unable to determine your location. Please check your device ' +
            'settings and try again.'
          );
        }
      } else {
        setStatus('error');
        setMessage(
          err?.message ||
          'Something went wrong while verifying your location. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    setShowModal(false);
  }, []);

  /**
   * Clear cached location data from sessionStorage.
   * Call this on sign-out so the next user gets a fresh check.
   */
  const clearCache = useCallback(() => {
    sessionRemove(KEY_CHECKED);
    sessionRemove(KEY_IN_TEXAS);
    setStatus('idle');
    setMessage(null);
    setShowModal(false);
  }, []);

  return {
    status,
    loading,
    message,
    showModal,
    requestCheck,
    verify,
    dismiss,
    clearCache,
    // Expose the ref setter so schedule.tsx can register a post-granted callback
    _onGrantedRef: onGrantedRef,
  } as UseTexasLocationGateReturn & { _onGrantedRef: React.MutableRefObject<(() => void) | null> };
}
