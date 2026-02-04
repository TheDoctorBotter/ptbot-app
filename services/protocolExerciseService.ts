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
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select('id, created_at, pain_location, protocol_key_selected, phase_number_selected')
        .eq('user_id', user.id)
        .not('protocol_key_selected', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (assessmentError || !assessment) {
        console.log('[ProtocolExerciseService] No protocol assignment found:', assessmentError);
        return null;
      }

      // Fetch protocol separately
      const { data: protocol, error: protocolError } = await supabase
        .from('protocols')
        .select('protocol_key, name, surgery_name')
        .eq('protocol_key', assessment.protocol_key_selected)
        .maybeSingle();

      if (protocolError || !protocol) {
        console.log('[ProtocolExerciseService] Protocol not found:', protocolError);
        return null;
      }

      // Fetch phase separately
      const { data: phase, error: phaseError } = await supabase
        .from('protocol_phases')
        .select('phase_number, name, description, week_start, week_end')
        .eq('protocol_id', (
          await supabase
            .from('protocols')
            .select('id')
            .eq('protocol_key', assessment.protocol_key_selected)
            .single()
        ).data?.id)
        .eq('phase_number', assessment.phase_number_selected || 1)
        .maybeSingle();

      // Use defaults if phase not found
      const phaseName = phase?.name || `Phase ${assessment.phase_number_selected || 1}`;
      const phaseDescription = phase?.description || null;
      const weekStart = phase?.week_start || 0;
      const weekEnd = phase?.week_end || null;

      return {
        protocolKey: assessment.protocol_key_selected,
        protocolName: protocol.name || protocol.surgery_name,
        phaseNumber: assessment.phase_number_selected || 1,
        phaseName: phaseName,
        phaseDescription: phaseDescription,
        weekStart: weekStart,
        weekEnd: weekEnd,
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
      // First, try to find a routine mapped to this protocol/phase via phase_routines
      // Check both by protocol_key/phase_number and by protocol_phase_id
      let phaseRoutine = null;
      let routineError = null;

      // Try querying by protocol_key and phase_number first
      const { data: routineByKey, error: keyError } = await supabase
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

      if (!keyError && routineByKey) {
        phaseRoutine = routineByKey;
      } else {
        // Fall back to querying by protocol_phase_id
        // First get the protocol_phase_id
        const { data: protocolData } = await supabase
          .from('protocols')
          .select('id')
          .eq('protocol_key', protocolKey)
          .maybeSingle();

        if (protocolData?.id) {
          const { data: phaseData } = await supabase
            .from('protocol_phases')
            .select('id')
            .eq('protocol_id', protocolData.id)
            .eq('phase_number', phaseNumber)
            .maybeSingle();

          if (phaseData?.id) {
            const { data: routineByPhase, error: phaseError } = await supabase
              .from('phase_routines')
              .select(`
                routine_id,
                exercise_routines (
                  id,
                  name,
                  description
                )
              `)
              .eq('protocol_phase_id', phaseData.id)
              .maybeSingle();

            if (!phaseError && routineByPhase) {
              phaseRoutine = routineByPhase;
            }
            routineError = phaseError;
          }
        }
      }

      if (routineError) {
        console.log('[ProtocolExerciseService] No phase routine mapping found, using fallback');
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

      // Fallback: Search for exercises by body part matching the protocol region
      console.log('[ProtocolExerciseService] No mapped routine, searching by protocol region/keywords');

      // Extract body part from protocol key (e.g., "knee_acl_reconstruction" -> "Knee")
      const regionMatch = protocolKey.match(/^(shoulder|knee|hip|elbow|foot_ankle|ankle)/i);
      const bodyPart = regionMatch ? regionMatch[1].replace('_', ' ') : null;

      let exerciseQuery = supabase
        .from('exercise_videos')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(10);

      // Filter by body part if we extracted one
      if (bodyPart) {
        const bodyPartCapitalized = bodyPart.charAt(0).toUpperCase() + bodyPart.slice(1).toLowerCase();
        exerciseQuery = exerciseQuery.contains('body_parts', [bodyPartCapitalized]);
      }

      const { data: exercises, error: searchError } = await exerciseQuery;

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

      return { exercises: mappedExercises, routineId: null, routineName: `${bodyPart ? bodyPart.charAt(0).toUpperCase() + bodyPart.slice(1) + ' ' : ''}Exercises` };
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
