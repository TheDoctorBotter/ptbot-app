/**
 * Exercise Video Library Service
 *
 * Provides access to the Supabase-backed exercise video library.
 * Includes sections (categories) and YouTube videos with metadata.
 */

import { supabase } from '@/lib/supabase';

// ============================================
// Types
// ============================================

export interface ExerciseSection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  display_order: number;
}

export interface ExerciseVideo {
  id: string;
  section_id: string;
  youtube_video_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
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
  is_featured: boolean;
}

export interface UserSavedExercise {
  id: string;
  video_id: string;
  notes: string | null;
  created_at: string;
  video?: ExerciseVideo;
}

// ============================================
// YouTube URL Helpers
// ============================================

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validate that a string is a valid YouTube video ID
 */
export function isValidYouTubeVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

/**
 * Get YouTube embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Get YouTube watch URL
 */
export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'
): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

// ============================================
// Service Class
// ============================================

export class ExerciseVideoService {
  private static instance: ExerciseVideoService;

  private constructor() {}

  static getInstance(): ExerciseVideoService {
    if (!ExerciseVideoService.instance) {
      ExerciseVideoService.instance = new ExerciseVideoService();
    }
    return ExerciseVideoService.instance;
  }

  /**
   * Check if Supabase client is available
   */
  private ensureSupabase() {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check environment configuration.');
    }
    return supabase;
  }

  // ============================================
  // Sections
  // ============================================

  /**
   * Get all active exercise sections
   */
  async getSections(): Promise<ExerciseSection[]> {
    const client = this.ensureSupabase();

    const { data, error } = await client
      .from('exercise_sections')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching sections:', error);
      throw new Error('Failed to load exercise sections');
    }

    return data || [];
  }

  /**
   * Get a section by slug
   */
  async getSectionBySlug(slug: string): Promise<ExerciseSection | null> {
    const client = this.ensureSupabase();

    const { data, error } = await client
      .from('exercise_sections')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching section:', error);
      throw new Error('Failed to load section');
    }

    return data;
  }

  // ============================================
  // Videos
  // ============================================

  /**
   * Get videos for a section
   */
  async getVideosBySection(sectionId: string): Promise<ExerciseVideo[]> {
    const client = this.ensureSupabase();

    const { data, error } = await client
      .from('exercise_videos')
      .select('*')
      .eq('section_id', sectionId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching videos:', error);
      throw new Error('Failed to load videos');
    }

    return data || [];
  }

  /**
   * Get featured videos
   */
  async getFeaturedVideos(): Promise<ExerciseVideo[]> {
    const client = this.ensureSupabase();

    const { data, error } = await client
      .from('exercise_videos')
      .select('*')
      .eq('is_featured', true)
      .order('display_order', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching featured videos:', error);
      throw new Error('Failed to load featured videos');
    }

    return data || [];
  }

  /**
   * Search videos by keyword, body part, or condition
   */
  async searchVideos(query: string): Promise<ExerciseVideo[]> {
    const client = this.ensureSupabase();
    const searchTerm = query.toLowerCase().trim();

    const { data, error } = await client
      .from('exercise_videos')
      .select('*')
      .or(
        `title.ilike.%${searchTerm}%,` +
        `description.ilike.%${searchTerm}%,` +
        `body_parts.cs.{${searchTerm}},` +
        `conditions.cs.{${searchTerm}},` +
        `keywords.cs.{${searchTerm}}`
      )
      .limit(20);

    if (error) {
      console.error('Error searching videos:', error);
      throw new Error('Failed to search videos');
    }

    return data || [];
  }

  /**
   * Get videos by body part
   */
  async getVideosByBodyPart(bodyPart: string): Promise<ExerciseVideo[]> {
    const client = this.ensureSupabase();

    const { data, error } = await client
      .from('exercise_videos')
      .select('*')
      .contains('body_parts', [bodyPart.toLowerCase()])
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching videos by body part:', error);
      throw new Error('Failed to load videos');
    }

    return data || [];
  }

  /**
   * Get a single video by ID
   */
  async getVideoById(videoId: string): Promise<ExerciseVideo | null> {
    const client = this.ensureSupabase();

    const { data, error } = await client
      .from('exercise_videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching video:', error);
      throw new Error('Failed to load video');
    }

    return data;
  }

  // ============================================
  // User Saved Exercises
  // ============================================

  /**
   * Get user's saved exercises
   */
  async getUserSavedExercises(): Promise<UserSavedExercise[]> {
    const client = this.ensureSupabase();

    const { data, error } = await client
      .from('user_saved_exercises')
      .select(`
        *,
        video:exercise_videos(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved exercises:', error);
      throw new Error('Failed to load saved exercises');
    }

    return data || [];
  }

  /**
   * Save an exercise to user's list
   */
  async saveExercise(videoId: string, notes?: string): Promise<void> {
    const client = this.ensureSupabase();

    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      throw new Error('Must be logged in to save exercises');
    }

    const { error } = await client.from('user_saved_exercises').upsert({
      user_id: user.id,
      video_id: videoId,
      notes: notes || null,
    });

    if (error) {
      console.error('Error saving exercise:', error);
      throw new Error('Failed to save exercise');
    }
  }

  /**
   * Remove an exercise from user's saved list
   */
  async unsaveExercise(videoId: string): Promise<void> {
    const client = this.ensureSupabase();

    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      throw new Error('Must be logged in to unsave exercises');
    }

    const { error } = await client
      .from('user_saved_exercises')
      .delete()
      .eq('user_id', user.id)
      .eq('video_id', videoId);

    if (error) {
      console.error('Error unsaving exercise:', error);
      throw new Error('Failed to unsave exercise');
    }
  }

  /**
   * Check if an exercise is saved
   */
  async isExerciseSaved(videoId: string): Promise<boolean> {
    const client = this.ensureSupabase();

    const { data: { user } } = await client.auth.getUser();
    if (!user) return false;

    const { data, error } = await client
      .from('user_saved_exercises')
      .select('id')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .maybeSingle();

    if (error) {
      console.error('Error checking saved status:', error);
      return false;
    }

    return data !== null;
  }
}

// Export singleton instance
export const exerciseVideoService = ExerciseVideoService.getInstance();
