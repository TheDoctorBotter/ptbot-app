interface PainCondition {
  location: string;
  side?: 'left' | 'right' | 'both';
  radiating: boolean;
  painType: string;
  severity: number;
  duration: string;
}

interface YouTubeExercise {
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

interface ExerciseRecommendation {
  exercise: YouTubeExercise;
  relevanceScore: number;
  reasoning: string;
}

export class ExerciseMatchingService {
  private openAIApiKey: string;
  private youtubeApiKey: string;
  private channelId: string;

  constructor(openAIKey: string, youtubeKey: string, channelId: string) {
    this.openAIApiKey = openAIKey;
    this.youtubeApiKey = youtubeKey;
    this.channelId = channelId;
  }

  /**
   * Analyzes user's pain description and returns structured condition data
   */
  async analyzePainCondition(userDescription: string): Promise<PainCondition> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAIApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a physical therapy expert. Analyze the user's pain description and extract structured information. Return ONLY a JSON object with these fields:
              {
                "location": "specific body part (e.g., lower back, neck, shoulder)",
                "side": "left|right|both|null",
                "radiating": boolean (true if pain shoots/radiates to other areas),
                "painType": "sharp|dull|burning|aching|throbbing|tingling|stiffness",
                "severity": number 1-10,
                "duration": "acute|subacute|chronic"
              }`
            },
            {
              role: 'user',
              content: userDescription
            }
          ],
          max_tokens: 200,
          temperature: 0.1,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing pain condition:', error);
      throw new Error('Failed to analyze pain condition');
    }
  }

  /**
   * Fetches exercises from YouTube channel and analyzes them
   */
  async fetchAndAnalyzeYouTubeExercises(): Promise<YouTubeExercise[]> {
    try {
      // Fetch videos from YouTube API
      const youtubeResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${this.channelId}&type=video&maxResults=50&key=${this.youtubeApiKey}`
      );
      
      const youtubeData = await youtubeResponse.json();
      
      // Analyze each video with OpenAI to extract exercise metadata
      const exercises: YouTubeExercise[] = [];
      
      for (const video of youtubeData.items) {
        const analysis = await this.analyzeVideoContent(video);
        if (analysis) {
          exercises.push(analysis);
        }
      }
      
      return exercises;
    } catch (error) {
      console.error('Error fetching YouTube exercises:', error);
      return [];
    }
  }

  /**
   * Analyzes individual video content to extract exercise metadata
   */
  private async analyzeVideoContent(video: any): Promise<YouTubeExercise | null> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAIApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `Analyze this YouTube video title and description for a physical therapy exercise. Extract structured data and return ONLY a JSON object:
              {
                "bodyPart": "primary body part targeted",
                "difficulty": "Beginner|Intermediate|Advanced",
                "keywords": ["array", "of", "relevant", "keywords"],
                "conditions": ["specific conditions this helps with"],
                "isExerciseVideo": boolean (true only if this is actually an exercise/therapy video)
              }`
            },
            {
              role: 'user',
              content: `Title: ${video.snippet.title}\nDescription: ${video.snippet.description}`
            }
          ],
          max_tokens: 300,
          temperature: 0.1,
        }),
      });

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);
      
      if (!analysis.isExerciseVideo) {
        return null;
      }

      return {
        id: video.id.videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        duration: 'Unknown', // Would need additional API call to get duration
        keywords: analysis.keywords,
        bodyPart: analysis.bodyPart,
        difficulty: analysis.difficulty,
        conditions: analysis.conditions,
      };
    } catch (error) {
      console.error('Error analyzing video content:', error);
      return null;
    }
  }

  /**
   * Matches pain condition to relevant exercises
   */
  async findMatchingExercises(
    painCondition: PainCondition,
    availableExercises: YouTubeExercise[]
  ): Promise<ExerciseRecommendation[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAIApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a physical therapy expert. Match the patient's pain condition to the most appropriate exercises. Consider:
              - Body part alignment
              - Pain characteristics (radiating vs localized)
              - Severity level
              - Exercise difficulty appropriateness
              
              Return a JSON array of recommendations with relevanceScore (0-100) and reasoning for each match.`
            },
            {
              role: 'user',
              content: `Pain Condition: ${JSON.stringify(painCondition)}\n\nAvailable Exercises: ${JSON.stringify(availableExercises)}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.2,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error matching exercises:', error);
      return [];
    }
  }

  /**
   * Main function to get exercise recommendations for user input
   */
  async getExerciseRecommendations(userPainDescription: string): Promise<ExerciseRecommendation[]> {
    try {
      // Step 1: Analyze the pain condition
      const painCondition = await this.analyzePainCondition(userPainDescription);
      
      // Step 2: Fetch and analyze YouTube exercises (cache this in production)
      const exercises = await this.fetchAndAnalyzeYouTubeExercises();
      
      // Step 3: Match condition to exercises
      const recommendations = await this.findMatchingExercises(painCondition, exercises);
      
      // Step 4: Sort by relevance score
      return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Error getting exercise recommendations:', error);
      return [];
    }
  }
}

// Example usage function
export const getPersonalizedExercises = async (
  painDescription: string,
  openAIKey: string,
  youtubeKey: string,
  channelId: string
): Promise<ExerciseRecommendation[]> => {
  const service = new ExerciseMatchingService(openAIKey, youtubeKey, channelId);
  return await service.getExerciseRecommendations(painDescription);
};