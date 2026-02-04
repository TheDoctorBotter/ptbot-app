import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'patient' | 'clinician' | 'admin';

export interface UserRoleData {
  role: UserRole;
  clinicId: string | null;
  clinicName: string | null;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface UseUserRoleResult {
  roleData: UserRoleData | null;
  isLoading: boolean;
  error: string | null;
  isPatient: boolean;
  isClinician: boolean;
  isAdmin: boolean;
  isClinicStaff: boolean;
  refreshRole: () => Promise<void>;
}

export function useUserRole(): UseUserRoleResult {
  const [roleData, setRoleData] = useState<UserRoleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = useCallback(async () => {
    if (!supabase) {
      setRoleData({
        role: 'patient',
        clinicId: null,
        clinicName: null,
        userId: null,
        firstName: null,
        lastName: null
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        // Not logged in - default to patient
        setRoleData({
          role: 'patient',
          clinicId: null,
          clinicName: null,
          userId: null,
          firstName: null,
          lastName: null
        });
        setIsLoading(false);
        return;
      }

      // Fetch profile with role and clinic info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          role,
          clinic_id,
          clinics (
            id,
            name
          )
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        // Profile doesn't exist yet - default to patient
        if (profileError.code === 'PGRST116') {
          setRoleData({
            role: 'patient',
            clinicId: null,
            clinicName: null,
            userId: user.id,
            firstName: user.user_metadata?.first_name || null,
            lastName: user.user_metadata?.last_name || null
          });
        } else {
          console.error('Error fetching user role:', profileError);
          setError('Failed to load user role');
          // Default to patient on error
          setRoleData({
            role: 'patient',
            clinicId: null,
            clinicName: null,
            userId: user.id,
            firstName: null,
            lastName: null
          });
        }
        setIsLoading(false);
        return;
      }

      // Extract clinic info
      const clinic = profile.clinics as { id: string; name: string } | null;

      setRoleData({
        role: (profile.role as UserRole) || 'patient',
        clinicId: profile.clinic_id || null,
        clinicName: clinic?.name || null,
        userId: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
      });

    } catch (err) {
      console.error('Error in useUserRole:', err);
      setError('An unexpected error occurred');
      // Default to patient on error
      setRoleData({
        role: 'patient',
        clinicId: null,
        clinicName: null,
        userId: null,
        firstName: null,
        lastName: null
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRole();

    // Subscribe to auth state changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user) {
            fetchRole();
          } else {
            setRoleData({
              role: 'patient',
              clinicId: null,
              clinicName: null,
              userId: null,
              firstName: null,
              lastName: null
            });
            setIsLoading(false);
          }
        }
      );

      return () => subscription.unsubscribe();
    }
  }, [fetchRole]);

  const isPatient = roleData?.role === 'patient';
  const isClinician = roleData?.role === 'clinician';
  const isAdmin = roleData?.role === 'admin';
  const isClinicStaff = isClinician || isAdmin;

  return {
    roleData,
    isLoading,
    error,
    isPatient,
    isClinician,
    isAdmin,
    isClinicStaff,
    refreshRole: fetchRole,
  };
}
