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
 * Calculate age equivalency from milestone scores.
 *
 * Strategy (inspired by PDMS-2 basal/ceiling approach):
 * - Each milestone has an age_equivalent_months value
 * - Score: 0 = cannot perform, 1 = emerging, 2 = mastered
 * - We compute a weighted average of all scored items to find
 *   the child's overall gross motor age equivalency.
 * - The age equivalency is the highest age_equivalent_months
 *   where the child has a cumulative score >= 80% of max possible
 *   up to that point, then interpolated for partial scores above.
 */
export function calculateAgeEquivalency(
  milestones: PediatricMilestone[],
  scores: Record<string, number>
): { ageEquivalentMonths: number; rawScore: number; maxScore: number; categoryScores: Record<string, { raw: number; max: number }> } {
  // Sort milestones by age_equivalent_months
  const sorted = [...milestones]
    .filter(m => m.age_equivalent_months != null)
    .sort((a, b) => (a.age_equivalent_months ?? 0) - (b.age_equivalent_months ?? 0));

  if (sorted.length === 0) {
    return { ageEquivalentMonths: 0, rawScore: 0, maxScore: 0, categoryScores: {} };
  }

  let rawScore = 0;
  let maxScore = sorted.length * 2;

  // Category breakdown
  const categoryScores: Record<string, { raw: number; max: number }> = {};
  for (const m of sorted) {
    const cat = (m as any).category ?? 'locomotion';
    if (!categoryScores[cat]) categoryScores[cat] = { raw: 0, max: 0 };
    categoryScores[cat].max += 2;
    const s = scores[m.id] ?? 0;
    categoryScores[cat].raw += s;
    rawScore += s;
  }

  // Find age equivalency using basal/ceiling approach
  // Walk through milestones in age order. Track running score.
  // The age equivalent is interpolated based on where scoring drops below threshold.
  let cumulativeScore = 0;
  let cumulativeMax = 0;
  let lastFullAge = 0; // highest age where score >= 80%

  // Group by age_equivalent_months
  const ageGroups = new Map<number, { score: number; max: number }>();
  for (const m of sorted) {
    const ageEq = m.age_equivalent_months ?? 0;
    if (!ageGroups.has(ageEq)) ageGroups.set(ageEq, { score: 0, max: 0 });
    const g = ageGroups.get(ageEq)!;
    g.max += 2;
    g.score += scores[m.id] ?? 0;
  }

  const ageEntries = Array.from(ageGroups.entries()).sort((a, b) => a[0] - b[0]);

  for (const [ageEq, group] of ageEntries) {
    cumulativeScore += group.score;
    cumulativeMax += group.max;
    const pct = cumulativeMax > 0 ? cumulativeScore / cumulativeMax : 0;
    if (pct >= 0.8) {
      lastFullAge = ageEq;
    }
  }

  // Interpolate: check partial performance above the lastFullAge
  let ageEquivalentMonths = lastFullAge;

  // Find items above lastFullAge that are partially scored
  const aboveItems = ageEntries.filter(([age]) => age > lastFullAge);
  if (aboveItems.length > 0) {
    let partialScore = 0;
    let partialMax = 0;
    let nextAge = aboveItems[0][0];

    for (const [age, group] of aboveItems) {
      partialScore += group.score;
      partialMax += group.max;
      nextAge = age;
      if (partialScore === 0) break; // no more partial credit
    }

    if (partialMax > 0 && partialScore > 0) {
      const fraction = partialScore / partialMax;
      ageEquivalentMonths = lastFullAge + (nextAge - lastFullAge) * fraction;
    }
  }

  return {
    ageEquivalentMonths: Math.round(ageEquivalentMonths * 10) / 10,
    rawScore,
    maxScore,
    categoryScores,
  };
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
