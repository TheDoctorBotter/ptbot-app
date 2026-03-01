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
} from 'react-native';
import {
  Baby,
  TriangleAlert as AlertTriangle,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CircleCheck as CheckCircle,
  Circle,
  Phone,
  History,
  Clock,
  Award,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import PediatricDisclaimer from './PediatricDisclaimer';
import {
  fetchAgeGroups,
  fetchChildProfiles,
  createChildProfile,
  deleteChildProfile,
  fetchSimplifiedMilestones,
  saveMilestoneScore,
  saveAssessmentResult,
  fetchAssessmentHistory,
  calculateSimpleAgeEquivalency,
  formatAgeEquivalency,
  PediatricAgeGroup,
  PediatricProfile,
  PediatricMilestone,
  AssessmentResult,
} from '@/services/pediatricService';

type Screen = 'profiles' | 'assessment' | 'results' | 'history';

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
  const [newChildAgeMonths, setNewChildAgeMonths] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Assessment state
  const [currentMilestoneIdx, setCurrentMilestoneIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'sometimes' | 'not_yet'>>({});
  const [orderedMilestones, setOrderedMilestones] = useState<PediatricMilestone[]>([]);
  const [direction, setDirection] = useState<'forward' | 'backward'>('backward');
  const [assessmentDone, setAssessmentDone] = useState(false);
  const [childAgeMonths, setChildAgeMonths] = useState(0);
  const [startIdx, setStartIdx] = useState(0);
  const [isSavingResult, setIsSavingResult] = useState(false);

  // Results
  const [resultData, setResultData] = useState<{
    ageEquivalentMonths: number;
    highestMastered: PediatricMilestone | null;
    firstNotMet: PediatricMilestone | null;
    masteredCount: number;
    totalAsked: number;
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
        fetchSimplifiedMilestones(),
      ]);
      setAgeGroups(ag);
      setProfiles(cp);
      setAllMilestones(ms);
      if (cp.length > 0) setSelectedProfile(cp[0]);
      setIsLoading(false);
    };
    load();
  }, []);

  // Find the matching age group for a given age in months
  const findAgeGroup = (months: number): PediatricAgeGroup | null => {
    for (const ag of ageGroups) {
      if (months >= ag.min_months && months < ag.max_months) return ag;
    }
    if (months >= 60) return ageGroups[ageGroups.length - 1] ?? null;
    if (months >= 36) return ageGroups.find(ag => ag.age_key === '3_5y') ?? ageGroups[ageGroups.length - 1] ?? null;
    return null;
  };

  const handleAddChild = async () => {
    const ageNum = parseInt(newChildAgeMonths, 10);
    if (!newChildName.trim() || isNaN(ageNum) || ageNum < 0 || ageNum > 60) return;

    const matchedAgeGroup = findAgeGroup(ageNum);
    if (!matchedAgeGroup) {
      const msg = 'Could not determine age group. Please enter an age between 0 and 60 months.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
      return;
    }

    setIsSaving(true);
    const profile = await createChildProfile(newChildName.trim(), null, matchedAgeGroup.id, null);
    if (profile) {
      // Store age in months in the notes field for now
      setProfiles((prev) => [profile, ...prev]);
      setSelectedProfile(profile);
      setShowAddForm(false);
      setNewChildName('');
      setNewChildAgeMonths('');
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

  // ── Start Assessment ────────────────────────────────────────────────────
  const startAssessment = useCallback((ageMonths: number) => {
    if (!selectedProfile || allMilestones.length === 0) return;

    // Sort milestones by expected_by_month
    const sorted = [...allMilestones].sort((a, b) => a.expected_by_month - b.expected_by_month);
    setOrderedMilestones(sorted);

    // Find the starting milestone — the one closest to the child's age
    let startIndex = sorted.length - 1;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].expected_by_month >= ageMonths) {
        startIndex = i;
        break;
      }
    }
    // If child's age is beyond all milestones, start at the last one
    if (ageMonths > sorted[sorted.length - 1].expected_by_month) {
      startIndex = sorted.length - 1;
    }

    setStartIdx(startIndex);
    setCurrentMilestoneIdx(startIndex);
    setChildAgeMonths(ageMonths);
    setAnswers({});
    setAssessmentDone(false);
    setDirection('backward');
    setResultData(null);
    setScreen('assessment');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedProfile, allMilestones]);

  // ── Handle answer ────────────────────────────────────────────────────────
  const handleAnswer = (answer: 'yes' | 'sometimes' | 'not_yet') => {
    const milestone = orderedMilestones[currentMilestoneIdx];
    if (!milestone) return;

    const newAnswers = { ...answers, [milestone.id]: answer };
    setAnswers(newAnswers);

    if (answer === 'yes') {
      // Child can do this. If we were going backward, we found the floor.
      // Now go forward from start to check if they're on track or ahead.
      if (direction === 'backward') {
        // We found a mastered milestone going backward. Now go forward from startIdx.
        if (currentMilestoneIdx >= startIdx) {
          // They said yes at or above start — try next one forward
          const nextIdx = currentMilestoneIdx + 1;
          if (nextIdx < orderedMilestones.length) {
            setDirection('forward');
            setCurrentMilestoneIdx(nextIdx);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          } else {
            finishAssessment(newAnswers);
          }
        } else {
          // We were below start going backward, and child said yes.
          // Now jump forward to startIdx to test age-appropriate milestones.
          setDirection('forward');
          if (startIdx < orderedMilestones.length && newAnswers[orderedMilestones[startIdx].id] === undefined) {
            setCurrentMilestoneIdx(startIdx);
          } else {
            // Already answered start, go one past it
            const nextUnanswered = findNextUnanswered(startIdx, newAnswers);
            if (nextUnanswered !== null) {
              setCurrentMilestoneIdx(nextUnanswered);
            } else {
              finishAssessment(newAnswers);
            }
          }
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }
      } else {
        // Going forward — try next milestone
        const nextIdx = findNextUnanswered(currentMilestoneIdx + 1, newAnswers);
        if (nextIdx !== null && nextIdx < orderedMilestones.length) {
          setCurrentMilestoneIdx(nextIdx);
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        } else {
          finishAssessment(newAnswers);
        }
      }
    } else {
      // Child can't do this (or sometimes). Go backward to find what they CAN do.
      if (direction === 'forward') {
        // They failed going forward — we're done, we found the ceiling
        finishAssessment(newAnswers);
      } else {
        // Going backward — keep going back
        const prevIdx = currentMilestoneIdx - 1;
        if (prevIdx >= 0) {
          setCurrentMilestoneIdx(prevIdx);
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        } else {
          // We've gone all the way to the beginning
          finishAssessment(newAnswers);
        }
      }
    }
  };

  const findNextUnanswered = (fromIdx: number, currentAnswers: Record<string, string>): number | null => {
    for (let i = fromIdx; i < orderedMilestones.length; i++) {
      if (currentAnswers[orderedMilestones[i].id] === undefined) return i;
    }
    return null;
  };

  // ── Finish Assessment ──────────────────────────────────────────────────
  const finishAssessment = async (finalAnswers: Record<string, 'yes' | 'sometimes' | 'not_yet'>) => {
    if (!selectedProfile) return;
    setAssessmentDone(true);
    setIsSavingResult(true);

    const result = calculateSimpleAgeEquivalency(orderedMilestones, finalAnswers);
    setResultData(result);

    // Save individual scores
    const scorePromises = Object.entries(finalAnswers).map(([milestoneId, answer]) => {
      const score = answer === 'yes' ? 2 : answer === 'sometimes' ? 1 : 0;
      return saveMilestoneScore(selectedProfile.id, milestoneId, score);
    });
    await Promise.all(scorePromises);

    // Save assessment result
    const snapshotScores: Record<string, number> = {};
    for (const [id, answer] of Object.entries(finalAnswers)) {
      snapshotScores[id] = answer === 'yes' ? 2 : answer === 'sometimes' ? 1 : 0;
    }
    await saveAssessmentResult(
      selectedProfile.id,
      result.masteredCount,
      result.ageEquivalentMonths,
      {},
      snapshotScores
    );

    setIsSavingResult(false);
    setScreen('results');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  // ── Load History ─────────────────────────────────────────────────────────
  const loadHistory = async () => {
    if (!selectedProfile) return;
    setIsLoadingHistory(true);
    const history = await fetchAssessmentHistory(selectedProfile.id);
    setAssessmentHistory(history);
    setIsLoadingHistory(false);
    setScreen('history');
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PROFILES SCREEN
  // ═════════════════════════════════════════════════════════════════════════
  if (screen === 'profiles') {
    return (
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PediatricDisclaimer compact />

        {/* Child Profiles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Child Profiles</Text>
            <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)} style={styles.addBtn}>
              <Plus size={16} color={colors.primary[500]} />
              <Text style={styles.addBtnText}>Add Child</Text>
            </TouchableOpacity>
          </View>

          {showAddForm && (
            <View style={styles.addForm}>
              <Text style={styles.formLabel}>Child's Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Emma"
                value={newChildName}
                onChangeText={setNewChildName}
                placeholderTextColor={colors.neutral[400]}
              />

              <Text style={styles.formLabel}>Child's Age (in months)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 14"
                value={newChildAgeMonths}
                onChangeText={(t) => setNewChildAgeMonths(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={2}
                placeholderTextColor={colors.neutral[400]}
              />
              {newChildAgeMonths !== '' && (
                <Text style={styles.ageHint}>
                  {parseInt(newChildAgeMonths, 10) >= 12
                    ? `${Math.floor(parseInt(newChildAgeMonths, 10) / 12)} year${Math.floor(parseInt(newChildAgeMonths, 10) / 12) !== 1 ? 's' : ''}${parseInt(newChildAgeMonths, 10) % 12 > 0 ? `, ${parseInt(newChildAgeMonths, 10) % 12} month${parseInt(newChildAgeMonths, 10) % 12 !== 1 ? 's' : ''}` : ''}`
                    : `${newChildAgeMonths} month${newChildAgeMonths !== '1' ? 's' : ''}`}
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  (!newChildName.trim() || !newChildAgeMonths || parseInt(newChildAgeMonths, 10) > 60) && styles.saveBtnDisabled,
                ]}
                onPress={handleAddChild}
                disabled={!newChildName.trim() || !newChildAgeMonths || parseInt(newChildAgeMonths, 10) > 60 || isSaving}
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
            <View style={styles.emptyBox}>
              <Baby size={32} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>
                Add a child profile to start the milestone tracker.
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
                  <Baby size={18} color={isSelected ? colors.primary[500] : colors.neutral[400]} />
                  <View>
                    <Text style={[styles.profileName, isSelected && styles.profileNameSelected]}>
                      {p.child_name}
                    </Text>
                    <Text style={styles.profileAge}>
                      {p.age_group?.display_name ?? 'Unknown age'}
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
            <View style={styles.startCard}>
              <Award size={28} color={colors.primary[500]} />
              <Text style={styles.startTitle}>Milestone Tracker</Text>
              <Text style={styles.startDesc}>
                We'll ask about key developmental milestones starting at
                {' '}{selectedProfile.child_name}'s age level. If your child isn't doing
                a skill yet, we'll work backward to find where they are. At the end, you'll get
                an age equivalency for their gross motor development.
              </Text>

              <AgePrompt
                profile={selectedProfile}
                ageGroups={ageGroups}
                onStart={startAssessment}
              />

              <TouchableOpacity style={styles.historyBtn} onPress={loadHistory} activeOpacity={0.7}>
                <History size={16} color={colors.neutral[600]} />
                <Text style={styles.historyBtnText}>View Past Results</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ASSESSMENT SCREEN
  // ═════════════════════════════════════════════════════════════════════════
  if (screen === 'assessment') {
    const milestone = orderedMilestones[currentMilestoneIdx];
    const answeredCount = Object.keys(answers).length;

    if (!milestone) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>No milestones available.</Text>
          <TouchableOpacity onPress={() => setScreen('profiles')}>
            <Text style={{ color: colors.primary[500], marginTop: 16 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const isAtOrAboveAge = milestone.expected_by_month <= childAgeMonths;

    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
        {/* Header */}
        <View style={styles.assessmentHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              const confirmExit = () => setScreen('profiles');
              if (Platform.OS === 'web') {
                if (confirm('Exit assessment? Progress will be lost.')) confirmExit();
              } else {
                Alert.alert('Exit', 'Progress will be lost.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Exit', style: 'destructive', onPress: confirmExit },
                ]);
              }
            }}
          >
            <ArrowLeft size={18} color={colors.neutral[600]} />
            <Text style={styles.backBtnText}>Exit</Text>
          </TouchableOpacity>
          <Text style={styles.assessmentHeaderTitle}>{selectedProfile?.child_name}</Text>
          <Text style={styles.assessmentCount}>{answeredCount} answered</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.assessmentBody}
          showsVerticalScrollIndicator={false}
        >
          {/* Direction indicator */}
          <View style={styles.directionBadge}>
            <Text style={styles.directionText}>
              {direction === 'backward'
                ? 'Finding your child\'s starting level...'
                : 'Checking skills above your child\'s level...'}
            </Text>
          </View>

          {/* Milestone Question */}
          <View style={styles.questionCard}>
            <Text style={styles.questionAgeTag}>
              Typically by {milestone.expected_by_month} months
            </Text>
            <Text style={styles.questionTitle}>
              Is {selectedProfile?.child_name ?? 'your child'} {milestone.display_name.toLowerCase()}?
            </Text>
            {milestone.description && (
              <Text style={styles.questionDesc}>{milestone.description}</Text>
            )}
            {milestone.red_flag && isAtOrAboveAge && (
              <View style={styles.redFlagBadge}>
                <AlertTriangle size={13} color={colors.error[600]} />
                <Text style={styles.redFlagText}>
                  Important milestone — concern if not met by {milestone.concern_if_missing_by_month} months
                </Text>
              </View>
            )}
          </View>

          {/* Answer Buttons */}
          <TouchableOpacity
            style={[styles.answerBtn, styles.answerBtnYes]}
            onPress={() => handleAnswer('yes')}
            activeOpacity={0.7}
          >
            <CheckCircle size={22} color={colors.success[600]} />
            <View style={styles.answerBtnContent}>
              <Text style={styles.answerBtnTitle}>Yes</Text>
              <Text style={styles.answerBtnHint}>My child does this consistently</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.answerBtn, styles.answerBtnSometimes]}
            onPress={() => handleAnswer('sometimes')}
            activeOpacity={0.7}
          >
            <Circle size={22} color={colors.warning[600]} />
            <View style={styles.answerBtnContent}>
              <Text style={styles.answerBtnTitle}>Sometimes</Text>
              <Text style={styles.answerBtnHint}>My child does this inconsistently or is just starting to</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.answerBtn, styles.answerBtnNo]}
            onPress={() => handleAnswer('not_yet')}
            activeOpacity={0.7}
          >
            <Circle size={22} color={colors.error[500]} />
            <View style={styles.answerBtnContent}>
              <Text style={styles.answerBtnTitle}>Not Yet</Text>
              <Text style={styles.answerBtnHint}>My child is not doing this yet</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RESULTS SCREEN
  // ═════════════════════════════════════════════════════════════════════════
  if (screen === 'results' && resultData) {
    const { ageEquivalentMonths, highestMastered, firstNotMet, masteredCount, totalAsked } = resultData;

    const isOnTrack = ageEquivalentMonths >= childAgeMonths;
    const delayMonths = childAgeMonths - ageEquivalentMonths;
    const isMild = delayMonths > 0 && delayMonths <= 3;
    const isModerate = delayMonths > 3 && delayMonths <= 6;
    const isSignificant = delayMonths > 6;

    let statusLabel: string;
    let statusColor: string;
    let statusBg: string;
    let statusDesc: string;

    if (isOnTrack) {
      statusLabel = 'On Track';
      statusColor = colors.success[600];
      statusBg = colors.success[50];
      statusDesc = `${selectedProfile?.child_name ?? 'Your child'}'s gross motor skills appear to be on track for their age. Keep up the great work!`;
    } else if (isMild) {
      statusLabel = 'Mild Delay';
      statusColor = colors.warning[600];
      statusBg = colors.warning[50];
      statusDesc = `${selectedProfile?.child_name ?? 'Your child'} may be slightly behind in some gross motor milestones. This is common and often resolves with practice, but monitoring is recommended.`;
    } else if (isModerate) {
      statusLabel = 'Moderate Delay';
      statusColor = colors.warning[700];
      statusBg = colors.warning[50];
      statusDesc = `${selectedProfile?.child_name ?? 'Your child'} appears to be behind in gross motor development. We recommend discussing these results with your pediatrician or scheduling a virtual consultation with a pediatric physical therapist.`;
    } else {
      statusLabel = 'Significant Delay';
      statusColor = colors.error[600];
      statusBg = colors.error[50];
      statusDesc = `${selectedProfile?.child_name ?? 'Your child'} appears to have a significant gross motor delay. We strongly recommend a professional evaluation by a pediatric physical therapist.`;
    }

    // Milestones not yet met
    const notMetMilestones = orderedMilestones.filter(
      (m) => answers[m.id] === 'not_yet' || answers[m.id] === 'sometimes'
    );

    return (
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PediatricDisclaimer compact />

        {/* Main Result */}
        <View style={[styles.section, styles.resultMainCard]}>
          <Award size={36} color={colors.primary[500]} />
          <Text style={styles.resultTitle}>Assessment Complete</Text>
          <Text style={styles.resultChildName}>{selectedProfile?.child_name}</Text>

          <View style={styles.ageEquivalencyBox}>
            <Text style={styles.ageEqLabel}>Gross Motor Age Equivalency</Text>
            <Text style={styles.ageEqValue}>
              {formatAgeEquivalency(ageEquivalentMonths)}
            </Text>
            <Text style={styles.ageEqDetail}>
              Child's age: {formatAgeEquivalency(childAgeMonths)}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <Text style={styles.statusDesc}>{statusDesc}</Text>

          {!isOnTrack && (
            <View style={styles.delayBox}>
              <Text style={styles.delayText}>
                Estimated delay: ~{Math.round(delayMonths)} month{Math.round(delayMonths) !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* What your child is doing */}
        {highestMastered && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What Your Child Is Doing</Text>
            <View style={styles.milestoneResult}>
              <CheckCircle size={18} color={colors.success[500]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.milestoneResultName}>{highestMastered.display_name}</Text>
                <Text style={styles.milestoneResultAge}>
                  Typically by {highestMastered.expected_by_month} months
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Next milestones to work on */}
        {notMetMilestones.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Skills to Work On</Text>
            {notMetMilestones.slice(0, 5).map((m) => {
              const answer = answers[m.id];
              return (
                <View key={m.id} style={styles.milestoneResult}>
                  <Circle
                    size={18}
                    color={answer === 'sometimes' ? colors.warning[500] : colors.neutral[300]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.milestoneResultName}>{m.display_name}</Text>
                    <Text style={styles.milestoneResultAge}>
                      Typically by {m.expected_by_month} months
                      {answer === 'sometimes' ? ' — emerging' : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Virtual Call CTA */}
        <View style={[styles.section, styles.ctaCard]}>
          <Phone size={24} color={colors.primary[500]} />
          <Text style={styles.ctaTitle}>Want Expert Guidance?</Text>
          <Text style={styles.ctaDesc}>
            Schedule a virtual consultation with a pediatric physical therapist to review
            your child's development and get a personalized plan.
          </Text>
          <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.7}>
            <Phone size={16} color="#FFFFFF" />
            <Text style={styles.ctaBtnText}>Schedule Virtual Call</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={[styles.section, { backgroundColor: colors.info[50], borderColor: colors.info[500] }]}>
          <Text style={styles.disclaimerText}>
            This screening is based on the Peabody Developmental Motor Scales (PDMS-2) framework
            and is NOT a clinical assessment. Age equivalency estimates are approximate.
            Always consult a qualified pediatric physical therapist or pediatrician
            for diagnosis and treatment.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.resultActions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              const ageGroup = ageGroups.find((ag) => ag.id === selectedProfile?.age_group_id);
              const ageMonths = ageGroup
                ? Math.round((ageGroup.min_months + ageGroup.max_months) / 2)
                : 12;
              startAssessment(ageMonths);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryBtnText}>Retake Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={loadHistory} activeOpacity={0.7}>
            <History size={16} color={colors.neutral[600]} />
            <Text style={styles.secondaryBtnText}>View Past Results</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setScreen('profiles')} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>Back to Profiles</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // HISTORY SCREEN
  // ═════════════════════════════════════════════════════════════════════════
  if (screen === 'history') {
    return (
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('profiles')}>
          <ArrowLeft size={16} color={colors.neutral[600]} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Assessment History — {selectedProfile?.child_name}
          </Text>

          {isLoadingHistory ? (
            <ActivityIndicator size="large" color={colors.primary[500]} style={{ marginTop: 20 }} />
          ) : assessmentHistory.length === 0 ? (
            <View style={styles.emptyBox}>
              <Clock size={28} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>No assessments completed yet.</Text>
            </View>
          ) : (
            assessmentHistory.map((result) => (
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
                <Text style={styles.historyScore}>
                  {result.raw_score} milestones mastered
                </Text>
              </View>
            ))
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

// ═══════════════════════════════════════════════════════════════════════════
// AGE PROMPT SUB-COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
function AgePrompt({
  profile,
  ageGroups,
  onStart,
}: {
  profile: PediatricProfile;
  ageGroups: PediatricAgeGroup[];
  onStart: (ageMonths: number) => void;
}) {
  const [ageInput, setAgeInput] = useState('');

  // Pre-fill with midpoint of their age group
  useEffect(() => {
    const ag = ageGroups.find((g) => g.id === profile.age_group_id);
    if (ag) {
      const mid = Math.round((ag.min_months + ag.max_months) / 2);
      setAgeInput(String(mid));
    }
  }, [profile, ageGroups]);

  const ageNum = parseInt(ageInput, 10);
  const isValid = !isNaN(ageNum) && ageNum >= 0 && ageNum <= 60;

  return (
    <View style={styles.agePrompt}>
      <Text style={styles.agePromptLabel}>
        How old is {profile.child_name} (in months)?
      </Text>
      <TextInput
        style={styles.agePromptInput}
        value={ageInput}
        onChangeText={(t) => setAgeInput(t.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        maxLength={2}
        placeholder="e.g. 14"
        placeholderTextColor={colors.neutral[400]}
      />
      {isValid && ageNum > 0 && (
        <Text style={styles.agePromptHint}>
          {formatAgeEquivalency(ageNum)}
        </Text>
      )}
      <TouchableOpacity
        style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
        onPress={() => isValid && onStart(ageNum)}
        disabled={!isValid}
        activeOpacity={0.7}
      >
        <Text style={styles.primaryBtnText}>Start Assessment</Text>
        <ArrowRight size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.neutral[500], fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Section
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral[800], marginBottom: 8 },

  // Add child
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontSize: 14, fontWeight: '500', color: colors.primary[500] },
  addForm: {
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  formLabel: { fontSize: 13, fontWeight: '600', color: colors.neutral[700], marginBottom: 4 },
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
  ageHint: { fontSize: 12, color: colors.primary[600], marginBottom: 10, marginTop: -6 },
  saveBtn: {
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: colors.neutral[300] },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  // Empty
  emptyBox: { paddingVertical: 24, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 14, color: colors.neutral[500], textAlign: 'center' },

  // Profile cards
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

  // Start card
  startCard: { alignItems: 'center', paddingVertical: 8 },
  startTitle: { fontSize: 18, fontWeight: '700', color: colors.neutral[900], marginTop: 8, marginBottom: 4 },
  startDesc: { fontSize: 13, color: colors.neutral[600], textAlign: 'center', lineHeight: 19, marginBottom: 16, paddingHorizontal: 4 },

  // Age prompt
  agePrompt: { width: '100%', marginBottom: 8 },
  agePromptLabel: { fontSize: 14, fontWeight: '600', color: colors.neutral[700], marginBottom: 6, textAlign: 'center' },
  agePromptInput: {
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: 6,
  },
  agePromptHint: { fontSize: 12, color: colors.primary[600], textAlign: 'center', marginBottom: 12 },

  // History
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  historyBtnText: { fontSize: 14, color: colors.neutral[600] },
  historyCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  historyDate: { fontSize: 14, fontWeight: '600', color: colors.neutral[800] },
  historyAgeEq: { fontSize: 14, fontWeight: '700', color: colors.primary[600] },
  historyScore: { fontSize: 12, color: colors.neutral[500] },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    paddingVertical: 14,
    width: '100%',
  },
  primaryBtnDisabled: { backgroundColor: colors.neutral[300] },
  primaryBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  secondaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    width: '100%',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '500', color: colors.neutral[600] },

  // Assessment header
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { fontSize: 14, color: colors.neutral[600] },
  assessmentHeaderTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral[800] },
  assessmentCount: { fontSize: 13, color: colors.neutral[500] },

  // Assessment body
  assessmentBody: { padding: 16, paddingBottom: 40 },

  directionBadge: {
    backgroundColor: colors.info[50],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  directionText: { fontSize: 13, color: colors.info[700], fontWeight: '500' },

  // Question card
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  questionAgeTag: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[500],
    marginBottom: 8,
  },
  questionTitle: { fontSize: 20, fontWeight: '700', color: colors.neutral[900], marginBottom: 6, lineHeight: 26 },
  questionDesc: { fontSize: 14, color: colors.neutral[500], lineHeight: 20 },
  redFlagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: colors.error[50],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  redFlagText: { fontSize: 12, color: colors.error[700], fontWeight: '500', flex: 1 },

  // Answer buttons
  answerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
  },
  answerBtnYes: { borderColor: colors.success[100] },
  answerBtnSometimes: { borderColor: colors.warning[100] },
  answerBtnNo: { borderColor: colors.error[100] },
  answerBtnContent: { flex: 1 },
  answerBtnTitle: { fontSize: 16, fontWeight: '600', color: colors.neutral[800] },
  answerBtnHint: { fontSize: 12, color: colors.neutral[500], marginTop: 1 },

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
    borderColor: colors.primary[100],
  },
  ageEqLabel: { fontSize: 13, fontWeight: '600', color: colors.primary[600], marginBottom: 4 },
  ageEqValue: { fontSize: 28, fontWeight: '700', color: colors.primary[700], marginBottom: 4 },
  ageEqDetail: { fontSize: 12, color: colors.primary[500] },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 10 },
  statusLabel: { fontSize: 14, fontWeight: '700' },
  statusDesc: { fontSize: 13, color: colors.neutral[600], textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },
  delayBox: {
    marginTop: 12,
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  delayText: { fontSize: 13, fontWeight: '600', color: colors.neutral[700] },

  // Milestone results
  milestoneResult: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  milestoneResultName: { fontSize: 14, fontWeight: '500', color: colors.neutral[800] },
  milestoneResultAge: { fontSize: 11, color: colors.neutral[400] },

  // CTA
  ctaCard: { alignItems: 'center', paddingVertical: 20 },
  ctaTitle: { fontSize: 17, fontWeight: '700', color: colors.neutral[900], marginTop: 8, marginBottom: 4 },
  ctaDesc: { fontSize: 13, color: colors.neutral[600], textAlign: 'center', lineHeight: 19, marginBottom: 16, paddingHorizontal: 4 },
  ctaBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
  },
  ctaBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  disclaimerText: { fontSize: 12, color: colors.info[700], lineHeight: 17 },

  resultActions: { gap: 8, marginBottom: 20 },
});
