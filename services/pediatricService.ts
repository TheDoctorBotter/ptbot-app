/**
 * Pediatric Development Service
 *
 * Handles all data-fetching for pediatric mode:
 * age groups, concerns, milestones, exercise videos, programs, child profiles.
 */

import { supabase } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

export interface PediatricAgeGroup {
  id: string;
  age_key: string;
  display_name: string;
  min_months: number;
  max_months: number;
  display_order: number;
}

export interface PediatricConcern {
  id: string;
  concern_key: string;
  display_name: string;
  description: string | null;
  red_flags: string[];
  display_order: number;
  is_active: boolean;
}

export interface PediatricMilestone {
  id: string;
  age_group_id: string;
  milestone_key: string;
  display_name: string;
  description: string | null;
  expected_by_month: number;
  concern_if_missing_by_month: number;
  red_flag: boolean;
  display_order: number;
  category?: string;
  age_equivalent_months?: number;
  age_group?: PediatricAgeGroup;
}

export interface PediatricExerciseVideo {
  id: string;
  concern_id: string;
  age_group_id: string;
  title: string;
  description: string | null;
  coaching_cues: string[];
  safety_notes: string[];
  youtube_video_id: string | null;
  display_order: number;
  is_active: boolean;
  // joined fields
  concern?: PediatricConcern;
  age_group?: PediatricAgeGroup;
}

export interface PediatricProgram {
  id: string;
  program_key: string;
  display_name: string;
  age_group_id: string;
  primary_concern_id: string;
  description: string | null;
  display_order: number;
  age_group?: PediatricAgeGroup;
  concern?: PediatricConcern;
}

export interface PediatricProfile {
  id: string;
  user_id: string;
  child_name: string;
  birthdate: string | null;
  age_group_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  age_group?: PediatricAgeGroup;
}

export interface MilestoneTracking {
  id: string;
  user_id: string;
  pediatric_profile_id: string;
  milestone_id: string;
  is_met: boolean;
  met_date: string | null;
  notes: string | null;
  score?: number;
}

export interface AssessmentResult {
  id: string;
  user_id: string;
  pediatric_profile_id: string;
  assessment_date: string;
  raw_score: number;
  age_equivalent_months: number;
  category_scores: Record<string, { raw: number; max: number }>;
  milestones_snapshot: Record<string, number>;
  notes: string | null;
  created_at: string;
}

// ── Queries ────────────────────────────────────────────────────────────────

export async function fetchAgeGroups(): Promise<PediatricAgeGroup[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pediatric_age_groups')
    .select('*')
    .order('display_order');
  if (error) { console.warn('[pediatricService] fetchAgeGroups:', error.message); return []; }
  return data ?? [];
}

export async function fetchConcerns(): Promise<PediatricConcern[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pediatric_concerns')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) { console.warn('[pediatricService] fetchConcerns:', error.message); return []; }
  return data ?? [];
}

export async function fetchMilestonesByAgeGroup(ageGroupId: string): Promise<PediatricMilestone[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pediatric_milestones')
    .select('*')
    .eq('age_group_id', ageGroupId)
    .order('display_order');
  if (error) { console.warn('[pediatricService] fetchMilestones:', error.message); return []; }
  return data ?? [];
}

export async function fetchAllMilestones(): Promise<PediatricMilestone[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pediatric_milestones')
    .select('*')
    .order('display_order');
  if (error) { console.warn('[pediatricService] fetchAllMilestones:', error.message); return []; }
  return data ?? [];
}

export async function fetchVideosByConcern(concernId: string): Promise<PediatricExerciseVideo[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pediatric_exercise_videos')
    .select('*, age_group:pediatric_age_groups(*)')
    .eq('concern_id', concernId)
    .eq('is_active', true)
    .order('display_order');
  if (error) { console.warn('[pediatricService] fetchVideosByConcern:', error.message); return []; }
  return data ?? [];
}

export async function fetchVideosByAgeGroup(ageGroupId: string): Promise<PediatricExerciseVideo[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pediatric_exercise_videos')
    .select('*, concern:pediatric_concerns(*)')
    .eq('age_group_id', ageGroupId)
    .eq('is_active', true)
    .order('display_order');
  if (error) { console.warn('[pediatricService] fetchVideosByAgeGroup:', error.message); return []; }
  return data ?? [];
}

export async function fetchVideosByConcernAndAge(
  concernId: string,
  ageGroupId: string
): Promise<PediatricExerciseVideo[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pediatric_exercise_videos')
    .select('*, concern:pediatric_concerns(*), age_group:pediatric_age_groups(*)')
    .eq('concern_id', concernId)
    .eq('age_group_id', ageGroupId)
    .eq('is_active', true)
    .order('display_order');
  if (error) { console.warn('[pediatricService] fetchVideosByConcernAndAge:', error.message); return []; }
  return data ?? [];
}

// ── Child Profiles ─────────────────────────────────────────────────────────

export async function fetchChildProfiles(): Promise<PediatricProfile[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('pediatric_profiles')
    .select('*, age_group:pediatric_age_groups(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) { console.warn('[pediatricService] fetchChildProfiles:', error.message); return []; }
  return data ?? [];
}

export async function createChildProfile(
  childName: string,
  birthdate: string | null,
  ageGroupId: string | null,
  notes: string | null
): Promise<PediatricProfile | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('pediatric_profiles')
    .insert({
      user_id: user.id,
      child_name: childName,
      birthdate,
      age_group_id: ageGroupId,
      notes,
    })
    .select('*, age_group:pediatric_age_groups(*)')
    .single();
  if (error) { console.warn('[pediatricService] createChildProfile:', error.message); return null; }
  return data;
}

export async function updateChildProfile(
  profileId: string,
  updates: { child_name?: string; birthdate?: string | null; age_group_id?: string | null; notes?: string | null }
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('pediatric_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', profileId);
  if (error) { console.warn('[pediatricService] updateChildProfile:', error.message); return false; }
  return true;
}

export async function deleteChildProfile(profileId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('pediatric_profiles')
    .delete()
    .eq('id', profileId);
  if (error) { console.warn('[pediatricService] deleteChildProfile:', error.message); return false; }
  return true;
}

// ── Milestone Tracking ─────────────────────────────────────────────────────

export async function fetchMilestoneTracking(profileId: string): Promise<MilestoneTracking[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pediatric_milestone_tracking')
    .select('*')
    .eq('pediatric_profile_id', profileId);
  if (error) { console.warn('[pediatricService] fetchMilestoneTracking:', error.message); return []; }
  return data ?? [];
}

export async function toggleMilestone(
  profileId: string,
  milestoneId: string,
  isMet: boolean
): Promise<boolean> {
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('pediatric_milestone_tracking')
    .upsert({
      user_id: user.id,
      pediatric_profile_id: profileId,
      milestone_id: milestoneId,
      is_met: isMet,
      met_date: isMet ? new Date().toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'pediatric_profile_id,milestone_id' });
  if (error) { console.warn('[pediatricService] toggleMilestone:', error.message); return false; }
  return true;
}

// ── Saved Videos ───────────────────────────────────────────────────────────

export async function fetchSavedVideos(): Promise<PediatricExerciseVideo[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('pediatric_saved_videos')
    .select('exercise_video_id, pediatric_exercise_videos(*, concern:pediatric_concerns(*), age_group:pediatric_age_groups(*))')
    .eq('user_id', user.id);
  if (error) { console.warn('[pediatricService] fetchSavedVideos:', error.message); return []; }

  return (data ?? [])
    .map((row: any) => row.pediatric_exercise_videos)
    .filter(Boolean);
}

export async function saveVideo(videoId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('pediatric_saved_videos')
    .insert({ user_id: user.id, exercise_video_id: videoId });
  if (error) { console.warn('[pediatricService] saveVideo:', error.message); return false; }
  return true;
}

export async function unsaveVideo(videoId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('pediatric_saved_videos')
    .delete()
    .eq('user_id', user.id)
    .eq('exercise_video_id', videoId);
  if (error) { console.warn('[pediatricService] unsaveVideo:', error.message); return false; }
  return true;
}

// ── Assessment Flow ───────────────────────────────────────────────────────

/** Fetch only the simplified milestone set (simple_ prefix), sorted by expected month */
export async function fetchSimplifiedMilestones(): Promise<PediatricMilestone[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pediatric_milestones')
    .select('*, age_group:pediatric_age_groups(*)')
    .like('milestone_key', 'simple_%')
    .order('expected_by_month', { ascending: true })
    .order('display_order', { ascending: true });
  if (error) { console.warn('[pediatricService] fetchSimplifiedMilestones:', error.message); return []; }
  return data ?? [];
}

export async function fetchAllMilestonesSorted(): Promise<PediatricMilestone[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pediatric_milestones')
    .select('*, age_group:pediatric_age_groups(*)')
    .order('age_equivalent_months', { ascending: true })
    .order('display_order', { ascending: true });
  if (error) { console.warn('[pediatricService] fetchAllMilestonesSorted:', error.message); return []; }
  return data ?? [];
}

export async function saveMilestoneScore(
  profileId: string,
  milestoneId: string,
  score: number
): Promise<boolean> {
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('pediatric_milestone_tracking')
    .upsert({
      user_id: user.id,
      pediatric_profile_id: profileId,
      milestone_id: milestoneId,
      is_met: score === 2,
      score,
      met_date: score === 2 ? new Date().toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'pediatric_profile_id,milestone_id' });
  if (error) { console.warn('[pediatricService] saveMilestoneScore:', error.message); return false; }
  return true;
}

export async function saveAssessmentResult(
  profileId: string,
  rawScore: number,
  ageEquivalentMonths: number,
  categoryScores: Record<string, { raw: number; max: number }>,
  milestonesSnapshot: Record<string, number>,
  notes?: string
): Promise<AssessmentResult | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('pediatric_assessment_results')
    .insert({
      user_id: user.id,
      pediatric_profile_id: profileId,
      raw_score: rawScore,
      age_equivalent_months: ageEquivalentMonths,
      category_scores: categoryScores,
      milestones_snapshot: milestonesSnapshot,
      notes: notes ?? null,
    })
    .select()
    .single();
  if (error) { console.warn('[pediatricService] saveAssessmentResult:', error.message); return null; }
  return data;
}

export async function fetchAssessmentHistory(profileId: string): Promise<AssessmentResult[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pediatric_assessment_results')
    .select('*')
    .eq('pediatric_profile_id', profileId)
    .order('created_at', { ascending: false });
  if (error) { console.warn('[pediatricService] fetchAssessmentHistory:', error.message); return []; }
  return data ?? [];
}

/**
 * Adaptive age equivalency for simplified milestone screening.
 *
 * Given the ordered milestones and which ones the child can/cannot do,
 * find the highest milestone they've mastered. That milestone's
 * expected_by_month is their gross motor age equivalency.
 */
export function calculateSimpleAgeEquivalency(
  milestones: PediatricMilestone[],
  answers: Record<string, 'yes' | 'sometimes' | 'not_yet'>
): {
  ageEquivalentMonths: number;
  highestMastered: PediatricMilestone | null;
  firstNotMet: PediatricMilestone | null;
  masteredCount: number;
  totalAsked: number;
} {
  const sorted = [...milestones].sort(
    (a, b) => a.expected_by_month - b.expected_by_month
  );

  let highestMastered: PediatricMilestone | null = null;
  let firstNotMet: PediatricMilestone | null = null;
  let masteredCount = 0;
  let totalAsked = 0;

  for (const m of sorted) {
    const answer = answers[m.id];
    if (answer === undefined) continue;
    totalAsked++;
    if (answer === 'yes') {
      highestMastered = m;
      masteredCount++;
    } else if (answer === 'not_yet' && !firstNotMet) {
      firstNotMet = m;
    }
  }

  const ageEquivalentMonths = highestMastered?.expected_by_month ?? 0;

  return { ageEquivalentMonths, highestMastered, firstNotMet, masteredCount, totalAsked };
}

// ── Utility ────────────────────────────────────────────────────────────────

export function ageGroupFromBirthdate(birthdate: string, ageGroups: PediatricAgeGroup[]): PediatricAgeGroup | null {
  const birth = new Date(birthdate);
  const now = new Date();
  const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());

  // Find best match
  for (const ag of ageGroups) {
    if (ageMonths >= ag.min_months && ageMonths < ag.max_months) return ag;
  }
  // If older than max, return the last group
  if (ageMonths >= 36) return ageGroups[ageGroups.length - 1] ?? null;
  return null;
}

export function formatAgeEquivalency(months: number): string {
  if (months < 1) return 'Less than 1 month';
  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);
  if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
}
