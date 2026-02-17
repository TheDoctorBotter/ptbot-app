import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Calendar, Clock, Check, X, ChevronRight, Phone, Mail, User } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { appointmentService, DaySlots, Appointment } from '@/services/appointmentService';
import { supabase } from '@/lib/supabase';

type ViewMode = 'book' | 'appointments';

export default function ScheduleScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('book');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Availability state
  const [slotsByDay, setSlotsByDay] = useState<DaySlots[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Booking form state
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // User state
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      if (session?.user) {
        // Pre-fill email if logged in
        setPatientEmail(session.user.email || '');
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user) {
        setPatientEmail(session.user.email || '');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load availability
  const loadAvailability = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentService.getAvailability(7);
      setSlotsByDay(response.slotsByDay);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load appointments
  const loadAppointments = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      setLoading(true);
      setError(null);
      const response = await appointmentService.getMyAppointments({ upcoming: true });
      setAppointments(response.appointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Initial load
  useEffect(() => {
    if (viewMode === 'book') {
      loadAvailability();
    } else {
      loadAppointments();
    }
  }, [viewMode, loadAvailability, loadAppointments]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (viewMode === 'book') {
      await loadAvailability();
    } else {
      await loadAppointments();
    }
    setRefreshing(false);
  }, [viewMode, loadAvailability, loadAppointments]);

  // Book appointment
  const handleBookAppointment = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    if (!patientName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (patientName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    try {
      setIsBooking(true);
      setError(null);

      const response = await appointmentService.bookAppointment({
        startISO: selectedSlot,
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim() || undefined,
        patientPhone: patientPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setSuccessMessage(response.message);
      setSelectedSlot(null);
      setNotes('');

      // Reload availability
      await loadAvailability();

      // Switch to appointments view if logged in
      if (isLoggedIn) {
        setTimeout(() => {
          setViewMode('appointments');
          setSuccessMessage(null);
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  // Cancel appointment
  const handleCancelAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await appointmentService.cancelAppointment(appointment.id, 'Cancelled by patient');
              setSuccessMessage('Appointment cancelled');
              await loadAppointments();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to cancel appointment');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Get status badge styles
  const getStatusStyles = (status: Appointment['status']) => {
    const info = appointmentService.getStatusInfo(status);
    return {
      backgroundColor: `${info.color}20`,
      color: info.color,
      label: info.label,
    };
  };

  // Render booking view
  const renderBookingView = () => (
    <>
      {/* Day Selection */}
      {slotsByDay.length > 0 && (
        <View style={styles.daySelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {slotsByDay.map((day, index) => (
              <TouchableOpacity
                key={day.date}
                style={[
                  styles.dayButton,
                  selectedDayIndex === index && styles.dayButtonActive,
                ]}
                onPress={() => {
                  setSelectedDayIndex(index);
                  setSelectedSlot(null);
                }}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    selectedDayIndex === index && styles.dayButtonTextActive,
                  ]}
                >
                  {day.dateDisplay}
                </Text>
                <Text
                  style={[
                    styles.daySlotCount,
                    selectedDayIndex === index && styles.daySlotCountActive,
                  ]}
                >
                  {day.slots.length} slots
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Time Slots */}
      {slotsByDay.length > 0 && slotsByDay[selectedDayIndex] && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Available Times - {slotsByDay[selectedDayIndex].dateDisplay}
          </Text>
          <View style={styles.slotsGrid}>
            {slotsByDay[selectedDayIndex].slots.map((slot) => (
              <TouchableOpacity
                key={slot.startISO}
                style={[
                  styles.slotButton,
                  selectedSlot === slot.startISO && styles.slotButtonSelected,
                ]}
                onPress={() => setSelectedSlot(slot.startISO)}
              >
                <Clock
                  size={16}
                  color={selectedSlot === slot.startISO ? colors.white : colors.primary[500]}
                />
                <Text
                  style={[
                    styles.slotButtonText,
                    selectedSlot === slot.startISO && styles.slotButtonTextSelected,
                  ]}
                >
                  {slot.timeDisplay}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {slotsByDay.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Calendar size={48} color={colors.neutral[400]} />
          <Text style={styles.emptyStateText}>No available slots</Text>
          <Text style={styles.emptyStateSubtext}>
            Please check back later or contact us directly
          </Text>
        </View>
      )}

      {/* Booking Form */}
      {selectedSlot && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Information</Text>

          <View style={styles.selectedTimeDisplay}>
            <Check size={20} color={colors.success[500]} />
            <Text style={styles.selectedTimeText}>
              {slotsByDay[selectedDayIndex]?.dateDisplay},{' '}
              {slotsByDay[selectedDayIndex]?.slots.find(s => s.startISO === selectedSlot)?.timeDisplay}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name *</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color={colors.neutral[400]} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Enter your full name"
                placeholderTextColor={colors.neutral[400]}
                value={patientName}
                onChangeText={setPatientName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (optional)</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color={colors.neutral[400]} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Enter your email"
                placeholderTextColor={colors.neutral[400]}
                value={patientEmail}
                onChangeText={setPatientEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone (optional)</Text>
            <View style={styles.inputWrapper}>
              <Phone size={20} color={colors.neutral[400]} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.neutral[400]}
                value={patientPhone}
                onChangeText={setPatientPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any concerns or topics you'd like to discuss"
              placeholderTextColor={colors.neutral[400]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isBooking && styles.buttonDisabled]}
            onPress={handleBookAppointment}
            disabled={isBooking}
          >
            {isBooking ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Calendar size={20} color={colors.white} />
                <Text style={styles.primaryButtonText}>Book Appointment</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>About PTBot Zoom Calls</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>30-minute video consultation with Dr. Justin Lemmo</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>Appointments during business hours are auto-confirmed</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>You'll receive Zoom meeting details after confirmation</Text>
        </View>
      </View>
    </>
  );

  // Render appointments view
  const renderAppointmentsView = () => (
    <>
      {appointments.length > 0 ? (
        appointments.map((appointment) => {
          const statusStyles = getStatusStyles(appointment.status);
          return (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusStyles.backgroundColor },
                  ]}
                >
                  <Text style={[styles.statusBadgeText, { color: statusStyles.color }]}>
                    {statusStyles.label}
                  </Text>
                </View>
                {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                  <TouchableOpacity
                    onPress={() => handleCancelAppointment(appointment)}
                    style={styles.cancelButton}
                  >
                    <X size={16} color={colors.error[500]} />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.appointmentDetails}>
                <View style={styles.appointmentRow}>
                  <Calendar size={18} color={colors.neutral[500]} />
                  <Text style={styles.appointmentText}>
                    {appointmentService.formatAppointmentTime(
                      appointment.start_time,
                      appointment.end_time
                    )}
                  </Text>
                </View>

                {appointment.zoom_meeting_url && (
                  <TouchableOpacity
                    style={styles.zoomLink}
                    onPress={() => {
                      // Open Zoom URL
                      import('react-native').then(({ Linking }) => {
                        Linking.openURL(appointment.zoom_meeting_url!);
                      });
                    }}
                  >
                    <Text style={styles.zoomLinkText}>Join Zoom Meeting</Text>
                    <ChevronRight size={16} color={colors.primary[500]} />
                  </TouchableOpacity>
                )}

                {appointment.patient_notes && (
                  <Text style={styles.appointmentNotes}>
                    Notes: {appointment.patient_notes}
                  </Text>
                )}
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <Calendar size={48} color={colors.neutral[400]} />
          <Text style={styles.emptyStateText}>No upcoming appointments</Text>
          <TouchableOpacity
            style={styles.bookNowButton}
            onPress={() => setViewMode('book')}
          >
            <Text style={styles.bookNowButtonText}>Book an Appointment</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Calendar size={32} color={colors.white} />
            </View>
            <Text style={styles.title}>Schedule a Call</Text>
            <Text style={styles.subtitle}>
              Book a PTBot Zoom consultation
            </Text>
          </View>

          {/* View Toggle */}
          {isLoggedIn && (
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === 'book' && styles.toggleButtonActive,
                ]}
                onPress={() => setViewMode('book')}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    viewMode === 'book' && styles.toggleButtonTextActive,
                  ]}
                >
                  Book New
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === 'appointments' && styles.toggleButtonActive,
                ]}
                onPress={() => setViewMode('appointments')}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    viewMode === 'appointments' && styles.toggleButtonTextActive,
                  ]}
                >
                  My Appointments
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Success Message */}
          {successMessage && (
            <View style={styles.successContainer}>
              <Check size={20} color={colors.success[600]} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Loading */}
          {loading && !refreshing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>
                {viewMode === 'book' ? 'Loading availability...' : 'Loading appointments...'}
              </Text>
            </View>
          )}

          {/* Content */}
          {!loading && (
            viewMode === 'book' ? renderBookingView() : renderAppointmentsView()
          )}
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    padding: spacing[1],
    marginBottom: spacing[4],
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  toggleButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[600],
  },
  toggleButtonTextActive: {
    color: colors.primary[500],
  },
  daySelector: {
    marginBottom: spacing[4],
  },
  dayButton: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    marginRight: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    minWidth: 120,
  },
  dayButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  dayButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[700],
    marginBottom: spacing[1],
  },
  dayButtonTextActive: {
    color: colors.white,
  },
  daySlotCount: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
  },
  daySlotCountActive: {
    color: colors.primary[100],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    marginBottom: spacing[4],
    ...shadows.md,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  slotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
    gap: spacing[2],
  },
  slotButtonSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  slotButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[700],
  },
  slotButtonTextSelected: {
    color: colors.white,
  },
  selectedTimeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  selectedTimeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.success[700],
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  input: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
  },
  inputWithIcon: {
    flex: 1,
    padding: spacing[4],
    paddingLeft: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  infoCard: {
    backgroundColor: colors.info[50],
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.info[100],
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.info[700],
    marginBottom: spacing[3],
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  infoBullet: {
    color: colors.info[600],
    marginRight: spacing[2],
    fontSize: typography.fontSize.sm,
  },
  infoText: {
    flex: 1,
    color: colors.info[700],
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyStateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[600],
    marginTop: spacing[4],
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginTop: spacing[2],
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  loadingText: {
    marginTop: spacing[3],
    color: colors.neutral[600],
    fontSize: typography.fontSize.base,
  },
  errorContainer: {
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  errorText: {
    color: colors.error[600],
    fontSize: typography.fontSize.sm,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  successText: {
    color: colors.success[600],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  appointmentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  cancelButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.error[500],
  },
  appointmentDetails: {
    gap: spacing[2],
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  appointmentText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[700],
  },
  appointmentNotes: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginTop: spacing[2],
    fontStyle: 'italic',
  },
  zoomLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  zoomLinkText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },
  bookNowButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    marginTop: spacing[4],
  },
  bookNowButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
