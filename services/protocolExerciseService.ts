/**
 * Protocol Exercise Service
 *
 * Fetches exercises based on protocol and phase assignments from assessments.
 * Uses protocol_phase_exercises table to get protocol-specific exercises.
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
      // First get the protocol_id from protocol_key
      const { data: protocolData, error: protocolError } = await supabase
        .from('protocols')
        .select('id, name, surgery_name')
        .eq('protocol_key', protocolKey)
        .maybeSingle();

      if (protocolError || !protocolData) {
        console.log('[ProtocolExerciseService] Protocol not found:', protocolKey, protocolError);
        return { exercises: [], routineId: null, routineName: null };
      }

      // Query protocol_phase_exercises with joined exercise data
      const { data: phaseExercises, error: exercisesError } = await supabase
        .from('protocol_phase_exercises')
        .select(`
          display_order,
          phase_sets,
          phase_reps,
          phase_hold_seconds,
          phase_frequency,
          phase_notes,
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
        .eq('protocol_id', protocolData.id)
        .eq('phase_number', phaseNumber)
        .order('display_order', { ascending: true });

      if (exercisesError) {
        console.error('[ProtocolExerciseService] Error fetching protocol exercises:', exercisesError);
        return { exercises: [], routineId: null, routineName: null };
      }

      if (phaseExercises && phaseExercises.length > 0) {
        const exercises: ProtocolExercise[] = phaseExercises
          .filter((pe: any) => pe.exercise_videos)
          .map((pe: any) => {
            const ex = pe.exercise_videos;
            return {
              id: ex.id,
              title: ex.title,
              description: ex.description,
              bodyParts: ex.body_parts || [],
              difficulty: ex.difficulty || 'Beginner',
              youtubeVideoId: ex.youtube_video_id,
              thumbnailUrl: ex.thumbnail_url,
              recommendedSets: pe.phase_sets || ex.recommended_sets,
              recommendedReps: pe.phase_reps || ex.recommended_reps,
              recommendedHoldSeconds: pe.phase_hold_seconds || ex.recommended_hold_seconds,
              displayOrder: pe.display_order,
            };
          });

        console.log(`[ProtocolExerciseService] Found ${exercises.length} exercises for ${protocolKey} phase ${phaseNumber}`);
        return {
          exercises,
          routineId: protocolData.id,
          routineName: protocolData.name || protocolData.surgery_name,
        };
      }

      // Fallback: Search for exercises by body part matching the protocol region
      console.log('[ProtocolExerciseService] No protocol exercises found, using fallback by body part');

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
