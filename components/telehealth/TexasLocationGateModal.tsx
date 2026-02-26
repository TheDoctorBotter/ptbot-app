/**
 * Texas Location Gate Modal
 *
 * Shown when a user attempts to schedule or join a Zoom consultation.
 * Uses the browser Geolocation API + /api/verify-texas to confirm
 * the user is physically located in Texas.
 *
 * Three visual states:
 *  1. Prompt    — ask user to allow location access
 *  2. Denied    — user is outside Texas (or permission denied)
 *  3. Loading   — verification in progress
 */

import React from 'react';
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
import { MapPin, X, AlertTriangle, ArrowLeft } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { GateStatus } from '@/hooks/useTexasLocationGate';

interface TexasLocationGateModalProps {
  visible: boolean;
  status: GateStatus;
  loading: boolean;
  message: string | null;
  onCheckEligibility: () => void;
  onDismiss: () => void;
  onBackToDashboard?: () => void;
}

export default function TexasLocationGateModal({
  visible,
  status,
  loading,
  message,
  onCheckEligibility,
  onDismiss,
  onBackToDashboard,
}: TexasLocationGateModalProps) {
  const isDenied = status === 'denied' || status === 'permission_denied';
  const isError = status === 'error';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MapPin size={28} color={colors.white} />
          </View>
          <Text style={styles.headerTitle}>
            {isDenied
              ? 'Zoom Unavailable in Your Area'
              : 'Zoom Consultations Available in Texas Only'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <X size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ───── Prompt state: not yet checked ───── */}
          {!isDenied && !isError && !loading && (
            <>
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                  You can use PTBot from anywhere. Zoom consultations are
                  currently available only to users located in Texas.
                </Text>
                <Text style={[styles.infoText, { marginTop: spacing[3] }]}>
                  To check eligibility, please allow location access. We only
                  use your location to confirm whether you are in Texas.
                </Text>
              </View>

              <View style={styles.privacyCard}>
                <Text style={styles.privacyTitle}>Your Privacy</Text>
                <Text style={styles.privacyText}>
                  Your exact coordinates are never stored. We only check
                  whether you are inside or outside Texas, then discard the
                  data immediately.
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onCheckEligibility}
                >
                  <MapPin size={20} color={colors.white} />
                  <Text style={styles.primaryButtonText}>
                    Check Eligibility
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onDismiss}
                >
                  <Text style={styles.secondaryButtonText}>Not Now</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ───── Loading state ───── */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>
                Checking your location...
              </Text>
              <Text style={styles.loadingSubtext}>
                Please allow location access if prompted by your browser.
              </Text>
            </View>
          )}

          {/* ───── Denied / permission denied / error states ───── */}
          {(isDenied || isError) && !loading && (
            <>
              <View style={styles.deniedCard}>
                <AlertTriangle size={32} color={colors.warning[600]} />
                <Text style={styles.deniedTitle}>
                  {status === 'permission_denied'
                    ? 'Location Access Required'
                    : status === 'error'
                    ? 'Verification Error'
                    : 'Outside Texas'}
                </Text>
                <Text style={styles.deniedText}>
                  {message ||
                    'Zoom consultations are available only in Texas at this time. ' +
                    'You can continue using PTBot features without booking a call.'}
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                {/* Allow retry on error or permission denied */}
                {(isError || status === 'permission_denied') && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={onCheckEligibility}
                  >
                    <MapPin size={20} color={colors.white} />
                    <Text style={styles.primaryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={onBackToDashboard || onDismiss}
                >
                  <ArrowLeft size={18} color={colors.primary[500]} />
                  <Text style={styles.backButtonText}>Back to PTBot</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
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
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: spacing[8],
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
    paddingBottom: spacing[8],
  },

  // ── Prompt state ──
  infoCard: {
    backgroundColor: colors.info[50],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.info[100],
  },
  infoText: {
    fontSize: typography.fontSize.base,
    color: colors.info[800],
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  privacyCard: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[5],
    ...shadows.sm,
  },
  privacyTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  privacyText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },

  // ── Loading state ──
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing[10],
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[700],
  },
  loadingSubtext: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    textAlign: 'center',
  },

  // ── Denied state ──
  deniedCard: {
    backgroundColor: colors.warning[50],
    padding: spacing[5],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[5],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.warning[100],
  },
  deniedTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.warning[700],
    marginTop: spacing[3],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  deniedText: {
    fontSize: typography.fontSize.base,
    color: colors.warning[700],
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },

  // ── Buttons ──
  buttonContainer: {
    gap: spacing[3],
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  secondaryButton: {
    alignItems: 'center',
    padding: spacing[3],
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    textDecorationLine: 'underline',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[500],
    gap: spacing[2],
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
  },
});
