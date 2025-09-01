export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration?: string;
}

export interface AnalyzedExercise {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  duration: string;
  bodyParts: string[];
  conditions: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  keywords: string[];
  painTypes: string[];
  isExerciseVideo: boolean;
  targetAudience: string[];
  contraindications: string[];
}

export class YouTubeService {
  private apiKey: string;
  private channelId: string;

  constructor(apiKey: string, channelId: string) {
    this.apiKey = apiKey;
    this.channelId = channelId;
  }

  async fetchChannelVideos(maxResults: number = 50): Promise<YouTubeVideo[]> {
    try {
      console.log(`🎥 Fetching ${maxResults} videos from YouTube channel: ${this.channelId}`);
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${this.channelId}&type=video&maxResults=${maxResults}&order=date&key=${this.apiKey}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('YouTube API Error:', errorData);
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.items?.length || 0} videos`);
      
      return data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt,
        duration: 'Unknown', // Will be populated by separate API call if needed
      }));
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      return [];
    }
  }

  async analyzeVideoForExerciseData(video: YouTubeVideo, openAIApiKey: string): Promise<AnalyzedExercise | null> {
    try {
      console.log(`🤖 Analyzing video: ${video.title.substring(0, 50)}...`);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are analyzing a YouTube video from Dr. Justin Lemmo's physical therapy channel. Extract detailed exercise information.

Return ONLY a JSON object with this exact structure:

Return ONLY a JSON object with this exact structure:
{
  "isExerciseVideo": boolean (true only if this is an exercise, stretch, or rehabilitation video),
  "bodyParts": ["specific body parts targeted - be precise"],
  "conditions": ["specific medical conditions this helps: herniated disc, sciatica, etc."],
  "bodyParts": ["specific body parts: neck, upper back, lower back, shoulder, elbow, wrist, hip, knee, ankle, etc."],
  "conditions": ["specific conditions: herniated disc, sciatica, rotator cuff, plantar fasciitis, etc."],
  "difficulty": "Beginner|Intermediate|Advanced",
  "keywords": ["terms patients would search for"],
  "painTypes": ["types of pain addressed"],
  "targetAudience": ["who this is designed for"],
  "contraindications": ["when NOT to do this"],
  "estimatedDuration": "duration in minutes if mentioned, otherwise estimate"
  "contraindications": ["when NOT to do this exercise"],
  "estimatedDuration": "estimated time in minutes"
}

Only return isExerciseVideo: true if this is actually a physical therapy, exercise, or rehabilitation video. Be very specific about body parts and conditions.`
            },
            {
              role: 'user',
              content: `Title: ${video.title}\n\nDescription: ${video.description}`
            }
          ],
          max_tokens: 400,
          temperature: 0.1,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('OpenAI error analyzing video:', data);
        return null;
      }
      
      
      if (!response.ok) {
        console.error('OpenAI API error during video analysis:', data);
        console.error('OpenAI API error:', data);
        return null;
      }

      const analysis = JSON.parse(data.choices[0].message.content);
      
      if (!analysis.isExerciseVideo) {
        console.log(`❌ Not an exercise video: ${video.title}`);
        return null;
      }

      console.log(`✅ Analyzed exercise video: ${video.title}`);
      
      return {
        id: video.id,
        thumbnailUrl: video.snippet.thumbnails.medium.url,
        duration: analysis.estimatedDuration || 'Unknown',
        bodyParts: analysis.bodyParts || [],
        conditions: analysis.conditions || [],
        thumbnailUrl: video.thumbnailUrl,
        duration: analysis.estimatedDuration || 'Unknown',
        bodyParts: analysis.bodyParts || [],
        conditions: analysis.conditions || [],
        difficulty: analysis.difficulty || 'Beginner',
        keywords: analysis.keywords || [],
        painTypes: analysis.painTypes || [],
        targetAudience: analysis.targetAudience || [],
        contraindications: analysis.contraindications || [],
        keywords: analysis.keywords || [],
        painTypes: analysis.painTypes || [],
        targetAudience: analysis.targetAudience || [],
        contraindications: analysis.contraindications || [],
        isExerciseVideo: true,
      };
    } catch (error) {
      console.error('Error analyzing video:', error);
      return null;
    }
  }
}