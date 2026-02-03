import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { User, Lock, Mail, Save, Eye, EyeOff, Bell, MessageSquare, Calendar, Shield } from 'lucide-react-native';

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

interface ProfileTabsProps {
  user: any;
  initialProfile?: UserProfile | null;
  initialEmailPreferences?: EmailPreferences | null;
  onProfileUpdate: (updatedProfile: Partial<UserProfile>) => void;
  onPasswordChange: (oldPassword: string, newPassword: string) => void;
  onEmailPreferencesUpdate: (preferences: EmailPreferences) => void;
}

export default function ProfileTabs({
  user,
  initialProfile,
  initialEmailPreferences,
  onProfileUpdate,
  onPasswordChange,
  onEmailPreferencesUpdate
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'email'>('profile');
  const [isLoading, setIsLoading] = useState(false);

  // Profile state - use initial profile if provided
  const [profile, setProfile] = useState<UserProfile>({
    firstName: initialProfile?.firstName || user?.firstName || '',
    lastName: initialProfile?.lastName || user?.lastName || '',
    email: user?.email || '',
    phone: initialProfile?.phone || '',
    dateOfBirth: initialProfile?.dateOfBirth || '',
    location: initialProfile?.location || '',
    emergencyContact: initialProfile?.emergencyContact || '',
    emergencyPhone: initialProfile?.emergencyPhone || '',
    medicalConditions: initialProfile?.medicalConditions || '',
    currentMedications: initialProfile?.currentMedications || '',
    preferredLanguage: initialProfile?.preferredLanguage || 'English',
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Email preferences state - use initial preferences if provided
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences>({
    exerciseReminders: initialEmailPreferences?.exerciseReminders ?? true,
    progressUpdates: initialEmailPreferences?.progressUpdates ?? true,
    appointmentReminders: initialEmailPreferences?.appointmentReminders ?? true,
    marketingEmails: initialEmailPreferences?.marketingEmails ?? false,
    redFlagAlerts: initialEmailPreferences?.redFlagAlerts ?? true,
    weeklyReports: initialEmailPreferences?.weeklyReports ?? true,
  });

  // Update profile state when initialProfile loads
  useEffect(() => {
    if (initialProfile) {
      setProfile({
        firstName: initialProfile.firstName || user?.firstName || '',
        lastName: initialProfile.lastName || user?.lastName || '',
        email: user?.email || '',
        phone: initialProfile.phone || '',
        dateOfBirth: initialProfile.dateOfBirth || '',
        location: initialProfile.location || '',
        emergencyContact: initialProfile.emergencyContact || '',
        emergencyPhone: initialProfile.emergencyPhone || '',
        medicalConditions: initialProfile.medicalConditions || '',
        currentMedications: initialProfile.currentMedications || '',
        preferredLanguage: initialProfile.preferredLanguage || 'English',
      });
    }
  }, [initialProfile]);

  // Update email prefs when initialEmailPreferences loads
  useEffect(() => {
    if (initialEmailPreferences) {
      setEmailPrefs({
        exerciseReminders: initialEmailPreferences.exerciseReminders ?? true,
        progressUpdates: initialEmailPreferences.progressUpdates ?? true,
        appointmentReminders: initialEmailPreferences.appointmentReminders ?? true,
        marketingEmails: initialEmailPreferences.marketingEmails ?? false,
        redFlagAlerts: initialEmailPreferences.redFlagAlerts ?? true,
        weeklyReports: initialEmailPreferences.weeklyReports ?? true,
      });
    }
  }, [initialEmailPreferences]);

  const handleProfileSave = async () => {
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      Alert.alert('Missing Information', 'First and last name are required.');
      return;
    }

    setIsLoading(true);
    try {
      await onProfileUpdate(profile);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Missing Information', 'Please fill in all password fields.');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      Alert.alert('Weak Password', 'New password must be at least 8 characters long.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Password Mismatch', 'New passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await onPasswordChange(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to change password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPreferencesSave = async () => {
    setIsLoading(true);
    try {
      await onEmailPreferencesUpdate(emailPrefs);
      Alert.alert('Success', 'Email preferences updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update email preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabButton = (tab: 'profile' | 'password' | 'email', icon: React.ReactNode, label: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.tabButtonActive,
      ]}
      onPress={() => setActiveTab(tab)}
    >
      {icon}
      <Text style={[
        styles.tabButtonText,
        activeTab === tab && styles.tabButtonTextActive,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.formSection}>
        <Text style={styles.formSectionTitle}>Personal Information</Text>
        
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <Text style={styles.inputLabel}>First Name *</Text>
            <TextInput
              style={styles.textInput}
              value={profile.firstName}
              onChangeText={(text) => setProfile(prev => ({ ...prev, firstName: text }))}
              placeholder="John"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />
          </View>
          <View style={styles.nameField}>
            <Text style={styles.inputLabel}>Last Name *</Text>
            <TextInput
              style={styles.textInput}
              value={profile.lastName}
              onChangeText={(text) => setProfile(prev => ({ ...prev, lastName: text }))}
              placeholder="Doe"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={[styles.textInput, styles.disabledInput]}
            value={profile.email}
            editable={false}
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.inputNote}>Email cannot be changed. Contact support if needed.</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.textInput}
            value={profile.phone}
            onChangeText={(text) => setProfile(prev => ({ ...prev, phone: text }))}
            placeholder="(555) 123-4567"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Date of Birth</Text>
          <TextInput
            style={styles.textInput}
            value={profile.dateOfBirth}
            onChangeText={(text) => setProfile(prev => ({ ...prev, dateOfBirth: text }))}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location</Text>
          <TextInput
            style={styles.textInput}
            value={profile.location}
            onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
            placeholder="City, State"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
          />
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formSectionTitle}>Emergency Contact</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Emergency Contact Name</Text>
          <TextInput
            style={styles.textInput}
            value={profile.emergencyContact}
            onChangeText={(text) => setProfile(prev => ({ ...prev, emergencyContact: text }))}
            placeholder="Contact person's full name"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Emergency Contact Phone</Text>
          <TextInput
            style={styles.textInput}
            value={profile.emergencyPhone}
            onChangeText={(text) => setProfile(prev => ({ ...prev, emergencyPhone: text }))}
            placeholder="(555) 123-4567"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formSectionTitle}>Medical Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Current Medical Conditions</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={profile.medicalConditions}
            onChangeText={(text) => setProfile(prev => ({ ...prev, medicalConditions: text }))}
            placeholder="List any current medical conditions, injuries, or diagnoses..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Current Medications</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={profile.currentMedications}
            onChangeText={(text) => setProfile(prev => ({ ...prev, currentMedications: text }))}
            placeholder="List medications, dosages, and supplements..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Preferred Language</Text>
          <View style={styles.languageContainer}>
            {['English', 'Spanish', 'French', 'German'].map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.languageButton,
                  profile.preferredLanguage === language && styles.languageButtonSelected,
                ]}
                onPress={() => setProfile(prev => ({ ...prev, preferredLanguage: language }))}
              >
                <Text style={[
                  styles.languageButtonText,
                  profile.preferredLanguage === language && styles.languageButtonTextSelected,
                ]}>
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleProfileSave}
        disabled={isLoading}
      >
        <Save size={20} color="#FFFFFF" />
        <Text style={styles.saveButtonText}>
          {isLoading ? 'Saving...' : 'Save Profile'}
        </Text>
      </TouchableOpacity>

      <View style={styles.tabBottomSpacer} />
    </ScrollView>
  );

  const renderPasswordTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.formSection}>
        <Text style={styles.formSectionTitle}>Change Password</Text>
        <Text style={styles.formSectionSubtitle}>
          Choose a strong password with at least 8 characters
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Current Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
              placeholder="Enter current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPasswords.current}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
            >
              {showPasswords.current ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>New Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
              placeholder="Enter new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPasswords.new}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
            >
              {showPasswords.new ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.passwordRequirement}>
            Must be at least 8 characters long
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirm New Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
              placeholder="Confirm new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPasswords.confirm}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
            >
              {showPasswords.confirm ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handlePasswordChange}
        disabled={isLoading}
      >
        <Lock size={20} color="#FFFFFF" />
        <Text style={styles.saveButtonText}>
          {isLoading ? 'Changing...' : 'Change Password'}
        </Text>
      </TouchableOpacity>

      <View style={styles.tabBottomSpacer} />
    </ScrollView>
  );

  const renderEmailTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.formSection}>
        <Text style={styles.formSectionTitle}>Email Notifications</Text>
        <Text style={styles.formSectionSubtitle}>
          Choose which emails you'd like to receive from PTBot
        </Text>

        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceGroupTitle}>
            <Bell size={16} color="#2563EB" /> Health & Recovery
          </Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>Exercise Reminders</Text>
              <Text style={styles.preferenceDescription}>
                Daily reminders to complete your prescribed exercises
              </Text>
            </View>
            <Switch
              value={emailPrefs.exerciseReminders}
              onValueChange={(value) => setEmailPrefs(prev => ({ ...prev, exerciseReminders: value }))}
              trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
              thumbColor={emailPrefs.exerciseReminders ? '#2563EB' : '#9CA3AF'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>Progress Updates</Text>
              <Text style={styles.preferenceDescription}>
                Weekly summaries of your recovery progress
              </Text>
            </View>
            <Switch
              value={emailPrefs.progressUpdates}
              onValueChange={(value) => setEmailPrefs(prev => ({ ...prev, progressUpdates: value }))}
              trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
              thumbColor={emailPrefs.progressUpdates ? '#2563EB' : '#9CA3AF'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>Weekly Reports</Text>
              <Text style={styles.preferenceDescription}>
                Detailed weekly reports on your therapy progress
              </Text>
            </View>
            <Switch
              value={emailPrefs.weeklyReports}
              onValueChange={(value) => setEmailPrefs(prev => ({ ...prev, weeklyReports: value }))}
              trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
              thumbColor={emailPrefs.weeklyReports ? '#2563EB' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceGroupTitle}>
            <Calendar size={16} color="#0D9488" /> Appointments & Alerts
          </Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>Appointment Reminders</Text>
              <Text style={styles.preferenceDescription}>
                Reminders for virtual consultations and follow-ups
              </Text>
            </View>
            <Switch
              value={emailPrefs.appointmentReminders}
              onValueChange={(value) => setEmailPrefs(prev => ({ ...prev, appointmentReminders: value }))}
              trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
              thumbColor={emailPrefs.appointmentReminders ? '#2563EB' : '#9CA3AF'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>Red Flag Alerts</Text>
              <Text style={styles.preferenceDescription}>
                Critical health alerts that require immediate attention
              </Text>
            </View>
            <Switch
              value={emailPrefs.redFlagAlerts}
              onValueChange={(value) => setEmailPrefs(prev => ({ ...prev, redFlagAlerts: value }))}
              trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
              thumbColor={emailPrefs.redFlagAlerts ? '#2563EB' : '#9CA3AF'}
            />
            <Text style={styles.criticalNote}>
              ⚠️ Recommended to keep enabled for safety
            </Text>
          </View>
        </View>

        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceGroupTitle}>
            <MessageSquare size={16} color="#F59E0B" /> Marketing & Updates
          </Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>Marketing Emails</Text>
              <Text style={styles.preferenceDescription}>
                New features, tips, and promotional content
              </Text>
            </View>
            <Switch
              value={emailPrefs.marketingEmails}
              onValueChange={(value) => setEmailPrefs(prev => ({ ...prev, marketingEmails: value }))}
              trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
              thumbColor={emailPrefs.marketingEmails ? '#2563EB' : '#9CA3AF'}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleEmailPreferencesSave}
        disabled={isLoading}
      >
        <Mail size={20} color="#FFFFFF" />
        <Text style={styles.saveButtonText}>
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Text>
      </TouchableOpacity>

      <View style={styles.tabBottomSpacer} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {renderTabButton('profile', <User size={20} color={activeTab === 'profile' ? "#FFFFFF" : "#6B7280"} />, 'Profile')}
        {renderTabButton('password', <Lock size={20} color={activeTab === 'password' ? "#FFFFFF" : "#6B7280"} />, 'Password')}
        {renderTabButton('email', <Mail size={20} color={activeTab === 'email' ? "#FFFFFF" : "#6B7280"} />, 'Email')}
      </View>

      {/* Tab Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'password' && renderPasswordTab()}
      {activeTab === 'email' && renderEmailTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: '#2563EB',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  formSection: {
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
  formSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  formSectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nameField: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  languageButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  languageButtonTextSelected: {
    color: '#FFFFFF',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  passwordRequirement: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  preferenceGroup: {
    marginBottom: 24,
  },
  preferenceGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  criticalNote: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabBottomSpacer: {
    height: 40,
  },
});