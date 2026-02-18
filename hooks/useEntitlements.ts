/**
 * useEntitlements – centralised entitlement state for the PTBot freemium model.
 *
 * Reads the `entitlements` and `telehealth_credits` tables (RLS-scoped to the
 * authenticated user) and exposes computed access helpers.
 *
 * The hook re-fetches automatically when:
 *  • the component mounts
 *  • the app comes back to foreground (AppState change)
 *  • `refresh()` is called explicitly (e.g. after returning from Stripe checkout)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Entitlement {
  id: string;
  entitlement_key: string;
  scope_json: Record<string, string>;
  active: boolean;
  valid_from: string;
  valid_to: string | null;
}

export interface TelehealthCredit {
  id: string;
  source: 'subscription' | 'one_time';
  quantity: number;
  used_quantity: number;
  period_end: string | null;
}

export interface EntitlementState {
  loading: boolean;
  error: string | null;
  /** Raw rows from the entitlements table */
  entitlements: Entitlement[];
  /** Total remaining telehealth credits */
  telehealthCreditsAvailable: number;

  // ── Derived access helpers ──────────────────────────────────────────────
  /** True if user has an active monthly subscription. */
  hasSubscription: boolean;
  /** True if user can use the AI chatbot without limit. */
  hasUnlimitedBot: boolean;
  /** True if user can run unlimited assessments. */
  hasUnlimitedAssessments: boolean;
  /** True if user can access unlimited exercise plans. */
  hasUnlimitedPlans: boolean;
  /** True if user has access to all exercise videos. */
  hasAllVideos: boolean;
  /**
   * True if user can export a PDF.
   * Pass an optional condition to check scoped pdf_export as well.
   */
  canExportPDF: (condition?: string) => boolean;
  /**
   * True if user can see the full exercise plan for a given condition.
   * Free users always get FALSE unless they purchased that condition.
   */
  canAccessFullPlan: (condition?: string) => boolean;
  /** True if user has at least 1 available telehealth credit. */
  canBookTelehealth: boolean;

  /** Re-fetch entitlements from the server. */
  refresh: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEntitlements(): EntitlementState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [creditsAvailable, setCreditsAvailable] = useState(0);

  const appState = useRef(AppState.currentState);

  const fetchEntitlements = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setEntitlements([]);
      setCreditsAvailable(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [entRes, credRes] = await Promise.all([
        supabase
          .from('entitlements')
          .select('id, entitlement_key, scope_json, active, valid_from, valid_to')
          .eq('active', true)
          .or(`valid_to.is.null,valid_to.gt.${new Date().toISOString()}`),
        supabase
          .from('telehealth_credits')
          .select('id, source, quantity, used_quantity, period_end'),
      ]);

      if (entRes.error) throw new Error(entRes.error.message);
      if (credRes.error) throw new Error(credRes.error.message);

      const rows = (entRes.data ?? []) as Entitlement[];
      setEntitlements(rows);

      // Sum available credits (not expired)
      const now = new Date();
      const available = (credRes.data ?? [] as TelehealthCredit[]).reduce((sum, c) => {
        const expired = c.period_end ? new Date(c.period_end) < now : false;
        if (expired) return sum;
        return sum + Math.max(0, c.quantity - c.used_quantity);
      }, 0);
      setCreditsAvailable(available);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entitlements');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  // Re-fetch when app returns to foreground (user may have completed checkout)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        fetchEntitlements();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [fetchEntitlements]);

  // Re-fetch on auth state change (login / logout)
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchEntitlements();
    });
    return () => subscription.unsubscribe();
  }, [fetchEntitlements]);

  // ---------------------------------------------------------------------------
  // Derived helpers (stable function references via inline closures on entitlements)
  // ---------------------------------------------------------------------------

  const hasKey = useCallback((key: string): boolean =>
    entitlements.some((e) => e.entitlement_key === key),
    [entitlements]);

  const hasSubscription = hasKey('unlimited_plans');
  const hasUnlimitedBot = hasKey('unlimited_bot');
  const hasUnlimitedAssessments = hasKey('unlimited_assessments');
  const hasUnlimitedPlans = hasKey('unlimited_plans');
  const hasAllVideos = hasKey('all_videos');

  const canAccessFullPlan = useCallback((condition?: string): boolean => {
    // Subscription grants global access
    if (hasKey('unlimited_plans')) return true;

    const planRows = entitlements.filter((e) => e.entitlement_key === 'full_plan_access');
    if (!planRows.length) return false;

    return planRows.some((e) => {
      const scope = e.scope_json ?? {};
      // Global scope (empty object) grants all conditions
      if (Object.keys(scope).length === 0) return true;
      if (!condition) return false;
      return (scope.condition ?? '').toLowerCase() === condition.toLowerCase();
    });
  }, [entitlements, hasKey]);

  const canExportPDF = useCallback((condition?: string): boolean => {
    if (hasKey('pdf_export') &&
        entitlements.some((e) => e.entitlement_key === 'pdf_export' &&
          Object.keys(e.scope_json ?? {}).length === 0)) {
      return true; // global pdf_export (from subscription)
    }
    if (!condition) return false;
    return entitlements.some((e) =>
      e.entitlement_key === 'pdf_export' &&
      (e.scope_json?.condition ?? '').toLowerCase() === condition.toLowerCase()
    );
  }, [entitlements, hasKey]);

  return {
    loading,
    error,
    entitlements,
    telehealthCreditsAvailable: creditsAvailable,
    hasSubscription,
    hasUnlimitedBot,
    hasUnlimitedAssessments,
    hasUnlimitedPlans,
    hasAllVideos,
    canAccessFullPlan,
    canExportPDF,
    canBookTelehealth: creditsAvailable > 0,
    refresh: fetchEntitlements,
  };
}
