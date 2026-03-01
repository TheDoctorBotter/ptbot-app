import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CareMode = 'adult' | 'pediatric';

const CACHE_KEY = 'ptbot_care_mode';

/**
 * Global hook for care mode (adult orthopedic vs. pediatric development).
 * Reads from profiles.care_mode, caches locally for fast tab switching.
 */
export function useCareMode() {
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

  const setCareMode = useCallback(async (mode: CareMode) => {
    // Optimistic local update
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
      console.warn('[useCareMode] Failed to persist care_mode:', err);
    }
  }, []);

  return { careMode, setCareMode, isLoading };
}
