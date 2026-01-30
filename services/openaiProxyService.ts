/**
 * OpenAI Proxy Service
 *
 * This service routes all OpenAI API calls through a secure server-side proxy
 * (Supabase Edge Function) to prevent API key exposure on the client.
 */

import { supabase } from '../lib/supabase';

// Get Supabase URL from environment
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  (typeof globalThis !== 'undefined' &&
    (globalThis as any).import?.meta?.env?.VITE_SUPABASE_URL) ||
  '';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  action: 'chat';
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

interface SafetyNotesRequest {
  action: 'safety-notes';
  assessment: {
    painLevel: number;
    painLocation: string;
    painType: string;
    painDuration: string;
    additionalSymptoms: string[];
  };
  exercise: {
    title: string;
    description: string;
    difficulty: string;
    bodyParts: string[];
    contraindications: string[];
  };
}

interface VideoAnalysisRequest {
  action: 'video-analysis';
  video: {
    title: string;
    description: string;
  };
}

type ProxyRequest = ChatRequest | SafetyNotesRequest | VideoAnalysisRequest;

interface ProxyResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIProxyService {
  private static instance: OpenAIProxyService;

  private constructor() {}

  static getInstance(): OpenAIProxyService {
    if (!OpenAIProxyService.instance) {
      OpenAIProxyService.instance = new OpenAIProxyService();
    }
    return OpenAIProxyService.instance;
  }

  private async getAccessToken(): Promise<string | null> {
    if (!supabase) {
      console.warn('[OpenAIProxy] Supabase client not initialized');
      return null;
    }

    try {
      // First try getSession
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('[OpenAIProxy] getSession error:', error.message);
      }

      if (session?.access_token) {
        return session.access_token;
      }

      // Fallback: try to get user (which also refreshes the session)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Session should be available now
        const { data: { session: refreshedSession } } = await supabase.auth.getSession();
        return refreshedSession?.access_token || null;
      }

      console.warn('[OpenAIProxy] No session or user found');
      return null;
    } catch (err) {
      console.error('[OpenAIProxy] Error getting access token:', err);
      return null;
    }
  }

  private async callProxy(request: ProxyRequest): Promise<ProxyResponse> {
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('User not authenticated. Please sign in to use this feature.');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/openai-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(data.error || 'Rate limit exceeded. Please wait a moment before trying again.');
      }
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in to continue.');
      }
      throw new Error(data.error || 'Failed to get response from AI service');
    }

    return data as ProxyResponse;
  }

  /**
   * Send a chat completion request through the proxy
   */
  async chat(
    messages: ChatMessage[],
    options?: { max_tokens?: number; temperature?: number }
  ): Promise<string> {
    const response = await this.callProxy({
      action: 'chat',
      messages,
      max_tokens: options?.max_tokens,
      temperature: options?.temperature,
    });
    return response.content;
  }

  /**
   * Generate safety notes for an exercise based on patient assessment
   */
  async generateSafetyNotes(
    assessment: SafetyNotesRequest['assessment'],
    exercise: SafetyNotesRequest['exercise']
  ): Promise<string[]> {
    const response = await this.callProxy({
      action: 'safety-notes',
      assessment,
      exercise,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      console.warn('[OpenAIProxy] Failed to parse safety notes JSON, returning default');
      return ['Consult with a healthcare provider before starting this exercise'];
    }
  }

  /**
   * Analyze a YouTube video for exercise data
   */
  async analyzeVideo(video: VideoAnalysisRequest['video']): Promise<{
    isExerciseVideo: boolean;
    bodyParts: string[];
    conditions: string[];
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    keywords: string[];
    painTypes: string[];
    targetAudience: string[];
    contraindications: string[];
    estimatedDuration: string;
  } | null> {
    const response = await this.callProxy({
      action: 'video-analysis',
      video,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      console.warn('[OpenAIProxy] Failed to parse video analysis JSON');
      return null;
    }
  }
}

// Export singleton instance for convenience
export const openaiProxy = OpenAIProxyService.getInstance();
