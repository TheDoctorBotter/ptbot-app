import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import {
  Baby,
  TriangleAlert as AlertTriangle,
  Plus,
  Trash2,
  CircleCheck as CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Award,
  BarChart3,
  Clock,
  History,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import PediatricDisclaimer from './PediatricDisclaimer';
import {
  fetchAgeGroups,
  fetchChildProfiles,
  createChildProfile,
  deleteChildProfile,
  fetchAllMilestonesSorted,
  fetchMilestoneTracking,
  saveMilestoneScore,
  saveAssessmentResult,
  fetchAssessmentHistory,
  calculateAgeEquivalency,
  formatAgeEquivalency,
  PediatricAgeGroup,
  PediatricProfile,
  PediatricMilestone,
  MilestoneTracking,
  AssessmentResult,
} from '@/services/pediatricService';

type Screen = 'profiles' | 'assessment' | 'results' | 'history';

const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  reflexes: { label: 'Reflexes', description: 'Automatic reactions to environmental events (0-11 months)' },
  stationary: { label: 'Stationary', description: 'Controlling body within center of gravity and retaining balance' },
  locomotion: { label: 'Locomotion', description: 'Moving from one place to another' },
  object_manipulation: { label: 'Object Manipulation', description: 'Catching, throwing, and kicking objects (12+ months)' },
};

export default function PediatricDashboard() {
  const [screen, setScreen] = useState<Screen>('profiles');
  const [isLoading, setIsLoading] = useState(true);

  // Data
  const [ageGroups, setAgeGroups] = useState<PediatricAgeGroup[]>([]);
  const [profiles, setProfiles] = useState<PediatricProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PediatricProfile | null>(null);
  const [allMilestones, setAllMilestones] = useState<PediatricMilestone[]>([]);

  // Add child form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Assessment state
  const [assessmentMilestones, setAssessmentMilestones] = useState<PediatricMilestone[]>([]);
  const [currentCategoryIdx, setCurrentCategoryIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);

  // Results
  const [assessmentResultData, setAssessmentResultData] = useState<{
    ageEquivalentMonths: number;
    rawScore: number;
    maxScore: number;
    categoryScores: Record<string, { raw: number; max: number }>;
  } | null>(null);

  // History
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [ag, cp, ms] = await Promise.all([
        fetchAgeGroups(),
        fetchChildProfiles(),
        fetchAllMilestonesSorted(),
      ]);
      setAgeGroups(ag);
      setProfiles(cp);
      setAllMilestones(ms);
      if (cp.length > 0) setSelectedProfile(cp[0]);
      setIsLoading(false);
    };
    load();
  }, []);

  const handleAddChild = async () => {
    if (!newChildName.trim() || !selectedAgeGroup) return;
    setIsSaving(true);
    const profile = await createChildProfile(newChildName.trim(), null, selectedAgeGroup, null);
    if (profile) {
      setProfiles((prev) => [profile, ...prev]);
      setSelectedProfile(profile);
      setShowAddForm(false);
      setNewChildName('');
      setSelectedAgeGroup(null);
    } else {
      const msg = 'Failed to save child profile. Please try again.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    }
    setIsSaving(false);
  };

  const handleDeleteChild = (profile: PediatricProfile) => {
    const doDelete = async () => {
      await deleteChildProfile(profile.id);
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
      if (selectedProfile?.id === profile.id) {
        setSelectedProfile(profiles.find((p) => p.id !== profile.id) ?? null);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(`Remove ${profile.child_name}'s profile?`)) doDelete();
    } else {
      Alert.alert('Remove Profile', `Remove ${profile.child_name}'s profile?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // Start assessment for a child
  const startAssessment = useCallback(() => {
    if (!selectedProfile) return;

    // Determine which milestones to show based on child's age group
    const ageGroup = ageGroups.find((ag) => ag.id === selectedProfile.age_group_id);
    if (!ageGroup) return;

    // Include milestones from birth up through the child's age group
    // This is how PDMS-2 works: start from below and work up
    const maxMonths = ageGroup.max_months;
    const relevantMilestones = allMilestones.filter(
      (m) => (m.age_equivalent_months ?? 0) <= maxMonths
    );

    // Sort by age then display order
    relevantMilestones.sort((a, b) => {
      const aDiff = (a.age_equivalent_months ?? 0) - (b.age_equivalent_months ?? 0);
      if (aDiff !== 0) return aDiff;
      return a.display_order - b.display_order;
    });

    setAssessmentMilestones(relevantMilestones);

    // Determine categories present
    const cats: string[] = [];
    const catSet = new Set<string>();
    for (const m of relevantMilestones) {
      const cat = m.category ?? 'locomotion';
      if (!catSet.has(cat)) {
        catSet.add(cat);
        cats.push(cat);
      }
    }
    // Order categories logically
    const catOrder = ['reflexes', 'stationary', 'locomotion', 'object_manipulation'];
    cats.sort((a, b) => catOrder.indexOf(a) - catOrder.indexOf(b));

    // Remove reflexes for children 12m+
    if (ageGroup.min_months >= 12) {
      const idx = cats.indexOf('reflexes');
      if (idx >= 0) cats.splice(idx, 1);
    }

    setCategories(cats);
    setCurrentCategoryIdx(0);
    setScores({});
    setScreen('assessment');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedProfile, ageGroups, allMilestones]);

  // Get milestones for current category
  const currentCategory = categories[currentCategoryIdx] ?? '';
  const currentMilestones = assessmentMilestones.filter(
    (m) => (m.category ?? 'locomotion') === currentCategory
  );

  const handleScore = (milestoneId: string, score: number) => {
    setScores((prev) => ({ ...prev, [milestoneId]: score }));
  };

  const allCurrentScored = currentMilestones.every((m) => scores[m.id] !== undefined);

  const goNextCategory = () => {
    if (currentCategoryIdx < categories.length - 1) {
      setCurrentCategoryIdx((prev) => prev + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      // Finish assessment
      finishAssessment();
    }
  };

  const goPrevCategory = () => {
    if (currentCategoryIdx > 0) {
      setCurrentCategoryIdx((prev) => prev - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const finishAssessment = async () => {
    if (!selectedProfile) return;
    setIsSavingAssessment(true);

    // Calculate results
    const result = calculateAgeEquivalency(assessmentMilestones, scores);
    setAssessmentResultData(result);

    // Save individual milestone scores
    const savePromises = Object.entries(scores).map(([milestoneId, score]) =>
      saveMilestoneScore(selectedProfile.id, milestoneId, score)
    );
    await Promise.all(savePromises);

    // Save assessment result
    await saveAssessmentResult(
      selectedProfile.id,
      result.rawScore,
      result.ageEquivalentMonths,
      result.categoryScores,
      scores
    );

    setIsSavingAssessment(false);
    setScreen('results');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const loadHistory = async () => {
    if (!selectedProfile) return;
    setIsLoadingHistory(true);
    const history = await fetchAssessmentHistory(selectedProfile.id);
    setAssessmentHistory(history);
    setIsLoadingHistory(false);
    setScreen('history');
  };

  const totalMilestonesScored = Object.keys(scores).length;
  const totalMilestones = assessmentMilestones.length;
  const progressPct = totalMilestones > 0 ? (totalMilestonesScored / totalMilestones) * 100 : 0;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // ── PROFILES SCREEN ───────────────────────────────────────────────────────
  if (screen === 'profiles') {
    return (
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PediatricDisclaimer compact />

        {/* Child Profile Selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Child Profiles</Text>
            <TouchableOpacity
              onPress={() => setShowAddForm(!showAddForm)}
              style={styles.addBtn}
            >
              <Plus size={16} color={colors.primary[500]} />
              <Text style={styles.addBtnText}>Add Child</Text>
            </TouchableOpacity>
          </View>

          {showAddForm && (
            <View style={styles.addForm}>
              <TextInput
                style={styles.input}
                placeholder="Child's name"
                value={newChildName}
                onChangeText={setNewChildName}
                placeholderTextColor={colors.neutral[400]}
              />
              <Text style={styles.formLabel}>Age Group</Text>
              <View style={styles.ageGroupGrid}>
                {ageGroups.map((ag) => (
                  <TouchableOpacity
                    key={ag.id}
                    style={[
                      styles.ageGroupChip,
                      selectedAgeGroup === ag.id && styles.ageGroupChipSelected,
                    ]}
                    onPress={() => setSelectedAgeGroup(ag.id)}
                  >
                    <Text
                      style={[
                        styles.ageGroupChipText,
                        selectedAgeGroup === ag.id && styles.ageGroupChipTextSelected,
                      ]}
                    >
                      {ag.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  (!newChildName.trim() || !selectedAgeGroup) && styles.saveBtnDisabled,
                ]}
                onPress={handleAddChild}
                disabled={!newChildName.trim() || !selectedAgeGroup || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Child Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {profiles.length === 0 && !showAddForm && (
            <View style={styles.emptyProfiles}>
              <Baby size={32} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>
                Add a child profile to start the milestone assessment.
              </Text>
            </View>
          )}

          {profiles.map((p) => {
            const isSelected = selectedProfile?.id === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.profileCard, isSelected && styles.profileCardSelected]}
                onPress={() => setSelectedProfile(p)}
                activeOpacity={0.7}
              >
                <View style={styles.profileInfo}>
                  <Baby
                    size={18}
                    color={isSelected ? colors.primary[500] : colors.neutral[400]}
                  />
                  <View>
                    <Text style={[styles.profileName, isSelected && styles.profileNameSelected]}>
                      {p.child_name}
                    </Text>
                    <Text style={styles.profileAge}>
                      {p.age_group?.display_name ?? 'No age group'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteChild(p)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={16} color={colors.neutral[400]} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Start Assessment */}
        {selectedProfile && (
          <View style={styles.section}>
            <View style={styles.assessmentStartCard}>
              <Award size={28} color={colors.primary[500]} />
              <Text style={styles.assessmentStartTitle}>
                Gross Motor Assessment
              </Text>
              <Text style={styles.assessmentStartDesc}>
                Based on the Peabody Developmental Motor Scales (PDMS-2).
                Score each milestone as your child performs it.
                At the end you'll receive a gross motor age equivalency.
              </Text>
              <Text style={styles.assessmentStartNote}>
                For {selectedProfile.child_name} ({selectedProfile.age_group?.display_name ?? ''})
              </Text>
              <TouchableOpacity
                style={styles.startAssessmentBtn}
                onPress={startAssessment}
                activeOpacity={0.7}
              >
                <Text style={styles.startAssessmentBtnText}>Begin Assessment</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.historyBtn}
                onPress={loadHistory}
                activeOpacity={0.7}
              >
                <History size={16} color={colors.neutral[600]} />
                <Text style={styles.historyBtnText}>View Past Assessments</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Scoring Guide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Scoring Works</Text>
          <View style={styles.scoringRow}>
            <View style={[styles.scoreBadge, styles.scoreBadge0]}>
              <Text style={styles.scoreBadgeText}>0</Text>
            </View>
            <View style={styles.scoringDesc}>
              <Text style={styles.scoringLabel}>Cannot Perform</Text>
              <Text style={styles.scoringDetail}>Child cannot attempt or complete the skill</Text>
            </View>
          </View>
          <View style={styles.scoringRow}>
            <View style={[styles.scoreBadge, styles.scoreBadge1]}>
              <Text style={styles.scoreBadgeText}>1</Text>
            </View>
            <View style={styles.scoringDesc}>
              <Text style={styles.scoringLabel}>Emerging</Text>
              <Text style={styles.scoringDetail}>Child shows the skill partially or inconsistently</Text>
            </View>
          </View>
          <View style={styles.scoringRow}>
            <View style={[styles.scoreBadge, styles.scoreBadge2]}>
              <Text style={[styles.scoreBadgeText, { color: '#FFFFFF' }]}>2</Text>
            </View>
            <View style={styles.scoringDesc}>
              <Text style={styles.scoringLabel}>Mastered</Text>
              <Text style={styles.scoringDetail}>Child performs the skill consistently and confidently</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ── ASSESSMENT SCREEN ─────────────────────────────────────────────────────
  if (screen === 'assessment') {
    const catInfo = CATEGORY_LABELS[currentCategory] ?? { label: currentCategory, description: '' };
    const isLastCategory = currentCategoryIdx === categories.length - 1;

    return (
      <View style={{ flex: 1 }}>
        {/* Assessment Header */}
        <View style={styles.assessmentHeader}>
          <TouchableOpacity
            style={styles.assessmentBackBtn}
            onPress={() => {
              if (currentCategoryIdx === 0) {
                const confirmExit = () => setScreen('profiles');
                if (Platform.OS === 'web') {
                  if (confirm('Exit assessment? Your progress will be lost.')) confirmExit();
                } else {
                  Alert.alert('Exit Assessment', 'Your progress will be lost.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Exit', style: 'destructive', onPress: confirmExit },
                  ]);
                }
              } else {
                goPrevCategory();
              }
            }}
          >
            <ArrowLeft size={18} color={colors.neutral[600]} />
            <Text style={styles.assessmentBackText}>
              {currentCategoryIdx === 0 ? 'Exit' : 'Back'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.assessmentHeaderTitle}>
            {selectedProfile?.child_name ?? 'Assessment'}
          </Text>
          <Text style={styles.assessmentCategoryCount}>
            {currentCategoryIdx + 1} / {categories.length}
          </Text>
        </View>

        {/* Overall Progress Bar */}
        <View style={styles.overallProgressContainer}>
          <View style={styles.overallProgressTrack}>
            <View style={[styles.overallProgressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.overallProgressText}>
            {totalMilestonesScored} of {totalMilestones} items scored
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.assessmentContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Category Header */}
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>{catInfo.label}</Text>
            <Text style={styles.categoryDesc}>{catInfo.description}</Text>
            <Text style={styles.categoryItemCount}>
              {currentMilestones.length} items in this section
            </Text>
          </View>

          {/* Milestone Items */}
          {currentMilestones.map((m, idx) => {
            const currentScore = scores[m.id];
            const ageGroup = m.age_group ?? ageGroups.find((ag) => ag.id === m.age_group_id);

            return (
              <View key={m.id} style={styles.milestoneCard}>
                <View style={styles.milestoneCardHeader}>
                  <Text style={styles.milestoneNumber}>{idx + 1}</Text>
                  <View style={styles.milestoneCardInfo}>
                    <Text style={styles.milestoneCardName}>{m.display_name}</Text>
                    {m.description && (
                      <Text style={styles.milestoneCardDesc}>{m.description}</Text>
                    )}
                    <Text style={styles.milestoneCardAge}>
                      Expected by {m.expected_by_month} months
                      {ageGroup ? ` (${ageGroup.display_name})` : ''}
                    </Text>
                    {m.red_flag && (
                      <View style={styles.redFlagBadge}>
                        <AlertTriangle size={11} color={colors.error[600]} />
                        <Text style={styles.redFlagText}>
                          Red flag if not met by {m.concern_if_missing_by_month} months
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Score Buttons */}
                <View style={styles.scoreButtonRow}>
                  <TouchableOpacity
                    style={[
                      styles.scoreButton,
                      styles.scoreButton0,
                      currentScore === 0 && styles.scoreButton0Active,
                    ]}
                    onPress={() => handleScore(m.id, 0)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.scoreButtonNum,
                      currentScore === 0 && styles.scoreButtonNumActive,
                    ]}>0</Text>
                    <Text style={[
                      styles.scoreButtonLabel,
                      currentScore === 0 && styles.scoreButtonLabelActive,
                    ]}>Cannot</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.scoreButton,
                      styles.scoreButton1,
                      currentScore === 1 && styles.scoreButton1Active,
                    ]}
                    onPress={() => handleScore(m.id, 1)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.scoreButtonNum,
                      currentScore === 1 && styles.scoreButtonNumActive1,
                    ]}>1</Text>
                    <Text style={[
                      styles.scoreButtonLabel,
                      currentScore === 1 && styles.scoreButtonLabelActive1,
                    ]}>Emerging</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.scoreButton,
                      styles.scoreButton2,
                      currentScore === 2 && styles.scoreButton2Active,
                    ]}
                    onPress={() => handleScore(m.id, 2)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.scoreButtonNum,
                      currentScore === 2 && styles.scoreButtonNumActive2,
                    ]}>2</Text>
                    <Text style={[
                      styles.scoreButtonLabel,
                      currentScore === 2 && styles.scoreButtonLabelActive2,
                    ]}>Mastered</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Navigation */}
          <View style={styles.assessmentNav}>
            {currentCategoryIdx > 0 && (
              <TouchableOpacity
                style={styles.assessmentNavBtnBack}
                onPress={goPrevCategory}
                activeOpacity={0.7}
              >
                <ArrowLeft size={16} color={colors.neutral[600]} />
                <Text style={styles.assessmentNavBtnBackText}>Previous Section</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.assessmentNavBtnNext,
                !allCurrentScored && styles.assessmentNavBtnDisabled,
              ]}
              onPress={goNextCategory}
              disabled={!allCurrentScored}
              activeOpacity={0.7}
            >
              {isSavingAssessment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.assessmentNavBtnNextText}>
                    {isLastCategory ? 'Finish & See Results' : 'Next Section'}
                  </Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {!allCurrentScored && (
            <Text style={styles.scoringReminder}>
              Please score all items in this section to continue.
            </Text>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── RESULTS SCREEN ────────────────────────────────────────────────────────
  if (screen === 'results' && assessmentResultData) {
    const { ageEquivalentMonths, rawScore, maxScore, categoryScores } = assessmentResultData;
    const ageGroup = ageGroups.find((ag) => ag.id === selectedProfile?.age_group_id);
    const childMaxMonths = ageGroup?.max_months ?? 0;

    // Determine status
    let statusColor: string = colors.success[500];
    let statusBg: string = colors.success[50];
    let statusLabel = 'On Track';
    let statusDesc = 'Your child\'s gross motor development appears to be progressing well for their age.';

    if (ageEquivalentMonths < childMaxMonths * 0.6) {
      statusColor = colors.error[500];
      statusBg = colors.error[50];
      statusLabel = 'Significant Delay';
      statusDesc = 'The assessment suggests a significant gross motor delay. We strongly recommend consulting a pediatric physical therapist for a comprehensive evaluation.';
    } else if (ageEquivalentMonths < childMaxMonths * 0.8) {
      statusColor = colors.warning[500];
      statusBg = colors.warning[50];
      statusLabel = 'Mild-Moderate Delay';
      statusDesc = 'The assessment suggests some areas of delay. Consider discussing these results with your pediatrician or a pediatric physical therapist.';
    }

    return (
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PediatricDisclaimer compact />

        {/* Age Equivalency Result */}
        <View style={[styles.section, styles.resultMainCard]}>
          <Award size={36} color={colors.primary[500]} />
          <Text style={styles.resultTitle}>Assessment Complete</Text>
          <Text style={styles.resultChildName}>{selectedProfile?.child_name}</Text>

          <View style={styles.ageEquivalencyBox}>
            <Text style={styles.ageEquivalencyLabel}>Gross Motor Age Equivalency</Text>
            <Text style={styles.ageEquivalencyValue}>
              {formatAgeEquivalency(ageEquivalentMonths)}
            </Text>
            <Text style={styles.ageEquivalencyDetail}>
              Child's age group: {ageGroup?.display_name ?? 'Unknown'}
            </Text>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <Text style={styles.statusDesc}>{statusDesc}</Text>
        </View>

        {/* Score Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={18} color={colors.neutral[700]} />
            <Text style={styles.sectionTitle}>Score Breakdown</Text>
          </View>

          <View style={styles.totalScoreRow}>
            <Text style={styles.totalScoreLabel}>Total Score</Text>
            <Text style={styles.totalScoreValue}>{rawScore} / {maxScore}</Text>
          </View>

          {Object.entries(categoryScores).map(([cat, data]) => {
            const catLabel = CATEGORY_LABELS[cat]?.label ?? cat;
            const pct = data.max > 0 ? (data.raw / data.max) * 100 : 0;
            return (
              <View key={cat} style={styles.categoryScoreRow}>
                <View style={styles.categoryScoreHeader}>
                  <Text style={styles.categoryScoreLabel}>{catLabel}</Text>
                  <Text style={styles.categoryScoreValue}>{data.raw} / {data.max}</Text>
                </View>
                <View style={styles.categoryBarTrack}>
                  <View
                    style={[
                      styles.categoryBarFill,
                      { width: `${pct}%` },
                      pct >= 80
                        ? { backgroundColor: colors.success[500] }
                        : pct >= 50
                        ? { backgroundColor: colors.warning[500] }
                        : { backgroundColor: colors.error[500] },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Milestones Not Mastered */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Areas for Growth</Text>
          <Text style={styles.areasDesc}>
            These milestones were scored as "Cannot Perform" or "Emerging":
          </Text>
          {assessmentMilestones
            .filter((m) => (scores[m.id] ?? 0) < 2)
            .map((m) => {
              const s = scores[m.id] ?? 0;
              return (
                <View key={m.id} style={styles.areaRow}>
                  <View style={[
                    styles.areaScoreBadge,
                    s === 0 ? { backgroundColor: colors.error[50], borderColor: colors.error[100] }
                            : { backgroundColor: colors.warning[50], borderColor: colors.warning[100] },
                  ]}>
                    <Text style={[
                      styles.areaScoreText,
                      s === 0 ? { color: colors.error[700] } : { color: colors.warning[700] },
                    ]}>{s}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.areaName}>{m.display_name}</Text>
                    <Text style={styles.areaAgeNote}>
                      Expected by {m.expected_by_month} months
                      {m.red_flag ? ' — Red flag' : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          {assessmentMilestones.filter((m) => (scores[m.id] ?? 0) < 2).length === 0 && (
            <Text style={styles.allMasteredText}>
              All milestones mastered — excellent!
            </Text>
          )}
        </View>

        {/* Disclaimer */}
        <View style={[styles.section, { backgroundColor: colors.info[50], borderColor: colors.info[500] }]}>
          <Text style={[styles.disclaimerText, { color: colors.info[700] }]}>
            This assessment is a screening tool based on the PDMS-2 framework and is NOT a substitute
            for a professional evaluation. Age equivalency estimates are approximate.
            Always consult a qualified pediatric physical therapist or pediatrician
            for clinical diagnosis and treatment planning.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.resultActions}>
          <TouchableOpacity
            style={styles.startAssessmentBtn}
            onPress={() => {
              setAssessmentResultData(null);
              startAssessment();
            }}
            activeOpacity={0.7}
          >
            <RotateCcw size={16} color="#FFFFFF" />
            <Text style={styles.startAssessmentBtnText}>Retake Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={loadHistory}
            activeOpacity={0.7}
          >
            <History size={16} color={colors.neutral[600]} />
            <Text style={styles.historyBtnText}>View Past Assessments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backToProfilesBtn}
            onPress={() => setScreen('profiles')}
            activeOpacity={0.7}
          >
            <Text style={styles.backToProfilesBtnText}>Back to Profiles</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── HISTORY SCREEN ────────────────────────────────────────────────────────
  if (screen === 'history') {
    return (
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.assessmentBackBtn}
          onPress={() => setScreen('profiles')}
        >
          <ArrowLeft size={16} color={colors.neutral[600]} />
          <Text style={styles.assessmentBackText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Assessment History — {selectedProfile?.child_name}
          </Text>

          {isLoadingHistory ? (
            <ActivityIndicator size="large" color={colors.primary[500]} style={{ marginTop: 20 }} />
          ) : assessmentHistory.length === 0 ? (
            <View style={styles.emptyProfiles}>
              <Clock size={28} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>No assessments completed yet.</Text>
            </View>
          ) : (
            assessmentHistory.map((result, idx) => {
              const catScores = result.category_scores ?? {};
              return (
                <View key={result.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <Text style={styles.historyDate}>
                      {new Date(result.assessment_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.historyAgeEq}>
                      {formatAgeEquivalency(result.age_equivalent_months)}
                    </Text>
                  </View>
                  <View style={styles.historyScoreRow}>
                    <Text style={styles.historyScoreLabel}>Total Score:</Text>
                    <Text style={styles.historyScoreValue}>{result.raw_score}</Text>
                  </View>
                  {Object.entries(catScores).map(([cat, data]: [string, any]) => (
                    <View key={cat} style={styles.historyScoreRow}>
                      <Text style={styles.historyCatLabel}>
                        {CATEGORY_LABELS[cat]?.label ?? cat}:
                      </Text>
                      <Text style={styles.historyCatValue}>{data.raw}/{data.max}</Text>
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    );
  }

  // Fallback
  return (
    <View style={styles.loadingContainer}>
      <TouchableOpacity onPress={() => setScreen('profiles')}>
        <Text style={{ color: colors.primary[500] }}>Return to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.neutral[500], fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral[800] },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  addBtnText: { fontSize: 14, fontWeight: '500', color: colors.primary[500] },
  addForm: {
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    padding: 10,
    fontSize: 15,
    color: colors.neutral[900],
    marginBottom: 10,
  },
  formLabel: { fontSize: 13, fontWeight: '600', color: colors.neutral[700], marginBottom: 6 },
  ageGroupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  ageGroupChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  ageGroupChipSelected: { backgroundColor: colors.primary[50], borderColor: colors.primary[500] },
  ageGroupChipText: { fontSize: 13, color: colors.neutral[600] },
  ageGroupChipTextSelected: { color: colors.primary[700], fontWeight: '600' },
  saveBtn: {
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: colors.neutral[300] },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  emptyProfiles: { paddingVertical: 24, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 14, color: colors.neutral[500], textAlign: 'center' },
  profileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: 6,
  },
  profileCardSelected: { borderColor: colors.primary[500], backgroundColor: colors.primary[50] },
  profileInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileName: { fontSize: 15, fontWeight: '600', color: colors.neutral[800] },
  profileNameSelected: { color: colors.primary[700] },
  profileAge: { fontSize: 12, color: colors.neutral[500] },

  // Assessment Start
  assessmentStartCard: { alignItems: 'center', paddingVertical: 8 },
  assessmentStartTitle: { fontSize: 18, fontWeight: '700', color: colors.neutral[900], marginTop: 10, marginBottom: 4 },
  assessmentStartDesc: { fontSize: 13, color: colors.neutral[600], textAlign: 'center', lineHeight: 19, marginBottom: 10, paddingHorizontal: 4 },
  assessmentStartNote: { fontSize: 14, fontWeight: '600', color: colors.primary[600], marginBottom: 16 },
  startAssessmentBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 10,
  },
  startAssessmentBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  historyBtnText: { fontSize: 14, color: colors.neutral[600] },

  // Scoring Guide
  scoringRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  scoreBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  scoreBadge0: { backgroundColor: colors.neutral[50], borderColor: colors.neutral[300] },
  scoreBadge1: { backgroundColor: colors.warning[50], borderColor: colors.warning[500] },
  scoreBadge2: { backgroundColor: colors.success[500], borderColor: colors.success[600] },
  scoreBadgeText: { fontSize: 14, fontWeight: '700', color: colors.neutral[700] },
  scoringDesc: { flex: 1 },
  scoringLabel: { fontSize: 14, fontWeight: '600', color: colors.neutral[800] },
  scoringDetail: { fontSize: 12, color: colors.neutral[500] },

  // Assessment Header
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  assessmentBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assessmentBackText: { fontSize: 14, color: colors.neutral[600] },
  assessmentHeaderTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral[800] },
  assessmentCategoryCount: { fontSize: 13, color: colors.neutral[500], fontWeight: '500' },

  // Overall Progress
  overallProgressContainer: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFFFFF' },
  overallProgressTrack: { height: 4, backgroundColor: colors.neutral[200], borderRadius: 2, marginBottom: 4 },
  overallProgressFill: { height: 4, backgroundColor: colors.primary[500], borderRadius: 2 },
  overallProgressText: { fontSize: 11, color: colors.neutral[500] },

  // Assessment Content
  assessmentContent: { padding: 16, paddingBottom: 40 },
  categoryHeader: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  categoryTitle: { fontSize: 20, fontWeight: '700', color: colors.primary[700], marginBottom: 4 },
  categoryDesc: { fontSize: 13, color: colors.primary[600], lineHeight: 18, marginBottom: 4 },
  categoryItemCount: { fontSize: 12, color: colors.primary[500], fontWeight: '500' },

  // Milestone Card
  milestoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  milestoneCardHeader: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  milestoneNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[600],
    overflow: 'hidden',
  },
  milestoneCardInfo: { flex: 1 },
  milestoneCardName: { fontSize: 15, fontWeight: '600', color: colors.neutral[800], marginBottom: 2 },
  milestoneCardDesc: { fontSize: 13, color: colors.neutral[500], lineHeight: 17, marginBottom: 4 },
  milestoneCardAge: { fontSize: 11, color: colors.neutral[400] },

  // Red flag
  redFlagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: colors.error[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  redFlagText: { fontSize: 11, color: colors.error[700], fontWeight: '500' },

  // Score Buttons
  scoreButtonRow: { flexDirection: 'row', gap: 8 },
  scoreButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
  },
  scoreButton0: { backgroundColor: '#FFFFFF', borderColor: colors.neutral[200] },
  scoreButton0Active: { backgroundColor: colors.neutral[100], borderColor: colors.neutral[500] },
  scoreButton1: { backgroundColor: '#FFFFFF', borderColor: colors.neutral[200] },
  scoreButton1Active: { backgroundColor: colors.warning[50], borderColor: colors.warning[500] },
  scoreButton2: { backgroundColor: '#FFFFFF', borderColor: colors.neutral[200] },
  scoreButton2Active: { backgroundColor: colors.success[50], borderColor: colors.success[500] },
  scoreButtonNum: { fontSize: 16, fontWeight: '700', color: colors.neutral[400], marginBottom: 1 },
  scoreButtonNumActive: { color: colors.neutral[700] },
  scoreButtonNumActive1: { color: colors.warning[700] },
  scoreButtonNumActive2: { color: colors.success[700] },
  scoreButtonLabel: { fontSize: 11, color: colors.neutral[400] },
  scoreButtonLabelActive: { color: colors.neutral[700], fontWeight: '500' },
  scoreButtonLabelActive1: { color: colors.warning[700], fontWeight: '500' },
  scoreButtonLabelActive2: { color: colors.success[700], fontWeight: '500' },

  // Assessment Nav
  assessmentNav: { flexDirection: 'row', gap: 10, marginTop: 16 },
  assessmentNavBtnBack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: '#FFFFFF',
  },
  assessmentNavBtnBackText: { fontSize: 14, fontWeight: '500', color: colors.neutral[600] },
  assessmentNavBtnNext: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    paddingVertical: 14,
  },
  assessmentNavBtnDisabled: { backgroundColor: colors.neutral[300] },
  assessmentNavBtnNextText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  scoringReminder: {
    fontSize: 13,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Results
  resultMainCard: { alignItems: 'center', paddingVertical: 24 },
  resultTitle: { fontSize: 22, fontWeight: '700', color: colors.neutral[900], marginTop: 12 },
  resultChildName: { fontSize: 15, color: colors.neutral[600], marginBottom: 20 },
  ageEquivalencyBox: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  ageEquivalencyLabel: { fontSize: 13, fontWeight: '600', color: colors.primary[600], marginBottom: 4 },
  ageEquivalencyValue: { fontSize: 28, fontWeight: '700', color: colors.primary[700], marginBottom: 4 },
  ageEquivalencyDetail: { fontSize: 12, color: colors.primary[500] },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusLabel: { fontSize: 14, fontWeight: '700' },
  statusDesc: { fontSize: 13, color: colors.neutral[600], textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },

  // Score Breakdown
  totalScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  totalScoreLabel: { fontSize: 15, fontWeight: '600', color: colors.neutral[800] },
  totalScoreValue: { fontSize: 16, fontWeight: '700', color: colors.primary[600] },
  categoryScoreRow: { marginBottom: 12 },
  categoryScoreHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  categoryScoreLabel: { fontSize: 14, fontWeight: '500', color: colors.neutral[700] },
  categoryScoreValue: { fontSize: 13, fontWeight: '600', color: colors.neutral[600] },
  categoryBarTrack: { height: 8, backgroundColor: colors.neutral[100], borderRadius: 4 },
  categoryBarFill: { height: 8, borderRadius: 4, minWidth: 4 },

  // Areas for Growth
  areasDesc: { fontSize: 13, color: colors.neutral[500], marginBottom: 12 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  areaScoreBadge: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  areaScoreText: { fontSize: 13, fontWeight: '700' },
  areaName: { fontSize: 14, fontWeight: '500', color: colors.neutral[800] },
  areaAgeNote: { fontSize: 11, color: colors.neutral[400] },
  allMasteredText: { fontSize: 14, color: colors.success[600], fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },

  disclaimerText: { fontSize: 12, lineHeight: 17 },

  // Result actions
  resultActions: { marginTop: 4, marginBottom: 20, gap: 4 },
  backToProfilesBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
  },
  backToProfilesBtnText: { fontSize: 14, fontWeight: '500', color: colors.neutral[600] },

  // History
  historyCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyDate: { fontSize: 14, fontWeight: '600', color: colors.neutral[800] },
  historyAgeEq: { fontSize: 14, fontWeight: '700', color: colors.primary[600] },
  historyScoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  historyScoreLabel: { fontSize: 13, fontWeight: '500', color: colors.neutral[700] },
  historyScoreValue: { fontSize: 13, fontWeight: '600', color: colors.neutral[800] },
  historyCatLabel: { fontSize: 12, color: colors.neutral[500] },
  historyCatValue: { fontSize: 12, fontWeight: '500', color: colors.neutral[600] },
});
