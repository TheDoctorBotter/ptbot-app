import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Lock, Eye, EyeOff, CircleCheck as CheckCircle, CircleAlert as AlertCircle, LogIn, UserPlus, Building2, FileText, Shield, ClipboardList } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import ProfileTabs from '@/components/ProfileTabs';
import ClinicSettings from '@/components/account/ClinicSettings';
import AdminConsultList from '@/components/telehealth/AdminConsultList';
import AdminConsultNoteScreen from '@/components/telehealth/AdminConsultNoteScreen';
import TelehealthConsentScreen from '@/components/telehealth/TelehealthConsentScreen';
import { AdminConsultOverview } from '@/types/telehealth';
import { telehealthConsentService } from '@/services/telehealthService';
import { colors } from '@/constants/theme';
import { AssessmentService } from '@/services/assessmentService';
import { useUserRole } from '@/hooks/useUserRole';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  location: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalConditions: string;
  currentMedications: string;
  preferredLanguage: string;
}

interface EmailPreferences {
  exerciseReminders: boolean;
  progressUpdates: boolean;
  appointmentReminders: boolean;
  marketingEmails: boolean;
  redFlagAlerts: boolean;
  weeklyReports: boolean;
}

export default function AccountScreen() {
  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // User role for clinic access
  const { roleData, isClinicStaff, refreshRole } = useUserRole();

  // Clinic settings modal state
  const [showClinicSettings, setShowClinicSettings] = useState(false);

  // Admin consult management state
  const [showConsultManagement, setShowConsultManagement] = useState(false);
  const [selectedConsult, setSelectedConsult] = useState<AdminConsultOverview | null>(null);

  // Telehealth consent viewing state
  const [showConsentViewer, setShowConsentViewer] = useState(false);

  // Form state
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // UI state
  const [showProfileTabs, setShowProfileTabs] = useState(false);

  // Profile data from Supabase
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences | null>(null);

  // Load profile from Supabase
  const loadProfile = async (userId: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfileData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: user?.email || '',
          phone: data.phone || '',
          dateOfBirth: data.date_of_birth || '',
          location: data.location || '',
          emergencyContact: data.emergency_contact || '',
          emergencyPhone: data.emergency_phone || '',
          medicalConditions: data.medical_conditions || '',
          currentMedications: data.current_medications || '',
          preferredLanguage: data.preferred_language || 'English',
        });
        if (data.email_preferences) {
          setEmailPreferences(data.email_preferences);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Check for existing session on mount and subscribe to auth changes
  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase not configured - auth features disabled');
      setIsInitializing(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsInitializing(false);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load profile when user changes
  useEffect(() => {
    if (user) {
      loadProfile(user.id);
    } else {
      setProfileData(null);
      setEmailPreferences(null);
    }
  }, [user]);

  // Form validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  // Clear form and errors
  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setAuthError(null);
  };

  // Handle Sign Up
  const handleSignUp = async () => {
    setAuthError(null);

    if (!supabase) {
      setAuthError('Authentication service not available. Please check configuration.');
      return;
    }

    if (!validateEmail(email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setAuthError('Please enter your first and last name.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`,
          },
        },
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes('already registered')) {
          setAuthError('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('weak password')) {
          setAuthError('Password is too weak. Please use a stronger password with letters, numbers, and symbols.');
        } else {
          setAuthError(error.message);
        }
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.email_confirmed_at === null) {
          Alert.alert(
            'Verification Email Sent',
            `Welcome ${firstName}! We've sent a verification email to ${email}. Please check your inbox and click the link to activate your account.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Account Created!',
            `Welcome to PTBot, ${firstName}! Your account has been created successfully.`,
            [{ text: 'OK' }]
          );
        }
        clearForm();
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign In
  const handleSignIn = async () => {
    setAuthError(null);

    if (!supabase) {
      setAuthError('Authentication service not available. Please check configuration.');
      return;
    }

    if (!validateEmail(email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setAuthError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          setAuthError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setAuthError('Please verify your email address before signing in. Check your inbox for the verification link.');
        } else {
          setAuthError(error.message);
        }
        return;
      }

      if (data.user) {
        const displayName = data.user.user_metadata?.first_name || data.user.email;
        Alert.alert(
          'Welcome Back!',
          `Successfully signed in as ${displayName}`,
          [{ text: 'OK' }]
        );
        clearForm();
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthError('An unexpected error occurred. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    if (!supabase) {
      Alert.alert('Error', 'Authentication service not available.');
      return;
    }

    setIsLoading(true);
    console.log('Sign out button pressed - starting sign out process');

    try {
      // Clear assessment data first
      const assessmentService = new AssessmentService();
      await assessmentService.clearAssessments();
      console.log('Assessment data cleared on sign out');

      // Sign out from Supabase - use global scope to sign out everywhere
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
        Alert.alert('Error', 'Failed to sign out. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('Supabase sign out successful');

      // Explicitly clear all state
      setSession(null);
      setUser(null);
      setShowProfileTabs(false);
      clearForm();
      setIsLoading(false);

      // Show success message
      Alert.alert(
        'Signed Out',
        'You have been signed out successfully.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle password reset
  const handleForgotPassword = async () => {
    if (!supabase) {
      Alert.alert('Error', 'Authentication service not available.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${process.env.EXPO_PUBLIC_APP_URL}/reset-password`,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Password Reset Email Sent',
          `If an account exists with ${email}, you'll receive a password reset link shortly.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification email
  const resendVerification = async () => {
    if (!supabase || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Verification Email Sent',
          'We\'ve sent another verification email. Please check your inbox and spam folder.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      Alert.alert('Error', 'Failed to resend verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Profile update handlers
  const handleProfileUpdate = async (updatedProfile: Partial<UserProfile>) => {
    if (!supabase || !user) return;

    try {
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: updatedProfile.firstName,
          last_name: updatedProfile.lastName,
          full_name: `${updatedProfile.firstName} ${updatedProfile.lastName}`,
        },
      });

      if (authError) throw authError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: updatedProfile.firstName,
          last_name: updatedProfile.lastName,
          phone: updatedProfile.phone,
          date_of_birth: updatedProfile.dateOfBirth || null,
          location: updatedProfile.location,
          emergency_contact: updatedProfile.emergencyContact,
          emergency_phone: updatedProfile.emergencyPhone,
          medical_conditions: updatedProfile.medicalConditions,
          current_medications: updatedProfile.currentMedications,
          preferred_language: updatedProfile.preferredLanguage,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // Update local state
      setProfileData(prev => prev ? { ...prev, ...updatedProfile } : null);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const handlePasswordChange = async (oldPassword: string, newPassword: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  };

  const handleEmailPreferencesUpdate = async (preferences: EmailPreferences) => {
    if (!supabase || !user) return;

    try {
      // Update profiles table with email preferences
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email_preferences: preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Update local state
      setEmailPreferences(preferences);
    } catch (error) {
      console.error('Email preferences update error:', error);
      throw error;
    }
  };

  // Get display name from user metadata
  const getDisplayName = () => {
    if (!user) return '';
    const firstName = user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.last_name || '';
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return user.email?.split('@')[0] || 'User';
  };

  // Check if email is verified
  const isEmailVerified = () => {
    return user?.email_confirmed_at !== null;
  };

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show configuration error if Supabase is not set up
  if (!supabase) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <View style={styles.logoContainer}>
              <User size={28} color="#FFFFFF" />
              <Text style={styles.logoText}>PTBOT</Text>
            </View>
            <Text style={styles.headerTitle}>Account</Text>
          </View>
          <Text style={styles.headerSubtitle}>Authentication Setup Required</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.error[500]} />
          <Text style={styles.errorTitle}>Configuration Required</Text>
          <Text style={styles.errorText}>
            Authentication is not configured. Please add the following to your .env file:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>EXPO_PUBLIC_SUPABASE_URL=your-url</Text>
            <Text style={styles.codeText}>EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // If showing profile tabs, render the ProfileTabs component
  if (user && showProfileTabs) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowProfileTabs(false)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerLogo}>
            <View style={styles.logoContainer}>
              <User size={28} color="#FFFFFF" />
              <Text style={styles.logoText}>PTBOT</Text>
            </View>
            <Text style={styles.headerTitle}>Profile Settings</Text>
          </View>
          <Text style={styles.headerSubtitle}>Manage your account information</Text>
        </View>

        <ProfileTabs
          user={{
            email: user.email || '',
            firstName: profileData?.firstName || user.user_metadata?.first_name || '',
            lastName: profileData?.lastName || user.user_metadata?.last_name || '',
            isVerified: isEmailVerified(),
            createdAt: new Date(user.created_at),
          }}
          initialProfile={profileData}
          initialEmailPreferences={emailPreferences}
          onProfileUpdate={handleProfileUpdate}
          onPasswordChange={handlePasswordChange}
          onEmailPreferencesUpdate={handleEmailPreferencesUpdate}
        />
      </SafeAreaView>
    );
  }

  // If user is signed in, show account dashboard
  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <View style={styles.logoContainer}>
              <User size={28} color="#FFFFFF" />
              <Text style={styles.logoText}>PTBOT</Text>
            </View>
            <Text style={styles.headerTitle}>My Account</Text>
          </View>
          <Text style={styles.headerSubtitle}>Manage your PTBot profile</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Account Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Status</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Text style={styles.userName}>{getDisplayName()}</Text>
                <View
                  style={[
                    styles.verificationBadge,
                    isEmailVerified() ? styles.verifiedBadge : styles.unverifiedBadge,
                  ]}
                >
                  {isEmailVerified() ? (
                    <CheckCircle size={16} color="#10B981" />
                  ) : (
                    <AlertCircle size={16} color="#F59E0B" />
                  )}
                  <Text
                    style={[
                      styles.verificationText,
                      isEmailVerified() ? styles.verifiedText : styles.unverifiedText,
                    ]}
                  >
                    {isEmailVerified() ? 'Verified' : 'Unverified'}
                  </Text>
                </View>
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.memberSince}>
                Member since {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </View>

            {!isEmailVerified() && (
              <View style={styles.verificationAlert}>
                <AlertCircle size={20} color="#F59E0B" />
                <View style={styles.verificationAlertContent}>
                  <Text style={styles.verificationAlertTitle}>
                    Email Verification Required
                  </Text>
                  <Text style={styles.verificationAlertText}>
                    Please check your email and click the verification link to activate your account.
                  </Text>
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={resendVerification}
                    disabled={isLoading}
                  >
                    <Mail size={16} color={colors.primary[500]} />
                    <Text style={styles.resendButtonText}>
                      {isLoading ? 'Sending...' : 'Resend Verification Email'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowProfileTabs(true)}
            >
              <User size={20} color={colors.primary[500]} />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
              <Text style={styles.actionButtonArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowProfileTabs(true)}
            >
              <Lock size={20} color={colors.primary[500]} />
              <Text style={styles.actionButtonText}>Change Password</Text>
              <Text style={styles.actionButtonArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowProfileTabs(true)}
            >
              <Mail size={20} color={colors.primary[500]} />
              <Text style={styles.actionButtonText}>Email Preferences</Text>
              <Text style={styles.actionButtonArrow}>→</Text>
            </TouchableOpacity>

            {/* Clinic Settings - only for clinicians/admins with a clinic */}
            {isClinicStaff && roleData?.clinicId && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowClinicSettings(true)}
              >
                <Building2 size={20} color={colors.primary[500]} />
                <View style={styles.actionButtonContent}>
                  <Text style={styles.clinicSettingsTitle}>Clinic Settings</Text>
                  <Text style={styles.actionButtonSubtext}>{roleData.clinicName}</Text>
                </View>
                <Text style={styles.actionButtonArrow}>→</Text>
              </TouchableOpacity>
            )}

            {/* View Telehealth Consent - for all logged-in users */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowConsentViewer(true)}
            >
              <Shield size={20} color={colors.primary[500]} />
              <Text style={styles.actionButtonText}>View Telehealth Consent</Text>
              <Text style={styles.actionButtonArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Admin Tools - only for clinicians/admins */}
          {isClinicStaff && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Admin Tools</Text>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowConsultManagement(true)}
              >
                <ClipboardList size={20} color={colors.primary[500]} />
                <View style={styles.actionButtonContent}>
                  <Text style={styles.clinicSettingsTitle}>Consult Management</Text>
                  <Text style={styles.actionButtonSubtext}>Document telehealth sessions</Text>
                </View>
                <Text style={styles.actionButtonArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowConsultManagement(true)}
              >
                <FileText size={20} color={colors.primary[500]} />
                <View style={styles.actionButtonContent}>
                  <Text style={styles.clinicSettingsTitle}>SOAP Notes</Text>
                  <Text style={styles.actionButtonSubtext}>Review and edit clinical notes</Text>
                </View>
                <Text style={styles.actionButtonArrow}>→</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sign Out */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={isLoading}
          >
            <Text style={styles.signOutButtonText}>
              {isLoading ? 'Signing Out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Clinic Settings Modal */}
        {isClinicStaff && roleData?.clinicId && (
          <Modal
            visible={showClinicSettings}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowClinicSettings(false)}
          >
            <ClinicSettings
              clinicId={roleData.clinicId}
              onClose={() => setShowClinicSettings(false)}
              onSave={() => {
                refreshRole();
              }}
            />
          </Modal>
        )}

        {/* Consult Management Modal */}
        {isClinicStaff && (
          <Modal
            visible={showConsultManagement && !selectedConsult}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowConsultManagement(false)}
          >
            <AdminConsultList
              onSelectConsult={(consult) => setSelectedConsult(consult)}
              onClose={() => setShowConsultManagement(false)}
            />
          </Modal>
        )}

        {/* Consult Note Screen Modal */}
        {isClinicStaff && selectedConsult && (
          <Modal
            visible={!!selectedConsult}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setSelectedConsult(null)}
          >
            <AdminConsultNoteScreen
              consult={selectedConsult}
              onSaved={() => {
                setSelectedConsult(null);
              }}
              onClose={() => setSelectedConsult(null)}
            />
          </Modal>
        )}

        {/* Telehealth Consent Viewer Modal */}
        <Modal
          visible={showConsentViewer}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowConsentViewer(false)}
        >
          <TelehealthConsentScreen
            onConsentAccepted={() => setShowConsentViewer(false)}
            onCancel={() => setShowConsentViewer(false)}
            isModal
            userId={user?.id}
          />
        </Modal>
      </SafeAreaView>
    );
  }

  // Sign up/Sign in form
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <View style={styles.logoContainer}>
            <User size={28} color="#FFFFFF" />
            <Text style={styles.logoText}>PTBOT</Text>
          </View>
          <Text style={styles.headerTitle}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {isSignUp
            ? 'Join PTBot to track your recovery journey'
            : 'Welcome back to PTBot'}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {/* Toggle Sign Up / Sign In */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, isSignUp && styles.toggleButtonActive]}
                onPress={() => {
                  setIsSignUp(true);
                  setAuthError(null);
                }}
              >
                <UserPlus size={20} color={isSignUp ? '#FFFFFF' : '#6B7280'} />
                <Text
                  style={[
                    styles.toggleButtonText,
                    isSignUp && styles.toggleButtonTextActive,
                  ]}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, !isSignUp && styles.toggleButtonActive]}
                onPress={() => {
                  setIsSignUp(false);
                  setAuthError(null);
                }}
              >
                <LogIn size={20} color={!isSignUp ? '#FFFFFF' : '#6B7280'} />
                <Text
                  style={[
                    styles.toggleButtonText,
                    !isSignUp && styles.toggleButtonTextActive,
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error message */}
            {authError && (
              <View style={styles.errorAlert}>
                <AlertCircle size={20} color={colors.error[500]} />
                <Text style={styles.errorAlertText}>{authError}</Text>
              </View>
            )}

            {/* Form fields */}
            <View style={styles.form}>
              {isSignUp && (
                <View style={styles.nameRow}>
                  <View style={[styles.inputGroup, styles.nameField]}>
                    <Text style={styles.inputLabel}>First Name</Text>
                    <View style={styles.inputContainer}>
                      <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInputWithIcon}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="First name"
                        autoCapitalize="words"
                        autoComplete="given-name"
                        editable={!isLoading}
                      />
                    </View>
                  </View>
                  <View style={[styles.inputGroup, styles.nameField]}>
                    <Text style={styles.inputLabel}>Last Name</Text>
                    <View style={styles.inputContainer}>
                      <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInputWithIcon}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Last name"
                        autoCapitalize="words"
                        autoComplete="family-name"
                        editable={!isLoading}
                      />
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInputWithIcon}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setAuthError(null);
                    }}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInputWithIcon}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setAuthError(null);
                    }}
                    placeholder={isSignUp ? 'At least 8 characters' : 'Enter your password'}
                    secureTextEntry={!showPassword}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#9CA3AF" />
                    ) : (
                      <Eye size={20} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {isSignUp && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.inputContainer}>
                    <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInputWithIcon}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        setAuthError(null);
                      }}
                      placeholder="Confirm your password"
                      secureTextEntry={!showConfirmPassword}
                      autoComplete="new-password"
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color="#9CA3AF" />
                      ) : (
                        <Eye size={20} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Forgot Password link (sign in only) */}
              {!isSignUp && (
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                  style={styles.forgotPasswordButton}
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              )}

              {/* Submit button */}
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={isSignUp ? handleSignUp : handleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : isSignUp ? (
                  <>
                    <UserPlus size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Create Account</Text>
                  </>
                ) : (
                  <>
                    <LogIn size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Sign In</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Email verification notice */}
              {isSignUp && (
                <View style={styles.verificationNotice}>
                  <Mail size={16} color={colors.primary[500]} />
                  <Text style={styles.verificationNoticeText}>
                    You'll receive a verification email to confirm your account.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.neutral[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 16,
  },
  codeBlock: {
    backgroundColor: colors.neutral[800],
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: colors.neutral[100],
    marginBottom: 4,
  },
  header: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.primary[200],
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    margin: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary[500],
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[500],
  },
  toggleButtonTextActive: {
    color: colors.white,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorAlertText: {
    flex: 1,
    fontSize: 14,
    color: colors.error[700],
  },
  form: {
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[700],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    backgroundColor: colors.neutral[50],
  },
  inputIcon: {
    marginLeft: 12,
  },
  textInputWithIcon: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary[500],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[400],
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  verificationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  verificationNoticeText: {
    fontSize: 12,
    color: colors.primary[500],
    flex: 1,
  },
  section: {
    margin: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginBottom: 16,
  },
  statusCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    padding: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedBadge: {
    backgroundColor: colors.success[50],
  },
  unverifiedBadge: {
    backgroundColor: colors.warning[50],
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  verifiedText: {
    color: colors.success[600],
  },
  unverifiedText: {
    color: colors.warning[600],
  },
  userEmail: {
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  verificationAlert: {
    flexDirection: 'row',
    backgroundColor: colors.warning[50],
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 12,
  },
  verificationAlertContent: {
    flex: 1,
  },
  verificationAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning[700],
    marginBottom: 4,
  },
  verificationAlertText: {
    fontSize: 13,
    color: colors.warning[700],
    marginBottom: 8,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[500],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  actionButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.neutral[700],
    marginLeft: 12,
  },
  actionButtonSubtext: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
    marginLeft: 0,
  },
  clinicSettingsTitle: {
    fontSize: 16,
    color: colors.neutral[700],
  },
  actionButtonArrow: {
    fontSize: 18,
    color: colors.neutral[400],
  },
  signOutButton: {
    margin: 16,
    backgroundColor: colors.error[500],
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  bottomSpacer: {
    height: 40,
  },
});
