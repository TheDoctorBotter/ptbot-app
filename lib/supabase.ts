/**
 * Shared Supabase client for both web (Vite) and mobile (Expo)
 *
 * Environment variables:
 * - Vite (web): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * - Expo (mobile): EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// No-op storage for SSR
const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

// Web storage wrapper
const webStorage = {
  getItem: async (key: string) => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

// Determine the appropriate storage based on environment
const getStorage = () => {
  // SSR - use no-op
  if (isSSR) {
    return noopStorage;
  }

  // React Native (iOS/Android) - use AsyncStorage
  if (Platform.OS !== 'web') {
    return AsyncStorage;
  }

  // Web browser - use localStorage wrapper
  return webStorage;
};

// Create Supabase client
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: getStorage(),
      autoRefreshToken: !isSSR,
      persistSession: !isSSR,
      detectSessionInUrl: false,
    },
  });
}

export { supabase, supabaseUrl, supabaseAnonKey };
export default supabase;
