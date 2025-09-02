import { useState, useEffect } from 'react';
import { AssessmentService } from '@/services/assessmentService';
import type { AssessmentResult } from '@/services/assessmentService';

export function useAssessmentResults() {
  const [latestAssessment, setLatestAssessment] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLatestAssessment();
  }, []);

  const loadLatestAssessment = () => {
    try {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      // For now, we'll check localStorage
      const stored = localStorage?.getItem('ptbot_assessments');
      if (stored) {
        const assessments: AssessmentResult[] = JSON.parse(stored);
        if (assessments.length > 0) {
          setLatestAssessment(assessments[0]);
        }
      }
    } catch (error) {
      console.error('Error loading latest assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAssessment = () => {
    loadLatestAssessment();
  };

  return {
    latestAssessment,
    isLoading,
    refreshAssessment,
  };
}