import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CareMode = 'adult' | 'pediatric';

const CACHE_KEY = 'ptbot_care_mode';

interface CareModeContextValue {
  careMode: CareMode;
  setCareMode: (mode: CareMode) => Promise<void>;
  isLoading: boolean;
}

export const CareModeContext = createContext<CareModeContextValue>({
  careMode: 'adult',
  setCareMode: async () => {},
  isLoading: false,
});

export function CareModeProvider({ children }: { children: React.ReactNode }) {
  const [careMode, setCareModeState] = useState<CareMode>('adult');
  const [isLoading, setIsLoading] = useState(true);

  // Load care mode — read cache first (fast), then sync from DB in the background
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // 1. Read from local cache for instant display
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (!cancelled && (cached === 'adult' || cached === 'pediatric')) {
          setCareModeState(cached);
        }
      } catch {
        // Cache miss is fine — default to 'adult'
      }

      // Mark loading done after cache read — don't wait for Supabase
      if (!cancelled) setIsLoading(false);

      // 2. Background sync from Supabase (non-blocking)
      // Use getSession() instead of getUser() — getUser() makes a network
      // request that can hang indefinitely after sign-out or on slow networks.
      if (!supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || cancelled) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('care_mode')
          .eq('id', session.user.id)
          .single();

        if (!error && data?.care_mode && !cancelled) {
          const mode = data.care_mode as CareMode;
          setCareModeState(mode);
          await AsyncStorage.setItem(CACHE_KEY, mode);
        }
      } catch {
        // Supabase sync failed — cache value is good enough
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // Re-load care mode when a different user signs in
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('care_mode')
              .eq('id', session.user.id)
              .single();
            if (data?.care_mode) {
              const mode = data.care_mode as CareMode;
              setCareModeState(mode);
              await AsyncStorage.setItem(CACHE_KEY, mode);
            }
          } catch {
            // Non-critical — keep current care mode
          }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const setCareMode = useCallback(async (mode: CareMode) => {
    // Optimistic local update — all consumers of the context re-render immediately
    setCareModeState(mode);
    try {
      await AsyncStorage.setItem(CACHE_KEY, mode);
    } catch {
      // Cache write failed, state update still works for this session
    }

    // Persist to Supabase
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      await supabase
        .from('profiles')
        .update({ care_mode: mode })
        .eq('id', session.user.id);
    } catch (err) {
      console.warn('[CareModeProvider] Failed to persist care_mode:', err);
    }
  }, []);

  return (
    <CareModeContext.Provider value={{ careMode, setCareMode, isLoading }}>
      {children}
    </CareModeContext.Provider>
  );
}
