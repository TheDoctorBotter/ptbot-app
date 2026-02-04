/**
 * Protocol Exercise Service
 *
 * Fetches exercises based on protocol and phase assignments from assessments.
 * Uses phase_routines mapping to get the appropriate exercise routines.
 */

import { supabase } from '@/lib/supabase';

export interface ProtocolExercise {
  id: string;
  title: string;
  description: string | null;
  bodyParts: string[];
  difficulty: string;
  youtubeVideoId: string | null;
  thumbnailUrl: string | null;
  recommendedSets: number | null;
  recommendedReps: number | null;
  recommendedHoldSeconds: number | null;
  displayOrder: number;
}

export interface ProtocolPhaseInfo {
  protocolKey: string;
  protocolName: string;
  phaseNumber: number;
  phaseName: string;
  phaseDescription: string | null;
  weekStart: number;
  weekEnd: number | null;
  assessmentDate: string;
  assessmentId: string;
  painLocation: string | null;
}

export interface ProtocolExerciseResult {
  phaseInfo: ProtocolPhaseInfo | null;
  exercises: ProtocolExercise[];
  routineId: string | null;
  routineName: string | null;
  isLoading: boolean;
  error: string | null;
}

class ProtocolExerciseService {
  /**
   * Get the user's current protocol assignment from their latest assessment
   */
  async getUserProtocolAssignment(): Promise<ProtocolPhaseInfo | null> {
    if (!supabase) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get latest assessment with protocol assignment
      const { data: assessment, error } = await supabase
        .from('assessments')
        .select(`
          id,
          created_at,
          pain_location,
          protocol_key_selected,
          phase_number_selected,
          protocols (
            key,
            name
          ),
          protocol_phases (
            phase_number,
            name,
            description,
            week_start,
            week_end
          )
        `)
        .eq('user_id', user.id)
        .not('protocol_key_selected', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !assessment) {
        console.log('[ProtocolExerciseService] No protocol assignment found');
        return null;
      }

      const protocol = assessment.protocols as { key: string; name: string } | null;
      const phase = assessment.protocol_phases as {
        phase_number: number;
        name: string;
        description: string | null;
        week_start: number;
        week_end: number | null;
      } | null;

      if (!protocol || !phase) {
        return null;
      }

      return {
        protocolKey: assessment.protocol_key_selected,
        protocolName: protocol.name,
        phaseNumber: assessment.phase_number_selected || 1,
        phaseName: phase.name,
        phaseDescription: phase.description,
        weekStart: phase.week_start,
        weekEnd: phase.week_end,
        assessmentDate: assessment.created_at,
        assessmentId: assessment.id,
        painLocation: assessment.pain_location,
      };
    } catch (err) {
      console.error('[ProtocolExerciseService] Error fetching protocol assignment:', err);
      return null;
    }
  }

  /**
   * Get exercises for a specific protocol and phase
   */
  async getProtocolExercises(
    protocolKey: string,
    phaseNumber: number
  ): Promise<{ exercises: ProtocolExercise[]; routineId: string | null; routineName: string | null }> {
    if (!supabase) {
      return { exercises: [], routineId: null, routineName: null };
    }

    try {
      // First, try to find a routine mapped to this protocol/phase
      const { data: phaseRoutine, error: routineError } = await supabase
        .from('phase_routines')
        .select(`
          routine_id,
          exercise_routines (
            id,
            name,
            description
          )
        `)
        .eq('protocol_key', protocolKey)
        .eq('phase_number', phaseNumber)
        .maybeSingle();

      if (routineError) {
        console.error('[ProtocolExerciseService] Error fetching phase routine:', routineError);
      }

      // If we found a routine, get its exercises
      if (phaseRoutine?.routine_id) {
        const routine = phaseRoutine.exercise_routines as { id: string; name: string; description: string | null } | null;

        const { data: routineExercises, error: exerciseError } = await supabase
          .from('routine_exercises')
          .select(`
            display_order,
            sets_override,
            reps_override,
            hold_seconds_override,
            exercise_videos (
              id,
              title,
              description,
              body_parts,
              difficulty,
              youtube_video_id,
              thumbnail_url,
              recommended_sets,
              recommended_reps,
              recommended_hold_seconds
            )
          `)
          .eq('routine_id', phaseRoutine.routine_id)
          .order('display_order', { ascending: true });

        if (exerciseError) {
          console.error('[ProtocolExerciseService] Error fetching routine exercises:', exerciseError);
          return { exercises: [], routineId: phaseRoutine.routine_id, routineName: routine?.name || null };
        }

        const exercises: ProtocolExercise[] = (routineExercises || [])
          .filter((re: any) => re.exercise_videos)
          .map((re: any) => {
            const ex = re.exercise_videos;
            return {
              id: ex.id,
              title: ex.title,
              description: ex.description,
              bodyParts: ex.body_parts || [],
              difficulty: ex.difficulty || 'Beginner',
              youtubeVideoId: ex.youtube_video_id,
              thumbnailUrl: ex.thumbnail_url,
              recommendedSets: re.sets_override || ex.recommended_sets,
              recommendedReps: re.reps_override || ex.recommended_reps,
              recommendedHoldSeconds: re.hold_seconds_override || ex.recommended_hold_seconds,
              displayOrder: re.display_order,
            };
          });

        return {
          exercises,
          routineId: phaseRoutine.routine_id,
          routineName: routine?.name || null,
        };
      }

      // Fallback: Search for exercises by protocol-related keywords
      // This happens if no specific routine is mapped
      console.log('[ProtocolExerciseService] No mapped routine, searching by protocol keywords');

      const { data: exercises, error: searchError } = await supabase
        .from('exercise_videos')
        .select('*')
        .eq('is_active', true)
        .or(`conditions.cs.{${protocolKey}},keywords.cs.{${protocolKey}}`)
        .order('display_order', { ascending: true })
        .limit(10);

      if (searchError) {
        console.error('[ProtocolExerciseService] Error searching exercises:', searchError);
        return { exercises: [], routineId: null, routineName: null };
      }

      const mappedExercises: ProtocolExercise[] = (exercises || []).map((ex: any) => ({
        id: ex.id,
        title: ex.title,
        description: ex.description,
        bodyParts: ex.body_parts || [],
        difficulty: ex.difficulty || 'Beginner',
        youtubeVideoId: ex.youtube_video_id,
        thumbnailUrl: ex.thumbnail_url,
        recommendedSets: ex.recommended_sets,
        recommendedReps: ex.recommended_reps,
        recommendedHoldSeconds: ex.recommended_hold_seconds,
        displayOrder: ex.display_order || 0,
      }));

      return { exercises: mappedExercises, routineId: null, routineName: null };
    } catch (err) {
      console.error('[ProtocolExerciseService] Error:', err);
      return { exercises: [], routineId: null, routineName: null };
    }
  }

  /**
   * Get full protocol exercise data for the current user
   */
  async getCurrentUserProtocolExercises(): Promise<ProtocolExerciseResult> {
    const result: ProtocolExerciseResult = {
      phaseInfo: null,
      exercises: [],
      routineId: null,
      routineName: null,
      isLoading: true,
      error: null,
    };

    try {
      const phaseInfo = await this.getUserProtocolAssignment();

      if (!phaseInfo) {
        return { ...result, isLoading: false };
      }

      const { exercises, routineId, routineName } = await this.getProtocolExercises(
        phaseInfo.protocolKey,
        phaseInfo.phaseNumber
      );

      return {
        phaseInfo,
        exercises,
        routineId,
        routineName,
        isLoading: false,
        error: null,
      };
    } catch (err) {
      console.error('[ProtocolExerciseService] Error:', err);
      return {
        ...result,
        isLoading: false,
        error: 'Failed to load protocol exercises',
      };
    }
  }
}

export const protocolExerciseService = new ProtocolExerciseService();
export default protocolExerciseService;
