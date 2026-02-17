/**
 * Admin Consult Note Screen
 *
 * SOAP note documentation form for telehealth consultations.
 * Only accessible by admin/clinician roles.
 *
 * HIPAA Compliance:
 * - Notes stored in consult_notes table with RLS
 * - Patients cannot view these notes
 * - EMR sync integration available
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FileText,
  Save,
  X,
  Check,
  AlertTriangle,
  Upload,
  MapPin,
  Calendar,
  Clock,
  User,
  Shield,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { consultNotesService, appointmentService } from '@/services/telehealthService';
import { emrAdapter } from '@/services/emrAdapter';
import { AdminConsultOverview, ConsultNote, UpsertConsultNotePayload } from '@/types/telehealth';

interface AdminConsultNoteScreenProps {
  /**
   * The consult to document
   */
  consult: AdminConsultOverview;

  /**
   * Callback when note is saved
   */
  onSaved: () => void;

  /**
   * Callback to close the screen
   */
  onClose: () => void;
}

export default function AdminConsultNoteScreen({
  consult,
  onSaved,
  onClose,
}: AdminConsultNoteScreenProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingNote, setExistingNote] = useState<ConsultNote | null>(null);

  // SOAP fields
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [recommendations, setRecommendations] = useState('');

  // Clinical flags
  const [redFlags, setRedFlags] = useState(false);
  const [followUpRecommended, setFollowUpRecommended] = useState(false);
  const [inPersonReferral, setInPersonReferral] = useState(false);

  // Session metadata
  const [durationMinutes, setDurationMinutes] = useState('30');

  // Load existing note if present
  useEffect(() => {
    const loadNote = async () => {
      try {
        const note = await consultNotesService.getNote(consult.appointment_id);
        if (note) {
          setExistingNote(note);
          setSubjective(note.subjective || '');
          setObjective(note.objective || '');
          setAssessment(note.assessment || '');
          setPlan(note.plan || '');
          setRecommendations(note.recommendations || '');
          setRedFlags(note.red_flags);
          setFollowUpRecommended(note.follow_up_recommended);
          setInPersonReferral(note.in_person_referral_recommended);
          setDurationMinutes(note.duration_minutes?.toString() || '30');
        }
      } catch (err) {
        setError('Failed to load existing note');
      } finally {
        setLoading(false);
      }
    };

    loadNote();
  }, [consult.appointment_id]);

  // Save note
  const handleSave = useCallback(async () => {
    if (!supabase) {
      setError('Database not available');
      return;
    }

    // Get current clinician user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      return;
    }

    if (!consult.patient_user_id) {
      setError('Patient user ID not available');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: UpsertConsultNotePayload = {
        appointment_id: consult.appointment_id,
        patient_user_id: consult.patient_user_id,
        subjective: subjective.trim() || null,
        objective: objective.trim() || null,
        assessment: assessment.trim() || null,
        plan: plan.trim() || null,
        recommendations: recommendations.trim() || null,
        red_flags: redFlags,
        follow_up_recommended: followUpRecommended,
        in_person_referral_recommended: inPersonReferral,
        duration_minutes: parseInt(durationMinutes, 10) || null,
      };

      await consultNotesService.upsertNote(payload, user.id);

      // Mark appointment as completed if it was scheduled/confirmed
      if (consult.appointment_status === 'scheduled' || consult.appointment_status === 'confirmed') {
        try {
          // TODO: Update appointment status through Edge Function
          // await appointmentService.completeAppointment(consult.appointment_id);
        } catch {
          // Non-critical error
        }
      }

      Alert.alert(
        'Note Saved',
        'Consult documentation has been saved successfully.',
        [{ text: 'OK', onPress: onSaved }]
      );
    } catch (err) {
      setError('Failed to save note');
    } finally {
      setSaving(false);
    }
  }, [
    consult,
    subjective,
    objective,
    assessment,
    plan,
    recommendations,
    redFlags,
    followUpRecommended,
    inPersonReferral,
    durationMinutes,
    onSaved,
  ]);

  // Export to EMR
  const handleExportToEMR = useCallback(async () => {
    if (!existingNote) {
      Alert.alert('Save First', 'Please save the note before exporting to EMR.');
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const result = await emrAdapter.pushConsultNoteToEMR({
        note_id: existingNote.id,
        appointment_id: consult.appointment_id,
        patient_user_id: consult.patient_user_id || '',
        patient_name: consult.patient_name,
        patient_email: consult.patient_email,
        note_type: existingNote.note_type,
        subjective: existingNote.subjective,
        objective: existingNote.objective,
        assessment: existingNote.assessment,
        plan: existingNote.plan,
        recommendations: existingNote.recommendations,
        red_flags: existingNote.red_flags,
        follow_up_recommended: existingNote.follow_up_recommended,
        in_person_referral_recommended: existingNote.in_person_referral_recommended,
        duration_minutes: existingNote.duration_minutes,
        consult_date: consult.start_time,
        clinician_user_id: existingNote.clinician_user_id,
        location_verified: consult.location_verified,
        location_state: consult.confirmed_state,
        consent_version: consult.consent_version,
      });

      if (result.success && result.emr_record_id) {
        await consultNotesService.markEMRSynced(existingNote.id, result.emr_record_id);
        Alert.alert('Export Successful', 'Note has been exported to Buckeye EMR.');
      } else {
        Alert.alert(
          'Export Failed',
          result.error || 'Failed to export to EMR. The EMR integration may not be configured yet.'
        );
      }
    } catch (err) {
      Alert.alert('Export Failed', 'An error occurred while exporting to EMR.');
    } finally {
      setSyncing(false);
    }
  }, [existingNote, consult]);

  // Format date for display
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading note...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Consult Documentation</Text>
          <Text style={styles.headerSubtitle}>SOAP Note</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Save size={18} color={colors.white} />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Patient Info Card */}
          <View style={styles.patientCard}>
            <View style={styles.patientHeader}>
              <User size={20} color={colors.primary[500]} />
              <Text style={styles.patientName}>{consult.patient_name}</Text>
            </View>
            {consult.patient_email && (
              <Text style={styles.patientEmail}>{consult.patient_email}</Text>
            )}
            <View style={styles.appointmentInfo}>
              <View style={styles.infoRow}>
                <Calendar size={14} color={colors.neutral[500]} />
                <Text style={styles.infoText}>{formatDateTime(consult.start_time)}</Text>
              </View>
            </View>

            {/* Compliance Status */}
            <View style={styles.complianceStatus}>
              <View style={[
                styles.complianceBadge,
                consult.has_consent ? styles.complianceSuccess : styles.complianceWarning
              ]}>
                <Shield size={12} color={consult.has_consent ? colors.success[600] : colors.warning[600]} />
                <Text style={[
                  styles.complianceText,
                  consult.has_consent ? styles.complianceTextSuccess : styles.complianceTextWarning
                ]}>
                  {consult.has_consent ? `Consent: ${consult.consent_version}` : 'No consent'}
                </Text>
              </View>
              <View style={[
                styles.complianceBadge,
                consult.location_verified ? styles.complianceSuccess : styles.complianceWarning
              ]}>
                <MapPin size={12} color={consult.location_verified ? colors.success[600] : colors.warning[600]} />
                <Text style={[
                  styles.complianceText,
                  consult.location_verified ? styles.complianceTextSuccess : styles.complianceTextWarning
                ]}>
                  {consult.location_verified ? `Location: ${consult.confirmed_state}` : 'Not verified'}
                </Text>
              </View>
            </View>
          </View>

          {/* Error message */}
          {error && (
            <View style={styles.errorAlert}>
              <AlertTriangle size={18} color={colors.error[600]} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* SOAP Form */}
          <View style={styles.soapSection}>
            <Text style={styles.sectionTitle}>SOAP Note</Text>

            {/* Subjective */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>S - Subjective</Text>
              <Text style={styles.inputHint}>Patient's reported symptoms, concerns, and history</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={subjective}
                onChangeText={setSubjective}
                placeholder="What the patient reports..."
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Objective */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>O - Objective</Text>
              <Text style={styles.inputHint}>Your observations and findings</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={objective}
                onChangeText={setObjective}
                placeholder="Observations via telehealth..."
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Assessment */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>A - Assessment</Text>
              <Text style={styles.inputHint}>Clinical assessment and diagnosis</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={assessment}
                onChangeText={setAssessment}
                placeholder="Clinical assessment..."
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Plan */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>P - Plan</Text>
              <Text style={styles.inputHint}>Treatment plan and next steps</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={plan}
                onChangeText={setPlan}
                placeholder="Treatment plan..."
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Recommendations */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Recommendations</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={recommendations}
                onChangeText={setRecommendations}
                placeholder="Home exercises, follow-up, referrals..."
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Clinical Flags */}
          <View style={styles.flagsSection}>
            <Text style={styles.sectionTitle}>Clinical Flags</Text>

            <View style={styles.flagRow}>
              <View style={styles.flagInfo}>
                <AlertTriangle size={18} color={colors.error[500]} />
                <View>
                  <Text style={styles.flagLabel}>Red Flags Identified</Text>
                  <Text style={styles.flagHint}>Safety concerns requiring immediate attention</Text>
                </View>
              </View>
              <Switch
                value={redFlags}
                onValueChange={setRedFlags}
                trackColor={{ false: colors.neutral[300], true: colors.error[200] }}
                thumbColor={redFlags ? colors.error[500] : colors.neutral[100]}
              />
            </View>

            <View style={styles.flagRow}>
              <View style={styles.flagInfo}>
                <Clock size={18} color={colors.info[500]} />
                <View>
                  <Text style={styles.flagLabel}>Follow-up Recommended</Text>
                  <Text style={styles.flagHint}>Schedule another telehealth session</Text>
                </View>
              </View>
              <Switch
                value={followUpRecommended}
                onValueChange={setFollowUpRecommended}
                trackColor={{ false: colors.neutral[300], true: colors.info[200] }}
                thumbColor={followUpRecommended ? colors.info[500] : colors.neutral[100]}
              />
            </View>

            <View style={styles.flagRow}>
              <View style={styles.flagInfo}>
                <User size={18} color={colors.warning[500]} />
                <View>
                  <Text style={styles.flagLabel}>In-Person Referral Recommended</Text>
                  <Text style={styles.flagHint}>Patient should be seen in person</Text>
                </View>
              </View>
              <Switch
                value={inPersonReferral}
                onValueChange={setInPersonReferral}
                trackColor={{ false: colors.neutral[300], true: colors.warning[200] }}
                thumbColor={inPersonReferral ? colors.warning[500] : colors.neutral[100]}
              />
            </View>
          </View>

          {/* Session Duration */}
          <View style={styles.durationSection}>
            <Text style={styles.sectionTitle}>Session Duration</Text>
            <View style={styles.durationInput}>
              <Clock size={18} color={colors.neutral[500]} />
              <TextInput
                style={styles.durationTextInput}
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={colors.neutral[400]}
              />
              <Text style={styles.durationUnit}>minutes</Text>
            </View>
          </View>

          {/* EMR Export */}
          <View style={styles.emrSection}>
            <Text style={styles.sectionTitle}>EMR Integration</Text>
            {existingNote?.emr_synced ? (
              <View style={styles.emrSyncedBadge}>
                <Check size={16} color={colors.success[600]} />
                <Text style={styles.emrSyncedText}>
                  Synced to EMR (ID: {existingNote.emr_record_id})
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.emrButton, syncing && styles.emrButtonDisabled]}
                onPress={handleExportToEMR}
                disabled={syncing || !existingNote}
              >
                {syncing ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Upload size={18} color={colors.white} />
                    <Text style={styles.emrButtonText}>Export to Buckeye EMR</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {!existingNote && (
              <Text style={styles.emrHint}>Save the note first to enable EMR export</Text>
            )}
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
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
  },
  header: {
    backgroundColor: colors.primary[500],
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: spacing[2],
    marginRight: spacing[2],
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[100],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    gap: spacing[1],
  },
  saveButtonDisabled: {
    backgroundColor: colors.neutral[400],
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  patientCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  patientName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[900],
  },
  patientEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginBottom: spacing[3],
  },
  appointmentInfo: {
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
  },
  complianceStatus: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    gap: spacing[1],
  },
  complianceSuccess: {
    backgroundColor: colors.success[50],
  },
  complianceWarning: {
    backgroundColor: colors.warning[50],
  },
  complianceText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  complianceTextSuccess: {
    color: colors.success[700],
  },
  complianceTextWarning: {
    color: colors.warning[700],
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
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.error[700],
  },
  soapSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
    marginBottom: spacing[1],
  },
  inputHint: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    marginBottom: spacing[2],
  },
  textInput: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: borderRadius.md,
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
  },
  textArea: {
    minHeight: 100,
  },
  flagsSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  flagInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing[3],
  },
  flagLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[800],
  },
  flagHint: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  durationSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  durationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: borderRadius.md,
    padding: spacing[3],
    gap: spacing[2],
  },
  durationTextInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
  },
  durationUnit: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  emrSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  emrSyncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    padding: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  emrSyncedText: {
    fontSize: typography.fontSize.sm,
    color: colors.success[700],
    fontWeight: typography.fontWeight.medium,
  },
  emrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.info[500],
    padding: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  emrButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  emrButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  emrHint: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    marginTop: spacing[2],
    textAlign: 'center',
  },
  bottomSpacer: {
    height: spacing[8],
  },
});
