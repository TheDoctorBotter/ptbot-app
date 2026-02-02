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

const STORAGE_KEY = 'ptbot_assessments';

export class AssessmentService {
  constructor() {
    // Uses Supabase for exercise data
  }

  async processAssessment(assessmentData: AssessmentData): Promise<AssessmentResult> {
    try {
      console.log('🔍 Processing comprehensive assessment...');

      // Determine risk level based on red flags and pain severity
      const riskLevel = this.calculateRiskLevel(assessmentData);

      // Generate exercise recommendations if safe to do so
      let recommendations: ExerciseRecommendation[] = [];

      if (riskLevel !== 'critical') {
        recommendations = await this.generateExerciseRecommendations(assessmentData);
      }

      // Generate next steps based on assessment
      const nextSteps = this.generateNextSteps(assessmentData, riskLevel);

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

  private generateNextSteps(assessment: AssessmentData, riskLevel: string): string[] {
    const steps: string[] = [];

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

  // Store assessment results using AsyncStorage (React Native compatible)
  async saveAssessmentResult(result: AssessmentResult): Promise<void> {
    try {
      const existingResults = await this.getStoredAssessments();
      const updatedResults = [result, ...existingResults.slice(0, 9)]; // Keep last 10

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResults));
      console.log('Assessment result saved:', result.id);
    } catch (error) {
      console.error('Error saving assessment result:', error);
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
