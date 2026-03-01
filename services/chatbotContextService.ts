/**
 * Chatbot Context Service
 *
 * Gathers all user data to provide context-aware chatbot responses.
 * Includes assessments, exercises, protocols, activity, and pain tracking.
 */

import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { appointmentService, Appointment } from './appointmentService';

// Types for user context
export interface UserAssessment {
  id: string;
  painLevel: number;
  painLocation: string;
  painType: string | null;
  painDuration: string | null;
  riskLevel: string;
  redFlags: string[];
  additionalSymptoms: string[];
  protocolKey: string | null;
  phaseNumber: number | null;
  surgeryType: string | null;
  weeksSinceSurgery: string | null;
  weightBearingStatus: string | null;
  createdAt: string;
  recommendations: ExerciseRecommendation[] | null;
}

export interface ExerciseRecommendation {
  exercise: {
    id: string;
    name: string;
    description?: string;
    videoUrl?: string;
    bodyParts?: string[];
    difficulty?: string;
  };
  dosage?: {
    sets?: number;
    reps?: number;
    holdTime?: string;
    frequency?: string;
  };
  reasoning?: string;
  safetyNotes?: string[];
}

export interface PainLogEntry {
  id: string;
  painLevel: number;
  painLocation: string;
  notes: string | null;
  createdAt: string;
}

export interface ProtocolPhaseInfo {
  protocolKey: string;
  protocolName: string;
  phaseNumber: number;
  phaseName: string;
  phaseDescription: string | null;
  weekStart: number;
  weekEnd: number | null;
  weeksSinceSurgery: string | null;
}

export interface ActivitySummary {
  totalSessions: number;
  sessionsThisWeek: number;
  lastActivityDate: Date | null;
  videosWatched: number;
  assessmentsCompleted: number;
  daysSinceLastActivity: number | null;
}

export interface ChatbotContext {
  user: User | null;
  isAuthenticated: boolean;
  latestAssessment: UserAssessment | null;
  assessmentHistory: UserAssessment[];
  painTrend: 'improving' | 'stable' | 'worsening' | 'unknown';
  currentExercises: ExerciseRecommendation[];
  protocolInfo: ProtocolPhaseInfo | null;
  activitySummary: ActivitySummary;
  painLogs: PainLogEntry[];
  needsReassessment: boolean;
  reassessmentReason: string | null;
  daysSinceLastAssessment: number | null;
  // Scheduling
  upcomingAppointments: Appointment[];
  hasUpcomingAppointment: boolean;
}

// Quick command types
export interface QuickCommand {
  command: string;
  aliases: string[];
  description: string;
  action: 'show_exercises' | 'log_pain' | 'show_progress' | 'today_routine' | 'next_exercise' | 'help' | 'how_am_i_doing' | 'check_in' | 'schedule_call' | 'my_appointments';
}

export const QUICK_COMMANDS: QuickCommand[] = [
  {
    command: 'show my exercises',
    aliases: ['my exercises', 'exercises', 'show exercises', 'what are my exercises', 'what exercises'],
    description: 'Display your current exercise recommendations',
    action: 'show_exercises',
  },
  {
    command: 'log pain',
    aliases: ['pain log', 'record pain', 'log my pain', 'how much pain', 'pain level'],
    description: 'Log your current pain level',
    action: 'log_pain',
  },
  {
    command: 'show my progress',
    aliases: ['my progress', 'progress', 'how am i doing', 'am i getting better'],
    description: 'View your recovery progress over time',
    action: 'show_progress',
  },
  {
    command: 'what should i do today',
    aliases: ['today', 'today\'s exercises', 'daily routine', 'what to do', 'routine'],
    description: 'Get your recommended routine for today',
    action: 'today_routine',
  },
  {
    command: 'next exercise',
    aliases: ['what\'s next', 'next', 'continue'],
    description: 'Get the next exercise in your routine',
    action: 'next_exercise',
  },
  {
    command: 'check in',
    aliases: ['check-in', 'checkin', 'daily check in', 'how are you'],
    description: 'Quick daily check-in for pain and progress',
    action: 'check_in',
  },
  {
    command: 'help',
    aliases: ['commands', 'what can you do', 'options', '?'],
    description: 'Show available commands',
    action: 'help',
  },
  {
    command: 'schedule a call',
    aliases: ['book appointment', 'schedule call', 'book a call', 'schedule appointment', 'talk to dr', 'talk to doctor', 'video call', 'zoom call'],
    description: 'Schedule a PTBot Zoom consultation',
    action: 'schedule_call',
  },
  {
    command: 'my appointments',
    aliases: ['appointments', 'upcoming appointments', 'scheduled calls', 'my calls', 'when is my appointment'],
    description: 'View your scheduled appointments',
    action: 'my_appointments',
  },
];

// Red flag keywords for triage
const RED_FLAG_KEYWORDS = [
  'can\'t walk', 'cannot walk', 'unable to walk',
  'can\'t feel', 'cannot feel', 'numbness spreading',
  'losing control', 'bladder', 'bowel',
  'fever', 'night sweats',
  'worst pain ever', 'unbearable',
  'chest pain', 'difficulty breathing',
  'fell', 'accident', 'trauma',
  'sudden weakness', 'both legs weak',
];

class ChatbotContextService {
  /**
   * Get full user context for the chatbot
   */
  async getUserContext(): Promise<ChatbotContext> {
    const emptyContext: ChatbotContext = {
      user: null,
      isAuthenticated: false,
      latestAssessment: null,
      assessmentHistory: [],
      painTrend: 'unknown',
      currentExercises: [],
      protocolInfo: null,
      activitySummary: {
        totalSessions: 0,
        sessionsThisWeek: 0,
        lastActivityDate: null,
        videosWatched: 0,
        assessmentsCompleted: 0,
        daysSinceLastActivity: null,
      },
      painLogs: [],
      needsReassessment: false,
      reassessmentReason: null,
      daysSinceLastAssessment: null,
      upcomingAppointments: [],
      hasUpcomingAppointment: false,
    };

    if (!supabase) {
      return emptyContext;
    }

    try {
      // Use getSession() instead of getUser() — getUser() makes a network
      // request that can hang indefinitely after sign-out or on slow networks.
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) {
        return emptyContext;
      }

      // Fetch all data in parallel
      const [
        assessmentsResult,
        activityResult,
        painLogsResult,
        appointmentsResult,
      ] = await Promise.all([
        this.fetchAssessments(user.id),
        this.fetchActivitySummary(user.id),
        this.fetchPainLogs(user.id),
        this.fetchUpcomingAppointments(),
      ]);

      const assessmentHistory = assessmentsResult;
      const latestAssessment = assessmentHistory.length > 0 ? assessmentHistory[0] : null;
      const currentExercises = latestAssessment?.recommendations || [];

      // Calculate pain trend
      const painTrend = this.calculatePainTrend(assessmentHistory);

      // Get protocol info if applicable
      let protocolInfo: ProtocolPhaseInfo | null = null;
      if (latestAssessment?.protocolKey && latestAssessment?.phaseNumber) {
        protocolInfo = await this.fetchProtocolInfo(
          latestAssessment.protocolKey,
          latestAssessment.phaseNumber,
          latestAssessment.weeksSinceSurgery
        );
      }

      // Calculate reassessment need
      const daysSinceLastAssessment = latestAssessment
        ? Math.floor((Date.now() - new Date(latestAssessment.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const { needsReassessment, reason } = this.checkReassessmentNeed(
        latestAssessment,
        daysSinceLastAssessment,
        painLogsResult
      );

      return {
        user,
        isAuthenticated: true,
        latestAssessment,
        assessmentHistory,
        painTrend,
        currentExercises,
        protocolInfo,
        activitySummary: activityResult,
        painLogs: painLogsResult,
        needsReassessment,
        reassessmentReason: reason,
        daysSinceLastAssessment,
        upcomingAppointments: appointmentsResult,
        hasUpcomingAppointment: appointmentsResult.length > 0,
      };
    } catch (error) {
      console.error('[ChatbotContextService] Error fetching context:', error);
      return emptyContext;
    }
  }

  /**
   * Fetch upcoming appointments
   */
  private async fetchUpcomingAppointments(): Promise<Appointment[]> {
    try {
      const response = await appointmentService.getMyAppointments({
        upcoming: true,
        limit: 5,
      });
      return response.appointments.filter(
        a => a.status === 'pending' || a.status === 'confirmed'
      );
    } catch (error) {
      console.log('[ChatbotContextService] Appointments not available:', error);
      return [];
    }
  }

  /**
   * Fetch user assessments
   */
  private async fetchAssessments(userId: string): Promise<UserAssessment[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          id,
          pain_level,
          pain_location,
          pain_type,
          pain_duration,
          risk_level,
          red_flags,
          additional_symptoms,
          protocol_key_selected,
          phase_number_selected,
          surgery_type,
          weeks_since_surgery,
          weight_bearing_status,
          created_at,
          recommendations
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('[ChatbotContextService] Error fetching assessments:', error);
        return [];
      }

      return (data || []).map(a => ({
        id: a.id,
        painLevel: a.pain_level,
        painLocation: a.pain_location,
        painType: a.pain_type,
        painDuration: a.pain_duration,
        riskLevel: a.risk_level,
        redFlags: a.red_flags || [],
        additionalSymptoms: a.additional_symptoms || [],
        protocolKey: a.protocol_key_selected,
        phaseNumber: a.phase_number_selected,
        surgeryType: a.surgery_type,
        weeksSinceSurgery: a.weeks_since_surgery,
        weightBearingStatus: a.weight_bearing_status,
        createdAt: a.created_at,
        recommendations: a.recommendations,
      }));
    } catch (error) {
      console.error('[ChatbotContextService] Error:', error);
      return [];
    }
  }

  /**
   * Fetch activity summary
   */
  private async fetchActivitySummary(userId: string): Promise<ActivitySummary> {
    const emptySummary: ActivitySummary = {
      totalSessions: 0,
      sessionsThisWeek: 0,
      lastActivityDate: null,
      videosWatched: 0,
      assessmentsCompleted: 0,
      daysSinceLastActivity: null,
    };

    if (!supabase) return emptySummary;

    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Fetch activity counts
      const { data: activities, error } = await supabase
        .from('activity_events')
        .select('event_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ChatbotContextService] Error fetching activities:', error);
        return emptySummary;
      }

      if (!activities || activities.length === 0) {
        return emptySummary;
      }

      const lastActivityDate = new Date(activities[0].created_at);
      const daysSinceLastActivity = Math.floor(
        (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const thisWeekActivities = activities.filter(
        a => new Date(a.created_at) >= weekAgo
      );

      return {
        totalSessions: activities.length,
        sessionsThisWeek: thisWeekActivities.length,
        lastActivityDate,
        videosWatched: activities.filter(a => a.event_type === 'video_opened' || a.event_type === 'video_completed').length,
        assessmentsCompleted: activities.filter(a => a.event_type === 'assessment_completed').length,
        daysSinceLastActivity,
      };
    } catch (error) {
      console.error('[ChatbotContextService] Error:', error);
      return emptySummary;
    }
  }

  /**
   * Fetch pain logs from chat_pain_logs table
   */
  private async fetchPainLogs(userId: string): Promise<PainLogEntry[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('chat_pain_logs')
        .select('id, pain_level, pain_location, notes, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        // Table might not exist yet, that's okay
        console.log('[ChatbotContextService] Pain logs not available:', error.message);
        return [];
      }

      return (data || []).map(p => ({
        id: p.id,
        painLevel: p.pain_level,
        painLocation: p.pain_location,
        notes: p.notes,
        createdAt: p.created_at,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch protocol information
   */
  private async fetchProtocolInfo(
    protocolKey: string,
    phaseNumber: number,
    weeksSinceSurgery: string | null
  ): Promise<ProtocolPhaseInfo | null> {
    if (!supabase) return null;

    try {
      // Get protocol
      const { data: protocol, error: protocolError } = await supabase
        .from('protocols')
        .select('id, name, surgery_name')
        .eq('protocol_key', protocolKey)
        .single();

      if (protocolError || !protocol) {
        return null;
      }

      // Get phase info
      const { data: phase, error: phaseError } = await supabase
        .from('protocol_phases')
        .select('phase_number, name, description, week_start, week_end')
        .eq('protocol_id', protocol.id)
        .eq('phase_number', phaseNumber)
        .single();

      return {
        protocolKey,
        protocolName: protocol.name || protocol.surgery_name,
        phaseNumber,
        phaseName: phase?.name || `Phase ${phaseNumber}`,
        phaseDescription: phase?.description || null,
        weekStart: phase?.week_start || 0,
        weekEnd: phase?.week_end || null,
        weeksSinceSurgery,
      };
    } catch (error) {
      console.error('[ChatbotContextService] Error fetching protocol:', error);
      return null;
    }
  }

  /**
   * Calculate pain trend from assessment history
   */
  private calculatePainTrend(assessments: UserAssessment[]): 'improving' | 'stable' | 'worsening' | 'unknown' {
    if (assessments.length < 2) {
      return 'unknown';
    }

    // Compare last 3 assessments (or less if not available)
    const recentAssessments = assessments.slice(0, Math.min(3, assessments.length));
    const painLevels = recentAssessments.map(a => a.painLevel);

    // Calculate average change
    let totalChange = 0;
    for (let i = 0; i < painLevels.length - 1; i++) {
      totalChange += painLevels[i] - painLevels[i + 1]; // Negative if pain decreased over time
    }

    const avgChange = totalChange / (painLevels.length - 1);

    if (avgChange <= -1) {
      return 'improving'; // Pain has decreased
    } else if (avgChange >= 1) {
      return 'worsening'; // Pain has increased
    } else {
      return 'stable';
    }
  }

  /**
   * Check if user needs reassessment
   */
  private checkReassessmentNeed(
    latestAssessment: UserAssessment | null,
    daysSinceAssessment: number | null,
    painLogs: PainLogEntry[]
  ): { needsReassessment: boolean; reason: string | null } {
    if (!latestAssessment) {
      return { needsReassessment: true, reason: 'No assessment on file' };
    }

    // High pain warrants reassessment
    if (latestAssessment.painLevel >= 7) {
      return {
        needsReassessment: true,
        reason: 'Your last assessment showed high pain levels'
      };
    }

    // Post-op: check every 2 weeks
    if (latestAssessment.protocolKey && daysSinceAssessment && daysSinceAssessment >= 14) {
      return {
        needsReassessment: true,
        reason: `It's been ${daysSinceAssessment} days since your last assessment. Post-op patients benefit from regular check-ins.`
      };
    }

    // Non-post-op: check every 7 days
    if (!latestAssessment.protocolKey && daysSinceAssessment && daysSinceAssessment >= 7) {
      return {
        needsReassessment: true,
        reason: `It's been ${daysSinceAssessment} days. A quick reassessment helps track your progress.`
      };
    }

    // Pain logs show worsening
    if (painLogs.length >= 3) {
      const recentPain = painLogs.slice(0, 3).map(p => p.painLevel);
      const avgRecentPain = recentPain.reduce((a, b) => a + b, 0) / recentPain.length;
      if (avgRecentPain >= latestAssessment.painLevel + 2) {
        return {
          needsReassessment: true,
          reason: 'Your recent pain logs show increased pain levels'
        };
      }
    }

    return { needsReassessment: false, reason: null };
  }

  /**
   * Detect quick command from user message
   */
  detectQuickCommand(message: string): QuickCommand | null {
    const normalizedMessage = message.toLowerCase().trim();

    for (const command of QUICK_COMMANDS) {
      if (normalizedMessage === command.command.toLowerCase()) {
        return command;
      }

      for (const alias of command.aliases) {
        if (normalizedMessage === alias.toLowerCase() ||
            normalizedMessage.includes(alias.toLowerCase())) {
          return command;
        }
      }
    }

    return null;
  }

  /**
   * Check for red flag symptoms in user message
   */
  detectRedFlags(message: string): string[] {
    const normalizedMessage = message.toLowerCase();
    const detectedFlags: string[] = [];

    for (const flag of RED_FLAG_KEYWORDS) {
      if (normalizedMessage.includes(flag)) {
        detectedFlags.push(flag);
      }
    }

    return detectedFlags;
  }

  /**
   * Log pain level via chat
   */
  async logPain(userId: string, painLevel: number, painLocation: string, notes?: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('chat_pain_logs')
        .insert({
          user_id: userId,
          pain_level: painLevel,
          pain_location: painLocation,
          notes: notes || null,
        });

      if (error) {
        console.error('[ChatbotContextService] Error logging pain:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[ChatbotContextService] Error:', error);
      return false;
    }
  }

  /**
   * Build context string for AI prompt
   */
  buildContextString(context: ChatbotContext): string {
    const parts: string[] = [];

    if (!context.isAuthenticated) {
      parts.push('USER STATUS: Not signed in. Encourage them to sign in for personalized recommendations.');
      return parts.join('\n\n');
    }

    // Latest assessment context
    if (context.latestAssessment) {
      const a = context.latestAssessment;
      const daysAgo = context.daysSinceLastAssessment;

      parts.push(`LATEST ASSESSMENT (${daysAgo} days ago):
- Pain Location: ${a.painLocation}
- Pain Level: ${a.painLevel}/10
- Pain Type: ${a.painType || 'Not specified'}
- Risk Level: ${a.riskLevel}
- Red Flags: ${a.redFlags.length > 0 ? a.redFlags.join(', ') : 'None'}
- Symptoms: ${a.additionalSymptoms.length > 0 ? a.additionalSymptoms.join(', ') : 'None noted'}`);

      // Post-op context
      if (a.protocolKey && a.phaseNumber) {
        parts.push(`POST-OP STATUS:
- Surgery: ${a.surgeryType || a.protocolKey.replace(/_/g, ' ')}
- Current Phase: ${a.phaseNumber}
- Weeks Since Surgery: ${a.weeksSinceSurgery || 'Not specified'}
- Weight Bearing: ${a.weightBearingStatus || 'Not specified'}`);
      }
    }

    // Pain trend
    if (context.painTrend !== 'unknown') {
      parts.push(`PAIN TREND: ${context.painTrend.toUpperCase()} - ${
        context.painTrend === 'improving' ? 'Pain levels have been decreasing. Encourage continued adherence!' :
        context.painTrend === 'stable' ? 'Pain levels are stable. Steady progress is good.' :
        'Pain levels have increased. May need to adjust exercises or reassess.'
      }`);
    }

    // Current exercises
    if (context.currentExercises.length > 0) {
      const exerciseList = context.currentExercises.slice(0, 5).map((e, i) => {
        const dosage = e.dosage ? `${e.dosage.sets || 2} sets × ${e.dosage.reps || 10} reps` : '';
        return `${i + 1}. ${e.exercise.name}${dosage ? ` (${dosage})` : ''}`;
      }).join('\n');

      parts.push(`CURRENT EXERCISES (${context.currentExercises.length} total):
${exerciseList}${context.currentExercises.length > 5 ? `\n... and ${context.currentExercises.length - 5} more` : ''}`);
    }

    // Protocol info for post-op
    if (context.protocolInfo) {
      const p = context.protocolInfo;
      parts.push(`PROTOCOL INFO:
- Protocol: ${p.protocolName}
- Phase: ${p.phaseName}
- Phase Description: ${p.phaseDescription || 'Standard rehabilitation phase'}
- Week Range: ${p.weekStart}${p.weekEnd ? `-${p.weekEnd}` : '+'}`);
    }

    // Activity summary
    const a = context.activitySummary;
    parts.push(`ENGAGEMENT:
- Sessions This Week: ${a.sessionsThisWeek}
- Videos Watched: ${a.videosWatched}
- Days Since Last Activity: ${a.daysSinceLastActivity !== null ? a.daysSinceLastActivity : 'N/A'}`);

    // Recent pain logs
    if (context.painLogs.length > 0) {
      const recentLogs = context.painLogs.slice(0, 3).map(p => {
        const date = new Date(p.createdAt).toLocaleDateString();
        return `${date}: ${p.painLevel}/10 (${p.painLocation})${p.notes ? ` - "${p.notes}"` : ''}`;
      }).join('\n');

      parts.push(`RECENT PAIN LOGS:
${recentLogs}`);
    }

    // Reassessment status
    if (context.needsReassessment && context.reassessmentReason) {
      parts.push(`REASSESSMENT NEEDED: ${context.reassessmentReason}`);
    }

    // Upcoming appointments
    if (context.upcomingAppointments.length > 0) {
      const apptList = context.upcomingAppointments.map(appt => {
        const time = appointmentService.formatAppointmentTime(appt.start_time, appt.end_time);
        const status = appointmentService.getStatusInfo(appt.status).label;
        return `- ${time} (${status})`;
      }).join('\n');

      parts.push(`UPCOMING APPOINTMENTS:
${apptList}`);
    } else {
      parts.push('APPOINTMENTS: No upcoming appointments scheduled. User can schedule a PTBot Zoom call through the Schedule tab or by saying "schedule a call".');
    }

    return parts.join('\n\n');
  }

  /**
   * Get exercise by name or ID
   */
  async getExerciseDetails(exerciseQuery: string): Promise<ExerciseRecommendation | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('exercise_videos')
        .select('id, title, description, youtube_video_id, body_parts, difficulty, recommended_sets, recommended_reps, recommended_hold_seconds, recommended_frequency, safety_notes')
        .or(`title.ilike.%${exerciseQuery}%,id.eq.${exerciseQuery}`)
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        exercise: {
          id: data.id,
          name: data.title,
          description: data.description,
          videoUrl: data.youtube_video_id
            ? `https://www.youtube.com/watch?v=${data.youtube_video_id}`
            : undefined,
          bodyParts: data.body_parts,
          difficulty: data.difficulty,
        },
        dosage: {
          sets: data.recommended_sets,
          reps: data.recommended_reps,
          holdTime: data.recommended_hold_seconds ? `${data.recommended_hold_seconds} seconds` : undefined,
          frequency: data.recommended_frequency,
        },
        safetyNotes: data.safety_notes,
      };
    } catch (error) {
      console.error('[ChatbotContextService] Error fetching exercise:', error);
      return null;
    }
  }
}

export const chatbotContextService = new ChatbotContextService();
export default chatbotContextService;
