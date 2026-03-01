import React, { useState, useEffect, useCallback } from 'react';
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
  CircleCheck as CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import PediatricDisclaimer from './PediatricDisclaimer';
import {
  fetchAgeGroups,
  fetchChildProfiles,
  createChildProfile,
  deleteChildProfile,
  fetchMilestonesByAgeGroup,
  fetchMilestoneTracking,
  toggleMilestone,
  fetchConcerns,
  PediatricAgeGroup,
  PediatricProfile,
  PediatricMilestone,
  MilestoneTracking,
  PediatricConcern,
} from '@/services/pediatricService';

export default function PediatricDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [ageGroups, setAgeGroups] = useState<PediatricAgeGroup[]>([]);
  const [concerns, setConcerns] = useState<PediatricConcern[]>([]);
  const [profiles, setProfiles] = useState<PediatricProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PediatricProfile | null>(null);

  // Milestone tracking
  const [milestones, setMilestones] = useState<PediatricMilestone[]>([]);
  const [tracking, setTracking] = useState<MilestoneTracking[]>([]);
  const [isMilestonesLoading, setIsMilestonesLoading] = useState(false);

  // Add child form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // When to worry expanded
  const [worryExpanded, setWorryExpanded] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [ag, cp, c] = await Promise.all([
        fetchAgeGroups(),
        fetchChildProfiles(),
        fetchConcerns(),
      ]);
      setAgeGroups(ag);
      setProfiles(cp);
      setConcerns(c);
      if (cp.length > 0) setSelectedProfile(cp[0]);
      setIsLoading(false);
    };
    load();
  }, []);

  // Load milestones when profile selected
  useEffect(() => {
    if (!selectedProfile) return;
    const ageGroupId = selectedProfile.age_group_id;
    if (!ageGroupId) return;

    setIsMilestonesLoading(true);
    Promise.all([
      fetchMilestonesByAgeGroup(ageGroupId),
      fetchMilestoneTracking(selectedProfile.id),
    ]).then(([ms, tr]) => {
      setMilestones(ms);
      setTracking(tr);
      setIsMilestonesLoading(false);
    });
  }, [selectedProfile]);

  const handleToggleMilestone = useCallback(
    async (milestoneId: string) => {
      if (!selectedProfile) return;
      const existing = tracking.find((t) => t.milestone_id === milestoneId);
      const newValue = !existing?.is_met;

      // Optimistic update
      setTracking((prev) => {
        const idx = prev.findIndex((t) => t.milestone_id === milestoneId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], is_met: newValue };
          return next;
        }
        return [
          ...prev,
          {
            id: 'temp',
            user_id: '',
            pediatric_profile_id: selectedProfile.id,
            milestone_id: milestoneId,
            is_met: newValue,
            met_date: null,
            notes: null,
          },
        ];
      });

      await toggleMilestone(selectedProfile.id, milestoneId, newValue);
    },
    [selectedProfile, tracking]
  );

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

  const metCount = tracking.filter((t) => t.is_met).length;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
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
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {profiles.length === 0 && !showAddForm && (
          <View style={styles.emptyProfiles}>
            <Text style={styles.emptyText}>
              Add a child profile to start tracking milestones.
            </Text>
          </View>
        )}

        {profiles.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.profileCard,
              selectedProfile?.id === p.id && styles.profileCardSelected,
            ]}
            onPress={() => setSelectedProfile(p)}
            activeOpacity={0.7}
          >
            <View style={styles.profileInfo}>
              <Baby
                size={18}
                color={selectedProfile?.id === p.id ? colors.primary[500] : colors.neutral[400]}
              />
              <View>
                <Text
                  style={[
                    styles.profileName,
                    selectedProfile?.id === p.id && styles.profileNameSelected,
                  ]}
                >
                  {p.child_name}
                </Text>
                <Text style={styles.profileAge}>
                  {p.age_group?.display_name ?? 'No age group'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDeleteChild(p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Trash2 size={16} color={colors.neutral[400]} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      {/* Milestone Tracker */}
      {selectedProfile && selectedProfile.age_group_id && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Milestone Tracker — {selectedProfile.child_name}
          </Text>
          {milestones.length > 0 && (
            <View style={styles.progressSummary}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${milestones.length > 0 ? (metCount / milestones.length) * 100 : 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {metCount} of {milestones.length} milestones met
              </Text>
            </View>
          )}

          {isMilestonesLoading ? (
            <ActivityIndicator size="small" color={colors.primary[500]} style={{ marginTop: 16 }} />
          ) : (
            milestones.map((m) => {
              const isMet = tracking.find((t) => t.milestone_id === m.id)?.is_met ?? false;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.milestoneRow, isMet && styles.milestoneRowMet]}
                  onPress={() => handleToggleMilestone(m.id)}
                  activeOpacity={0.7}
                >
                  {isMet ? (
                    <CheckCircle size={20} color={colors.success[500]} />
                  ) : (
                    <Circle size={20} color={colors.neutral[300]} />
                  )}
                  <View style={styles.milestoneContent}>
                    <Text style={[styles.milestoneName, isMet && styles.milestoneNameMet]}>
                      {m.display_name}
                    </Text>
                    {m.description && (
                      <Text style={styles.milestoneDesc} numberOfLines={2}>
                        {m.description}
                      </Text>
                    )}
                    <Text style={styles.milestoneAge}>
                      Expected by {m.expected_by_month} months
                      {m.red_flag ? ' • Red flag if missing' : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      {/* When to Worry */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.worryHeader}
          onPress={() => setWorryExpanded(!worryExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.worryHeaderLeft}>
            <AlertTriangle size={18} color={colors.error[500]} />
            <Text style={styles.worryTitle}>When to Worry</Text>
          </View>
          {worryExpanded ? (
            <ChevronUp size={18} color={colors.neutral[500]} />
          ) : (
            <ChevronDown size={18} color={colors.neutral[500]} />
          )}
        </TouchableOpacity>

        {worryExpanded && (
          <View style={styles.worryContent}>
            <Text style={styles.worryIntro}>
              Contact your pediatrician or pediatric PT if you notice:
            </Text>
            {concerns.slice(0, 8).map((c) => (
              <View key={c.id} style={styles.worryItem}>
                <Text style={styles.worryItemTitle}>{c.display_name}</Text>
                {c.red_flags.length > 0 && (
                  <View style={styles.redFlagList}>
                    {c.red_flags.map((flag, i) => (
                      <Text key={i} style={styles.redFlagItem}>• {flag}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
            <Text style={styles.worryFooter}>
              Seek immediate care for: loss of skills, seizures, severe asymmetry,
              sudden inability to bear weight, or inconsolable distress.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral[800] },
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
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: colors.neutral[300] },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  emptyProfiles: { paddingVertical: 16, alignItems: 'center' },
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
  progressSummary: { marginBottom: 14 },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.neutral[200],
    borderRadius: 3,
    marginBottom: 6,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: colors.success[500],
    borderRadius: 3,
  },
  progressText: { fontSize: 13, color: colors.neutral[600] },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  milestoneRowMet: { backgroundColor: colors.success[50], borderColor: colors.success[100] },
  milestoneContent: { flex: 1 },
  milestoneName: { fontSize: 14, fontWeight: '500', color: colors.neutral[800] },
  milestoneNameMet: { color: colors.success[700] },
  milestoneDesc: { fontSize: 12, color: colors.neutral[500], marginTop: 2, lineHeight: 16 },
  milestoneAge: { fontSize: 11, color: colors.neutral[400], marginTop: 3 },
  worryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  worryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  worryTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral[800] },
  worryContent: { marginTop: 12 },
  worryIntro: { fontSize: 14, color: colors.neutral[700], marginBottom: 12, lineHeight: 20 },
  worryItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  worryItemTitle: { fontSize: 14, fontWeight: '600', color: colors.neutral[800], marginBottom: 4 },
  redFlagList: { paddingLeft: 4 },
  redFlagItem: { fontSize: 13, color: colors.error[700], lineHeight: 18 },
  worryFooter: {
    fontSize: 13,
    color: colors.error[600],
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 4,
  },
});
