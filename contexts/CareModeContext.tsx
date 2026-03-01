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
  isLoading: true,
});

export function CareModeProvider({ children }: { children: React.ReactNode }) {
  const [careMode, setCareModeState] = useState<CareMode>('adult');
  const [isLoading, setIsLoading] = useState(true);

  // Load from cache first, then sync from DB
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // 1. Read from local cache for instant display
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached === 'adult' || cached === 'pediatric') {
          if (!cancelled) setCareModeState(cached);
        }
      } catch {}

      // 2. Sync from Supabase
      if (!supabase) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('care_mode')
          .eq('id', user.id)
          .single();

        if (!error && data?.care_mode && !cancelled) {
          const mode = data.care_mode as CareMode;
          setCareModeState(mode);
          await AsyncStorage.setItem(CACHE_KEY, mode);
        }
      } catch {} finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // Re-sync care mode when the user signs in/out
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
              .from('profiles')
              .select('care_mode')
              .eq('id', user.id)
              .single();
            if (data?.care_mode) {
              const mode = data.care_mode as CareMode;
              setCareModeState(mode);
              await AsyncStorage.setItem(CACHE_KEY, mode);
            }
          } catch {}
        } else if (event === 'SIGNED_OUT') {
          setCareModeState('adult');
          await AsyncStorage.removeItem(CACHE_KEY);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const setCareMode = useCallback(async (mode: CareMode) => {
    // Optimistic local update — all consumers of the context re-render immediately
    setCareModeState(mode);
    await AsyncStorage.setItem(CACHE_KEY, mode);

    // Persist to Supabase
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ care_mode: mode })
        .eq('id', user.id);
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
