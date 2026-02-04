import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ClipboardList,
  Activity,
  Heart,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  RefreshCw,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { activityService } from '@/services/activityService';

interface LatestAssessment {
  id: string;
  pain_level: number;
  pain_location: string;
  risk_level: string;
  protocol_key_selected: string | null;
  phase_number_selected: number | null;
  red_flags: string[];
  surgery_type: string | null;
  created_at: string;
}

// Configuration for re-check prompts
const REASSESSMENT_CONFIG = {
  regularIntervalDays: 7, // Re-check every 7 days
  postOpIntervalDays: 14, // Post-op patients: every 2 weeks
  phaseTransitionPromptDays: 21, // Suggest phase transition check after 3 weeks
};

interface PatientDashboardProps {
  userId: string | null;
  firstName: string | null;
}

export default function PatientDashboard({ userId, firstName }: PatientDashboardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState<LatestAssessment | null>(null);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);
  const [lastActivityDate, setLastActivityDate] = useState<Date | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!supabase || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch latest assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select('id, pain_level, pain_location, risk_level, protocol_key_selected, phase_number_selected, red_flags, surgery_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!assessmentError && assessment) {
        setLatestAssessment(assessment);
      }

      // Fetch activity metrics
      const sessions = await activityService.getSessionCount(7);
      setSessionsThisWeek(sessions);

      const lastActivity = await activityService.getLastActivityDate();
      setLastActivityDate(lastActivity);

    } catch (err) {
      console.error('Error loading patient dashboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculate days since last activity
  const getDaysSinceActivity = (): number | null => {
    if (!lastActivityDate) return null;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastActivityDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get reassurance message based on engagement
  const getReassuranceMessage = (): { message: string; type: 'success' | 'warning' | 'info' } => {
    const daysSinceActivity = getDaysSinceActivity();

    // Check for high pain
    if (latestAssessment && latestAssessment.pain_level >= 7) {
      return {
        message: "Take it easier today. Consider reassessing if pain persists.",
        type: 'warning'
      };
    }

    // Check for inactivity
    if (daysSinceActivity !== null && daysSinceActivity > 7) {
      return {
        message: "It's been a while! Let's restart with a light session.",
        type: 'info'
      };
    }

    // Check for good engagement
    if (sessionsThisWeek >= 2) {
      return {
        message: "You're on track! Keep up the great work.",
        type: 'success'
      };
    }

    // Default encouraging message
    return {
      message: "Every session counts. You've got this!",
      type: 'info'
    };
  };

  // Get the next action CTA
  const getNextAction = (): { label: string; route: string; params?: Record<string, string> } => {
    // No assessment - start one
    if (!latestAssessment) {
      return { label: 'Start Assessment', route: '/(tabs)/assessment' };
    }

    // Check for red flags - urgent action
    if (latestAssessment.red_flags && latestAssessment.red_flags.length > 0) {
      return { label: 'View Safety Information', route: '/(tabs)/assessment' };
    }

    // Post-op patient - continue phase
    if (latestAssessment.protocol_key_selected && latestAssessment.phase_number_selected) {
      return {
        label: `Continue Phase ${latestAssessment.phase_number_selected}`,
        route: '/(tabs)/exercises'
      };
    }

    // Check if reassessment might be due (>7 days since assessment)
    const assessmentDate = new Date(latestAssessment.created_at);
    const daysSinceAssessment = Math.floor(
      (new Date().getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceAssessment > 7) {
      return { label: 'Reassess Now', route: '/(tabs)/assessment' };
    }

    // Default - view exercises
    return { label: "View Today's Exercises", route: '/(tabs)/exercises' };
  };

  // Check if reassessment is due
  const getReassessmentStatus = (): {
    isDue: boolean;
    daysSinceAssessment: number;
    type: 'regular' | 'phase_transition' | 'high_pain' | null;
    message: string | null;
  } => {
    if (!latestAssessment) {
      return { isDue: false, daysSinceAssessment: 0, type: null, message: null };
    }

    const assessmentDate = new Date(latestAssessment.created_at);
    const daysSince = Math.floor(
      (new Date().getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // High pain - should reassess
    if (latestAssessment.pain_level >= 7) {
      return {
        isDue: true,
        daysSinceAssessment: daysSince,
        type: 'high_pain',
        message: "Your last assessment showed high pain levels. A new assessment can help us adjust your plan."
      };
    }

    // Phase transition check for post-op patients
    if (latestAssessment.protocol_key_selected &&
        latestAssessment.phase_number_selected &&
        daysSince >= REASSESSMENT_CONFIG.phaseTransitionPromptDays) {
      return {
        isDue: true,
        daysSinceAssessment: daysSince,
        type: 'phase_transition',
        message: `You've been in Phase ${latestAssessment.phase_number_selected} for ${daysSince} days. Ready to see if you can progress?`
      };
    }

    // Regular reassessment for post-op
    if (latestAssessment.protocol_key_selected &&
        daysSince >= REASSESSMENT_CONFIG.postOpIntervalDays) {
      return {
        isDue: true,
        daysSinceAssessment: daysSince,
        type: 'regular',
        message: "It's been a while since your last check-in. A quick assessment helps us track your recovery."
      };
    }

    // Regular reassessment for general pain
    if (!latestAssessment.protocol_key_selected &&
        daysSince >= REASSESSMENT_CONFIG.regularIntervalDays) {
      return {
        isDue: true,
        daysSinceAssessment: daysSince,
        type: 'regular',
        message: "Time for a quick check-in! Reassessing helps us keep your exercises on target."
      };
    }

    return { isDue: false, daysSinceAssessment: daysSince, type: null, message: null };
  };

  // Check for safety reminders
  const getSafetyReminder = (): string | null => {
    if (!latestAssessment) return null;

    // Check for red flags
    if (latestAssessment.red_flags && latestAssessment.red_flags.length > 0) {
      return "Important: Your assessment indicated potential red flags. Please contact your healthcare provider before continuing exercises.";
    }

    // Check for posterior THA precautions
    if (latestAssessment.protocol_key_selected?.includes('hip_posterior')) {
      return "Reminder: Follow your posterior hip precautions - avoid bending past 90°, crossing legs, or rotating your hip inward.";
    }

    return null;
  };

  // Format plan title
  const getPlanTitle = (): string => {
    if (!latestAssessment) return 'No plan yet';

    if (latestAssessment.protocol_key_selected) {
      // Format protocol key to readable title
      const formatted = latestAssessment.protocol_key_selected
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      return formatted;
    }

    // Non-protocol plan based on pain location
    return `${latestAssessment.pain_location} Plan`;
  };

  const reassurance = getReassuranceMessage();
  const nextAction = getNextAction();
  const safetyReminder = getSafetyReminder();
  const reassessmentStatus = getReassessmentStatus();
  const hasRedFlags = latestAssessment?.red_flags && latestAssessment.red_flags.length > 0;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary[500]]}
          tintColor={colors.primary[500]}
        />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>
          Welcome back{firstName ? `, ${firstName}` : ''}
        </Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      {/* Section 1: Current Plan Snapshot */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <ClipboardList size={20} color={colors.primary[500]} />
          <Text style={styles.cardTitle}>Current Plan</Text>
        </View>

        {latestAssessment ? (
          <View style={styles.planContent}>
            <Text style={styles.planTitle}>{getPlanTitle()}</Text>

            {latestAssessment.phase_number_selected && (
              <View style={styles.phaseContainer}>
                <Text style={styles.phaseLabel}>Current Phase</Text>
                <View style={styles.phaseBadge}>
                  <Text style={styles.phaseNumber}>
                    Phase {latestAssessment.phase_number_selected}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.planDetails}>
              <View style={styles.planDetail}>
                <Text style={styles.planDetailLabel}>Focus Area</Text>
                <Text style={styles.planDetailValue}>
                  {latestAssessment.pain_location}
                </Text>
              </View>
              <View style={styles.planDetail}>
                <Text style={styles.planDetailLabel}>Pain Level</Text>
                <Text style={[
                  styles.planDetailValue,
                  latestAssessment.pain_level >= 7 && styles.highPain
                ]}>
                  {latestAssessment.pain_level}/10
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyPlan}>
            <Text style={styles.emptyPlanText}>
              Complete an assessment to get your personalized plan
            </Text>
            <TouchableOpacity
              style={styles.emptyPlanButton}
              onPress={() => router.push('/(tabs)/assessment')}
            >
              <Text style={styles.emptyPlanButtonText}>Start Assessment</Text>
              <ArrowRight size={16} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Section 2: Engagement Feedback */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Activity size={20} color={colors.primary[500]} />
          <Text style={styles.cardTitle}>Your Activity</Text>
        </View>

        <View style={styles.activityGrid}>
          <View style={styles.activityItem}>
            <Calendar size={24} color={colors.neutral[500]} />
            <Text style={styles.activityValue}>
              {lastActivityDate
                ? getDaysSinceActivity() === 0
                  ? 'Today'
                  : getDaysSinceActivity() === 1
                    ? 'Yesterday'
                    : `${getDaysSinceActivity()} days ago`
                : 'No activity yet'}
            </Text>
            <Text style={styles.activityLabel}>Last Activity</Text>
          </View>

          <View style={styles.activityDivider} />

          <View style={styles.activityItem}>
            <Clock size={24} color={colors.neutral[500]} />
            <Text style={styles.activityValue}>{sessionsThisWeek}</Text>
            <Text style={styles.activityLabel}>Sessions This Week</Text>
          </View>
        </View>
      </View>

      {/* Section 3: Reassurance Messaging */}
      <View style={[
        styles.reassuranceCard,
        reassurance.type === 'success' && styles.reassuranceSuccess,
        reassurance.type === 'warning' && styles.reassuranceWarning,
        reassurance.type === 'info' && styles.reassuranceInfo,
      ]}>
        {reassurance.type === 'success' && (
          <CheckCircle size={24} color={colors.success[600]} />
        )}
        {reassurance.type === 'warning' && (
          <AlertTriangle size={24} color={colors.warning[600]} />
        )}
        {reassurance.type === 'info' && (
          <Heart size={24} color={colors.info[600]} />
        )}
        <Text style={[
          styles.reassuranceText,
          reassurance.type === 'success' && styles.reassuranceTextSuccess,
          reassurance.type === 'warning' && styles.reassuranceTextWarning,
          reassurance.type === 'info' && styles.reassuranceTextInfo,
        ]}>
          {reassurance.message}
        </Text>
      </View>

      {/* Section 4: Re-check Prompt (when due) */}
      {reassessmentStatus.isDue && (
        <View style={[
          styles.recheckCard,
          reassessmentStatus.type === 'high_pain' && styles.recheckCardUrgent,
          reassessmentStatus.type === 'phase_transition' && styles.recheckCardProgress,
        ]}>
          <View style={styles.recheckHeader}>
            <View style={[
              styles.recheckIcon,
              reassessmentStatus.type === 'high_pain' && styles.recheckIconUrgent,
              reassessmentStatus.type === 'phase_transition' && styles.recheckIconProgress,
            ]}>
              <RefreshCw
                size={24}
                color={
                  reassessmentStatus.type === 'high_pain'
                    ? colors.error[600]
                    : reassessmentStatus.type === 'phase_transition'
                      ? colors.success[600]
                      : colors.primary[600]
                }
              />
            </View>
            <View style={styles.recheckTextContainer}>
              <Text style={[
                styles.recheckTitle,
                reassessmentStatus.type === 'high_pain' && styles.recheckTitleUrgent,
                reassessmentStatus.type === 'phase_transition' && styles.recheckTitleProgress,
              ]}>
                {reassessmentStatus.type === 'phase_transition'
                  ? 'Ready to Progress?'
                  : reassessmentStatus.type === 'high_pain'
                    ? 'Pain Check-in Recommended'
                    : 'Time for a Re-check'}
              </Text>
              <Text style={[
                styles.recheckDays,
                reassessmentStatus.type === 'high_pain' && styles.recheckDaysUrgent,
              ]}>
                Last assessment: {reassessmentStatus.daysSinceAssessment} days ago
              </Text>
            </View>
          </View>

          {reassessmentStatus.message && (
            <Text style={[
              styles.recheckMessage,
              reassessmentStatus.type === 'high_pain' && styles.recheckMessageUrgent,
              reassessmentStatus.type === 'phase_transition' && styles.recheckMessageProgress,
            ]}>
              {reassessmentStatus.message}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.recheckButton,
              reassessmentStatus.type === 'high_pain' && styles.recheckButtonUrgent,
              reassessmentStatus.type === 'phase_transition' && styles.recheckButtonProgress,
            ]}
            onPress={() => router.push('/(tabs)/assessment')}
          >
            <Text style={styles.recheckButtonText}>
              {reassessmentStatus.type === 'phase_transition'
                ? 'Check Progress'
                : 'Start Re-assessment'}
            </Text>
            <ArrowRight size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Section 5: Next Step CTA */}
      {!hasRedFlags && !reassessmentStatus.isDue && (
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push(nextAction.route as any)}
        >
          <Text style={styles.ctaButtonText}>{nextAction.label}</Text>
          <ArrowRight size={20} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* Section 6: Safety Reminder (conditional) */}
      {safetyReminder && (
        <View style={[
          styles.safetyCard,
          hasRedFlags && styles.safetyCardUrgent
        ]}>
          <AlertTriangle
            size={24}
            color={hasRedFlags ? colors.error[600] : colors.warning[600]}
          />
          <View style={styles.safetyContent}>
            <Text style={[
              styles.safetyTitle,
              hasRedFlags && styles.safetyTitleUrgent
            ]}>
              {hasRedFlags ? 'Important Safety Notice' : 'Reminder'}
            </Text>
            <Text style={[
              styles.safetyText,
              hasRedFlags && styles.safetyTextUrgent
            ]}>
              {safetyReminder}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
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
    backgroundColor: colors.neutral[50],
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.neutral[600],
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  dateText: {
    fontSize: 14,
    color: colors.neutral[500],
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
    marginLeft: 8,
  },
  planContent: {},
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  phaseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  phaseLabel: {
    fontSize: 14,
    color: colors.neutral[600],
    marginRight: 8,
  },
  phaseBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  phaseNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
  },
  planDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planDetail: {},
  planDetailLabel: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 4,
  },
  planDetailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutral[800],
  },
  highPain: {
    color: colors.error[600],
  },
  emptyPlan: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyPlanText: {
    fontSize: 14,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyPlanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[500],
    marginRight: 4,
  },
  activityGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityItem: {
    flex: 1,
    alignItems: 'center',
  },
  activityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginTop: 8,
  },
  activityLabel: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 4,
  },
  activityDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.neutral[200],
    marginHorizontal: 16,
  },
  reassuranceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  reassuranceSuccess: {
    backgroundColor: colors.success[50],
  },
  reassuranceWarning: {
    backgroundColor: colors.warning[50],
  },
  reassuranceInfo: {
    backgroundColor: colors.info[50],
  },
  reassuranceText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 12,
    lineHeight: 22,
  },
  reassuranceTextSuccess: {
    color: colors.success[700],
  },
  reassuranceTextWarning: {
    color: colors.warning[700],
  },
  reassuranceTextInfo: {
    color: colors.info[700],
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginRight: 8,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  safetyCardUrgent: {
    backgroundColor: colors.error[50],
    borderColor: colors.error[200],
  },
  safetyContent: {
    flex: 1,
    marginLeft: 12,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning[700],
    marginBottom: 4,
  },
  safetyTitleUrgent: {
    color: colors.error[700],
  },
  safetyText: {
    fontSize: 14,
    color: colors.warning[600],
    lineHeight: 20,
  },
  safetyTextUrgent: {
    color: colors.error[600],
  },
  bottomSpacer: {
    height: 32,
  },
  // Re-check card styles
  recheckCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[200],
  },
  recheckCardUrgent: {
    backgroundColor: colors.error[50],
    borderColor: colors.error[200],
  },
  recheckCardProgress: {
    backgroundColor: colors.success[50],
    borderColor: colors.success[200],
  },
  recheckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recheckIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recheckIconUrgent: {
    backgroundColor: colors.error[100],
  },
  recheckIconProgress: {
    backgroundColor: colors.success[100],
  },
  recheckTextContainer: {
    flex: 1,
  },
  recheckTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary[700],
    marginBottom: 2,
  },
  recheckTitleUrgent: {
    color: colors.error[700],
  },
  recheckTitleProgress: {
    color: colors.success[700],
  },
  recheckDays: {
    fontSize: 12,
    color: colors.primary[600],
  },
  recheckDaysUrgent: {
    color: colors.error[600],
  },
  recheckMessage: {
    fontSize: 14,
    color: colors.primary[700],
    lineHeight: 20,
    marginBottom: 16,
  },
  recheckMessageUrgent: {
    color: colors.error[700],
  },
  recheckMessageProgress: {
    color: colors.success[700],
  },
  recheckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  recheckButtonUrgent: {
    backgroundColor: colors.error[500],
  },
  recheckButtonProgress: {
    backgroundColor: colors.success[500],
  },
  recheckButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});
