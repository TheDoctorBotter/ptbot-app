import { supabase } from '@/lib/supabase';

export interface InjuryRegion {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  display_order: number;
}

export interface InjurySummary {
  id: string;
  injury_key: string;
  display_name: string;
  description: string | null;
  display_order: number;
}

export interface InjuryPhase {
  id: string;
  phase_number: number;
  phase_name: string;
  display_order: number;
  goals: string[];
  precautions: string[];
  progress_criteria: string[];
}

export interface InjuryVideo {
  id: string;
  slot_number: number;
  youtube_video_id: string | null;
  title: string | null;
  display_order: number;
}

export interface InjuryDetail {
  id: string;
  injury_key: string;
  display_name: string;
  description: string | null;
  common_symptoms: string[];
  red_flags: string[];
  protocol_key: string | null;
  protocol_name: string | null;
  phases: InjuryPhase[];
  videos: InjuryVideo[];
}

/**
 * Returns only exercise_sections that have at least one active injury,
 * ordered by display_order.
 */
export async function getInjuryRegions(): Promise<InjuryRegion[]> {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('exercise_sections')
    .select('id, name, slug, icon_name, display_order, injuries!inner(id)')
    .eq('is_active', true)
    .eq('injuries.is_active', true)
    .order('display_order');

  if (error) throw error;

  return (data ?? []).map(({ injuries, ...section }) => section as InjuryRegion);
}

/**
 * Returns injuries for a given section id, ordered by display_order.
 */
export async function getInjuriesBySection(sectionId: string): Promise<InjurySummary[]> {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('injuries')
    .select('id, injury_key, display_name, description, display_order')
    .eq('section_id', sectionId)
    .eq('is_active', true)
    .order('display_order');

  if (error) throw error;

  return (data ?? []) as InjurySummary[];
}

/**
 * Returns full injury detail: injury row + conservative protocol + phases + videos.
 */
export async function getInjuryDetail(injuryId: string): Promise<InjuryDetail | null> {
  if (!supabase) throw new Error('Supabase client not initialized');

  // Fetch injury
  const { data: injury, error: injuryError } = await supabase
    .from('injuries')
    .select('id, injury_key, display_name, description, common_symptoms, red_flags')
    .eq('id', injuryId)
    .single();

  if (injuryError || !injury) return null;

  // Fetch conservative protocol linked to this injury
  const { data: protocol } = await supabase
    .from('protocols')
    .select('id, protocol_key, surgery_name')
    .eq('injury_id', injuryId)
    .eq('protocol_type', 'conservative')
    .eq('is_active', true)
    .single();

  // Fetch phases if protocol exists
  let phases: InjuryPhase[] = [];
  if (protocol) {
    const { data: phaseData } = await supabase
      .from('protocol_phases')
      .select('id, phase_number, phase_name, display_order, goals, precautions, progress_criteria')
      .eq('protocol_id', protocol.id)
      .order('phase_number');

    phases = (phaseData ?? []) as InjuryPhase[];
  }

  // Fetch injury videos
  const { data: videoData } = await supabase
    .from('injury_videos')
    .select('id, slot_number, youtube_video_id, title, display_order')
    .eq('injury_id', injuryId)
    .order('slot_number');

  const videos = (videoData ?? []) as InjuryVideo[];

  return {
    id: injury.id,
    injury_key: injury.injury_key,
    display_name: injury.display_name,
    description: injury.description,
    common_symptoms: injury.common_symptoms ?? [],
    red_flags: injury.red_flags ?? [],
    protocol_key: protocol?.protocol_key ?? null,
    protocol_name: protocol?.surgery_name ?? null,
    phases,
    videos,
  };
}
