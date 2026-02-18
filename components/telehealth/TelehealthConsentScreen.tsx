/**
 * Telehealth Consent Screen
 *
 * Displays telehealth consent agreement and collects patient acceptance.
 * Required before booking or joining a telehealth consult.
 *
 * HIPAA Compliance:
 * - Consent version tracked for regulatory compliance
 * - Acceptance timestamp recorded
 * - Hash of consent text stored for integrity verification
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FileCheck,
  Check,
  X,
  AlertTriangle,
  Shield,
  MapPin,
  Clock,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import {
  telehealthConsentService,
  getCurrentConsentInfo,
} from '@/services/telehealthService';
import { ConsentStatus } from '@/types/telehealth';

interface TelehealthConsentScreenProps {
  /**
   * Callback when consent is successfully accepted
   */
  onConsentAccepted: () => void;

  /**
   * Callback when user cancels/declines
   */
  onCancel?: () => void;

  /**
   * Whether to show as a modal (affects styling)
   */
  isModal?: boolean;

  /**
   * User ID to check/store consent for
   * If not provided, will use current authenticated user
   */
  userId?: string;

  /**
   * When true, shows the consent text in read-only mode (for viewing from settings).
   * Skips the auto-redirect when consent is already accepted.
   */
  viewOnly?: boolean;
}

export default function TelehealthConsentScreen({
  onConsentAccepted,
  onCancel,
  isModal = false,
  userId: propUserId,
  viewOnly = false,
}: TelehealthConsentScreenProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null);
  const [userId, setUserId] = useState<string | null>(propUserId || null);

  // Checkbox states
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [understandLimitations, setUnderstandLimitations] = useState(false);
  const [confirmTexasLocation, setConfirmTexasLocation] = useState(false);

  const { version, text } = getCurrentConsentInfo();

  // Get user ID if not provided
  useEffect(() => {
    const getUserId = async () => {
      if (propUserId) {
        setUserId(propUserId);
        return;
      }

      if (!supabase) {
        setError('Authentication service not available');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        setError('Please sign in to continue');
        setLoading(false);
      }
    };

    getUserId();
  }, [propUserId]);

  // Check current consent status
  useEffect(() => {
    const checkConsent = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const status = await telehealthConsentService.getConsentStatus(userId);
        setConsentStatus(status);

        // If already has valid consent, notify parent (unless viewing read-only)
        if (status.hasValidConsent && !viewOnly) {
          onConsentAccepted();
        }
      } catch (err) {
        setError('Failed to check consent status');
      } finally {
        setLoading(false);
      }
    };

    checkConsent();
  }, [userId, onConsentAccepted]);

  // Handle consent acceptance
  const handleAcceptConsent = useCallback(async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    if (!agreeToTerms || !understandLimitations || !confirmTexasLocation) {
      Alert.alert(
        'Required',
        'Please check all boxes to confirm your understanding and agreement.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await telehealthConsentService.acceptConsent(userId);

      Alert.alert(
        'Consent Recorded',
        'Thank you for accepting the telehealth consent agreement.',
        [{ text: 'Continue', onPress: onConsentAccepted }]
      );
    } catch (err) {
      setError('Failed to record consent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [userId, agreeToTerms, understandLimitations, confirmTexasLocation, onConsentAccepted]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      Alert.alert(
        'Consent Required',
        'You must accept the telehealth consent agreement before booking or joining a consultation.',
        [{ text: 'OK' }]
      );
    }
  }, [onCancel]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isModal && styles.modalContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading consent information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !consentStatus) {
    return (
      <SafeAreaView style={[styles.container, isModal && styles.modalContainer]}>
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color={colors.error[500]} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Already consented - show read-only view if viewOnly, otherwise redirect via useEffect
  if (consentStatus?.hasValidConsent) {
    if (!viewOnly) {
      return (
        <SafeAreaView style={[styles.container, isModal && styles.modalContainer]}>
          <View style={styles.successContainer}>
            <Check size={48} color={colors.success[500]} />
            <Text style={styles.successTitle}>Consent Recorded</Text>
            <Text style={styles.successText}>
              You have already accepted the telehealth consent agreement.
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    // View-only mode: show the consent text with a close button
    return (
      <SafeAreaView style={[styles.container, isModal && styles.modalContainer]}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <FileCheck size={28} color={colors.white} />
          </View>
          <Text style={styles.headerTitle}>Telehealth Consent</Text>
          <Text style={styles.headerSubtitle}>
            Your accepted consent agreement
          </Text>
          {onCancel && (
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <X size={24} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.viewOnlyBanner}>
            <Check size={18} color={colors.success[600]} />
            <Text style={styles.viewOnlyBannerText}>
              You accepted this consent on{' '}
              {consentStatus.acceptedAt
                ? new Date(consentStatus.acceptedAt).toLocaleDateString()
                : 'a previous date'}
            </Text>
          </View>

          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version: {version}</Text>
          </View>

          <View style={styles.keyPointsCard}>
            <Text style={styles.keyPointsTitle}>Key Points</Text>
            <View style={styles.keyPoint}>
              <Shield size={18} color={colors.info[600]} />
              <Text style={styles.keyPointText}>
                Your telehealth sessions are secure and HIPAA-compliant
              </Text>
            </View>
            <View style={styles.keyPoint}>
              <MapPin size={18} color={colors.info[600]} />
              <Text style={styles.keyPointText}>
                You must be physically located in Texas during each session
              </Text>
            </View>
            <View style={styles.keyPoint}>
              <Clock size={18} color={colors.info[600]} />
              <Text style={styles.keyPointText}>
                Telehealth is not for emergencies - call 911 if needed
              </Text>
            </View>
          </View>

          <View style={styles.consentCard}>
            <Text style={styles.consentTitle}>Informed Consent Agreement</Text>
            <View style={styles.consentTextContainer}>
              <Text style={styles.consentText}>{text}</Text>
            </View>
          </View>

          {onCancel && (
            <TouchableOpacity
              style={styles.viewOnlyCloseButton}
              onPress={onCancel}
            >
              <Text style={styles.viewOnlyCloseButtonText}>Close</Text>
            </TouchableOpacity>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isModal && styles.modalContainer]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <FileCheck size={28} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>Telehealth Consent</Text>
        <Text style={styles.headerSubtitle}>
          Please review and accept before your consultation
        </Text>
        {onCancel && (
          <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
            <X size={24} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Re-consent notice if upgrading */}
        {consentStatus?.needsReConsent && (
          <View style={styles.reconsentNotice}>
            <AlertTriangle size={20} color={colors.warning[600]} />
            <Text style={styles.reconsentText}>
              Our telehealth consent agreement has been updated. Please review and accept the new version to continue.
            </Text>
          </View>
        )}

        {/* Version info */}
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>Version: {version}</Text>
        </View>

        {/* Key points summary */}
        <View style={styles.keyPointsCard}>
          <Text style={styles.keyPointsTitle}>Key Points</Text>

          <View style={styles.keyPoint}>
            <Shield size={18} color={colors.info[600]} />
            <Text style={styles.keyPointText}>
              Your telehealth sessions are secure and HIPAA-compliant
            </Text>
          </View>

          <View style={styles.keyPoint}>
            <MapPin size={18} color={colors.info[600]} />
            <Text style={styles.keyPointText}>
              You must be physically located in Texas during each session
            </Text>
          </View>

          <View style={styles.keyPoint}>
            <Clock size={18} color={colors.info[600]} />
            <Text style={styles.keyPointText}>
              Telehealth is not for emergencies - call 911 if needed
            </Text>
          </View>
        </View>

        {/* Full consent text */}
        <View style={styles.consentCard}>
          <Text style={styles.consentTitle}>Informed Consent Agreement</Text>
          <View style={styles.consentTextContainer}>
            <Text style={styles.consentText}>{text}</Text>
          </View>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorAlert}>
            <AlertTriangle size={18} color={colors.error[600]} />
            <Text style={styles.errorAlertText}>{error}</Text>
          </View>
        )}

        {/* Checkboxes */}
        <View style={styles.checkboxSection}>
          <Text style={styles.checkboxSectionTitle}>
            Please confirm the following:
          </Text>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
            disabled={submitting}
          >
            <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
              {agreeToTerms && <Check size={16} color={colors.white} />}
            </View>
            <Text style={styles.checkboxLabel}>
              I have read and agree to the telehealth consent agreement above
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setUnderstandLimitations(!understandLimitations)}
            disabled={submitting}
          >
            <View style={[styles.checkbox, understandLimitations && styles.checkboxChecked]}>
              {understandLimitations && <Check size={16} color={colors.white} />}
            </View>
            <Text style={styles.checkboxLabel}>
              I understand the limitations of telehealth and that some conditions may require in-person care
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setConfirmTexasLocation(!confirmTexasLocation)}
            disabled={submitting}
          >
            <View style={[styles.checkbox, confirmTexasLocation && styles.checkboxChecked]}>
              {confirmTexasLocation && <Check size={16} color={colors.white} />}
            </View>
            <Text style={styles.checkboxLabel}>
              I understand I must be physically located in Texas during each telehealth session
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.acceptButton,
              (!agreeToTerms || !understandLimitations || !confirmTexasLocation) &&
                styles.acceptButtonDisabled,
            ]}
            onPress={handleAcceptConsent}
            disabled={
              submitting ||
              !agreeToTerms ||
              !understandLimitations ||
              !confirmTexasLocation
            }
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Check size={20} color={colors.white} />
                <Text style={styles.acceptButtonText}>Accept & Continue</Text>
              </>
            )}
          </TouchableOpacity>

          {onCancel && (
            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleCancel}
              disabled={submitting}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  modalContainer: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[900],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  successTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.success[600],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  successText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    textAlign: 'center',
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
  reconsentNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning[50],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  reconsentText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  versionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.neutral[200],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    marginBottom: spacing[4],
  },
  versionText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
    fontWeight: typography.fontWeight.medium,
  },
  keyPointsCard: {
    backgroundColor: colors.info[50],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.info[100],
  },
  keyPointsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.info[800],
    marginBottom: spacing[3],
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  keyPointText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.info[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  consentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  consentTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  consentTextContainer: {
    backgroundColor: colors.neutral[50],
    padding: spacing[4],
    borderRadius: borderRadius.md,
    maxHeight: 300,
  },
  consentText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  errorAlertText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.error[700],
  },
  checkboxSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  checkboxSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
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
  checkboxLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.neutral[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  buttonContainer: {
    marginTop: spacing[2],
  },
  acceptButton: {
    backgroundColor: colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  acceptButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  acceptButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  declineButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
    marginTop: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
  },
  declineButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[600],
  },
  cancelButton: {
    backgroundColor: colors.neutral[200],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[700],
    fontWeight: typography.fontWeight.medium,
  },
  viewOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  viewOnlyBannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.success[700],
    fontWeight: typography.fontWeight.medium,
  },
  viewOnlyCloseButton: {
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginTop: spacing[2],
  },
  viewOnlyCloseButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  bottomSpacer: {
    height: spacing[8],
  },
});
