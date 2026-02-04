import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/theme';

export interface ClinicBranding {
  clinicId: string | null;
  clinicName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  tagline: string | null;
  isClinicBranded: boolean;
}

const DEFAULT_BRANDING: ClinicBranding = {
  clinicId: null,
  clinicName: 'PTBOT',
  logoUrl: null,
  primaryColor: colors.primary[500],
  secondaryColor: colors.info[500],
  tagline: 'Your Physical Therapy Assistant',
  isClinicBranded: false,
};

interface UseClinicBrandingResult {
  branding: ClinicBranding;
  isLoading: boolean;
  error: string | null;
  refreshBranding: () => Promise<void>;
}

export function useClinicBranding(): UseClinicBrandingResult {
  const [branding, setBranding] = useState<ClinicBranding>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranding = useCallback(async () => {
    if (!supabase) {
      setBranding(DEFAULT_BRANDING);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in - use default branding
        setBranding(DEFAULT_BRANDING);
        setIsLoading(false);
        return;
      }

      // Fetch user's profile with clinic info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          clinic_id,
          clinics (
            id,
            name,
            logo_url,
            primary_color,
            secondary_color,
            tagline
          )
        `)
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching clinic branding:', profileError);
        setError('Failed to load clinic branding');
        setBranding(DEFAULT_BRANDING);
        setIsLoading(false);
        return;
      }

      if (!profile?.clinic_id || !profile?.clinics) {
        // No clinic assigned - use default branding
        setBranding(DEFAULT_BRANDING);
        setIsLoading(false);
        return;
      }

      const clinic = profile.clinics as {
        id: string;
        name: string;
        logo_url: string | null;
        primary_color: string | null;
        secondary_color: string | null;
        tagline: string | null;
      };

      setBranding({
        clinicId: clinic.id,
        clinicName: clinic.name || 'PTBOT',
        logoUrl: clinic.logo_url || null,
        primaryColor: clinic.primary_color || colors.primary[500],
        secondaryColor: clinic.secondary_color || colors.info[500],
        tagline: clinic.tagline || null,
        isClinicBranded: true,
      });

    } catch (err) {
      console.error('Error in useClinicBranding:', err);
      setError('An unexpected error occurred');
      setBranding(DEFAULT_BRANDING);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();

    // Subscribe to auth state changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user) {
            fetchBranding();
          } else {
            setBranding(DEFAULT_BRANDING);
            setIsLoading(false);
          }
        }
      );

      return () => subscription.unsubscribe();
    }
  }, [fetchBranding]);

  return {
    branding,
    isLoading,
    error,
    refreshBranding: fetchBranding,
  };
}

// Utility function to get branding for a specific clinic (for share pages)
export async function getClinicBrandingById(clinicId: string): Promise<ClinicBranding> {
  if (!supabase || !clinicId) {
    return DEFAULT_BRANDING;
  }

  try {
    const { data: clinic, error } = await supabase
      .from('clinics')
      .select('id, name, logo_url, primary_color, secondary_color, tagline')
      .eq('id', clinicId)
      .single();

    if (error || !clinic) {
      return DEFAULT_BRANDING;
    }

    return {
      clinicId: clinic.id,
      clinicName: clinic.name || 'PTBOT',
      logoUrl: clinic.logo_url || null,
      primaryColor: clinic.primary_color || colors.primary[500],
      secondaryColor: clinic.secondary_color || colors.info[500],
      tagline: clinic.tagline || null,
      isClinicBranded: true,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export default useClinicBranding;
