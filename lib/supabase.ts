/**
 * Shared Supabase client for both web (Vite) and mobile (Expo)
 *
 * Environment variables:
 * - Vite (web): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * - Expo (mobile): EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Create Supabase client with AsyncStorage for session persistence
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Disabled for React Native
    },
  });
}

export { supabase, supabaseUrl, supabaseAnonKey };
export default supabase;
