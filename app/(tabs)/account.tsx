import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Lock, Eye, EyeOff, CircleCheck as CheckCircle, CircleAlert as AlertCircle, LogIn, UserPlus } from 'lucide-react-native';
import { EmailService, generateVerificationToken, isValidEmail } from '@/services/emailService';

interface UserAccount {
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  createdAt: Date;
}

export default function AccountScreen() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [emailService] = useState(() => {
    const apiKey = process.env.EXPO_PUBLIC_RESEND_API_KEY;
    const fromEmail = process.env.EXPO_PUBLIC_FROM_EMAIL || 'noreply@ptbot.app';
    console.log('Email service config:', { 
      hasApiKey: !!apiKey, 
      fromEmail,
      apiKeyLength: apiKey?.length 
    });
    return apiKey ? new EmailService(apiKey, fromEmail) : null;
  });

  const validateEmail = (email: string) => {
    return isValidEmail(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const sendVerificationEmail = async (userEmail: string, userName: string) => {
    if (!emailService) {
      console.warn('Email service not configured - missing EXPO_PUBLIC_RESEND_API_KEY');
      Alert.alert(
        'Email Service Not Available',
        'Email verification is not configured. Please contact support.',
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      const verificationToken = generateVerificationToken();
      const appUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://your-ptbot-app.vercel.app';
      
      const success = await emailService.sendVerificationEmail({
        to: userEmail,
        firstName: userName,
        verificationToken,
        appUrl,
      });
      
      if (success) {
        // Store verification token (in real app, save to database)
        console.log('✅ Verification email sent successfully to:', userEmail);
        console.log('Verification token:', verificationToken);
      } else {
        console.error('❌ Failed to send verification email');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      Alert.alert(
        'Email Error',
        'Failed to send verification email. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  const handleSignUp = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing Information', 'Please enter your first and last name.');
      return;
    }

    setIsLoading(true);

    try {
      // Create user account (in real app, this would be an API call)
      const newUser: UserAccount = {
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isVerified: false,
        createdAt: new Date(),
      };

      // Send verification email
      const emailSent = await sendVerificationEmail(email, firstName);
      
      if (emailSent) {
        setUser(newUser);
        setVerificationSent(true);
        
        Alert.alert(
          'Account Created!',
          `Welcome ${firstName}! We've sent a verification email to ${email}. Please check your inbox (and spam folder) and click the verification link to activate your account.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Email Service Error', 
          'Account created but verification email could not be sent. Please contact support or try signing in.'
        );
      }
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!password) {
      Alert.alert('Missing Password', 'Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate sign in (in real app, this would be an API call)
      const mockUser: UserAccount = {
        email,
        firstName: 'John',
        lastName: 'Doe',
        isVerified: true,
        createdAt: new Date('2024-01-01'),
      };

      setUser(mockUser);
      
      Alert.alert(
        'Welcome Back!',
        `Successfully signed in as ${mockUser.firstName} ${mockUser.lastName}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Error', 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            setUser(null);
            setVerificationSent(false);
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setFirstName('');
            setLastName('');
          }
        }
      ]
    );
  };

  const resendVerification = async () => {
    if (!user) return;

    setIsLoading(true);
    const emailSent = await sendVerificationEmail(user.email, user.firstName);
    
    if (emailSent) {
      Alert.alert(
        'Verification Email Sent',
        `We've sent another verification email to ${user.email}. Please check your inbox and spam folder.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Email Error', 'Failed to send verification email. Please check your internet connection and try again.');
    }
    
    setIsLoading(false);
  };

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
                <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
                <View style={[
                  styles.verificationBadge,
                  user.isVerified ? styles.verifiedBadge : styles.unverifiedBadge
                ]}>
                  {user.isVerified ? (
                    <CheckCircle size={16} color="#10B981" />
                  ) : (
                    <AlertCircle size={16} color="#F59E0B" />
                  )}
                  <Text style={[
                    styles.verificationText,
                    user.isVerified ? styles.verifiedText : styles.unverifiedText
                  ]}>
                    {user.isVerified ? 'Verified' : 'Unverified'}
                  </Text>
                </View>
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.memberSince}>
                Member since {user.createdAt.toLocaleDateString()}
              </Text>
            </View>

            {!user.isVerified && (
              <View style={styles.verificationAlert}>
                <AlertCircle size={20} color="#F59E0B" />
                <View style={styles.verificationAlertContent}>
                  <Text style={styles.verificationAlertTitle}>
                    Email Verification Required
                  </Text>
                  <Text style={styles.verificationAlertText}>
                    Please check your email and click the verification link to activate your account.
                  </Text>
                  <Text style={styles.verificationAlertNote}>
                    Don't see the email? Check your spam folder or click below to resend.
                  </Text>
                  <TouchableOpacity 
                    style={styles.resendButton}
                    onPress={resendVerification}
                    disabled={isLoading}
                  >
                    <Mail size={16} color="#2563EB" />
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
            
            <TouchableOpacity style={styles.actionButton}>
              <User size={20} color="#2563EB" />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Lock size={20} color="#2563EB" />
              <Text style={styles.actionButtonText}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Mail size={20} color="#2563EB" />
              <Text style={styles.actionButtonText}>Email Preferences</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
            : 'Welcome back to PTBot'
          }
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
                style={[
                  styles.toggleButton,
                  isSignUp && styles.toggleButtonActive,
                ]}
                onPress={() => setIsSignUp(true)}
              >
                <UserPlus size={16} color={isSignUp ? "#FFFFFF" : "#6B7280"} />
                <Text style={[
                  styles.toggleButtonText,
                  isSignUp && styles.toggleButtonTextActive,
                ]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  !isSignUp && styles.toggleButtonActive,
                ]}
                onPress={() => setIsSignUp(false)}
              >
                <LogIn size={16} color={!isSignUp ? "#FFFFFF" : "#6B7280"} />
                <Text style={[
                  styles.toggleButtonText,
                  !isSignUp && styles.toggleButtonTextActive,
                ]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
              {isSignUp && (
                <>
                  <View style={styles.nameRow}>
                    <View style={styles.nameField}>
                      <Text style={styles.inputLabel}>First Name</Text>
                      <TextInput
                        style={styles.textInput}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="John"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="words"
                      />
                    </View>
                    <View style={styles.nameField}>
                      <Text style={styles.inputLabel}>Last Name</Text>
                      <TextInput
                        style={styles.textInput}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Doe"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Mail size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInputWithIcon}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your.email@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInputWithIcon}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#6B7280" />
                    ) : (
                      <Eye size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {isSignUp && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.inputContainer}>
                    <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInputWithIcon}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color="#6B7280" />
                      ) : (
                        <Eye size={20} color="#6B7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={isSignUp ? handleSignUp : handleSignIn}
                disabled={isLoading}
              >
                {isSignUp ? (
                  <UserPlus size={20} color="#FFFFFF" />
                ) : (
                  <LogIn size={20} color="#FFFFFF" />
                )}
                <Text style={styles.submitButtonText}>
                  {isLoading 
                    ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
                    : (isSignUp ? 'Create Account' : 'Sign In')
                  }
                </Text>
              </TouchableOpacity>

              {/* Email Verification Notice */}
              {isSignUp && (
                <View style={styles.verificationNotice}>
                  <Mail size={16} color="#2563EB" />
                  <Text style={styles.verificationNoticeText}>
                    You'll receive an email verification link after creating your account
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#2563EB',
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
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#BFDBFE',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#2563EB',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
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
    color: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginLeft: 12,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  verificationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  verificationNoticeText: {
    fontSize: 12,
    color: '#2563EB',
    flex: 1,
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
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
    color: '#1F2937',
    marginBottom: 16,
  },
  statusCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#1F2937',
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
    backgroundColor: '#D1FAE5',
  },
  unverifiedBadge: {
    backgroundColor: '#FEF3C7',
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  verifiedText: {
    color: '#065F46',
  },
  unverifiedText: {
    color: '#92400E',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  verificationAlert: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 12,
  },
  verificationAlertContent: {
    flex: 1,
  },
  verificationAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  verificationAlertText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 8,
  },
  verificationAlertNote: {
    fontSize: 11,
    color: '#92400E',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resendButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  signOutButton: {
    margin: 16,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 20,
  },
});