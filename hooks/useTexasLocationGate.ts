/**
 * useTexasLocationGate
 *
 * React hook that manages GPS-based Texas location verification for Zoom
 * scheduling. Caches the result in sessionStorage so users are not
 * re-prompted within the same browser session.
 *
 * Privacy: coordinates are sent to /api/verify-texas and are NOT stored.
 */

import { useState, useCallback, useEffect } from 'react';
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

export function useTexasLocationGate(): UseTexasLocationGateReturn {
  const [status, setStatus] = useState<GateStatus>('idle');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // On mount, rehydrate from sessionStorage
  useEffect(() => {
    const checked = sessionGet(KEY_CHECKED);
    if (checked === 'true') {
      const inTexas = sessionGet(KEY_IN_TEXAS);
      setStatus(inTexas === 'true' ? 'granted' : 'denied');
      if (inTexas !== 'true') {
        setMessage(
          'Zoom consultations are available only in Texas at this time. ' +
          'You can continue using PTBot features without booking a call.'
        );
      }
    }
  }, []);

  /**
   * Called when the user reaches a scheduling entry point.
   * If already checked this session, does nothing (status is already set).
   * Otherwise opens the modal to prompt for location access.
   */
  const requestCheck = useCallback(() => {
    if (status === 'granted' || status === 'denied') {
      // Already resolved this session — just surface modal for denied
      if (status === 'denied') {
        setShowModal(true);
      }
      return;
    }
    setShowModal(true);
  }, [status]);

  /**
   * Runs the Browser Geolocation API → POST /api/verify-texas flow.
   */
  const verify = useCallback(async () => {
    setLoading(true);
    setMessage(null);

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

      // 4. Persist to session
      sessionSet(KEY_CHECKED, 'true');
      sessionSet(KEY_IN_TEXAS, String(!!inTexas));

      if (inTexas) {
        setStatus('granted');
        setMessage(null);
        setShowModal(false);
      } else {
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

  return {
    status,
    loading,
    message,
    showModal,
    requestCheck,
    verify,
    dismiss,
  };
}
