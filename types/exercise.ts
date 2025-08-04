export interface PainCondition {
  location: string;
  side?: 'left' | 'right' | 'both';
  radiating: boolean;
  painType: string;
  severity: number;
  duration: string;
}

export interface YouTubeExercise {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: string;
  keywords: string[];
  bodyPart: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  conditions: string[];
}

export interface ExerciseRecommendation {
  exercise: YouTubeExercise;
  relevanceScore: number;
  reasoning: string;
}

export interface ExerciseMatchingConfig {
  openAIApiKey: string;
  youtubeApiKey: string;
  channelId: string;
}