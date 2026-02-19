/**
 * useOutcomeSummary Hook
 *
 * Fetches and provides outcome measure summaries for a user.
 * Used by Patient and Clinic dashboards to show progress.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  getOutcomeSummary,
  needsFollowUp,
  type OutcomeSummary,
} from '@/services/outcomeService';

interface UseOutcomeSummaryResult {
  summary: OutcomeSummary | null;
  isLoading: boolean;
  error: string | null;
  needsFollowUp: boolean;
  refetch: () => Promise<void>;
}

export function useOutcomeSummary(
  userId: string | null,
  conditionTag: string | null
): UseOutcomeSummaryResult {
  const [summary, setSummary] = useState<OutcomeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsFollowUpState, setNeedsFollowUpState] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!userId || !conditionTag) {
      setSummary(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getOutcomeSummary(userId, conditionTag);
      setSummary(result);

      // Check if follow-up is needed
      const followUpNeeded = await needsFollowUp(userId, conditionTag);
      setNeedsFollowUpState(followUpNeeded);
    } catch (err) {
      console.error('Error fetching outcome summary:', err);
      setError('Failed to load outcome data');
    } finally {
      setIsLoading(false);
    }
  }, [userId, conditionTag]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    needsFollowUp: needsFollowUpState,
    refetch: fetchSummary,
  };
}

/**
 * useAllOutcomeSummaries Hook
 *
 * Fetches outcome summaries for all conditions a user has assessments for.
 * Useful for clinic dashboard overview.
 */
export function useAllOutcomeSummaries(userId: string | null) {
  const [summaries, setSummaries] = useState<OutcomeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllSummaries = useCallback(async () => {
    if (!userId || !supabase) {
      setSummaries([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get distinct condition tags for this user
      const { data: conditions, error: condError } = await supabase
        .from('outcome_assessments')
        .select('condition_tag')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (condError) throw condError;

      // Get unique condition tags
      const uniqueConditions = [...new Set(conditions?.map(c => c.condition_tag) || [])];

      // Fetch summary for each condition
      const allSummaries = await Promise.all(
        uniqueConditions.map(tag => getOutcomeSummary(userId, tag))
      );

      setSummaries(allSummaries);
    } catch (err) {
      console.error('Error fetching all outcome summaries:', err);
      setError('Failed to load outcome data');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAllSummaries();
  }, [fetchAllSummaries]);

  return {
    summaries,
    isLoading,
    error,
    refetch: fetchAllSummaries,
  };
}

/**
 * usePatientsMissingFollowups Hook
 *
 * For clinic dashboard - finds patients who need follow-up assessments.
 */
export function usePatientsMissingFollowups(clinicId: string | null) {
  const [patients, setPatients] = useState<Array<{
    userId: string;
    patientName: string;
    conditionTag: string;
    lastAssessmentDate: string;
    daysSinceAssessment: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMissingFollowups = async () => {
      if (!clinicId || !supabase) {
        setPatients([]);
        return;
      }

      setIsLoading(true);

      try {
        // Get clinic patients with their latest assessments
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('clinic_id', clinicId)
          .eq('role', 'patient');

        if (error) throw error;

        const missingFollowups: typeof patients = [];
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        for (const patient of data || []) {
          // Get latest outcome assessment for each patient
          const { data: assessments } = await supabase
            .from('outcome_assessments')
            .select('condition_tag, created_at')
            .eq('user_id', patient.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (assessments && assessments.length > 0) {
            // Check each condition
            const conditionsSeen = new Set<string>();
            for (const assessment of assessments) {
              if (conditionsSeen.has(assessment.condition_tag)) continue;
              conditionsSeen.add(assessment.condition_tag);

              const assessmentDate = new Date(assessment.created_at);
              if (assessmentDate < fourteenDaysAgo) {
                const daysSince = Math.floor(
                  (Date.now() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                missingFollowups.push({
                  userId: patient.id,
                  patientName: `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown',
                  conditionTag: assessment.condition_tag,
                  lastAssessmentDate: assessment.created_at,
                  daysSinceAssessment: daysSince,
                });
              }
            }
          }
        }

        // Sort by days since assessment (most overdue first)
        missingFollowups.sort((a, b) => b.daysSinceAssessment - a.daysSinceAssessment);
        setPatients(missingFollowups);
      } catch (err) {
        console.error('Error fetching missing followups:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissingFollowups();
  }, [clinicId]);

  return { patients, isLoading };
}
