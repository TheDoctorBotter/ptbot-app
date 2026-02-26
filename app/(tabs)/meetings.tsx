import React, { useState, useRef } from 'react';
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
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Video, ExternalLink, X, ArrowLeft, MapPin } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows, cardStyles } from '@/constants/theme';
import TexasLocationGateModal from '@/components/telehealth/TexasLocationGateModal';
import { useTexasLocationGate } from '@/hooks/useTexasLocationGate';

export default function MeetingsScreen() {
  const [meetingId, setMeetingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  // Texas GPS location gate (session-level)
  const texasGate = useTexasLocationGate() as ReturnType<typeof useTexasLocationGate> & {
    _onGrantedRef: React.MutableRefObject<(() => void) | null>;
  };

  // Clean meeting ID (remove spaces and dashes)
  const cleanMeetingId = (id: string) => {
    return id.replace(/[\s-]/g, '');
  };

  // Generate Zoom web client URL
  const getZoomUrl = () => {
    const cleanedId = cleanMeetingId(meetingId);
    let url = `https://zoom.us/wc/${cleanedId}/join`;

    const params = new URLSearchParams();
    if (passcode) {
      params.append('pwd', passcode);
    }
    if (displayName) {
      params.append('uname', displayName);
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    return url;
  };

  // Join meeting via WebView
  const handleJoinMeeting = () => {
    // Texas GPS location gate — auto-resume after verification
    if (texasGate.status !== 'granted') {
      texasGate._onGrantedRef.current = () => handleJoinMeeting();
      texasGate.requestCheck();
      return;
    }
    texasGate._onGrantedRef.current = null;

    const cleanedId = cleanMeetingId(meetingId);

    if (!cleanedId) {
      setError('Please enter a meeting ID');
      return;
    }

    if (cleanedId.length < 9) {
      setError('Meeting ID should be at least 9 digits');
      return;
    }

    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setError(null);
    setIsLoading(true);
    setIsInMeeting(true);
  };

  // Open in external Zoom app/browser
  const handleOpenExternal = () => {
    // Texas GPS location gate — auto-resume after verification
    if (texasGate.status !== 'granted') {
      texasGate._onGrantedRef.current = () => handleOpenExternal();
      texasGate.requestCheck();
      return;
    }
    texasGate._onGrantedRef.current = null;

    const cleanedId = cleanMeetingId(meetingId);
    if (!cleanedId) {
      setError('Please enter a meeting ID');
      return;
    }

    let url = `https://zoom.us/j/${cleanedId}`;
    if (passcode) {
      url += `?pwd=${passcode}`;
    }

    Linking.openURL(url);
  };

  // Leave meeting
  const handleLeaveMeeting = () => {
    setIsInMeeting(false);
    setIsLoading(false);
  };

  // Render meeting WebView
  if (isInMeeting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.meetingHeader}>
          <TouchableOpacity
            onPress={handleLeaveMeeting}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.meetingHeaderTitle}>Zoom Meeting</Text>
          <TouchableOpacity
            onPress={handleLeaveMeeting}
            style={styles.leaveButton}
          >
            <X size={20} color={colors.white} />
            <Text style={styles.leaveButtonText}>Leave</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Connecting to meeting...</Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: getZoomUrl() }}
          style={styles.webView}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setError(`Failed to load: ${nativeEvent.description}`);
            setIsLoading(false);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          mediaCapturePermissionGrantType="grant"
          startInLoadingState={true}
          allowsFullscreenVideo={true}
          userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        />
      </SafeAreaView>
    );
  }

  // Render join form
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
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Video size={32} color={colors.white} />
            </View>
            <Text style={styles.title}>Telehealth Consultation</Text>
            <Text style={styles.subtitle}>
              Join your physical therapy video session
            </Text>
          </View>

          {/* Texas Location Gate Banner */}
          {(texasGate.status === 'denied' || texasGate.status === 'permission_denied') && (
            <View style={styles.locationDeniedBanner}>
              <MapPin size={18} color={colors.warning[600]} />
              <Text style={styles.locationDeniedText}>
                Zoom consultations are available only in Texas at this time.
                You can continue using PTBot features without joining a call.
              </Text>
            </View>
          )}

          {/* Join Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Join a Meeting</Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={colors.neutral[400]}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Meeting ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter meeting ID (e.g., 123 456 7890)"
                placeholderTextColor={colors.neutral[400]}
                value={meetingId}
                onChangeText={(text) => {
                  setMeetingId(text);
                  setError(null);
                }}
                keyboardType="numeric"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Passcode (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter meeting passcode"
                placeholderTextColor={colors.neutral[400]}
                value={passcode}
                onChangeText={setPasscode}
                autoCapitalize="none"
                secureTextEntry={false}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleJoinMeeting}
            >
              <Video size={20} color={colors.white} />
              <Text style={styles.primaryButtonText}>Join Meeting</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleOpenExternal}
            >
              <ExternalLink size={20} color={colors.primary[500]} />
              <Text style={styles.secondaryButtonText}>Open in Zoom App</Text>
            </TouchableOpacity>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Tips for Your Session</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Find a quiet, well-lit space for your consultation
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Wear comfortable clothing that allows movement
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Have your exercise mat ready if needed
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Test your camera and microphone before joining
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Texas GPS Location Gate Modal */}
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
  primaryButton: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  secondaryButtonText: {
    color: colors.primary[500],
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
  // Meeting view styles
  meetingHeader: {
    backgroundColor: colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backButton: {
    padding: spacing[2],
  },
  meetingHeaderTitle: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    gap: spacing[1],
  },
  leaveButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: spacing[3],
    color: colors.neutral[600],
    fontSize: typography.fontSize.base,
  },
});
