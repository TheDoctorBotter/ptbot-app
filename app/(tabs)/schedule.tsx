import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Modal,
  Linking,
  Pressable,
} from 'react-native';
import { Calendar, Clock, Check, X, ChevronRight, Phone, Mail, User, Shield, MapPin, FileText } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { appointmentService, DaySlots, Appointment } from '@/services/appointmentService';
import { supabase } from '@/lib/supabase';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useUserRole } from '@/hooks/useUserRole';
import PaywallCard from '@/components/PaywallCard';
import { telehealthConsentService, checkPreConsultRequirements, adminConsultService } from '@/services/telehealthService';
import TelehealthConsentScreen from '@/components/telehealth/TelehealthConsentScreen';
import LocationVerificationModal from '@/components/telehealth/LocationVerificationModal';
import AdminConsultNoteScreen from '@/components/telehealth/AdminConsultNoteScreen';
import TexasLocationGateModal from '@/components/telehealth/TexasLocationGateModal';
import { AdminConsultOverview } from '@/types/telehealth';
import { useTexasLocationGate } from '@/hooks/useTexasLocationGate';

type ViewMode = 'book' | 'appointments';

export default function ScheduleScreen() {
  const { isClinicStaff, isLoading: roleLoading } = useUserRole();
  const [viewMode, setViewMode] = useState<ViewMode>('book');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Admin consult note modal
  const [selectedConsult, setSelectedConsult] = useState<AdminConsultOverview | null>(null);
  // Admin appointments list (all patients)
  const [adminConsults, setAdminConsults] = useState<AdminConsultOverview[]>([]);

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

  // Track whether user manually edited the name field so we don't overwrite
  const nameEditedByUser = useRef(false);

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // Tracks which appointment id is currently being cancelled (for per-row loading)
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // User state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Telehealth credit / entitlement state
  const { canBookTelehealth, telehealthCreditsAvailable, refresh: refreshEntitlements } = useEntitlements();
  const [showTelehealthPaywall, setShowTelehealthPaywall] = useState(false);

  // Telehealth consent state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [hasValidConsent, setHasValidConsent] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);

  // Location verification state (per-appointment, for joining consults)
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedAppointmentForJoin, setSelectedAppointmentForJoin] = useState<Appointment | null>(null);

  // Texas GPS location gate (for scheduling — session-level)
  const texasGate = useTexasLocationGate();

  // Pending-action refs: track what to do after the Texas gate passes.
  // Using refs (not state) so we never have stale closure issues.
  const pendingBookRef = useRef(false);
  const pendingJoinRef = useRef<Appointment | null>(null);

  // When the Texas gate transitions to 'granted', auto-proceed with
  // whatever action was pending. This runs after React re-renders, so
  // all state values are fresh — no stale closure problem.
  useEffect(() => {
    if (texasGate.status !== 'granted') return;

    if (pendingBookRef.current) {
      pendingBookRef.current = false;
      // Continue the booking flow past the Texas gate.
      // Credit check → consent check → proceedWithBooking
      const continueBooking = async () => {
        if (!canBookTelehealth) {
          setShowTelehealthPaywall(true);
          return;
        }
        if (isLoggedIn && !hasValidConsent) {
          setShowConsentModal(true);
          return;
        }
        await proceedWithBooking();
      };
      continueBooking();
    }

    if (pendingJoinRef.current) {
      const appointment = pendingJoinRef.current;
      pendingJoinRef.current = null;
      // Continue the join flow past the Texas gate
      const continueJoin = async () => {
        if (!userId) return;
        try {
          const requirements = await checkPreConsultRequirements(userId, appointment.id);
          if (requirements.needsConsent) {
            setShowConsentModal(true);
            return;
          }
          if (requirements.needsLocationVerification) {
            setSelectedAppointmentForJoin(appointment);
            setShowLocationModal(true);
            return;
          }
          if (requirements.locationError) {
            Alert.alert('Location Required', requirements.locationError);
            return;
          }
          if (appointment.zoom_meeting_url) {
            Linking.openURL(appointment.zoom_meeting_url);
          }
        } catch {
          setSelectedAppointmentForJoin(appointment);
          setShowLocationModal(true);
        }
      };
      continueJoin();
    }
  }, [texasGate.status]);

  // Pre-fill name from profile, falling back to auth user_metadata
  const prefillFromProfile = useCallback(async (uid: string, userMetadata?: Record<string, string>) => {
    if (!supabase || nameEditedByUser.current) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', uid)
        .maybeSingle();

      if (nameEditedByUser.current) return;

      // Try profile first_name + last_name
      const profileName = data
        ? [data.first_name, data.last_name].filter(Boolean).join(' ')
        : '';

      // Fall back to user_metadata.full_name (web signup) or first+last
      const metaName = userMetadata?.full_name
        || [userMetadata?.first_name, userMetadata?.last_name].filter(Boolean).join(' ')
        || '';

      const resolvedName = profileName || metaName;
      if (resolvedName) setPatientName(resolvedName);
    } catch {
      // Non-critical — try metadata fallback
      if (!nameEditedByUser.current && userMetadata?.full_name) {
        setPatientName(userMetadata.full_name);
      }
    }
  }, []);

  // Check auth status and consent
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setCheckingConsent(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      if (session?.user) {
        setUserId(session.user.id);
        setPatientEmail(session.user.email || '');

        // Fetch profile + consent in parallel
        const meta = (session.user.user_metadata ?? {}) as Record<string, string>;
        const consentPromise = telehealthConsentService
          .getConsentStatus(session.user.id)
          .then(s => setHasValidConsent(s.hasValidConsent))
          .catch(() => setHasValidConsent(false));

        const profilePromise = prefillFromProfile(session.user.id, meta);

        await Promise.all([consentPromise, profilePromise]);
      }
      setCheckingConsent(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user) {
        setUserId(session.user.id);
        setPatientEmail(session.user.email || '');
        const meta = (session.user.user_metadata ?? {}) as Record<string, string>;
        prefillFromProfile(session.user.id, meta);

        // Re-check consent on auth change
        try {
          const consentStatus = await telehealthConsentService.getConsentStatus(session.user.id);
          setHasValidConsent(consentStatus.hasValidConsent);
        } catch {
          setHasValidConsent(false);
        }
      } else {
        setUserId(null);
        setHasValidConsent(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [prefillFromProfile]);

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
    // Wait until we know the user's role before fetching — prevents a double-load
    // where we first fetch as patient, then re-fetch as clinician once roleLoading resolves.
    if (!isLoggedIn || roleLoading) return;

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Loading timed out. Pull down to refresh or tap Retry.');
    }, 8000);

    try {
      setLoading(true);
      setError(null);

      if (isClinicStaff) {
        // Admin/clinician: load ALL appointments (all patients)
        const consults = await adminConsultService.getConsultOverview({ limit: 100 });
        setAdminConsults(consults);
      } else {
        const response = await appointmentService.getMyAppointments({ upcoming: true });
        setAppointments(response.appointments);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [isLoggedIn, isClinicStaff, roleLoading]);

  // Default admin to appointments view
  useEffect(() => {
    if (isClinicStaff) {
      setViewMode('appointments');
    }
  }, [isClinicStaff]);

  // Load availability when in book mode — kept separate so role changes don't re-trigger this.
  useEffect(() => {
    if (viewMode === 'book') {
      loadAvailability();
    }
  }, [viewMode, loadAvailability]);

  // Load appointments when in appointments mode.  Runs whenever the user's role
  // resolves (roleLoading → false) or isClinicStaff changes, so we always load
  // with the correct role without firing a competing patient-view load first.
  useEffect(() => {
    if (viewMode === 'appointments') {
      loadAppointments();
    }
  }, [viewMode, loadAppointments]);

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

  // Check consent before booking — runs each gate in sequence.
  // If the Texas location gate is not yet passed, opens the modal and
  // registers a callback so booking auto-continues after verification.
  const handleBookAppointment = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    // Credit / paywall gate runs first so non-members see the purchase
    // prompt immediately — before we ask them to fill in form fields.
    if (!canBookTelehealth) {
      setShowTelehealthPaywall(true);
      return;
    }

    // Safety net: users with credits should always be logged in
    if (!isLoggedIn) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to book an appointment.',
        [{ text: 'OK' }]
      );
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

    // Texas location gate: must be in Texas to book a Zoom call.
    // Mark pending so the useEffect auto-proceeds after verification.
    if (texasGate.status !== 'granted') {
      pendingBookRef.current = true;
      texasGate.requestCheck();
      return;
    }

    // Require consent for logged-in users before booking
    if (isLoggedIn && !hasValidConsent) {
      setShowConsentModal(true);
      return;
    }

    await proceedWithBooking();
  };

  // Actual booking after consent check
  const proceedWithBooking = async () => {
    try {
      setIsBooking(true);
      setError(null);

      const response = await appointmentService.bookAppointment({
        startISO: selectedSlot!,
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim() || undefined,
        patientPhone: patientPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setSuccessMessage(response.message);
      if (!response.zoomCreated) {
        console.warn('[schedule] Zoom meeting was not created for this booking');
      }
      setSelectedSlot(null);
      setNotes('');

      // Consume telehealth credit after a successful booking (best-effort)
      if (isLoggedIn && canBookTelehealth && supabase && response.appointment?.id) {
        try {
          await supabase.functions.invoke('consume-telehealth-credit', {
            method: 'POST',
            body: { appointment_id: response.appointment.id },
          });
          refreshEntitlements();
        } catch (creditErr) {
          console.warn('[schedule] Credit consumption failed:', creditErr);
        }
      }

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

  // Handle consent accepted
  const handleConsentAccepted = useCallback(() => {
    setHasValidConsent(true);
    setShowConsentModal(false);

    // If user was trying to book, proceed with booking
    if (selectedSlot && patientName.trim()) {
      proceedWithBooking();
    }
  }, [selectedSlot, patientName]);

  // Handle join consult with location verification
  const handleJoinConsult = useCallback(async (appointment: Appointment) => {
    if (!userId) {
      Alert.alert('Error', 'Please sign in to join the consultation.');
      return;
    }

    // Texas GPS location gate (session-level).
    // Mark pending so the useEffect auto-proceeds after verification.
    if (texasGate.status !== 'granted') {
      pendingJoinRef.current = appointment;
      texasGate.requestCheck();
      return;
    }

    // Check pre-consult requirements
    try {
      const requirements = await checkPreConsultRequirements(userId, appointment.id);

      if (requirements.needsConsent) {
        setShowConsentModal(true);
        return;
      }

      if (requirements.needsLocationVerification) {
        setSelectedAppointmentForJoin(appointment);
        setShowLocationModal(true);
        return;
      }

      if (requirements.locationError) {
        Alert.alert('Location Required', requirements.locationError);
        return;
      }

      // All requirements met, open Zoom
      if (appointment.zoom_meeting_url) {
        Linking.openURL(appointment.zoom_meeting_url);
      }
    } catch (err) {
      // On error, still allow joining but show location modal
      setSelectedAppointmentForJoin(appointment);
      setShowLocationModal(true);
    }
  }, [userId, texasGate]);

  // Handle location verified
  const handleLocationVerified = useCallback(() => {
    setShowLocationModal(false);

    // Open Zoom after verification
    if (selectedAppointmentForJoin?.zoom_meeting_url) {
      Linking.openURL(selectedAppointmentForJoin.zoom_meeting_url);
    }

    setSelectedAppointmentForJoin(null);
  }, [selectedAppointmentForJoin]);

  // Cancel appointment – optimistic update so the UI responds immediately
  const handleCancelAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            // Optimistic: remove from list right away
            setCancellingId(appointment.id);
            setAppointments(prev => prev.filter(a => a.id !== appointment.id));
            setError(null);
            try {
              await appointmentService.cancelAppointment(appointment.id, 'Cancelled by patient');
              setSuccessMessage('Appointment cancelled');
            } catch (err) {
              // Roll back on failure
              setAppointments(prev => [appointment, ...prev]);
              setError(err instanceof Error ? err.message : 'Failed to cancel appointment');
            } finally {
              setCancellingId(null);
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
                onChangeText={(text) => {
                  nameEditedByUser.current = true;
                  setPatientName(text);
                }}
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

      {/* Telehealth Credit Banner (for all non-admin users) */}
      {!isClinicStaff && (
        <View>
          <TouchableOpacity
            style={[
              styles.consentBanner,
              canBookTelehealth ? styles.consentBannerValid : styles.consentBannerRequired,
            ]}
            onPress={() => !canBookTelehealth && setShowTelehealthPaywall(!showTelehealthPaywall)}
            disabled={canBookTelehealth}
          >
            <Calendar
              size={18}
              color={canBookTelehealth ? colors.success[600] : colors.warning[600]}
            />
            <Text
              style={[
                styles.consentBannerText,
                canBookTelehealth ? styles.consentBannerTextValid : styles.consentBannerTextRequired,
              ]}
            >
              {canBookTelehealth
                ? `${telehealthCreditsAvailable} telehealth credit${telehealthCreditsAvailable !== 1 ? 's' : ''} available`
                : isLoggedIn
                  ? 'No consult credits — tap to purchase'
                  : 'Sign in & purchase a credit to book'}
            </Text>
            {canBookTelehealth ? (
              <Check size={16} color={colors.success[600]} />
            ) : (
              <ChevronRight size={16} color={colors.warning[600]} />
            )}
          </TouchableOpacity>
          {showTelehealthPaywall && !canBookTelehealth && (
            <PaywallCard
              visibleProducts={['telehealth_onetime', 'subscription']}
              headerTitle="Book a Telehealth Visit"
              headerSubtitle="Purchase a consult credit or become a PTBot member to schedule your appointment."
              onEntitlementsRefresh={() => {
                refreshEntitlements();
                setShowTelehealthPaywall(false);
              }}
            />
          )}
        </View>
      )}

      {/* Consent Status Banner — only shown once the user has telehealth credits
          (i.e. they've paid).  No point asking for consent before purchase. */}
      {isLoggedIn && !checkingConsent && !isClinicStaff && canBookTelehealth && (
        <TouchableOpacity
          style={[
            styles.consentBanner,
            hasValidConsent ? styles.consentBannerValid : styles.consentBannerRequired,
          ]}
          onPress={() => !hasValidConsent && setShowConsentModal(true)}
          disabled={hasValidConsent}
        >
          <Shield
            size={18}
            color={hasValidConsent ? colors.success[600] : colors.warning[600]}
          />
          <Text
            style={[
              styles.consentBannerText,
              hasValidConsent ? styles.consentBannerTextValid : styles.consentBannerTextRequired,
            ]}
          >
            {hasValidConsent
              ? 'Telehealth consent accepted'
              : 'Telehealth consent required - Tap to review'}
          </Text>
          {hasValidConsent ? (
            <Check size={16} color={colors.success[600]} />
          ) : (
            <ChevronRight size={16} color={colors.warning[600]} />
          )}
        </TouchableOpacity>
      )}

      {/* Texas Location Gate Banner (shown when user is outside Texas) */}
      {(texasGate.status === 'denied' || texasGate.status === 'permission_denied') && (
        <View style={styles.locationDeniedBanner}>
          <MapPin size={18} color={colors.warning[600]} />
          <Text style={styles.locationDeniedText}>
            Zoom consultations are available only in Texas at this time.
            You can continue using PTBot features without booking a call.
          </Text>
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
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>You must be in Texas to join telehealth sessions</Text>
        </View>
      </View>
    </>
  );

  // Format date/time for admin cards
  const formatConsultDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Render admin appointments view (all patients)
  const renderAdminAppointmentsView = () => (
    <>
      <Text style={styles.adminSectionLabel}>
        {adminConsults.length} appointment{adminConsults.length !== 1 ? 's' : ''}
      </Text>
      {adminConsults.length > 0 ? (
        adminConsults.map((consult) => {
          const hasNote = consult.has_note;
          return (
            <TouchableOpacity
              key={consult.appointment_id}
              style={styles.adminAppointmentCard}
              onPress={() => setSelectedConsult(consult)}
              activeOpacity={0.75}
            >
              {/* Patient info */}
              <View style={styles.adminCardHeader}>
                <View style={styles.adminPatientInfo}>
                  <User size={16} color={colors.primary[500]} />
                  <Text style={styles.adminPatientName}>{consult.patient_name}</Text>
                </View>
                <View style={[
                  styles.adminNoteBadge,
                  hasNote ? styles.adminNoteBadgeDone : styles.adminNoteBadgePending,
                ]}>
                  <FileText size={12} color={hasNote ? colors.success[600] : colors.warning[600]} />
                  <Text style={[
                    styles.adminNoteBadgeText,
                    { color: hasNote ? colors.success[700] : colors.warning[700] },
                  ]}>
                    {hasNote ? 'Documented' : 'Needs Note'}
                  </Text>
                </View>
              </View>

              {/* Contact info */}
              {consult.patient_phone && (
                <View style={styles.adminContactRow}>
                  <Phone size={14} color={colors.neutral[500]} />
                  <Text style={styles.adminContactText}>{consult.patient_phone}</Text>
                </View>
              )}
              {consult.patient_email && (
                <View style={styles.adminContactRow}>
                  <Mail size={14} color={colors.neutral[500]} />
                  <Text style={styles.adminContactText}>{consult.patient_email}</Text>
                </View>
              )}

              {/* Date/time */}
              <View style={styles.adminDateRow}>
                <Calendar size={14} color={colors.neutral[500]} />
                <Text style={styles.adminDateText}>
                  {formatConsultDateTime(consult.start_time)}
                </Text>
              </View>

              {/* Action hint */}
              <View style={styles.adminActionRow}>
                <Text style={styles.adminActionText}>
                  {hasNote ? 'View / Edit Note' : 'Complete Documentation'}
                </Text>
                <ChevronRight size={16} color={colors.primary[500]} />
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <Calendar size={48} color={colors.neutral[400]} />
          <Text style={styles.emptyStateText}>No appointments yet</Text>
        </View>
      )}
    </>
  );

  // Render appointments view (patient)
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
                    style={[styles.cancelButton, cancellingId !== null && { opacity: 0.5 }]}
                    disabled={cancellingId !== null}
                  >
                    {cancellingId === appointment.id
                      ? <ActivityIndicator size="small" color={colors.error[500]} />
                      : <X size={16} color={colors.error[500]} />
                    }
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

                {appointment.zoom_meeting_url ? (
                  <TouchableOpacity
                    style={styles.zoomLink}
                    onPress={() => handleJoinConsult(appointment)}
                  >
                    <MapPin size={16} color={colors.primary[500]} />
                    <Text style={styles.zoomLinkText}>Join Zoom Meeting</Text>
                    <ChevronRight size={16} color={colors.primary[500]} />
                  </TouchableOpacity>
                ) : (appointment.status === 'pending' || appointment.status === 'confirmed') ? (
                  <View style={styles.zoomPending}>
                    <Clock size={16} color={colors.warning[500]} />
                    <Text style={styles.zoomPendingText}>Zoom link will be provided before your session</Text>
                  </View>
                ) : null}

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
            <Text style={styles.title}>
              {isClinicStaff ? 'Manage Consultations' : 'Schedule a Call'}
            </Text>
            <Text style={styles.subtitle}>
              {isClinicStaff
                ? 'View and manage patient zoom consults'
                : 'Book a PTBot Zoom consultation'}
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
              <TouchableOpacity
                onPress={() => viewMode === 'appointments' ? loadAppointments() : loadAvailability()}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
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
            viewMode === 'book'
              ? renderBookingView()
              : isClinicStaff
              ? renderAdminAppointmentsView()
              : renderAppointmentsView()
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Admin: SOAP Note Modal */}
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
              loadAppointments();
            }}
            onClose={() => {
              // Refresh the list on close so any saves made during the session
              // (which show inline success rather than calling onSaved) are reflected.
              setSelectedConsult(null);
              loadAppointments();
            }}
          />
        </Modal>
      )}

      {/* Telehealth Consent Modal */}
      <Modal
        visible={showConsentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowConsentModal(false)}
      >
        <TelehealthConsentScreen
          onConsentAccepted={handleConsentAccepted}
          onCancel={() => setShowConsentModal(false)}
          isModal
          userId={userId || undefined}
        />
      </Modal>

      {/* Location Verification Modal (per-appointment, for joining) */}
      {selectedAppointmentForJoin && (
        <LocationVerificationModal
          visible={showLocationModal}
          appointmentId={selectedAppointmentForJoin.id}
          userId={userId || undefined}
          onVerified={handleLocationVerified}
          onClose={() => {
            setShowLocationModal(false);
            setSelectedAppointmentForJoin(null);
          }}
        />
      )}

      {/* Texas GPS Location Gate Modal (session-level, for scheduling) */}
      <TexasLocationGateModal
        visible={texasGate.showModal}
        status={texasGate.status}
        loading={texasGate.loading}
        message={texasGate.message}
        onCheckEligibility={texasGate.verify}
        onDismiss={texasGate.dismiss}
      />
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
    marginBottom: spacing[2],
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.error[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
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
  zoomPending: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
    gap: spacing[2],
  },
  zoomPendingText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[600],
    fontWeight: typography.fontWeight.medium,
    flex: 1,
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
  locationDeniedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning[50],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.warning[100],
  },
  locationDeniedText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.warning[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  consentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  consentBannerValid: {
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  consentBannerRequired: {
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  consentBannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  consentBannerTextValid: {
    color: colors.success[700],
  },
  consentBannerTextRequired: {
    color: colors.warning[700],
  },
  // Admin appointment cards
  adminSectionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginBottom: spacing[3],
  },
  adminAppointmentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  adminCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  adminPatientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  adminPatientName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[900],
  },
  adminNoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  adminNoteBadgeDone: {
    backgroundColor: colors.success[50],
  },
  adminNoteBadgePending: {
    backgroundColor: colors.warning[50],
  },
  adminNoteBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  adminContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  adminContactText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
  },
  adminDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  adminDateText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[700],
    fontWeight: typography.fontWeight.medium,
  },
  adminActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing[2],
    gap: spacing[1],
  },
  adminActionText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },
});
