import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  exerciseLibrary,
  getExercisesByBodyPart,
  getExercisesByPainLevel,
  scoreExercises,
  type LibraryExercise,
  type ExerciseDosage,
} from '@/data/exerciseLibrary';

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

const STORAGE_KEY = 'ptbot_assessments';

export class AssessmentService {
  constructor() {
    // No external API keys needed - uses deterministic library
  }

  async processAssessment(assessmentData: AssessmentData): Promise<AssessmentResult> {
    try {
      console.log('🔍 Processing comprehensive assessment...');

      // Determine risk level based on red flags and pain severity
      const riskLevel = this.calculateRiskLevel(assessmentData);

      // Generate exercise recommendations if safe to do so
      let recommendations: ExerciseRecommendation[] = [];

      if (riskLevel !== 'critical') {
        recommendations = this.generateExerciseRecommendations(assessmentData);
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

  private generateExerciseRecommendations(assessment: AssessmentData): ExerciseRecommendation[] {
    // Step 1: Get exercises for the body part
    let candidates = getExercisesByBodyPart(assessment.painLocation);

    // If no specific matches, fall back to general exercises
    if (candidates.length === 0) {
      console.log(`No exercises found for ${assessment.painLocation}, using general recommendations`);
      candidates = exerciseLibrary.filter((ex) => ex.difficulty === 'Beginner');
    }

    // Step 2: Filter by pain level safety
    candidates = getExercisesByPainLevel(candidates, assessment.painLevel);

    // Step 3: Score and rank exercises
    const scored = scoreExercises(candidates, {
      bodyPart: assessment.painLocation,
      painLevel: assessment.painLevel,
      painType: assessment.painType,
      painDuration: assessment.painDuration,
      symptoms: assessment.additionalSymptoms,
    });

    // Step 4: Take top 3-5 recommendations
    const topExercises = scored.filter((s) => s.score >= 40).slice(0, 5);

    // Ensure we have at least 3 exercises if available
    const finalExercises =
      topExercises.length >= 3 ? topExercises : scored.slice(0, Math.min(3, scored.length));

    // Step 5: Build recommendations with dosage and safety info
    const recommendations: ExerciseRecommendation[] = finalExercises.map((scored) => {
      const { exercise, matchReasons } = scored;

      // Generate safety notes based on assessment
      const safetyNotes = this.generateSafetyNotes(assessment, exercise);

      return {
        exercise: {
          id: exercise.id,
          name: exercise.name,
          description: exercise.description,
          videoUrl: exercise.videoUrl,
          thumbnailUrl: exercise.thumbnailUrl,
          bodyParts: exercise.bodyParts,
          difficulty: exercise.difficulty,
          category: exercise.category,
        },
        dosage: exercise.dosage,
        relevanceScore: scored.score,
        reasoning: matchReasons.join('. '),
        safetyNotes,
        redFlagWarnings: exercise.redFlagWarnings,
        progressionTips: exercise.progressionTips,
      };
    });

    return recommendations;
  }

  private generateSafetyNotes(assessment: AssessmentData, exercise: LibraryExercise): string[] {
    const notes: string[] = [];

    // Pain level specific guidance
    if (assessment.painLevel >= 7) {
      notes.push('Start very gently and reduce intensity if pain increases above baseline.');
    } else if (assessment.painLevel >= 5) {
      notes.push('Perform within pain-free range. Stop if pain significantly worsens.');
    }

    // Include exercise-specific contraindications
    if (exercise.contraindications.length > 0) {
      notes.push(`Avoid this exercise if you have: ${exercise.contraindications.join(', ')}.`);
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
