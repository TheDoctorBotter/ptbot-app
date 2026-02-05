/**
 * Outcome Measures Service
 *
 * Handles scoring, storage, and retrieval of standardized outcome measures:
 * - ODI (Oswestry Disability Index) for back pain
 * - KOOS (Knee Outcome Score) for knee pain
 * - QuickDASH for shoulder/upper extremity
 * - NPRS (Numeric Pain Rating Scale) for general pain
 * - GROC (Global Rating of Change) for final assessment
 */

import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

export interface Questionnaire {
  id: string;
  key: string;
  display_name: string;
  body_region: string;
  version: string | null;
  scoring_type: string;
  min_score: number | null;
  max_score: number | null;
  mcid: number | null;
  notes: string | null;
}

export interface QuestionnaireItem {
  id: string;
  questionnaire_id: string;
  item_key: string;
  prompt_text: string | null;
  response_type: string;
  response_options: Record<string, any> | null;
  display_order: number;
  is_required: boolean;
}

export interface OutcomeAssessment {
  id: string;
  user_id: string;
  questionnaire_id: string;
  context_type: 'baseline' | 'followup' | 'final';
  condition_tag: string;
  related_assessment_id: string | null;
  total_score: number | null;
  normalized_score: number | null;
  interpretation: string | null;
  created_at: string;
  questionnaire?: Questionnaire;
}

export interface OutcomeResponse {
  id: string;
  outcome_assessment_id: string;
  item_id: string;
  response_value: number;
}

export interface OutcomeSummary {
  condition_tag: string;
  baseline: {
    function: OutcomeAssessment | null;
    pain: OutcomeAssessment | null;
    date: string | null;
  };
  latest: {
    function: OutcomeAssessment | null;
    pain: OutcomeAssessment | null;
    date: string | null;
  };
  final: {
    groc: OutcomeAssessment | null;
    date: string | null;
  };
  change: {
    functionChange: number | null;
    painChange: number | null;
    isMeaningful: boolean;
  };
}

// ============================================
// SCORING FUNCTIONS
// ============================================

/**
 * Calculate ODI score
 * Each item 0-5, total possible = 50
 * normalized_score = (sum / 50) * 100
 */
export function calculateODIScore(responses: number[]): {
  totalScore: number;
  normalizedScore: number;
  interpretation: string;
} {
  const validResponses = responses.filter(r => r >= 0 && r <= 5);
  const maxPossible = validResponses.length * 5;

  if (maxPossible === 0) {
    return { totalScore: 0, normalizedScore: 0, interpretation: 'No responses' };
  }

  const totalScore = validResponses.reduce((sum, r) => sum + r, 0);
  const normalizedScore = (totalScore / maxPossible) * 100;

  let interpretation: string;
  if (normalizedScore <= 20) {
    interpretation = 'Minimal disability';
  } else if (normalizedScore <= 40) {
    interpretation = 'Moderate disability';
  } else if (normalizedScore <= 60) {
    interpretation = 'Severe disability';
  } else if (normalizedScore <= 80) {
    interpretation = 'Crippled';
  } else {
    interpretation = 'Bed-bound or exaggerating';
  }

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    normalizedScore: Math.round(normalizedScore * 10) / 10,
    interpretation,
  };
}

/**
 * Calculate KOOS score
 * Each item 0-4, higher = worse symptoms
 * For KOOS, we convert so higher score = BETTER function
 * normalized_score = 100 - ((sum / max) * 100)
 */
export function calculateKOOSScore(responses: number[]): {
  totalScore: number;
  normalizedScore: number;
  interpretation: string;
} {
  const validResponses = responses.filter(r => r >= 0 && r <= 4);
  const maxPossible = validResponses.length * 4;

  if (maxPossible === 0) {
    return { totalScore: 0, normalizedScore: 100, interpretation: 'No responses' };
  }

  const totalScore = validResponses.reduce((sum, r) => sum + r, 0);
  // KOOS: 0 = no problems, 4 = extreme problems
  // Convert so 100 = no problems, 0 = extreme problems
  const normalizedScore = 100 - ((totalScore / maxPossible) * 100);

  let interpretation: string;
  if (normalizedScore >= 90) {
    interpretation = 'Normal function';
  } else if (normalizedScore >= 75) {
    interpretation = 'Near normal function';
  } else if (normalizedScore >= 50) {
    interpretation = 'Moderate impairment';
  } else if (normalizedScore >= 25) {
    interpretation = 'Severe impairment';
  } else {
    interpretation = 'Extreme impairment';
  }

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    normalizedScore: Math.round(normalizedScore * 10) / 10,
    interpretation,
  };
}

/**
 * Calculate QuickDASH score
 * Each item 1-5
 * normalized_score = ((sum/n) - 1) * 25
 * Result is 0-100, higher = more disability
 */
export function calculateQuickDASHScore(responses: number[]): {
  totalScore: number;
  normalizedScore: number;
  interpretation: string;
} {
  const validResponses = responses.filter(r => r >= 1 && r <= 5);
  const n = validResponses.length;

  if (n === 0) {
    return { totalScore: 0, normalizedScore: 0, interpretation: 'No responses' };
  }

  const totalScore = validResponses.reduce((sum, r) => sum + r, 0);
  const mean = totalScore / n;
  const normalizedScore = (mean - 1) * 25;

  let interpretation: string;
  if (normalizedScore <= 20) {
    interpretation = 'Minimal disability';
  } else if (normalizedScore <= 40) {
    interpretation = 'Mild disability';
  } else if (normalizedScore <= 60) {
    interpretation = 'Moderate disability';
  } else if (normalizedScore <= 80) {
    interpretation = 'Severe disability';
  } else {
    interpretation = 'Extreme disability';
  }

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    normalizedScore: Math.round(normalizedScore * 10) / 10,
    interpretation,
  };
}

/**
 * Calculate NPRS score
 * Single 0-10 value
 */
export function calculateNPRSScore(response: number): {
  totalScore: number;
  normalizedScore: number;
  interpretation: string;
} {
  const score = Math.max(0, Math.min(10, response));

  let interpretation: string;
  if (score === 0) {
    interpretation = 'No pain';
  } else if (score <= 3) {
    interpretation = 'Mild pain';
  } else if (score <= 6) {
    interpretation = 'Moderate pain';
  } else if (score <= 9) {
    interpretation = 'Severe pain';
  } else {
    interpretation = 'Worst possible pain';
  }

  return {
    totalScore: score,
    normalizedScore: score,
    interpretation,
  };
}

/**
 * Calculate GROC score
 * Single -7 to +7 value
 */
export function calculateGROCScore(response: number): {
  totalScore: number;
  normalizedScore: number;
  interpretation: string;
} {
  const score = Math.max(-7, Math.min(7, response));

  let interpretation: string;
  if (score <= -5) {
    interpretation = 'Very much worse';
  } else if (score <= -3) {
    interpretation = 'Much worse';
  } else if (score <= -1) {
    interpretation = 'Somewhat worse';
  } else if (score === 0) {
    interpretation = 'No change';
  } else if (score <= 2) {
    interpretation = 'Somewhat better';
  } else if (score <= 4) {
    interpretation = 'Much better';
  } else {
    interpretation = 'Very much better';
  }

  return {
    totalScore: score,
    normalizedScore: score,
    interpretation,
  };
}

/**
 * Calculate score based on questionnaire type
 */
export function calculateScore(
  questionnaireKey: string,
  responses: number[]
): { totalScore: number; normalizedScore: number; interpretation: string } {
  switch (questionnaireKey) {
    case 'odi':
      return calculateODIScore(responses);
    case 'koos':
      return calculateKOOSScore(responses);
    case 'quickdash':
      return calculateQuickDASHScore(responses);
    case 'nprs':
      return calculateNPRSScore(responses[0] ?? 0);
    case 'groc':
      return calculateGROCScore(responses[0] ?? 0);
    default:
      throw new Error(`Unknown questionnaire type: ${questionnaireKey}`);
  }
}

// ============================================
// DATA ACCESS FUNCTIONS
// ============================================

/**
 * Get questionnaire by key
 */
export async function getQuestionnaireByKey(key: string): Promise<Questionnaire | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('key', key)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching questionnaire:', error);
    return null;
  }

  return data;
}

/**
 * Get questionnaire items in display order
 */
export async function getQuestionnaireItems(questionnaireId: string): Promise<QuestionnaireItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('questionnaire_items')
    .select('*')
    .eq('questionnaire_id', questionnaireId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching questionnaire items:', error);
    return [];
  }

  return data || [];
}

/**
 * Get questionnaires for a body region
 */
export async function getQuestionnairesForRegion(bodyRegion: string): Promise<Questionnaire[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('is_active', true)
    .or(`body_region.eq.${bodyRegion},body_region.eq.general`)
    .order('body_region', { ascending: false }); // Region-specific first

  if (error) {
    console.error('Error fetching questionnaires:', error);
    return [];
  }

  return data || [];
}

/**
 * Map pain location to condition tag
 */
export function mapPainLocationToCondition(painLocation: string): string {
  const location = painLocation.toLowerCase();

  if (location.includes('back') || location.includes('lumbar') || location.includes('spine')) {
    return 'back';
  }
  if (location.includes('knee') || location.includes('patella')) {
    return 'knee';
  }
  if (location.includes('shoulder') || location.includes('rotator')) {
    return 'shoulder';
  }

  // Default to the pain location itself
  return location.split(' ')[0];
}

/**
 * Get questionnaire key for a condition
 */
export function getQuestionnaireKeyForCondition(conditionTag: string): string {
  switch (conditionTag) {
    case 'back':
      return 'odi';
    case 'knee':
      return 'koos';
    case 'shoulder':
      return 'quickdash';
    default:
      return 'nprs'; // Fallback to pain scale only
  }
}

/**
 * Save outcome assessment with responses
 */
export async function saveOutcomeAssessment(
  questionnaireKey: string,
  contextType: 'baseline' | 'followup' | 'final',
  conditionTag: string,
  responses: Map<string, number>, // item_id -> response_value
  relatedAssessmentId?: string
): Promise<OutcomeAssessment | null> {
  if (!supabase) return null;

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user');
      return null;
    }

    // Get questionnaire
    const questionnaire = await getQuestionnaireByKey(questionnaireKey);
    if (!questionnaire) {
      console.error('Questionnaire not found:', questionnaireKey);
      return null;
    }

    // Calculate score
    const responseValues = Array.from(responses.values());
    const { totalScore, normalizedScore, interpretation } = calculateScore(
      questionnaireKey,
      responseValues
    );

    // Insert outcome assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('outcome_assessments')
      .insert({
        user_id: user.id,
        questionnaire_id: questionnaire.id,
        context_type: contextType,
        condition_tag: conditionTag,
        related_assessment_id: relatedAssessmentId || null,
        total_score: totalScore,
        normalized_score: normalizedScore,
        interpretation,
      })
      .select()
      .single();

    if (assessmentError) {
      console.error('Error saving outcome assessment:', assessmentError);
      return null;
    }

    // Insert responses
    const responseRecords = Array.from(responses.entries()).map(([itemId, value]) => ({
      outcome_assessment_id: assessment.id,
      item_id: itemId,
      response_value: value,
    }));

    const { error: responsesError } = await supabase
      .from('outcome_responses')
      .insert(responseRecords);

    if (responsesError) {
      console.error('Error saving outcome responses:', responsesError);
      // Assessment was created but responses failed - could clean up here
    }

    return assessment;
  } catch (error) {
    console.error('Error in saveOutcomeAssessment:', error);
    return null;
  }
}

/**
 * Get outcome summary for a user and condition
 */
export async function getOutcomeSummary(
  userId: string,
  conditionTag: string
): Promise<OutcomeSummary> {
  const emptySummary: OutcomeSummary = {
    condition_tag: conditionTag,
    baseline: { function: null, pain: null, date: null },
    latest: { function: null, pain: null, date: null },
    final: { groc: null, date: null },
    change: { functionChange: null, painChange: null, isMeaningful: false },
  };

  if (!supabase) return emptySummary;

  try {
    const functionKey = getQuestionnaireKeyForCondition(conditionTag);

    // Get baseline function score
    const { data: baselineFunction } = await supabase
      .from('outcome_assessments')
      .select('*, questionnaire:questionnaires(*)')
      .eq('user_id', userId)
      .eq('condition_tag', conditionTag)
      .eq('context_type', 'baseline')
      .eq('questionnaire.key', functionKey)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    // Get baseline pain score
    const { data: baselinePain } = await supabase
      .from('outcome_assessments')
      .select('*, questionnaire:questionnaires(*)')
      .eq('user_id', userId)
      .eq('condition_tag', conditionTag)
      .eq('context_type', 'baseline')
      .eq('questionnaire.key', 'nprs')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    // Get latest followup function score
    const { data: latestFunction } = await supabase
      .from('outcome_assessments')
      .select('*, questionnaire:questionnaires(*)')
      .eq('user_id', userId)
      .eq('condition_tag', conditionTag)
      .in('context_type', ['followup', 'final'])
      .eq('questionnaire.key', functionKey)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get latest followup pain score
    const { data: latestPain } = await supabase
      .from('outcome_assessments')
      .select('*, questionnaire:questionnaires(*)')
      .eq('user_id', userId)
      .eq('condition_tag', conditionTag)
      .in('context_type', ['followup', 'final'])
      .eq('questionnaire.key', 'nprs')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get final GROC
    const { data: finalGroc } = await supabase
      .from('outcome_assessments')
      .select('*, questionnaire:questionnaires(*)')
      .eq('user_id', userId)
      .eq('condition_tag', conditionTag)
      .eq('context_type', 'final')
      .eq('questionnaire.key', 'groc')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Calculate changes
    let functionChange: number | null = null;
    let painChange: number | null = null;
    let isMeaningful = false;

    if (baselineFunction?.normalized_score != null && latestFunction?.normalized_score != null) {
      // For ODI/QuickDASH: lower is better, so negative change is improvement
      // For KOOS: higher is better, so positive change is improvement
      functionChange = latestFunction.normalized_score - baselineFunction.normalized_score;

      const mcid = baselineFunction.questionnaire?.mcid || 10;
      isMeaningful = Math.abs(functionChange) >= mcid;
    }

    if (baselinePain?.normalized_score != null && latestPain?.normalized_score != null) {
      painChange = latestPain.normalized_score - baselinePain.normalized_score;
      // NPRS MCID is typically 2 points
      if (Math.abs(painChange) >= 2) {
        isMeaningful = true;
      }
    }

    return {
      condition_tag: conditionTag,
      baseline: {
        function: baselineFunction,
        pain: baselinePain,
        date: baselineFunction?.created_at || baselinePain?.created_at || null,
      },
      latest: {
        function: latestFunction || baselineFunction,
        pain: latestPain || baselinePain,
        date: latestFunction?.created_at || latestPain?.created_at || null,
      },
      final: {
        groc: finalGroc,
        date: finalGroc?.created_at || null,
      },
      change: {
        functionChange,
        painChange,
        isMeaningful,
      },
    };
  } catch (error) {
    console.error('Error fetching outcome summary:', error);
    return emptySummary;
  }
}

/**
 * Check if user needs follow-up (last assessment > 14 days ago)
 */
export async function needsFollowUp(userId: string, conditionTag: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data } = await supabase
      .from('outcome_assessments')
      .select('created_at')
      .eq('user_id', userId)
      .eq('condition_tag', conditionTag)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return true; // No assessments yet

    const lastDate = new Date(data.created_at);
    const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysSince > 14;
  } catch (error) {
    console.error('Error checking follow-up status:', error);
    return false;
  }
}
