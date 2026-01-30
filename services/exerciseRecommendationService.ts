import { YouTubeService } from './youtubeService';
import type { AnalyzedExercise } from './youtubeService';
import { openaiProxy } from './openaiProxyService';

interface ExerciseMatch {
  exercise: AnalyzedExercise;
  relevanceScore: number;
  reasoning: string;
}

interface UserPainProfile {
  description: string;
  painLevel: number;
  location: string;
  painType: string;
  duration: string;
}

export class ExerciseRecommendationService {
  private youtubeService: YouTubeService;
  private openAIApiKey: string;
  private exerciseCache: AnalyzedExercise[] = [];
  private cacheExpiry: number = 0;

  constructor(openAIApiKey: string, youtubeApiKey: string, channelId: string) {
    this.openAIApiKey = openAIApiKey;
    this.youtubeService = new YouTubeService(youtubeApiKey, channelId);
  }

  async getAnalyzedExercises(): Promise<AnalyzedExercise[]> {
    // Check cache (valid for 1 hour)
    const now = Date.now();
    if (this.exerciseCache.length > 0 && now < this.cacheExpiry) {
      return this.exerciseCache;
    }

    try {
      console.log('Fetching and analyzing YouTube videos...');
      
      // Fetch videos from YouTube
      const videos = await this.youtubeService.fetchChannelVideos(30);
      console.log(`Found ${videos.length} videos from channel`);

      // Analyze each video with AI
      const analyzedExercises: AnalyzedExercise[] = [];
      
      for (const video of videos) {
        const analysis = await this.youtubeService.analyzeVideoForExerciseData(video, this.openAIApiKey);
        if (analysis) {
          analyzedExercises.push(analysis);
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Analyzed ${analyzedExercises.length} exercise videos`);

      // Cache results for 1 hour
      this.exerciseCache = analyzedExercises;
      this.cacheExpiry = now + (60 * 60 * 1000);

      return analyzedExercises;
    } catch (error) {
      console.error('Error getting analyzed exercises:', error);
      return [];
    }
  }

  async findMatchingExercises(userPain: UserPainProfile): Promise<ExerciseMatch[]> {
    try {
      console.log('🎯 Finding matching exercises for user pain profile...');

      const exercises = await this.getAnalyzedExercises();

      if (exercises.length === 0) {
        console.log('No exercises available for matching');
        return [];
      }

      console.log(`Matching user pain profile against ${exercises.length} exercises`);

      const systemPrompt = `You are a physical therapy expert working with Dr. Justin Lemmo's exercise videos. Match the user's pain description to the most relevant exercises.

Scoring Criteria (0-100):
- Body part match (40 points): Exact body part alignment
- Pain type compatibility (25 points): Exercise addresses their specific pain type
- Condition match (20 points): Exercise targets their specific condition
- Difficulty appropriateness (10 points): Suitable for their pain level
- Keyword relevance (5 points): Keywords match their description

IMPORTANT:
- Only recommend exercises that are SAFE for their condition
- Consider contraindications carefully
- Higher pain levels (8-10) should get gentler, beginner exercises
- Lower pain levels (1-4) can handle more challenging exercises

Return a JSON array of the top 3-5 most relevant exercises:
[
  {
    "exerciseId": "video_id",
    "relevanceScore": number (0-100),
    "reasoning": "specific explanation of why this exercise matches their symptoms and is safe for them"
  }
]

Only include exercises with relevanceScore >= 70. Sort by relevanceScore descending.`;

      const userContent = `Patient Pain Profile:
Description: "${userPain.description}"
Pain Level: ${userPain.painLevel}/10
Location: ${userPain.location}
Pain Type: ${userPain.painType}
Duration: ${userPain.duration}

Available Dr. Lemmo Exercise Videos:
${exercises.map(ex => `
ID: ${ex.id}
Title: ${ex.title}
Description: ${ex.description.substring(0, 200)}...
Body Parts: ${ex.bodyParts.join(', ')}
Conditions: ${ex.conditions.join(', ')}
Pain Types: ${ex.painTypes.join(', ')}
Keywords: ${ex.keywords.join(', ')}
Difficulty: ${ex.difficulty}
Duration: ${ex.duration}
Target Audience: ${ex.targetAudience.join(', ')}
Contraindications: ${ex.contraindications.join(', ')}
`).join('\n---\n')}`;

      const responseContent = await openaiProxy.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        { max_tokens: 1000, temperature: 0.2 }
      );

      const matches = JSON.parse(responseContent);

      // Map the matches back to full exercise objects
      const exerciseMatches: ExerciseMatch[] = matches.map((match: any) => {
        const exercise = exercises.find(ex => ex.id === match.exerciseId);
        return exercise ? {
          exercise,
          relevanceScore: match.relevanceScore,
          reasoning: match.reasoning,
        } : null;
      }).filter(Boolean);

      console.log(`Found ${exerciseMatches.length} matching exercises`);
      return exerciseMatches;

    } catch (error) {
      console.error('Error finding matching exercises:', error);
      return [];
    }
  }

  async getExerciseRecommendationsFromChat(chatMessage: string): Promise<ExerciseMatch[]> {
    try {
      console.log('💬 Analyzing chat message for pain information...');

      const systemPrompt = `You are a medical AI assistant. Extract pain and symptom information from the user's message. Be thorough in identifying any mentions of:
- Body parts or anatomical locations
- Pain descriptions or symptoms
- Activities that cause pain
- Duration or timing of symptoms
- Previous injuries or conditions

Return ONLY a JSON object:
{
  "hasPainDescription": boolean (true if ANY pain/symptom/body part is mentioned),
  "painLevel": number (1-10, estimate based on severity described, default 5 if unclear),
  "location": "specific body part mentioned (be precise: lower back, neck, shoulder, etc.)",
  "painType": "sharp|dull|aching|burning|stiffness|tingling|throbbing|cramping|shooting",
  "duration": "acute|subacute|chronic|unknown",
  "triggers": "what makes it worse or better",
  "additionalSymptoms": ["other symptoms mentioned"]
}`;

      const responseContent = await openaiProxy.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: chatMessage },
        ],
        { max_tokens: 300, temperature: 0.1 }
      );

      const painProfile = JSON.parse(responseContent);
      console.log('🔍 Extracted pain profile:', painProfile);

      if (!painProfile.hasPainDescription) {
        console.log('❌ No pain description found in message');
        return [];
      }

      // Convert to UserPainProfile format
      const userPain: UserPainProfile = {
        description: chatMessage,
        painLevel: painProfile.painLevel || 5,
        location: painProfile.location || 'unknown',
        painType: painProfile.painType || 'unknown',
        duration: painProfile.duration || 'unknown',
      };

      console.log('🎯 Searching for matching exercises...');
      return await this.findMatchingExercises(userPain);
    } catch (error) {
      console.error('Error getting exercise recommendations from chat:', error);
      return [];
    }
  }
}