/**
 * QuestionnaireScreen Component
 *
 * A reusable component for rendering standardized outcome questionnaires.
 * Supports: ODI, KOOS, QuickDASH, NPRS, GROC
 *
 * Features:
 * - Renders items from database in display_order
 * - Handles different response types (likert, nprs, groc)
 * - Calculates and saves scores
 * - Shows progress indicator
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import {
  getQuestionnaireByKey,
  getQuestionnaireItems,
  saveOutcomeAssessment,
  calculateScore,
  type Questionnaire,
  type QuestionnaireItem,
} from '@/services/outcomeService';

interface QuestionnaireScreenProps {
  questionnaireKey: string;
  contextType: 'baseline' | 'followup' | 'final';
  conditionTag: string;
  relatedAssessmentId?: string;
  onComplete: (result: {
    totalScore: number;
    normalizedScore: number;
    interpretation: string;
  }) => void;
  onCancel?: () => void;
}

export default function QuestionnaireScreen({
  questionnaireKey,
  contextType,
  conditionTag,
  relatedAssessmentId,
  onComplete,
  onCancel,
}: QuestionnaireScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [items, setItems] = useState<QuestionnaireItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, number>>(new Map());

  // Load questionnaire and items
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const q = await getQuestionnaireByKey(questionnaireKey);
        if (q) {
          setQuestionnaire(q);
          const qItems = await getQuestionnaireItems(q.id);
          setItems(qItems);
        }
      } catch (error) {
        console.error('Error loading questionnaire:', error);
        Alert.alert('Error', 'Failed to load questionnaire');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [questionnaireKey]);

  const currentItem = items[currentItemIndex];
  const isLastItem = currentItemIndex === items.length - 1;
  const hasCurrentResponse = currentItem ? responses.has(currentItem.id) : false;

  const handleResponse = useCallback((value: number) => {
    if (!currentItem) return;

    setResponses(prev => {
      const newMap = new Map(prev);
      newMap.set(currentItem.id, value);
      return newMap;
    });
  }, [currentItem]);

  const handleNext = useCallback(() => {
    if (!hasCurrentResponse && currentItem?.is_required) {
      Alert.alert('Required', 'Please select a response before continuing.');
      return;
    }

    if (isLastItem) {
      handleSubmit();
    } else {
      setCurrentItemIndex(prev => prev + 1);
    }
  }, [hasCurrentResponse, isLastItem, currentItem]);

  const handlePrevious = useCallback(() => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
    }
  }, [currentItemIndex]);

  const handleSubmit = async () => {
    if (!questionnaire) return;

    setIsSaving(true);
    try {
      // Calculate score
      const responseValues = Array.from(responses.values());
      const result = calculateScore(questionnaireKey, responseValues);

      // Save to database
      await saveOutcomeAssessment(
        questionnaireKey,
        contextType,
        conditionTag,
        responses,
        relatedAssessmentId
      );

      onComplete(result);
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      Alert.alert('Error', 'Failed to save your responses. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderResponseOptions = () => {
    if (!currentItem) return null;

    const responseType = currentItem.response_type;
    const responseOptions = currentItem.response_options as Record<string, any> | null;
    const currentValue = responses.get(currentItem.id);

    // NPRS (0-10 pain scale)
    if (responseType === 'nprs_0_10') {
      return (
        <View style={styles.nprsContainer}>
          <View style={styles.nprsLabels}>
            <Text style={styles.nprsLabel}>No Pain</Text>
            <Text style={styles.nprsLabel}>Worst Pain</Text>
          </View>
          <View style={styles.nprsButtons}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.nprsButton,
                  currentValue === value && styles.nprsButtonSelected,
                  value <= 3 && styles.nprsButtonGreen,
                  value > 3 && value <= 6 && styles.nprsButtonYellow,
                  value > 6 && styles.nprsButtonRed,
                ]}
                onPress={() => handleResponse(value)}
              >
                <Text
                  style={[
                    styles.nprsButtonText,
                    currentValue === value && styles.nprsButtonTextSelected,
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    // GROC (-7 to +7 scale)
    if (responseType === 'groc_-7_7') {
      const grocLabels = responseOptions?.labels || {};
      return (
        <ScrollView style={styles.grocContainer}>
          {[-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7].map(value => (
            <TouchableOpacity
              key={value}
              style={[
                styles.grocOption,
                currentValue === value && styles.grocOptionSelected,
                value < 0 && styles.grocOptionNegative,
                value === 0 && styles.grocOptionNeutral,
                value > 0 && styles.grocOptionPositive,
              ]}
              onPress={() => handleResponse(value)}
            >
              <Text style={styles.grocValue}>{value > 0 ? `+${value}` : value}</Text>
              <Text style={styles.grocLabel}>
                {grocLabels[value.toString()] || `Level ${value}`}
              </Text>
              {currentValue === value && (
                <Check size={20} color={colors.white} style={styles.grocCheck} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }

    // Likert scales (0-4, 0-5, 1-5)
    let options: { value: number; label: string }[] = [];

    if (responseType === 'likert_0_5') {
      options = [
        { value: 0, label: '0 - No difficulty / No pain' },
        { value: 1, label: '1 - Mild' },
        { value: 2, label: '2 - Moderate' },
        { value: 3, label: '3 - Fairly severe' },
        { value: 4, label: '4 - Very severe' },
        { value: 5, label: '5 - Unable / Maximum' },
      ];
    } else if (responseType === 'likert_0_4') {
      options = [
        { value: 0, label: '0 - None' },
        { value: 1, label: '1 - Mild' },
        { value: 2, label: '2 - Moderate' },
        { value: 3, label: '3 - Severe' },
        { value: 4, label: '4 - Extreme' },
      ];
    } else if (responseType === 'likert_1_5') {
      options = [
        { value: 1, label: '1 - No difficulty' },
        { value: 2, label: '2 - Mild difficulty' },
        { value: 3, label: '3 - Moderate difficulty' },
        { value: 4, label: '4 - Severe difficulty' },
        { value: 5, label: '5 - Unable' },
      ];
    }

    return (
      <View style={styles.likertContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.likertOption,
              currentValue === option.value && styles.likertOptionSelected,
            ]}
            onPress={() => handleResponse(option.value)}
          >
            <View style={styles.likertRadio}>
              {currentValue === option.value && <View style={styles.likertRadioInner} />}
            </View>
            <Text
              style={[
                styles.likertLabel,
                currentValue === option.value && styles.likertLabelSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading questionnaire...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!questionnaire || items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.red[500]} />
          <Text style={styles.errorText}>Questionnaire not available</Text>
          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{questionnaire.display_name}</Text>
        <Text style={styles.headerSubtitle}>
          {contextType === 'baseline' ? 'Baseline Assessment' :
           contextType === 'followup' ? 'Follow-up Assessment' : 'Final Assessment'}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentItemIndex + 1) / items.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Question {currentItemIndex + 1} of {items.length}
        </Text>
      </View>

      {/* Question */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.questionCard}>
          <Text style={styles.questionNumber}>Question {currentItemIndex + 1}</Text>
          <Text style={styles.questionText}>
            {currentItem?.prompt_text || `Question ${currentItem?.item_key}`}
          </Text>

          {currentItem?.prompt_text?.includes('PLACEHOLDER') && (
            <View style={styles.placeholderNote}>
              <AlertCircle size={16} color={colors.amber[600]} />
              <Text style={styles.placeholderNoteText}>
                Licensed questionnaire text to be added
              </Text>
            </View>
          )}
        </View>

        {renderResponseOptions()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentItemIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentItemIndex === 0}
        >
          <ArrowLeft size={20} color={currentItemIndex === 0 ? colors.gray[400] : colors.gray[700]} />
          <Text style={[styles.navButtonText, currentItemIndex === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.navButtonPrimary,
            !hasCurrentResponse && styles.navButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!hasCurrentResponse || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Text style={styles.navButtonPrimaryText}>
                {isLastItem ? 'Submit' : 'Next'}
              </Text>
              {isLastItem ? (
                <Check size={20} color={colors.white} />
              ) : (
                <ArrowRight size={20} color={colors.white} />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.gray[700],
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.gray[200],
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.gray[700],
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.primary[600],
    marginTop: 4,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  progressText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.gray[500],
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  questionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[600],
    marginBottom: 8,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.gray[900],
    lineHeight: 24,
  },
  placeholderNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: colors.amber[50],
    borderRadius: 8,
  },
  placeholderNoteText: {
    marginLeft: 8,
    fontSize: 12,
    color: colors.amber[700],
  },
  // Likert styles
  likertContainer: {
    gap: 10,
  },
  likertOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  likertOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  likertRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray[400],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  likertRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
  },
  likertLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
  },
  likertLabelSelected: {
    color: colors.primary[700],
    fontWeight: '500',
  },
  // NPRS styles
  nprsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
  },
  nprsLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nprsLabel: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '500',
  },
  nprsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nprsButton: {
    width: 30,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
  nprsButtonGreen: {
    backgroundColor: colors.green[100],
  },
  nprsButtonYellow: {
    backgroundColor: colors.amber[100],
  },
  nprsButtonRed: {
    backgroundColor: colors.red[100],
  },
  nprsButtonSelected: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  nprsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[700],
  },
  nprsButtonTextSelected: {
    color: colors.primary[700],
  },
  // GROC styles
  grocContainer: {
    maxHeight: 400,
  },
  grocOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  grocOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[500],
  },
  grocOptionNegative: {
    borderLeftWidth: 4,
    borderLeftColor: colors.red[400],
  },
  grocOptionNeutral: {
    borderLeftWidth: 4,
    borderLeftColor: colors.gray[400],
  },
  grocOptionPositive: {
    borderLeftWidth: 4,
    borderLeftColor: colors.green[400],
  },
  grocValue: {
    width: 40,
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[700],
  },
  grocLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[700],
  },
  grocCheck: {
    marginLeft: 8,
  },
  // Navigation
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  navButtonTextDisabled: {
    color: colors.gray[400],
  },
  navButtonPrimary: {
    backgroundColor: colors.primary[500],
  },
  navButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
