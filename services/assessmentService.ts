import { ExerciseRecommendationService } from './exerciseRecommendationService';
import type { AnalyzedExercise } from './youtubeService';

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

export interface AssessmentResult {
  id: string;
  assessment: AssessmentData;
  recommendations: ExerciseRecommendation[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  nextSteps: string[];
}

export interface ExerciseRecommendation {
  exercise: AnalyzedExercise;
  relevanceScore: number;
  reasoning: string;
  safetyNotes: string[];
}

export class AssessmentService {
  private exerciseService: ExerciseRecommendationService;
  private openAIApiKey: string;

  constructor(openAIApiKey: string, youtubeApiKey: string, channelId: string) {
    this.openAIApiKey = openAIApiKey;
    this.exerciseService = new ExerciseRecommendationService(openAIApiKey, youtubeApiKey, channelId);
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
        'Progressive neurological deficits',
        'Weakness in both legs',
        'Severe night pain'
      ];
      
      if (assessment.additionalSymptoms.some(symptom => 
        concerningSymptoms.some(concerning => symptom.includes(concerning))
      )) {
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
    try {
      // Create a comprehensive pain description for the AI
      const painDescription = this.createPainDescription(assessment);
      
      // Use the exercise recommendation service to find matches
      const matches = await this.exerciseService.findMatchingExercises({
        description: painDescription,
        painLevel: assessment.painLevel,
        location: assessment.painLocation,
        painType: assessment.painType,
        duration: assessment.painDuration,
      });

      // Convert matches to recommendations with safety notes
      const recommendations: ExerciseRecommendation[] = await Promise.all(
        matches.map(async (match) => {
          const safetyNotes = await this.generateSafetyNotes(assessment, match.exercise);
          return {
            exercise: match.exercise,
            relevanceScore: match.relevanceScore,
            reasoning: match.reasoning,
            safetyNotes,
          };
        })
      );

      return recommendations.slice(0, 5); // Return top 5 recommendations
    } catch (error) {
      console.error('Error generating exercise recommendations:', error);
      return [];
    }
  }

  private createPainDescription(assessment: AssessmentData): string {
    let description = `I have ${assessment.painType} pain in my ${assessment.painLocation}`;
    
    if (assessment.painLevel > 0) {
      description += ` with severity ${assessment.painLevel}/10`;
    }
    
    if (assessment.painDuration) {
      description += ` for ${assessment.painDuration}`;
    }
    
    if (assessment.mechanismOfInjury) {
      description += `. It started from: ${assessment.mechanismOfInjury}`;
    }
    
    if (assessment.additionalSymptoms.length > 0) {
      description += `. Additional symptoms: ${assessment.additionalSymptoms.join(', ')}`;
    }

    return description;
  }

  private async generateSafetyNotes(assessment: AssessmentData, exercise: AnalyzedExercise): Promise<string[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAIApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a physical therapy expert. Generate specific safety notes for this exercise based on the patient's condition. Return ONLY a JSON array of safety notes:
              
              ["safety note 1", "safety note 2", "safety note 3"]
              
              Focus on:
              - Modifications for their pain level
              - Precautions for their specific symptoms
              - When to stop the exercise
              - Progression guidelines
              
              Keep each note concise and actionable.`
            },
            {
              role: 'user',
              content: `Patient Assessment:
              Pain Level: ${assessment.painLevel}/10
              Location: ${assessment.painLocation}
              Pain Type: ${assessment.painType}
              Duration: ${assessment.painDuration}
              Additional Symptoms: ${assessment.additionalSymptoms.join(', ')}
              
              Exercise: ${exercise.title}
              Description: ${exercise.description}
              Difficulty: ${exercise.difficulty}
              Target Body Parts: ${exercise.bodyParts.join(', ')}
              Contraindications: ${exercise.contraindications.join(', ')}`
            }
          ],
          max_tokens: 200,
          temperature: 0.1,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error generating safety notes:', data);
        return ['Consult with a healthcare provider before starting this exercise'];
      }

      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error generating safety notes:', error);
      return ['Consult with a healthcare provider before starting this exercise'];
    }
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
        steps.push('📱 Follow recommended exercises in the Exercises tab');
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

  // Store assessment results locally (in real app, this would go to database)
  saveAssessmentResult(result: AssessmentResult): void {
    try {
      const existingResults = this.getStoredAssessments();
      const updatedResults = [result, ...existingResults.slice(0, 9)]; // Keep last 10
      
      // In a real app, this would be saved to a database
      console.log('Assessment result saved:', result.id);
      
      // For now, we'll just log it
      localStorage?.setItem('ptbot_assessments', JSON.stringify(updatedResults));
    } catch (error) {
      console.error('Error saving assessment result:', error);
    }
  }

  getStoredAssessments(): AssessmentResult[] {
    try {
      const stored = localStorage?.getItem('ptbot_assessments');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error retrieving stored assessments:', error);
      return [];
    }
  }

  getLatestAssessment(): AssessmentResult | null {
    const assessments = this.getStoredAssessments();
    return assessments.length > 0 ? assessments[0] : null;
  }
}