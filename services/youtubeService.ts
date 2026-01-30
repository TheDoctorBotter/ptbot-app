import { openaiProxy } from './openaiProxyService';

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
        duration: 'Unknown',
      }));
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      return [];
    }
  }

  async analyzeVideoForExerciseData(video: YouTubeVideo, _openAIApiKey?: string): Promise<AnalyzedExercise | null> {
    try {
      console.log(`🤖 Analyzing video: ${video.title.substring(0, 50)}...`);

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

      const analysis = await openaiProxy.analyzeVideo({
        title: video.title,
        description: video.description,
      });

      if (!analysis || !analysis.isExerciseVideo) {
        console.log(`❌ Not an exercise video: ${video.title}`);
        return null;
      }

      console.log(`✅ Analyzed exercise video: ${video.title}`);

      return {
        id: video.id,
        title: video.title,
        description: video.description,
        url: video.url,
        thumbnailUrl: video.thumbnailUrl,
        duration: analysis.estimatedDuration || 'Unknown',
        bodyParts: analysis.bodyParts || [],
        conditions: analysis.conditions || [],
        difficulty: analysis.difficulty || 'Beginner',
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