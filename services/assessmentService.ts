import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface AssessmentData {
  painLevel: number;
  painLocation: string;
  painDuration: string;
  painType: string;
  mechanismOfInjury: string;
  medications: string;
  additionalSymptoms: string[];
  redFlags: string[];
  location: string;
  timestamp: string;
}

export interface PostOpData {
  surgeryStatus: string;
  postOpRegion: string | null;
  surgeryType: string | null;
  procedureModifier: string | null;
  weeksSinceSurgery: string | null;
  weightBearingStatus: string | null;
  surgeonPrecautions: string | null;
  protocolKey: string | null;
  phaseNumber: number | null;
}

export interface ExerciseDosage {
  sets: number;
  reps?: number;
  duration?: string;
  frequency: string;
  holdTime?: string;
  restBetweenSets?: string;
}

export interface ExerciseRecommendation {
  exercise: {
    id: string;
    name: string;
    description: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    bodyParts: string[];
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    category: string;
  };
  dosage: ExerciseDosage;
  relevanceScore: number;
  reasoning: string;
  safetyNotes: string[];
  redFlagWarnings: string[];
  progressionTips: string[];
}

export interface AssessmentResult {
  id: string;
  assessment: AssessmentData;
  recommendations: ExerciseRecommendation[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  nextSteps: string[];
  createdAt: string;
}

// Database exercise type (from Supabase)
interface DatabaseExercise {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  body_parts: string[];
  conditions: string[];
  keywords: string[];
  recommended_sets: number | null;
  recommended_reps: number | null;
  recommended_hold_seconds: number | null;
  recommended_frequency: string | null;
  contraindications: string[];
  safety_notes: string[];
  display_order: number;
  section_id: string;
}

interface ScoredExercise {
  exercise: DatabaseExercise;
  score: number;
  matchReasons: string[];
}

// Routine types
interface DatabaseRoutine {
  id: string;
  name: string;
  slug: string;
  description: string;
  target_symptoms: string[];
  exclusion_criteria: string[];
  disclaimer: string;
  difficulty: string;
  estimated_duration_minutes: number;
}

interface DatabaseRoutineItem {
  id: string;
  sequence_order: number;
  phase: string;
  phase_notes: string | null;
  transition_notes: string | null;
  is_optional: boolean;
  exercise_videos: DatabaseExercise;
}

interface MatchedRoutine {
  routine: DatabaseRoutine;
  matchScore: number;
  matchedSymptoms: string[];
}

const STORAGE_KEY = 'ptbot_assessments';

export class AssessmentService {
  constructor() {
    // Uses Supabase for exercise data
  }

  async processAssessment(assessmentData: AssessmentData, postOpData?: PostOpData): Promise<AssessmentResult> {
    try {
      console.log('🔍 Processing comprehensive assessment...');

      // Determine risk level based on red flags and pain severity
      const riskLevel = this.calculateRiskLevel(assessmentData);

      // Generate exercise recommendations if safe to do so
      let recommendations: ExerciseRecommendation[] = [];

      if (riskLevel !== 'critical') {
        // Check if this is a post-op assessment with protocol data
        if (postOpData?.surgeryStatus === 'post_op' && postOpData?.protocolKey && postOpData?.phaseNumber) {
          console.log(`📋 Post-op assessment detected: ${postOpData.protocolKey}, Phase ${postOpData.phaseNumber}`);
          recommendations = await this.generateProtocolExerciseRecommendations(assessmentData, postOpData);
        } else {
          // Standard body-part based recommendations
          recommendations = await this.generateExerciseRecommendations(assessmentData);
        }
      }

      // Generate next steps based on assessment
      const nextSteps = this.generateNextSteps(assessmentData, riskLevel, postOpData);

      const result: AssessmentResult = {
        id: Date.now().toString(),
        assessment: assessmentData,
        recommendations,
        riskLevel,
        nextSteps,
        createdAt: new Date().toISOString(),
      };

      console.log(`✅ Assessment processed: ${riskLevel} risk, ${recommendations.length} recommendations`);
      return result;
    } catch (error) {
      console.error('Error processing assessment:', error);
      throw new Error('Failed to process assessment');
    }
  }

  private calculateRiskLevel(assessment: AssessmentData): 'low' | 'moderate' | 'high' | 'critical' {
    // Critical: Any red flags present
    if (assessment.redFlags.length > 0) {
      return 'critical';
    }

    // High: Severe pain (8-10) with concerning symptoms
    if (assessment.painLevel >= 8) {
      const concerningSymptoms = [
        'Numbness or tingling',
        'Muscle weakness',
        'Weakness in both legs',
      ];

      if (
        assessment.additionalSymptoms.some((symptom) =>
          concerningSymptoms.some((concerning) => symptom.toLowerCase().includes(concerning.toLowerCase()))
        )
      ) {
        return 'high';
      }
    }

    // Moderate: Moderate to severe pain (6-7) or chronic duration
    if (assessment.painLevel >= 6 || assessment.painDuration.includes('month')) {
      return 'moderate';
    }

    // Low: Mild pain (1-5) with recent onset
    return 'low';
  }

  private async generateExerciseRecommendations(assessment: AssessmentData): Promise<ExerciseRecommendation[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty recommendations');
      return [];
    }

    try {
      // Step 0: Try to match a curated routine first
      console.log('🔍 Checking for matching exercise routine...');
      const routineRecommendations = await this.tryMatchRoutine(assessment);
      if (routineRecommendations && routineRecommendations.length > 0) {
        console.log(`✅ Using matched routine with ${routineRecommendations.length} exercises`);
        return routineRecommendations;
      }
      console.log('📋 No routine match, falling back to individual exercise matching');

      // Step 1: Get the section ID for the body part
      const sectionSlug = this.bodyPartToSectionSlug(assessment.painLocation);

      // Step 2: Query exercises from Supabase
      // Use explicit ordering: display_order first, then id for deterministic results
      const { data: exercises, error } = await supabase
        .from('exercise_videos')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching exercises from Supabase:', error);
        return [];
      }

      if (!exercises || exercises.length === 0) {
        console.log('No exercises found in database');
        return [];
      }

      // Step 3: Score and rank exercises
      const scored = this.scoreExercisesFromDB(exercises as DatabaseExercise[], assessment);

      // Step 4: Filter by pain level - for high pain, prefer beginner exercises
      let filtered = scored;
      if (assessment.painLevel >= 7) {
        // High pain: strongly prefer beginner, allow some intermediate
        filtered = scored.filter(s => s.exercise.difficulty !== 'Advanced');
      } else if (assessment.painLevel >= 5) {
        // Moderate pain: allow beginner and intermediate
        filtered = scored.filter(s => s.exercise.difficulty !== 'Advanced' || s.score > 70);
      }

      // Step 5: Take top 5-8 recommendations (return the full routine if matched)
      const topExercises = filtered.filter((s) => s.score >= 30).slice(0, 8);

      // Ensure we have at least 3 exercises if available
      const finalExercises =
        topExercises.length >= 3 ? topExercises : filtered.slice(0, Math.min(5, filtered.length));

      // Step 6: Build recommendations with dosage and safety info
      const recommendations: ExerciseRecommendation[] = finalExercises.map((scored) => {
        const { exercise, matchReasons } = scored;

        // Generate safety notes based on assessment
        const safetyNotes = this.generateSafetyNotes(assessment, exercise);

        // Build YouTube video URL
        const videoUrl = exercise.youtube_video_id
          ? `https://www.youtube.com/watch?v=${exercise.youtube_video_id}`
          : undefined;

        // Build thumbnail URL
        const thumbnailUrl = exercise.youtube_video_id
          ? `https://img.youtube.com/vi/${exercise.youtube_video_id}/hqdefault.jpg`
          : exercise.thumbnail_url || undefined;

        // Build dosage from database fields
        const dosage: ExerciseDosage = {
          sets: exercise.recommended_sets || 2,
          reps: exercise.recommended_reps || undefined,
          frequency: exercise.recommended_frequency || 'Daily',
          holdTime: exercise.recommended_hold_seconds
            ? `${exercise.recommended_hold_seconds} seconds`
            : undefined,
        };

        return {
          exercise: {
            id: exercise.id,
            name: exercise.title,
            description: exercise.description || '',
            videoUrl,
            thumbnailUrl,
            bodyParts: exercise.body_parts || [],
            difficulty: exercise.difficulty || 'Beginner',
            category: this.inferCategory(exercise),
          },
          dosage,
          relevanceScore: scored.score,
          reasoning: matchReasons.join('. '),
          safetyNotes,
          redFlagWarnings: this.generateRedFlagWarnings(exercise),
          progressionTips: this.generateProgressionTips(exercise),
        };
      });

      return recommendations;
    } catch (error) {
      console.error('Error generating exercise recommendations:', error);
      return [];
    }
  }

  // Try to match assessment to a curated routine first
  private async tryMatchRoutine(assessment: AssessmentData): Promise<ExerciseRecommendation[] | null> {
    if (!supabase) {
      return null;
    }

    try {
      // Fetch all active routines
      const { data: routines, error: routinesError } = await supabase
        .from('exercise_routines')
        .select('*')
        .eq('is_active', true);

      if (routinesError || !routines || routines.length === 0) {
        console.log('No routines found or error fetching routines');
        return null;
      }

      // Match routines to assessment symptoms
      const matchedRoutine = this.matchRoutineToSymptoms(routines as DatabaseRoutine[], assessment);

      if (!matchedRoutine || matchedRoutine.matchScore < 30) {
        console.log('No routine matched with sufficient score');
        return null;
      }

      console.log(`✅ Matched routine: ${matchedRoutine.routine.name} (score: ${matchedRoutine.matchScore})`);
      console.log(`   Matched symptoms: ${matchedRoutine.matchedSymptoms.join(', ')}`);

      // Check exclusion criteria
      if (this.checkExclusionCriteria(matchedRoutine.routine, assessment)) {
        console.log('❌ Routine excluded due to exclusion criteria');
        return null;
      }

      // Fetch routine exercises in order
      return await this.generateRoutineRecommendations(matchedRoutine.routine, assessment);
    } catch (error) {
      console.error('Error matching routine:', error);
      return null;
    }
  }

  // Match routines to assessment based on target_symptoms
  private matchRoutineToSymptoms(routines: DatabaseRoutine[], assessment: AssessmentData): MatchedRoutine | null {
    const assessmentTerms = this.buildAssessmentSearchTerms(assessment);

    let bestMatch: MatchedRoutine | null = null;

    for (const routine of routines) {
      let matchScore = 0;
      const matchedSymptoms: string[] = [];

      // Check each target symptom against assessment
      for (const targetSymptom of routine.target_symptoms) {
        const targetLower = targetSymptom.toLowerCase();

        for (const term of assessmentTerms) {
          // Check for meaningful overlap (not just single word matches)
          if (this.symptomsMatch(targetLower, term)) {
            matchScore += 15;
            if (!matchedSymptoms.includes(targetSymptom)) {
              matchedSymptoms.push(targetSymptom);
            }
          }
        }
      }

      // Bonus for body part match in routine name/description
      const routineText = `${routine.name} ${routine.description}`.toLowerCase();
      if (routineText.includes(assessment.painLocation.toLowerCase())) {
        matchScore += 25;
        matchedSymptoms.push(`Targets ${assessment.painLocation}`);
      }

      // Bonus for pain type match
      if (assessment.painType) {
        const painTypeLower = assessment.painType.toLowerCase();
        if (routineText.includes(painTypeLower) ||
            routine.target_symptoms.some(s => s.toLowerCase().includes(painTypeLower))) {
          matchScore += 10;
        }
      }

      if (!bestMatch || matchScore > bestMatch.matchScore) {
        bestMatch = { routine, matchScore, matchedSymptoms };
      }
    }

    return bestMatch;
  }

  // Check if two symptom descriptions match meaningfully
  private symptomsMatch(routineSymptom: string, assessmentTerm: string): boolean {
    // Direct inclusion
    if (routineSymptom.includes(assessmentTerm) || assessmentTerm.includes(routineSymptom)) {
      return true;
    }

    // Key symptom mappings
    const mappings: Record<string, string[]> = {
      'stiffness': ['stiff', 'tight', 'limited mobility', 'restricted'],
      'aching': ['ache', 'dull pain', 'sore'],
      'sitting': ['prolonged sitting', 'desk', 'sedentary'],
      'morning': ['morning stiffness', 'wake up', 'first thing'],
      'stairs': ['going down stairs', 'climbing', 'steps'],
      'kneecap': ['patella', 'anterior knee', 'front of knee'],
      'squatting': ['squat', 'bending knee', 'deep knee bend'],
    };

    for (const [key, synonyms] of Object.entries(mappings)) {
      if (routineSymptom.includes(key) && synonyms.some(s => assessmentTerm.includes(s))) {
        return true;
      }
      if (assessmentTerm.includes(key) && synonyms.some(s => routineSymptom.includes(s))) {
        return true;
      }
    }

    return false;
  }

  // Build search terms from assessment data
  private buildAssessmentSearchTerms(assessment: AssessmentData): string[] {
    const terms: string[] = [];

    // Pain location variations
    if (assessment.painLocation) {
      terms.push(assessment.painLocation.toLowerCase());
      // Add common variations
      if (assessment.painLocation.toLowerCase().includes('lower back')) {
        terms.push('lumbar', 'low back', 'back pain');
      }
      if (assessment.painLocation.toLowerCase().includes('knee')) {
        terms.push('patella', 'kneecap', 'anterior knee');
      }
    }

    // Pain type
    if (assessment.painType) {
      terms.push(assessment.painType.toLowerCase());
      if (assessment.painType.toLowerCase().includes('ach')) {
        terms.push('dull pain', 'aching');
      }
      if (assessment.painType.toLowerCase().includes('stiff')) {
        terms.push('stiffness', 'tight');
      }
    }

    // Additional symptoms
    for (const symptom of assessment.additionalSymptoms) {
      terms.push(symptom.toLowerCase());
    }

    // Pain duration context
    if (assessment.painDuration) {
      const duration = assessment.painDuration.toLowerCase();
      if (duration.includes('gradual') || duration.includes('week') || duration.includes('month')) {
        terms.push('builds gradually', 'wax and wane');
      }
    }

    return terms;
  }

  // Check if routine should be excluded based on assessment
  private checkExclusionCriteria(routine: DatabaseRoutine, assessment: AssessmentData): boolean {
    if (!routine.exclusion_criteria || routine.exclusion_criteria.length === 0) {
      return false;
    }

    const assessmentText = [
      assessment.painType,
      assessment.mechanismOfInjury,
      ...assessment.additionalSymptoms,
      ...assessment.redFlags,
    ].join(' ').toLowerCase();

    for (const exclusion of routine.exclusion_criteria) {
      const exclusionLower = exclusion.toLowerCase();

      // Check for trauma exclusion
      if (exclusionLower.includes('trauma') &&
          (assessmentText.includes('fall') || assessmentText.includes('accident') ||
           assessmentText.includes('injury') || assessmentText.includes('hit'))) {
        return true;
      }

      // Check for neurological exclusion
      if (exclusionLower.includes('neurological') &&
          (assessmentText.includes('numbness') || assessmentText.includes('tingling') ||
           assessmentText.includes('weakness'))) {
        return true;
      }

      // Check for direct match
      if (assessmentText.includes(exclusionLower.split(' ')[0])) {
        return true;
      }
    }

    return false;
  }

  // Generate recommendations from a matched routine
  private async generateRoutineRecommendations(
    routine: DatabaseRoutine,
    assessment: AssessmentData
  ): Promise<ExerciseRecommendation[]> {
    if (!supabase) {
      return [];
    }

    // Fetch routine items with exercises
    const { data: routineItems, error } = await supabase
      .from('exercise_routine_items')
      .select(`
        id,
        sequence_order,
        phase,
        phase_notes,
        transition_notes,
        is_optional,
        exercise_videos (*)
      `)
      .eq('routine_id', routine.id)
      .order('sequence_order', { ascending: true });

    if (error || !routineItems || routineItems.length === 0) {
      console.log('No routine items found');
      return [];
    }

    console.log(`📋 Building recommendations from ${routineItems.length} routine exercises`);

    // Build recommendations from routine items
    const recommendations: ExerciseRecommendation[] = routineItems
      .filter(item => item.exercise_videos)
      .map((item) => {
        const exercise = item.exercise_videos as unknown as DatabaseExercise;
        const routineItem = item as unknown as DatabaseRoutineItem;

        // Build dosage from exercise
        const dosage: ExerciseDosage = {
          sets: exercise.recommended_sets || 2,
          reps: exercise.recommended_reps || undefined,
          frequency: exercise.recommended_frequency || 'Daily',
          holdTime: exercise.recommended_hold_seconds
            ? `${exercise.recommended_hold_seconds} seconds`
            : undefined,
        };

        // Build YouTube video URL
        const videoUrl = exercise.youtube_video_id
          ? `https://www.youtube.com/watch?v=${exercise.youtube_video_id}`
          : undefined;

        // Build thumbnail URL
        const thumbnailUrl = exercise.youtube_video_id
          ? `https://img.youtube.com/vi/${exercise.youtube_video_id}/hqdefault.jpg`
          : exercise.thumbnail_url || undefined;

        // Build reasoning with phase info
        let reasoning = `Part of your personalized ${routine.name}`;
        if (routineItem.phase) {
          reasoning += ` - ${routineItem.phase} Phase`;
        }
        reasoning += ` (Exercise ${routineItem.sequence_order} of ${routineItems.length})`;

        // Build safety notes including phase notes
        const safetyNotes = this.generateRoutineSafetyNotes(assessment, exercise, routineItem);

        return {
          exercise: {
            id: exercise.id,
            name: exercise.title,
            description: exercise.description || '',
            videoUrl,
            thumbnailUrl,
            bodyParts: exercise.body_parts || [],
            difficulty: exercise.difficulty || 'Beginner',
            category: this.inferCategory(exercise),
          },
          dosage,
          relevanceScore: 100 - routineItem.sequence_order, // Earlier exercises score higher
          reasoning,
          safetyNotes,
          redFlagWarnings: this.generateRedFlagWarnings(exercise),
          progressionTips: this.generateRoutineProgressionTips(exercise, routineItem, routineItems.length),
        };
      });

    // Add routine disclaimer to first exercise
    if (recommendations.length > 0 && routine.disclaimer) {
      recommendations[0].safetyNotes.unshift(`📋 ${routine.disclaimer}`);
    }

    return recommendations;
  }

  // Generate safety notes for routine exercises
  private generateRoutineSafetyNotes(
    assessment: AssessmentData,
    exercise: DatabaseExercise,
    routineItem: DatabaseRoutineItem
  ): string[] {
    const notes: string[] = [];

    // Add phase notes first
    if (routineItem.phase_notes) {
      notes.push(routineItem.phase_notes);
    }

    // Add transition notes
    if (routineItem.transition_notes) {
      notes.push(`💡 ${routineItem.transition_notes}`);
    }

    // Include exercise-specific safety notes
    if (exercise.safety_notes && exercise.safety_notes.length > 0) {
      notes.push(...exercise.safety_notes);
    }

    // Pain level guidance
    if (assessment.painLevel >= 7) {
      notes.push('Start very gently given your current pain level.');
    }

    // Contraindications
    if (exercise.contraindications && exercise.contraindications.length > 0) {
      notes.push(`Avoid if you have: ${exercise.contraindications.join(', ')}.`);
    }

    return notes;
  }

  // Generate progression tips for routine exercises
  private generateRoutineProgressionTips(
    exercise: DatabaseExercise,
    routineItem: DatabaseRoutineItem,
    totalExercises: number
  ): string[] {
    const tips: string[] = [];

    if (routineItem.sequence_order < totalExercises) {
      tips.push(`Once comfortable, progress to Exercise ${routineItem.sequence_order + 1}`);
    }

    if (routineItem.phase === 'Symptom Relief') {
      tips.push('Focus on pain relief before advancing to strengthening exercises');
    } else if (routineItem.phase === 'Strengthening') {
      tips.push('Ensure symptom relief exercises are comfortable before progressing');
    } else if (routineItem.phase === 'Integration') {
      tips.push('This exercise integrates previous movements into functional patterns');
    }

    if (exercise.difficulty === 'Beginner') {
      tips.push('Increase hold time or repetitions as this becomes easier');
    }

    return tips;
  }

  // Generate exercise recommendations based on protocol and phase for post-op patients
  private async generateProtocolExerciseRecommendations(
    assessment: AssessmentData,
    postOpData: PostOpData
  ): Promise<ExerciseRecommendation[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty recommendations');
      return [];
    }

    try {
      console.log(`🔍 Looking for protocol: key="${postOpData.protocolKey}", phase=${postOpData.phaseNumber}`);

      // Step 1: Get the protocol ID from protocol_key
      const { data: protocol, error: protocolError } = await supabase
        .from('protocols')
        .select('id, surgery_name')
        .eq('protocol_key', postOpData.protocolKey)
        .eq('is_active', true)
        .single();

      if (protocolError) {
        console.log(`❌ Protocol query error:`, protocolError);
        return this.generateExerciseRecommendations(assessment);
      }

      if (!protocol) {
        console.log(`❌ Protocol not found for key: ${postOpData.protocolKey}, falling back to standard recommendations`);
        return this.generateExerciseRecommendations(assessment);
      }

      console.log(`✅ Found protocol: ${protocol.surgery_name} (ID: ${protocol.id})`);


      // Step 2: Get exercises for this protocol and phase
      const { data: protocolExercises, error: exercisesError } = await supabase
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
            youtube_video_id,
            title,
            description,
            thumbnail_url,
            difficulty,
            body_parts,
            conditions,
            keywords,
            recommended_sets,
            recommended_reps,
            recommended_hold_seconds,
            recommended_frequency,
            contraindications,
            safety_notes,
            display_order,
            section_id
          )
        `)
        .eq('protocol_id', protocol.id)
        .eq('phase_number', postOpData.phaseNumber)
        .order('display_order', { ascending: true });

      if (exercisesError) {
        console.error('❌ Error fetching protocol exercises:', exercisesError);
        return this.generateExerciseRecommendations(assessment);
      }

      console.log(`🔍 Protocol exercises query result: ${protocolExercises?.length || 0} exercises found for phase ${postOpData.phaseNumber}`);

      if (!protocolExercises || protocolExercises.length === 0) {
        console.log(`No exercises found for ${postOpData.protocolKey} Phase ${postOpData.phaseNumber}, falling back to standard recommendations`);
        return this.generateExerciseRecommendations(assessment);
      }

      console.log(`✅ Found ${protocolExercises.length} protocol exercises for ${protocol.surgery_name} Phase ${postOpData.phaseNumber}`);

      // Step 3: Build recommendations from protocol exercises
      const recommendations: ExerciseRecommendation[] = protocolExercises
        .filter(pe => pe.exercise_videos) // Filter out any null exercises
        .map((pe) => {
          const exercise = pe.exercise_videos as unknown as DatabaseExercise;

          // Use phase-specific dosage if provided, otherwise use exercise defaults
          const dosage: ExerciseDosage = {
            sets: pe.phase_sets || exercise.recommended_sets || 2,
            reps: pe.phase_reps || exercise.recommended_reps || undefined,
            frequency: pe.phase_frequency || exercise.recommended_frequency || 'Daily',
            holdTime: (pe.phase_hold_seconds || exercise.recommended_hold_seconds)
              ? `${pe.phase_hold_seconds || exercise.recommended_hold_seconds} seconds`
              : undefined,
          };

          // Build YouTube video URL
          const videoUrl = exercise.youtube_video_id
            ? `https://www.youtube.com/watch?v=${exercise.youtube_video_id}`
            : undefined;

          // Build thumbnail URL
          const thumbnailUrl = exercise.youtube_video_id
            ? `https://img.youtube.com/vi/${exercise.youtube_video_id}/hqdefault.jpg`
            : exercise.thumbnail_url || undefined;

          // Generate safety notes with post-op specific guidance
          const safetyNotes = this.generatePostOpSafetyNotes(assessment, exercise, postOpData, pe.phase_notes);

          return {
            exercise: {
              id: exercise.id,
              name: exercise.title,
              description: exercise.description || '',
              videoUrl,
              thumbnailUrl,
              bodyParts: exercise.body_parts || [],
              difficulty: exercise.difficulty || 'Beginner',
              category: this.inferCategory(exercise),
            },
            dosage,
            relevanceScore: 100, // Protocol exercises are always highly relevant
            reasoning: `Part of your ${protocol.surgery_name} rehabilitation protocol - Phase ${postOpData.phaseNumber}`,
            safetyNotes,
            redFlagWarnings: this.generatePostOpRedFlagWarnings(exercise, postOpData),
            progressionTips: this.generatePostOpProgressionTips(exercise, postOpData),
          };
        });

      return recommendations;
    } catch (error) {
      console.error('Error generating protocol exercise recommendations:', error);
      return this.generateExerciseRecommendations(assessment);
    }
  }

  // Generate safety notes specific to post-op patients
  private generatePostOpSafetyNotes(
    assessment: AssessmentData,
    exercise: DatabaseExercise,
    postOpData: PostOpData,
    phaseNotes: string | null
  ): string[] {
    const notes: string[] = [];

    // Include phase-specific notes first
    if (phaseNotes) {
      notes.push(phaseNotes);
    }

    // Include exercise-specific safety notes from database
    if (exercise.safety_notes && exercise.safety_notes.length > 0) {
      notes.push(...exercise.safety_notes);
    }

    // Weight-bearing precautions for lower extremity
    if (postOpData.weightBearingStatus && postOpData.weightBearingStatus !== 'full_weight_bearing') {
      const wbNotes: Record<string, string> = {
        'non_weight_bearing': '⚠️ Non-weight bearing: Do not put any weight through the surgical leg.',
        'toe_touch_weight_bearing': '⚠️ Toe-touch weight bearing only: Light touch for balance only.',
        'partial_weight_bearing': '⚠️ Partial weight bearing: Use crutches/walker as instructed.',
        'weight_bearing_as_tolerated': 'Weight bearing as tolerated with assistive device if needed.',
      };
      if (wbNotes[postOpData.weightBearingStatus]) {
        notes.push(wbNotes[postOpData.weightBearingStatus]);
      }
    }

    // Surgeon precautions
    if (postOpData.surgeonPrecautions) {
      notes.push(`Surgeon precautions: ${postOpData.surgeonPrecautions}`);
    }

    // Pain level guidance for post-op
    if (assessment.painLevel >= 6) {
      notes.push('Higher pain levels are expected after surgery. Perform exercises gently within tolerable range.');
    }

    // Include exercise-specific contraindications
    if (exercise.contraindications && exercise.contraindications.length > 0) {
      notes.push(`Avoid if you have: ${exercise.contraindications.join(', ')}.`);
    }

    // General post-op reminder
    notes.push('Follow your surgeon\'s specific instructions. Contact your care team if you experience increased swelling, redness, or fever.');

    return notes;
  }

  // Generate red flag warnings for post-op patients
  private generatePostOpRedFlagWarnings(exercise: DatabaseExercise, postOpData: PostOpData): string[] {
    const warnings: string[] = [];

    if (exercise.contraindications && exercise.contraindications.length > 0) {
      warnings.push(`Do not perform if you have: ${exercise.contraindications.join(', ')}`);
    }

    // Post-op specific red flags
    warnings.push('Stop immediately and contact your surgeon if you experience:');
    warnings.push('- Sudden severe pain or popping sensation');
    warnings.push('- Significant increase in swelling');
    warnings.push('- Signs of infection (fever, increased redness, drainage)');
    warnings.push('- Numbness or tingling that doesn\'t resolve');

    return warnings;
  }

  // Generate progression tips for post-op patients
  private generatePostOpProgressionTips(exercise: DatabaseExercise, postOpData: PostOpData): string[] {
    const tips: string[] = [];

    tips.push('Follow your rehabilitation timeline - do not rush progression');
    tips.push('Your therapist or surgeon will clear you to advance to the next phase');

    if (exercise.difficulty === 'Beginner') {
      tips.push('Focus on proper form and gentle movement before increasing intensity');
    } else if (exercise.difficulty === 'Intermediate') {
      tips.push('Ensure you can perform beginner exercises pain-free before progressing');
    }

    if (postOpData.phaseNumber && postOpData.phaseNumber < 4) {
      tips.push(`Phase ${postOpData.phaseNumber} exercises build the foundation for later phases`);
    }

    return tips;
  }

  private bodyPartToSectionSlug(painLocation: string): string {
    const mappings: Record<string, string> = {
      'lower back': 'lower-back',
      'upper back': 'upper-back',
      'neck': 'neck',
      'shoulder': 'shoulder',
      'hip': 'hip',
      'knee': 'knee',
      'ankle': 'ankle-foot',
      'foot': 'ankle-foot',
      'elbow': 'elbow-wrist',
      'wrist': 'elbow-wrist',
      'hand': 'elbow-wrist',
    };

    const lower = painLocation.toLowerCase();
    for (const [key, value] of Object.entries(mappings)) {
      if (lower.includes(key)) {
        return value;
      }
    }
    return 'lower-back'; // default
  }

  private scoreExercisesFromDB(
    exercises: DatabaseExercise[],
    assessment: AssessmentData
  ): ScoredExercise[] {
    const painLocation = assessment.painLocation.toLowerCase();
    const painType = assessment.painType.toLowerCase();
    const symptoms = assessment.additionalSymptoms.map(s => s.toLowerCase());

    // Build search terms from assessment
    const searchTerms: string[] = [
      painLocation,
      painType,
      ...symptoms,
      assessment.painDuration.toLowerCase(),
    ].filter(Boolean);

    // Add common symptom keywords
    if (painType.includes('stiff') || painType.includes('tight')) {
      searchTerms.push('stiffness', 'mobility', 'flexibility');
    }
    if (painType.includes('ach') || painType.includes('dull')) {
      searchTerms.push('mechanical', 'muscle tension', 'relief');
    }
    if (symptoms.some(s => s.includes('sit'))) {
      searchTerms.push('sitting', 'flexion', 'posture');
    }

    const scored: ScoredExercise[] = exercises.map(exercise => {
      let score = 0;
      const matchReasons: string[] = [];

      // Check body part match (highest priority)
      const bodyPartsLower = (exercise.body_parts || []).map(b => b.toLowerCase());
      if (bodyPartsLower.some(bp => painLocation.includes(bp) || bp.includes(painLocation.split(' ')[0]))) {
        score += 40;
        matchReasons.push(`Targets ${assessment.painLocation}`);
      }

      // Check conditions match
      const conditionsLower = (exercise.conditions || []).map(c => c.toLowerCase());
      for (const term of searchTerms) {
        if (conditionsLower.some(c => c.includes(term) || term.includes(c.split(' ')[0]))) {
          score += 15;
          matchReasons.push(`Addresses ${term}`);
          break; // Only count once per exercise
        }
      }

      // Check keywords match
      const keywordsLower = (exercise.keywords || []).map(k => k.toLowerCase());
      let keywordMatches = 0;
      for (const term of searchTerms) {
        if (keywordsLower.some(k => k.includes(term) || term.includes(k))) {
          keywordMatches++;
        }
      }
      if (keywordMatches > 0) {
        score += Math.min(keywordMatches * 5, 20);
        matchReasons.push(`Matches ${keywordMatches} symptoms/keywords`);
      }

      // Bonus for beginner exercises with high pain
      if (assessment.painLevel >= 6 && exercise.difficulty === 'Beginner') {
        score += 10;
        matchReasons.push('Appropriate for your pain level');
      }

      // Bonus for featured exercises
      if ((exercise as any).is_featured) {
        score += 5;
      }

      // Use display order as tiebreaker (lower order = earlier in sequence = higher score)
      score += Math.max(0, 10 - (exercise.display_order || 0));

      return { exercise, score, matchReasons };
    });

    // Sort by score descending, then by display_order ascending, then by id for determinism
    return scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const orderDiff = (a.exercise.display_order || 0) - (b.exercise.display_order || 0);
      if (orderDiff !== 0) return orderDiff;
      // Tertiary sort by id ensures consistent ordering when score and display_order are equal
      return a.exercise.id.localeCompare(b.exercise.id);
    });
  }

  private inferCategory(exercise: DatabaseExercise): string {
    const title = exercise.title.toLowerCase();
    const keywords = (exercise.keywords || []).join(' ').toLowerCase();

    if (title.includes('stretch') || keywords.includes('stretch') || keywords.includes('flexibility')) {
      return 'stretch';
    }
    if (title.includes('strength') || keywords.includes('strengthen') || title.includes('superman')) {
      return 'strengthening';
    }
    if (title.includes('mobility') || title.includes('cat') || title.includes('camel')) {
      return 'mobility';
    }
    if (title.includes('nerve') || keywords.includes('nerve')) {
      return 'nerve_glide';
    }
    if (title.includes('posture') || keywords.includes('posture')) {
      return 'postural';
    }
    return 'mobility';
  }

  private generateSafetyNotes(assessment: AssessmentData, exercise: DatabaseExercise): string[] {
    const notes: string[] = [];

    // Include exercise-specific safety notes from database
    if (exercise.safety_notes && exercise.safety_notes.length > 0) {
      notes.push(...exercise.safety_notes);
    }

    // Pain level specific guidance
    if (assessment.painLevel >= 7) {
      notes.push('Start very gently and reduce intensity if pain increases above baseline.');
    } else if (assessment.painLevel >= 5) {
      notes.push('Perform within pain-free range. Stop if pain significantly worsens.');
    }

    // Include exercise-specific contraindications
    if (exercise.contraindications && exercise.contraindications.length > 0) {
      notes.push(`Avoid if you have: ${exercise.contraindications.join(', ')}.`);
    }

    // Duration-specific guidance
    if (assessment.painDuration.includes('More than 6 months')) {
      notes.push('For chronic conditions, consistency is key. Start with lower intensity and progress slowly.');
    } else if (assessment.painDuration.includes('Less than 1 week')) {
      notes.push('For acute pain, rest may be beneficial. If pain worsens with exercise, pause and reassess.');
    }

    // Symptom-specific notes
    if (assessment.additionalSymptoms.includes('Numbness or tingling')) {
      notes.push('If numbness or tingling increases during the exercise, stop immediately.');
    }
    if (assessment.additionalSymptoms.includes('Muscle weakness')) {
      notes.push('Start with supported positions and progress to unsupported as strength improves.');
    }

    // General safety reminder
    notes.push('Consult with a healthcare provider if symptoms worsen or do not improve within 2 weeks.');

    return notes;
  }

  private generateRedFlagWarnings(exercise: DatabaseExercise): string[] {
    const warnings: string[] = [];

    if (exercise.contraindications && exercise.contraindications.length > 0) {
      warnings.push(`Do not perform if you have: ${exercise.contraindications.join(', ')}`);
    }

    warnings.push('Stop immediately if you experience sharp shooting pain down the leg');
    warnings.push('Seek medical attention if you develop bowel or bladder changes');

    return warnings;
  }

  private generateProgressionTips(exercise: DatabaseExercise): string[] {
    const tips: string[] = [];

    if (exercise.difficulty === 'Beginner') {
      tips.push('Once comfortable, increase hold time or repetitions gradually');
      tips.push('Progress to the next exercise in the sequence when this feels easy');
    } else if (exercise.difficulty === 'Intermediate') {
      tips.push('Focus on control and form before increasing intensity');
      tips.push('Can add resistance or increase range as tolerated');
    } else {
      tips.push('This is an advanced exercise - ensure proper form throughout');
      tips.push('Consider working with a physical therapist for optimal technique');
    }

    return tips;
  }

  private generateNextSteps(assessment: AssessmentData, riskLevel: string, postOpData?: PostOpData): string[] {
    const steps: string[] = [];

    // Post-op specific next steps
    if (postOpData?.surgeryStatus === 'post_op') {
      if (riskLevel === 'critical') {
        steps.push('🚨 Contact your surgeon immediately');
        steps.push('📞 If unable to reach surgeon, go to emergency room');
        steps.push('🏥 Bring your surgical information with you');
        return steps;
      }

      steps.push('📋 Follow your post-operative protocol exercises below');
      steps.push(`📅 You are in Phase ${postOpData.phaseNumber} of your rehabilitation`);
      steps.push('🩺 Attend all scheduled follow-up appointments with your surgeon');
      steps.push('📊 Track your progress and report concerns to your care team');

      if (postOpData.weightBearingStatus && postOpData.weightBearingStatus !== 'full_weight_bearing') {
        steps.push('🦿 Follow weight-bearing restrictions as prescribed');
      }

      if (assessment.location.toLowerCase().includes('texas')) {
        steps.push('💻 Consider booking virtual PT session with Dr. Lemmo for guidance');
      }

      return steps;
    }

    // Standard non-post-op next steps
    switch (riskLevel) {
      case 'critical':
        steps.push('🚨 Seek immediate medical attention');
        steps.push('📞 Contact emergency services if symptoms worsen');
        steps.push('🏥 Visit emergency room or urgent care');
        break;

      case 'high':
        steps.push('🩺 Schedule appointment with healthcare provider within 24-48 hours');
        steps.push('📋 Avoid strenuous activities until evaluated');
        steps.push('❄️ Apply ice for acute injuries, heat for muscle tension');
        if (assessment.location.toLowerCase().includes('texas')) {
          steps.push('💻 Consider booking virtual consultation with Dr. Lemmo');
        }
        break;

      case 'moderate':
        steps.push('📱 Follow recommended exercises below');
        steps.push('📊 Track your progress daily');
        steps.push('🩺 Consider seeing a healthcare provider if no improvement in 1-2 weeks');
        if (assessment.location.toLowerCase().includes('texas')) {
          steps.push('💻 Book virtual consultation with Dr. Lemmo for personalized plan');
        }
        break;

      case 'low':
        steps.push('💪 Start with recommended beginner exercises');
        steps.push('📈 Monitor your symptoms and progress');
        steps.push('🎯 Gradually increase activity as tolerated');
        steps.push('📞 Contact healthcare provider if symptoms worsen');
        break;
    }

    return steps;
  }

  // Store assessment results using AsyncStorage (React Native compatible) AND Supabase
  async saveAssessmentResult(result: AssessmentResult, consentData?: {
    userEmail: string;
    userPhone: string;
    consentContact: boolean;
    consentDataUse: boolean;
    legalWaiverAccepted: boolean;
    // Post-op data
    surgeryStatus?: string;
    postOpRegion?: string | null;
    surgeryType?: string | null;
    procedureModifier?: string | null;
    weeksSinceSurgery?: string | null;
    weightBearingStatus?: string | null;
    surgeonPrecautions?: string | null;
    protocolKeySelected?: string | null;
    phaseNumberSelected?: number | null;
  }): Promise<void> {
    try {
      // Save to local storage for offline access
      const existingResults = await this.getStoredAssessments();
      const updatedResults = [result, ...existingResults.slice(0, 9)]; // Keep last 10
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResults));
      console.log('Assessment result saved locally:', result.id);

      // Also save to Supabase for admin viewing
      await this.saveAssessmentToSupabase(result, consentData);
    } catch (error) {
      console.error('Error saving assessment result:', error);
    }
  }

  // Save assessment to Supabase database
  private async saveAssessmentToSupabase(result: AssessmentResult, consentData?: {
    userEmail: string;
    userPhone: string;
    consentContact: boolean;
    consentDataUse: boolean;
    legalWaiverAccepted: boolean;
    surgeryStatus?: string;
    postOpRegion?: string | null;
    surgeryType?: string | null;
    procedureModifier?: string | null;
    weeksSinceSurgery?: string | null;
    weightBearingStatus?: string | null;
    surgeonPrecautions?: string | null;
    protocolKeySelected?: string | null;
    phaseNumberSelected?: number | null;
  }): Promise<void> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping cloud save');
      return;
    }

    try {
      // Get current user (may be null for anonymous assessments)
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('assessments')
        .insert({
          user_id: user?.id || null,
          user_email: consentData?.userEmail || user?.email || null,
          user_phone: consentData?.userPhone || null,
          pain_level: result.assessment.painLevel,
          pain_location: result.assessment.painLocation,
          pain_duration: result.assessment.painDuration,
          pain_type: result.assessment.painType,
          mechanism_of_injury: result.assessment.mechanismOfInjury,
          medications: result.assessment.medications,
          additional_symptoms: result.assessment.additionalSymptoms,
          red_flags: result.assessment.redFlags,
          location: result.assessment.location,
          risk_level: result.riskLevel,
          next_steps: result.nextSteps,
          recommendations: result.recommendations,
          consent_contact: consentData?.consentContact || false,
          consent_data_use: consentData?.consentDataUse || false,
          legal_waiver_accepted: consentData?.legalWaiverAccepted || false,
          consent_timestamp: consentData ? new Date().toISOString() : null,
          // Post-op data
          surgery_status: consentData?.surgeryStatus || null,
          post_op_region: consentData?.postOpRegion || null,
          surgery_type: consentData?.surgeryType || null,
          procedure_modifier: consentData?.procedureModifier || null,
          weeks_since_surgery: consentData?.weeksSinceSurgery || null,
          weight_bearing_status: consentData?.weightBearingStatus || null,
          surgeon_precautions: consentData?.surgeonPrecautions || null,
          protocol_key_selected: consentData?.protocolKeySelected || null,
          phase_number_selected: consentData?.phaseNumberSelected || null,
        });

      if (error) {
        console.error('Error saving assessment to Supabase:', error);
      } else {
        console.log('Assessment saved to Supabase for user:', consentData?.userEmail || user?.email || 'anonymous');
      }
    } catch (error) {
      console.error('Error saving assessment to Supabase:', error);
    }
  }

  async getStoredAssessments(): Promise<AssessmentResult[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error retrieving stored assessments:', error);
      return [];
    }
  }

  async getLatestAssessment(): Promise<AssessmentResult | null> {
    const assessments = await this.getStoredAssessments();
    return assessments.length > 0 ? assessments[0] : null;
  }

  async clearAssessments(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('Assessment history cleared');
    } catch (error) {
      console.error('Error clearing assessments:', error);
    }
  }
}
