/**
 * Activity Event Service
 *
 * Tracks user engagement events for dashboard metrics and analytics.
 * Events are stored in the activity_events table.
 */

import { supabase } from '@/lib/supabase';

export type ActivityEventType =
  | 'assessment_completed'
  | 'assessment_started'
  | 'routine_opened'
  | 'video_opened'
  | 'video_completed'
  | 'phase_changed'
  | 'exercise_favorited'
  | 'session_started';

export interface ActivityEvent {
  id: string;
  user_id: string;
  event_type: ActivityEventType;
  event_ref_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ActivityMetadata {
  // Assessment events
  assessment_id?: string;
  pain_location?: string;
  pain_level?: number;
  protocol_key?: string;
  phase_number?: number;
  risk_level?: string;

  // Video events
  video_id?: string;
  video_title?: string;
  duration_watched?: number;

  // Routine events
  routine_id?: string;
  routine_name?: string;

  // Phase events
  old_phase?: number;
  new_phase?: number;

  // Generic
  source?: string;
  [key: string]: unknown;
}

class ActivityService {
  /**
   * Log an activity event
   */
  async logEvent(
    eventType: ActivityEventType,
    metadata: ActivityMetadata = {},
    eventRefId?: string
  ): Promise<boolean> {
    if (!supabase) {
      console.warn('[ActivityService] Supabase not configured, skipping event log');
      return false;
    }

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log('[ActivityService] No authenticated user, skipping event log');
        return false;
      }

      const { error } = await supabase
        .from('activity_events')
        .insert({
          user_id: user.id,
          event_type: eventType,
          event_ref_id: eventRefId || null,
          metadata: metadata,
        });

      if (error) {
        console.error('[ActivityService] Error logging event:', error);
        return false;
      }

      console.log(`[ActivityService] Logged event: ${eventType}`);
      return true;
    } catch (err) {
      console.error('[ActivityService] Unexpected error:', err);
      return false;
    }
  }

  /**
   * Log assessment started
   */
  async logAssessmentStarted(painLocation?: string): Promise<boolean> {
    return this.logEvent('assessment_started', {
      pain_location: painLocation,
      source: 'assessment_flow',
    });
  }

  /**
   * Log assessment completed
   */
  async logAssessmentCompleted(
    assessmentId: string,
    painLocation: string,
    painLevel: number,
    riskLevel: string,
    protocolKey?: string,
    phaseNumber?: number
  ): Promise<boolean> {
    return this.logEvent('assessment_completed', {
      assessment_id: assessmentId,
      pain_location: painLocation,
      pain_level: painLevel,
      risk_level: riskLevel,
      protocol_key: protocolKey,
      phase_number: phaseNumber,
    }, assessmentId);
  }

  /**
   * Log routine opened
   */
  async logRoutineOpened(routineId: string, routineName: string): Promise<boolean> {
    return this.logEvent('routine_opened', {
      routine_id: routineId,
      routine_name: routineName,
    }, routineId);
  }

  /**
   * Log video opened
   */
  async logVideoOpened(videoId: string, videoTitle: string): Promise<boolean> {
    return this.logEvent('video_opened', {
      video_id: videoId,
      video_title: videoTitle,
    }, videoId);
  }

  /**
   * Log video completed
   */
  async logVideoCompleted(videoId: string, videoTitle: string, durationWatched?: number): Promise<boolean> {
    return this.logEvent('video_completed', {
      video_id: videoId,
      video_title: videoTitle,
      duration_watched: durationWatched,
    }, videoId);
  }

  /**
   * Log phase changed
   */
  async logPhaseChanged(protocolKey: string, oldPhase: number, newPhase: number): Promise<boolean> {
    return this.logEvent('phase_changed', {
      protocol_key: protocolKey,
      old_phase: oldPhase,
      new_phase: newPhase,
    });
  }

  /**
   * Log exercise favorited
   */
  async logExerciseFavorited(exerciseId: string, exerciseTitle: string): Promise<boolean> {
    return this.logEvent('exercise_favorited', {
      video_id: exerciseId,
      video_title: exerciseTitle,
    }, exerciseId);
  }

  /**
   * Log session started (app opened)
   */
  async logSessionStarted(): Promise<boolean> {
    return this.logEvent('session_started', {
      source: 'app_launch',
    });
  }

  /**
   * Get user's activity events (most recent first)
   */
  async getUserActivity(limit: number = 10): Promise<ActivityEvent[]> {
    if (!supabase) {
      return [];
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('activity_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[ActivityService] Error fetching activity:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('[ActivityService] Unexpected error:', err);
      return [];
    }
  }

  /**
   * Get user's session count for the last N days
   */
  async getSessionCount(days: number = 7): Promise<number> {
    if (!supabase) {
      return 0;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { count, error } = await supabase
        .from('activity_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .in('event_type', ['assessment_completed', 'routine_opened', 'video_opened']);

      if (error) {
        console.error('[ActivityService] Error fetching session count:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('[ActivityService] Unexpected error:', err);
      return 0;
    }
  }

  /**
   * Get user's last activity date
   */
  async getLastActivityDate(): Promise<Date | null> {
    if (!supabase) {
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('activity_events')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return new Date(data.created_at);
    } catch (err) {
      console.error('[ActivityService] Unexpected error:', err);
      return null;
    }
  }
}

// Export singleton instance
export const activityService = new ActivityService();
export default activityService;
