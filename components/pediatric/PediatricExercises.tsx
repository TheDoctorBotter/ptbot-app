import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  Baby,
  Play,
  CalendarSearch,
  Target,
  ArrowLeft,
  TriangleAlert as AlertTriangle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import PediatricDisclaimer from './PediatricDisclaimer';
import {
  fetchAgeGroups,
  fetchConcerns,
  fetchVideosByAgeGroup,
  fetchVideosByConcern,
  PediatricAgeGroup,
  PediatricConcern,
  PediatricExerciseVideo,
} from '@/services/pediatricService';

type BrowseMode = 'tabs' | 'age_list' | 'concern_list' | 'videos';
type Tab = 'age' | 'concern';

export default function PediatricExercises() {
  const [activeTab, setActiveTab] = useState<Tab>('age');
  const [browseMode, setBrowseMode] = useState<BrowseMode>('tabs');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Data
  const [ageGroups, setAgeGroups] = useState<PediatricAgeGroup[]>([]);
  const [concerns, setConcerns] = useState<PediatricConcern[]>([]);
  const [videos, setVideos] = useState<PediatricExerciseVideo[]>([]);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const lastLoadAt = useRef<number>(0);
  const STALE_MS = 5 * 60 * 1000; // Re-fetch if data is older than 5 min

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const [ag, c] = await Promise.all([fetchAgeGroups(), fetchConcerns()]);
      setAgeGroups(ag);
      setConcerns(c);
      // If both returned empty, the fetch likely failed (RLS / network)
      if (ag.length === 0 && c.length === 0) {
        setLoadError(true);
      } else {
        lastLoadAt.current = Date.now();
      }
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-fetch on focus if data is stale or was never loaded successfully
  useFocusEffect(
    useCallback(() => {
      const dataEmpty = ageGroups.length === 0 && concerns.length === 0;
      const stale = Date.now() - lastLoadAt.current > STALE_MS;
      if (dataEmpty || stale) {
        loadData();
      }
    }, [loadData, ageGroups.length, concerns.length])
  );

  const openAgeGroup = useCallback(async (ag: PediatricAgeGroup) => {
    setSelectedLabel(ag.display_name);
    setBrowseMode('videos');
    setIsLoadingVideos(true);
    const v = await fetchVideosByAgeGroup(ag.id);
    setVideos(v);
    setIsLoadingVideos(false);
  }, []);

  const openConcern = useCallback(async (c: PediatricConcern) => {
    setSelectedLabel(c.display_name);
    setBrowseMode('videos');
    setIsLoadingVideos(true);
    const v = await fetchVideosByConcern(c.id);
    setVideos(v);
    setIsLoadingVideos(false);
  }, []);

  const goBack = () => {
    setBrowseMode('tabs');
    setVideos([]);
  };

  const openVideo = (videoId: string | null) => {
    if (!videoId) return;
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <Baby size={28} color="#FFFFFF" />
            <Text style={styles.logoText}>PTBOT</Text>
          </View>
          <Text style={styles.headerTitle}>Pediatric Exercises</Text>
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
          <Text style={styles.headerTitle}>Pediatric Exercises</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {browseMode === 'videos' ? selectedLabel : 'Browse activity library'}
        </Text>
      </View>

      {/* Tab switcher */}
      {browseMode === 'tabs' && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'age' && styles.tabActive]}
            onPress={() => setActiveTab('age')}
          >
            <CalendarSearch size={16} color={activeTab === 'age' ? colors.primary[500] : colors.neutral[500]} />
            <Text style={[styles.tabText, activeTab === 'age' && styles.tabTextActive]}>By Age</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'concern' && styles.tabActive]}
            onPress={() => setActiveTab('concern')}
          >
            <Target size={16} color={activeTab === 'concern' ? colors.primary[500] : colors.neutral[500]} />
            <Text style={[styles.tabText, activeTab === 'concern' && styles.tabTextActive]}>By Concern</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Browse Lists */}
        {browseMode === 'tabs' && (
          <>
            <PediatricDisclaimer compact />

            {/* Error / empty state with retry */}
            {loadError && ageGroups.length === 0 && concerns.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Unable to load activities</Text>
                <Text style={styles.emptyText}>
                  Please check your connection and try again.
                </Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={loadData}
                  activeOpacity={0.7}
                >
                  <RefreshCw size={14} color="#FFFFFF" />
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'age' &&
              ageGroups.map((ag) => (
                <TouchableOpacity
                  key={ag.id}
                  style={styles.listCard}
                  onPress={() => openAgeGroup(ag)}
                  activeOpacity={0.7}
                >
                  <View style={styles.listCardContent}>
                    <Text style={styles.listCardTitle}>{ag.display_name}</Text>
                    <Text style={styles.listCardSub}>
                      {ag.min_months}–{ag.max_months} months
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.neutral[400]} />
                </TouchableOpacity>
              ))}

            {activeTab === 'concern' &&
              concerns.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.listCard}
                  onPress={() => openConcern(c)}
                  activeOpacity={0.7}
                >
                  <View style={styles.listCardContent}>
                    <Text style={styles.listCardTitle}>{c.display_name}</Text>
                    {c.description && (
                      <Text style={styles.listCardSub} numberOfLines={2}>
                        {c.description}
                      </Text>
                    )}
                  </View>
                  <ChevronRight size={18} color={colors.neutral[400]} />
                </TouchableOpacity>
              ))}
          </>
        )}

        {/* Video Results */}
        {browseMode === 'videos' && (
          <>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <ArrowLeft size={16} color={colors.neutral[600]} />
              <Text style={styles.backText}>Back to browse</Text>
            </TouchableOpacity>

            {isLoadingVideos ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
              </View>
            ) : videos.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No activities yet</Text>
                <Text style={styles.emptyText}>
                  We are adding new content regularly. Check back soon!
                </Text>
              </View>
            ) : (
              videos.map((v) => (
                <View key={v.id} style={styles.videoCard}>
                  <View style={styles.videoHeader}>
                    <Text style={styles.videoTitle}>{v.title}</Text>
                    {v.age_group && (
                      <View style={styles.ageBadge}>
                        <Text style={styles.ageBadgeText}>
                          {(v.age_group as PediatricAgeGroup).display_name}
                        </Text>
                      </View>
                    )}
                    {v.concern && (
                      <View style={styles.concernBadge}>
                        <Text style={styles.concernBadgeText}>
                          {(v.concern as PediatricConcern).display_name}
                        </Text>
                      </View>
                    )}
                  </View>

                  {v.description && (
                    <Text style={styles.videoDesc}>{v.description}</Text>
                  )}

                  {v.coaching_cues.length > 0 && (
                    <View style={styles.cuesBlock}>
                      <Text style={styles.cuesTitle}>Coaching Cues</Text>
                      {v.coaching_cues.map((cue, i) => (
                        <Text key={i} style={styles.cueText}>• {cue}</Text>
                      ))}
                    </View>
                  )}

                  {v.safety_notes.length > 0 && (
                    <View style={styles.safetyBlock}>
                      <AlertTriangle size={14} color={colors.warning[600]} />
                      <View style={{ flex: 1 }}>
                        {v.safety_notes.map((note, i) => (
                          <Text key={i} style={styles.safetyText}>• {note}</Text>
                        ))}
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.watchBtn, !v.youtube_video_id && styles.watchBtnDisabled]}
                    disabled={!v.youtube_video_id}
                    onPress={() => openVideo(v.youtube_video_id)}
                    activeOpacity={0.7}
                  >
                    <Play
                      size={16}
                      color={v.youtube_video_id ? '#FFFFFF' : colors.neutral[400]}
                    />
                    <Text
                      style={[
                        styles.watchBtnText,
                        !v.youtube_video_id && styles.watchBtnTextDisabled,
                      ]}
                    >
                      {v.youtube_video_id ? 'Watch Video' : 'Video Coming Soon'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
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
  headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: colors.primary[200], marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary[500] },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.neutral[500] },
  tabTextActive: { color: colors.primary[500] },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  listCardContent: { flex: 1 },
  listCardTitle: { fontSize: 15, fontWeight: '600', color: colors.neutral[800] },
  listCardSub: { fontSize: 13, color: colors.neutral[500], marginTop: 2, lineHeight: 17 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backText: { fontSize: 14, color: colors.neutral[600] },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.neutral[700], marginBottom: 6 },
  emptyText: { fontSize: 14, color: colors.neutral[500], textAlign: 'center', marginBottom: 12 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[500],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  videoHeader: { marginBottom: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  videoTitle: { fontSize: 16, fontWeight: '600', color: colors.neutral[900], width: '100%' },
  ageBadge: {
    backgroundColor: colors.info[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ageBadgeText: { fontSize: 11, color: colors.info[700], fontWeight: '500' },
  concernBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  concernBadgeText: { fontSize: 11, color: colors.primary[700], fontWeight: '500' },
  videoDesc: { fontSize: 13, color: colors.neutral[600], lineHeight: 18, marginBottom: 10 },
  cuesBlock: { marginBottom: 10 },
  cuesTitle: { fontSize: 13, fontWeight: '600', color: colors.neutral[700], marginBottom: 4 },
  cueText: { fontSize: 13, color: colors.neutral[600], marginLeft: 4, lineHeight: 18 },
  safetyBlock: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.warning[50],
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  safetyText: { fontSize: 12, color: colors.warning[700], lineHeight: 16 },
  watchBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    paddingVertical: 10,
  },
  watchBtnDisabled: { backgroundColor: colors.neutral[100] },
  watchBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  watchBtnTextDisabled: { color: colors.neutral[400] },
});
