/**
 * Location Verification Modal
 *
 * Requires patients to confirm their physical location before joining a consult.
 * Required for state licensure compliance (Texas only currently).
 *
 * HIPAA Compliance:
 * - Location verification stored with timestamp
 * - Required before each telehealth session
 * - Blocks consult if patient is not in Texas
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MapPin,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { locationVerificationService } from '@/services/telehealthService';
import { TEXAS_CITIES, ALLOWED_STATES } from '@/types/telehealth';

interface LocationVerificationModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;

  /**
   * Appointment ID to verify location for
   */
  appointmentId: string;

  /**
   * User ID (optional, will use current user if not provided)
   */
  userId?: string;

  /**
   * Callback when location is successfully verified
   */
  onVerified: () => void;

  /**
   * Callback when modal is closed without verification
   */
  onClose: () => void;
}

export default function LocationVerificationModal({
  visible,
  appointmentId,
  userId: propUserId,
  onVerified,
  onClose,
}: LocationVerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string>('TX');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Handle verification submission
  const handleVerify = useCallback(async () => {
    if (!isConfirmed) {
      setError('Please confirm your location by checking the box below.');
      return;
    }

    if (selectedState !== 'TX') {
      setError('PTBOT consults are currently available only when you are physically located in Texas.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user ID if not provided
      let userId = propUserId;
      if (!userId && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }

      if (!userId) {
        setError('Please sign in to continue.');
        setLoading(false);
        return;
      }

      const result = await locationVerificationService.verifyLocation(
        appointmentId,
        userId,
        selectedState,
        selectedCity || undefined
      );

      if (result.isVerified && result.isAllowedState) {
        onVerified();
      } else if (result.errorMessage) {
        setError(result.errorMessage);
      } else {
        setError('Location verification failed. Please try again.');
      }
    } catch (err) {
      setError('Failed to verify location. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, propUserId, selectedState, selectedCity, isConfirmed, onVerified]);

  // Handle not in Texas
  const handleNotInTexas = useCallback(() => {
    setError(
      'PTBOT consults are currently available only when you are physically located in Texas. ' +
      'Please reschedule your appointment for a time when you will be in Texas.'
    );
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MapPin size={28} color={colors.white} />
          </View>
          <Text style={styles.headerTitle}>Confirm Your Location</Text>
          <Text style={styles.headerSubtitle}>
            Required before joining your telehealth session
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Why we need this */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Why is this required?</Text>
            <Text style={styles.infoText}>
              Due to state healthcare licensing regulations, we must verify that you are
              physically located in Texas before starting your telehealth consultation.
              This verification is required before each session.
            </Text>
          </View>

          {/* Location confirmation */}
          <View style={styles.locationCard}>
            <Text style={styles.locationTitle}>Your Current Location</Text>

            {/* State selection (currently only TX allowed) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>State</Text>
              <View style={styles.stateDisplay}>
                <MapPin size={18} color={colors.primary[500]} />
                <Text style={styles.stateText}>Texas (TX)</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>Required</Text>
                </View>
              </View>
            </View>

            {/* City selection (optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City (Optional)</Text>
              <TouchableOpacity
                style={styles.cityPicker}
                onPress={() => setShowCityPicker(true)}
              >
                <Text style={selectedCity ? styles.cityText : styles.cityPlaceholder}>
                  {selectedCity || 'Select your city'}
                </Text>
                <ChevronDown size={20} color={colors.neutral[400]} />
              </TouchableOpacity>
            </View>

            {/* Error message */}
            {error && (
              <View style={styles.errorAlert}>
                <AlertTriangle size={18} color={colors.error[600]} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Confirmation checkbox */}
            <TouchableOpacity
              style={styles.confirmRow}
              onPress={() => setIsConfirmed(!isConfirmed)}
              disabled={loading}
            >
              <View style={[styles.checkbox, isConfirmed && styles.checkboxChecked]}>
                {isConfirmed && <Check size={16} color={colors.white} />}
              </View>
              <Text style={styles.confirmText}>
                I confirm that I am currently physically located in Texas
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (!isConfirmed || loading) && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerify}
              disabled={!isConfirmed || loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Check size={20} color={colors.white} />
                  <Text style={styles.verifyButtonText}>Confirm & Join Consult</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.notInTexasButton}
              onPress={handleNotInTexas}
              disabled={loading}
            >
              <Text style={styles.notInTexasText}>
                I'm not currently in Texas
              </Text>
            </TouchableOpacity>
          </View>

          {/* Legal notice */}
          <View style={styles.legalNotice}>
            <Text style={styles.legalText}>
              By confirming your location, you attest that you are physically present
              in the State of Texas at the time of this telehealth consultation.
              Providing false information may result in the termination of services.
            </Text>
          </View>
        </ScrollView>

        {/* City Picker Modal */}
        <Modal
          visible={showCityPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCityPicker(false)}
        >
          <SafeAreaView style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select City</Text>
              <TouchableOpacity
                style={styles.pickerDone}
                onPress={() => setShowCityPicker(false)}
              >
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {TEXAS_CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.pickerItem,
                    selectedCity === city && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCity(city);
                    setShowCityPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedCity === city && styles.pickerItemTextSelected,
                    ]}
                  >
                    {city}
                  </Text>
                  {selectedCity === city && (
                    <Check size={20} color={colors.primary[500]} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

/**
 * Hook to manage location verification state
 */
export function useLocationVerification(appointmentId: string) {
  const [showModal, setShowModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check existing verification on mount
  React.useEffect(() => {
    const checkVerification = async () => {
      try {
        const status = await locationVerificationService.getVerificationStatus(appointmentId);
        setIsVerified(status.isVerified && status.isAllowedState);
      } catch {
        setIsVerified(false);
      } finally {
        setChecking(false);
      }
    };

    checkVerification();
  }, [appointmentId]);

  const requestVerification = useCallback(() => {
    if (!isVerified) {
      setShowModal(true);
    }
  }, [isVerified]);

  const onVerified = useCallback(() => {
    setIsVerified(true);
    setShowModal(false);
  }, []);

  const onClose = useCallback(() => {
    setShowModal(false);
  }, []);

  return {
    showModal,
    isVerified,
    checking,
    requestVerification,
    onVerified,
    onClose,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    backgroundColor: colors.primary[500],
    padding: spacing[5],
    paddingTop: spacing[6],
    alignItems: 'center',
    position: 'relative',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing[1],
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[100],
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    padding: spacing[2],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  infoCard: {
    backgroundColor: colors.info[50],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.info[100],
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.info[800],
    marginBottom: spacing[2],
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.info[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  locationCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  locationTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  stateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
    gap: spacing[3],
  },
  stateText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[700],
  },
  requiredBadge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  requiredBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
  cityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  cityText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
  },
  cityPlaceholder: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.neutral[400],
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.error[50],
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.error[200],
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.error[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  confirmText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.neutral[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  buttonContainer: {
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  verifyButton: {
    backgroundColor: colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  verifyButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  verifyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  notInTexasButton: {
    alignItems: 'center',
    padding: spacing[3],
  },
  notInTexasText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    textDecorationLine: 'underline',
  },
  legalNotice: {
    padding: spacing[3],
    marginTop: spacing[4],
  },
  legalText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
  },
  // City Picker styles
  pickerContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  pickerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[900],
  },
  pickerDone: {
    padding: spacing[2],
  },
  pickerDoneText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[500],
  },
  pickerList: {
    flex: 1,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  pickerItemSelected: {
    backgroundColor: colors.primary[50],
  },
  pickerItemText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[700],
  },
  pickerItemTextSelected: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium,
  },
});
