import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AssessmentResult } from '@/services/assessmentService';

const STORAGE_KEY = 'ptbot_assessments';

export function useAssessmentResults() {
  const [latestAssessment, setLatestAssessment] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLatestAssessment = useCallback(async () => {
    try {
      setIsLoading(true);

      // Use AsyncStorage for React Native compatibility
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const assessments: AssessmentResult[] = JSON.parse(stored);
        if (assessments.length > 0) {
          setLatestAssessment(assessments[0]);
        } else {
          setLatestAssessment(null);
        }
      } else {
        setLatestAssessment(null);
      }
    } catch (error) {
      console.error('Error loading latest assessment:', error);
      setLatestAssessment(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLatestAssessment();
  }, [loadLatestAssessment]);

  const refreshAssessment = useCallback(() => {
    loadLatestAssessment();
  }, [loadLatestAssessment]);

  const clearAssessments = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setLatestAssessment(null);
      console.log('Assessment data cleared');
    } catch (error) {
      console.error('Error clearing assessments:', error);
    }
  }, []);

  return {
    latestAssessment,
    isLoading,
    refreshAssessment,
    clearAssessments,
  };
}