import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Baby,
  ArrowLeft,
  ArrowRight,
  CircleCheck as CheckCircle,
  Circle,
  TriangleAlert as AlertTriangle,
  Play,
  Square,
  SquareCheck as CheckSquare,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import PediatricDisclaimer from './PediatricDisclaimer';
import {
  fetchAgeGroups,
  fetchConcerns,
  fetchMilestonesByAgeGroup,
  fetchVideosByConcernAndAge,
  PediatricAgeGroup,
  PediatricConcern,
  PediatricMilestone,
  PediatricExerciseVideo,
} from '@/services/pediatricService';

type Step = 'age' | 'concerns' | 'milestones' | 'results';

export default function PediatricAssessment() {
  const [step, setStep] = useState<Step>('age');
  const [isLoading, setIsLoading] = useState(true);

  // Data
  const [ageGroups, setAgeGroups] = useState<PediatricAgeGroup[]>([]);
  const [concerns, setConcerns] = useState<PediatricConcern[]>([]);
  const [milestones, setMilestones] = useState<PediatricMilestone[]>([]);

  // Selections
  const [selectedAge, setSelectedAge] = useState<PediatricAgeGroup | null>(null);
  const [selectedConcerns, setSelectedConcerns] = useState<Set<string>>(new Set());
  const [checkedMilestones, setCheckedMilestones] = useState<Set<string>>(new Set());

  // Results
  const [resultVideos, setResultVideos] = useState<PediatricExerciseVideo[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [ag, c] = await Promise.all([fetchAgeGroups(), fetchConcerns()]);
      setAgeGroups(ag);
      setConcerns(c);
      setIsLoading(false);
    };
    load();
  }, []);

  // Load milestones when age is selected
  useEffect(() => {
    if (selectedAge) {
      fetchMilestonesByAgeGroup(selectedAge.id).then(setMilestones);
    }
  }, [selectedAge]);

  const toggleConcern = (id: string) => {
    setSelectedConcerns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleMilestone = (id: string) => {
    setCheckedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goToResults = useCallback(async () => {
    if (!selectedAge || selectedConcerns.size === 0) return;
    setIsLoadingResults(true);
    setStep('results');

    // Fetch videos for each selected concern + age group
    const allVideos: PediatricExerciseVideo[] = [];
    for (const concernId of selectedConcerns) {
      const videos = await fetchVideosByConcernAndAge(concernId, selectedAge.id);
      allVideos.push(...videos);
    }
    setResultVideos(allVideos);
    setIsLoadingResults(false);
  }, [selectedAge, selectedConcerns]);

  const resetAssessment = () => {
    setStep('age');
    setSelectedAge(null);
    setSelectedConcerns(new Set());
    setCheckedMilestones(new Set());
    setResultVideos([]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <Baby size={28} color="#FFFFFF" />
            <Text style={styles.logoText}>PTBOT</Text>
          </View>
          <Text style={styles.headerTitle}>Pediatric Intake</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <View style={styles.logoContainer}>
            <Baby size={28} color="#FFFFFF" />
            <Text style={styles.logoText}>PTBOT</Text>
          </View>
          <Text style={styles.headerTitle}>Pediatric Intake</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {step === 'age' && 'Step 1: Select age group'}
          {step === 'concerns' && 'Step 2: Select concern(s)'}
          {step === 'milestones' && 'Step 3: Milestone check (optional)'}
          {step === 'results' && 'Recommended Activities'}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        {['age', 'concerns', 'milestones', 'results'].map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              (step === s || ['age', 'concerns', 'milestones', 'results'].indexOf(step) > i) &&
                styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Age Group */}
        {step === 'age' && (
          <>
            <Text style={styles.stepTitle}>How old is your child?</Text>
            {ageGroups.map((ag) => (
              <TouchableOpacity
                key={ag.id}
                style={[styles.optionCard, selectedAge?.id === ag.id && styles.optionCardSelected]}
                onPress={() => setSelectedAge(ag)}
                activeOpacity={0.7}
              >
                {selectedAge?.id === ag.id ? (
                  <CheckCircle size={20} color={colors.primary[500]} />
                ) : (
                  <Circle size={20} color={colors.neutral[300]} />
                )}
                <Text
                  style={[
                    styles.optionText,
                    selectedAge?.id === ag.id && styles.optionTextSelected,
                  ]}
                >
                  {ag.display_name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.nextButton, !selectedAge && styles.nextButtonDisabled]}
              onPress={() => selectedAge && setStep('concerns')}
              disabled={!selectedAge}
              activeOpacity={0.7}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}

        {/* Step 2: Concerns */}
        {step === 'concerns' && (
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep('age')}>
              <ArrowLeft size={16} color={colors.neutral[600]} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.stepTitle}>
              What are your primary concerns?
            </Text>
            <Text style={styles.stepHint}>Select one or more</Text>
            {concerns.map((c) => {
              const selected = selectedConcerns.has(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.optionCard, selected && styles.optionCardSelected]}
                  onPress={() => toggleConcern(c.id)}
                  activeOpacity={0.7}
                >
                  {selected ? (
                    <CheckSquare size={20} color={colors.primary[500]} />
                  ) : (
                    <Square size={20} color={colors.neutral[300]} />
                  )}
                  <View style={styles.concernContent}>
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {c.display_name}
                    </Text>
                    {c.description && (
                      <Text style={styles.concernDesc} numberOfLines={2}>
                        {c.description}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.nextButton, selectedConcerns.size === 0 && styles.nextButtonDisabled]}
              onPress={() => selectedConcerns.size > 0 && setStep('milestones')}
              disabled={selectedConcerns.size === 0}
              activeOpacity={0.7}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}

        {/* Step 3: Milestones (optional) */}
        {step === 'milestones' && (
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep('concerns')}>
              <ArrowLeft size={16} color={colors.neutral[600]} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.stepTitle}>
              Milestone Check — {selectedAge?.display_name}
            </Text>
            <Text style={styles.stepHint}>
              Check milestones your child has achieved (optional)
            </Text>
            {milestones.map((m) => {
              const checked = checkedMilestones.has(m.id);
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.optionCard, checked && styles.milestoneChecked]}
                  onPress={() => toggleMilestone(m.id)}
                  activeOpacity={0.7}
                >
                  {checked ? (
                    <CheckSquare size={20} color={colors.success[500]} />
                  ) : (
                    <Square size={20} color={colors.neutral[300]} />
                  )}
                  <View style={styles.concernContent}>
                    <Text style={styles.optionText}>{m.display_name}</Text>
                    {m.description && (
                      <Text style={styles.concernDesc} numberOfLines={2}>
                        {m.description}
                      </Text>
                    )}
                    {m.red_flag && (
                      <View style={styles.redFlagBadge}>
                        <AlertTriangle size={12} color={colors.error[600]} />
                        <Text style={styles.redFlagText}>
                          Concern if not met by {m.concern_if_missing_by_month} months
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.nextButton} onPress={goToResults} activeOpacity={0.7}>
              <Text style={styles.nextButtonText}>See Recommended Activities</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}

        {/* Step 4: Results */}
        {step === 'results' && (
          <>
            <PediatricDisclaimer />

            {isLoadingResults ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text style={styles.loadingText}>Finding activities...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.stepTitle}>
                  Recommended Activities
                </Text>
                <Text style={styles.resultSummary}>
                  {resultVideos.length > 0
                    ? `Found ${resultVideos.length} activit${resultVideos.length === 1 ? 'y' : 'ies'} for your selections`
                    : 'No specific activities found yet for this combination. Check back soon — we are adding new content regularly.'}
                </Text>

                {resultVideos.map((v) => (
                  <View key={v.id} style={styles.videoCard}>
                    <Text style={styles.videoTitle}>{v.title}</Text>
                    {v.description && (
                      <Text style={styles.videoDesc}>{v.description}</Text>
                    )}
                    {v.coaching_cues.length > 0 && (
                      <View style={styles.cuesContainer}>
                        <Text style={styles.cuesTitle}>Coaching Cues:</Text>
                        {v.coaching_cues.map((cue, i) => (
                          <Text key={i} style={styles.cueText}>• {cue}</Text>
                        ))}
                      </View>
                    )}
                    {v.safety_notes.length > 0 && (
                      <View style={styles.safetyContainer}>
                        <AlertTriangle size={14} color={colors.warning[600]} />
                        <View style={{ flex: 1 }}>
                          {v.safety_notes.map((note, i) => (
                            <Text key={i} style={styles.safetyText}>• {note}</Text>
                          ))}
                        </View>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[styles.watchButton, !v.youtube_video_id && styles.watchButtonDisabled]}
                      disabled={!v.youtube_video_id}
                      activeOpacity={0.7}
                    >
                      <Play size={16} color={v.youtube_video_id ? '#FFFFFF' : colors.neutral[400]} />
                      <Text
                        style={[
                          styles.watchButtonText,
                          !v.youtube_video_id && styles.watchButtonTextDisabled,
                        ]}
                      >
                        {v.youtube_video_id ? 'Watch Video' : 'Video Coming Soon'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Unchecked milestones warning */}
                {milestones.length > 0 && (
                  <View style={styles.uncheckedCard}>
                    <Text style={styles.uncheckedTitle}>Milestones Not Yet Met</Text>
                    {milestones
                      .filter((m) => !checkedMilestones.has(m.id))
                      .map((m) => (
                        <View key={m.id} style={styles.uncheckedRow}>
                          <Circle size={14} color={colors.neutral[400]} />
                          <Text style={styles.uncheckedText}>
                            {m.display_name}
                            {m.red_flag ? ' ⚠️' : ''}
                          </Text>
                        </View>
                      ))}
                    {milestones.filter((m) => !checkedMilestones.has(m.id)).length === 0 && (
                      <Text style={styles.allMetText}>
                        All milestones met — great job!
                      </Text>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={resetAssessment}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resetButtonText}>Start Over</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: colors.primary[200], marginTop: 2 },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[200],
  },
  progressDotActive: { backgroundColor: colors.primary[500] },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  loadingText: { marginTop: 12, color: colors.neutral[500], fontSize: 14 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: colors.neutral[900], marginBottom: 6 },
  stepHint: { fontSize: 13, color: colors.neutral[500], marginBottom: 16 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: 12,
  },
  optionCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  milestoneChecked: {
    borderColor: colors.success[500],
    backgroundColor: colors.success[50],
  },
  optionText: { fontSize: 15, fontWeight: '500', color: colors.neutral[800] },
  optionTextSelected: { color: colors.primary[700] },
  concernContent: { flex: 1 },
  concernDesc: { fontSize: 13, color: colors.neutral[500], marginTop: 2, lineHeight: 17 },
  redFlagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: colors.error[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  redFlagText: { fontSize: 11, color: colors.error[700], fontWeight: '500' },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 16,
  },
  nextButtonDisabled: { backgroundColor: colors.neutral[300] },
  nextButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backText: { fontSize: 14, color: colors.neutral[600] },
  resultSummary: { fontSize: 14, color: colors.neutral[600], marginBottom: 16, lineHeight: 20 },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  videoTitle: { fontSize: 16, fontWeight: '600', color: colors.neutral[900], marginBottom: 6 },
  videoDesc: { fontSize: 13, color: colors.neutral[600], lineHeight: 18, marginBottom: 10 },
  cuesContainer: { marginBottom: 10 },
  cuesTitle: { fontSize: 13, fontWeight: '600', color: colors.neutral[700], marginBottom: 4 },
  cueText: { fontSize: 13, color: colors.neutral[600], marginLeft: 4, lineHeight: 18 },
  safetyContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.warning[50],
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  safetyText: { fontSize: 12, color: colors.warning[700], lineHeight: 16 },
  watchButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    paddingVertical: 10,
  },
  watchButtonDisabled: { backgroundColor: colors.neutral[100] },
  watchButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  watchButtonTextDisabled: { color: colors.neutral[400] },
  uncheckedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  uncheckedTitle: { fontSize: 15, fontWeight: '600', color: colors.neutral[800], marginBottom: 10 },
  uncheckedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  uncheckedText: { fontSize: 13, color: colors.neutral[600] },
  allMetText: { fontSize: 14, color: colors.success[600], fontStyle: 'italic' },
  resetButton: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: { fontSize: 14, fontWeight: '500', color: colors.neutral[600] },
});
