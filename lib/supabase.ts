/**
 * Shared Supabase client for both web (Vite) and mobile (Expo)
 *
 * Environment variables:
 * - Vite (web): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * - Expo (mobile): EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

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

// Custom storage adapter that handles SSR gracefully
const createStorageAdapter = () => {
  // Check if we're in a browser/React Native environment
  const isClient = typeof window !== 'undefined' || Platform.OS !== 'web';

  if (!isClient) {
    // Return a no-op storage for SSR
    return {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    };
  }

  // Use AsyncStorage for React Native, localStorage for web
  if (Platform.OS !== 'web') {
    // Dynamically import AsyncStorage only when needed
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage;
  }

  // Web browser - use localStorage
  return {
    getItem: async (key: string) => localStorage.getItem(key),
    setItem: async (key: string, value: string) => localStorage.setItem(key, value),
    removeItem: async (key: string) => localStorage.removeItem(key),
  };
};

// Create Supabase client with appropriate storage
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: createStorageAdapter(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Disabled for React Native
    },
  });
}

export { supabase, supabaseUrl, supabaseAnonKey };
export default supabase;
