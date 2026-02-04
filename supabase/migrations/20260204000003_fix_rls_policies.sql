-- Migration: Fix RLS policies for profiles and clinics
-- Date: 2026-02-04
-- Purpose: Fix circular RLS dependency that causes "failed to load user role" error

-- ============================================
-- PART 1: CREATE HELPER FUNCTION (SECURITY DEFINER)
-- ============================================

-- This function bypasses RLS to get the user's clinic_id
-- Needed because clinics RLS policy can't query profiles (which also has RLS)
CREATE OR REPLACE FUNCTION get_user_clinic_id(user_uuid UUID)
RETURNS UUID AS $$
  SELECT clinic_id FROM profiles WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to get user's role (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- PART 2: FIX CLINICS RLS POLICY
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own clinic" ON clinics;

-- Create new policy using SECURITY DEFINER function
CREATE POLICY "Users can view own clinic" ON clinics
  FOR SELECT USING (
    id = get_user_clinic_id(auth.uid())
  );

-- Also allow anon/public to view clinics for shared plan pages
DROP POLICY IF EXISTS "Public can view clinics" ON clinics;
CREATE POLICY "Public can view clinics" ON clinics
  FOR SELECT USING (true);

-- ============================================
-- PART 3: FIX PROFILES RLS POLICIES
-- ============================================

-- Drop conflicting policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Clinicians can view clinic patients" ON profiles;

-- Create single comprehensive SELECT policy
CREATE POLICY "Users can view profiles" ON profiles
  FOR SELECT USING (
    -- Users can always view their own profile
    auth.uid() = id
    OR
    -- Clinicians/admins can view patients in their clinic (using SECURITY DEFINER function)
    (
      get_user_role(auth.uid()) IN ('clinician', 'admin')
      AND get_user_clinic_id(auth.uid()) IS NOT NULL
      AND get_user_clinic_id(auth.uid()) = clinic_id
    )
  );

-- ============================================
-- PART 4: FIX ACTIVITY_EVENTS RLS POLICY
-- ============================================

-- Drop existing clinic policy that has the same issue
DROP POLICY IF EXISTS "Clinicians can view clinic patient activity" ON activity_events;

-- Recreate with SECURITY DEFINER functions
CREATE POLICY "Clinicians can view clinic patient activity" ON activity_events
  FOR SELECT USING (
    get_user_role(auth.uid()) IN ('clinician', 'admin')
    AND get_user_clinic_id(auth.uid()) IS NOT NULL
    AND get_user_clinic_id(auth.uid()) = get_user_clinic_id(user_id)
  );

-- ============================================
-- PART 5: FIX ASSESSMENTS RLS POLICY
-- ============================================

-- Drop existing clinic policy
DROP POLICY IF EXISTS "Clinicians can view clinic patient assessments" ON assessments;

-- Recreate with SECURITY DEFINER functions
CREATE POLICY "Clinicians can view clinic patient assessments" ON assessments
  FOR SELECT USING (
    -- Users can view their own assessments
    auth.uid() = user_id
    OR
    -- Clinicians/admins can view assessments for clinic patients
    (
      get_user_role(auth.uid()) IN ('clinician', 'admin')
      AND get_user_clinic_id(auth.uid()) IS NOT NULL
      AND get_user_clinic_id(auth.uid()) = get_user_clinic_id(user_id)
    )
  );

-- ============================================
-- PART 6: GRANT EXECUTE ON FUNCTIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_user_clinic_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
