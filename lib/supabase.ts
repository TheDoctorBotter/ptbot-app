/**
 * Shared Supabase client for both web (Vite) and mobile (Expo)
 *
 * Environment variables:
 * - Vite (web): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * - Expo (mobile): EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Check if we're in a server-side rendering context
const isSSR = typeof window === 'undefined';

// Get Supabase URL - try both Vite and Expo env var formats
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  (typeof globalThis !== 'undefined' &&
    (globalThis as any).import?.meta?.env?.VITE_SUPABASE_URL) ||
  '';

// Get Supabase anon key - try both formats
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof globalThis !== 'undefined' &&
    (globalThis as any).import?.meta?.env?.VITE_SUPABASE_ANON_KEY) ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing environment variables. Please add to your .env file:\n' +
      '  EXPO_PUBLIC_SUPABASE_URL=your-project-url\n' +
      '  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key'
  );
}

// Lazy-loaded supabase client
let _supabase: SupabaseClient | null = null;

// No-op storage for SSR
const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

// Get or create supabase client (lazy initialization for SSR compatibility)
const getSupabase = (): SupabaseClient | null => {
  if (_supabase) return _supabase;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  // During SSR, create client with no-op storage
  if (isSSR) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: noopStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    return _supabase;
  }

  // Client-side: determine storage based on platform
  let storage: any = noopStorage;

  try {
    // Check if we're in React Native (not web)
    const { Platform } = require('react-native');
    if (Platform.OS !== 'web') {
      // React Native - use AsyncStorage
      storage = require('@react-native-async-storage/async-storage').default;
    } else {
      // Web browser - use localStorage
      storage = {
        getItem: async (key: string) => localStorage.getItem(key),
        setItem: async (key: string, value: string) => localStorage.setItem(key, value),
        removeItem: async (key: string) => localStorage.removeItem(key),
      };
    }
  } catch {
    // Fallback to localStorage if Platform check fails
    if (typeof localStorage !== 'undefined') {
      storage = {
        getItem: async (key: string) => localStorage.getItem(key),
        setItem: async (key: string, value: string) => localStorage.setItem(key, value),
        removeItem: async (key: string) => localStorage.removeItem(key),
      };
    }
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return _supabase;
};

// Create a proxy that lazily initializes the client
const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase();
    if (!client) return undefined;
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export { supabase, supabaseUrl, supabaseAnonKey };
export default supabase;
