import React, { useState, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Play,
  BookOpen,
  Activity,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import {
  getInjuryRegions,
  getInjuriesBySection,
  getInjuryDetail,
  type InjuryRegion,
  type InjurySummary,
  type InjuryDetail,
} from '@/services/injuryLibraryService';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type View = 'regions' | 'injuries' | 'detail';

export default function InjuryLibraryModal({ visible, onClose }: Props) {
  const [view, setView] = useState<View>('regions');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [regions, setRegions] = useState<InjuryRegion[]>([]);
  const [injuries, setInjuries] = useState<InjurySummary[]>([]);
  const [detail, setDetail] = useState<InjuryDetail | null>(null);

  const [selectedRegion, setSelectedRegion] = useState<InjuryRegion | null>(null);

  // Cache so we don't refetch on every open
  const regionsCache = useRef<InjuryRegion[] | null>(null);
  const injuriesCache = useRef<Record<string, InjurySummary[]>>({});

  // Load regions when modal opens
  const handleVisible = useCallback(async () => {
    if (!visible) return;
    // Reset to regions view when reopened
    setView('regions');
    setSelectedRegion(null);
    setDetail(null);
    setError(null);

    if (regionsCache.current) {
      setRegions(regionsCache.current);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getInjuryRegions();
      regionsCache.current = data;
      setRegions(data);
    } catch (e) {
      setError('Could not load body regions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [visible]);

  React.useEffect(() => {
    handleVisible();
  }, [handleVisible]);

  const handleSelectRegion = useCallback(async (region: InjuryRegion) => {
    setSelectedRegion(region);
    setError(null);

    if (injuriesCache.current[region.id]) {
      setInjuries(injuriesCache.current[region.id]);
      setView('injuries');
      return;
    }

    setIsLoading(true);
    try {
      const data = await getInjuriesBySection(region.id);
      injuriesCache.current[region.id] = data;
      setInjuries(data);
      setView('injuries');
    } catch (e) {
      setError('Could not load injuries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectInjury = useCallback(async (injury: InjurySummary) => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await getInjuryDetail(injury.id);
      setDetail(data);
      setView('detail');
    } catch (e) {
      setError('Could not load injury details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    if (view === 'detail') {
      setView('injuries');
      setDetail(null);
    } else if (view === 'injuries') {
      setView('regions');
      setSelectedRegion(null);
    }
  }, [view]);

  const openVideo = useCallback((videoId: string) => {
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  }, []);

  const renderHeader = () => {
    const title =
      view === 'regions'
        ? 'Injury Library'
        : view === 'injuries'
        ? selectedRegion?.name ?? 'Injuries'
        : detail?.display_name ?? 'Injury Detail';

    return (
      <View style={styles.header}>
        {view !== 'regions' ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={22} color={colors.primary[400]} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRegions = () => (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.sectionHint}>Select a body region to browse common injuries</Text>
      {regions.map((region) => (
        <TouchableOpacity
          key={region.id}
          style={styles.regionCard}
          onPress={() => handleSelectRegion(region)}
        >
          <View style={styles.regionIcon}>
            <Activity size={20} color={colors.primary[400]} />
          </View>
          <Text style={styles.regionName}>{region.name}</Text>
          <ChevronRight size={18} color="#6B7280" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderInjuries = () => (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.sectionHint}>
        {injuries.length} condition{injuries.length !== 1 ? 's' : ''} — tap to view rehab protocol
      </Text>
      {injuries.map((injury) => (
        <TouchableOpacity
          key={injury.id}
          style={styles.injuryCard}
          onPress={() => handleSelectInjury(injury)}
        >
          <View style={styles.injuryCardContent}>
            <Text style={styles.injuryName}>{injury.display_name}</Text>
            {injury.description ? (
              <Text style={styles.injuryDesc} numberOfLines={2}>
                {injury.description}
              </Text>
            ) : null}
          </View>
          <ChevronRight size={18} color="#6B7280" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderDetail = () => {
    if (!detail) return null;
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Description */}
        {detail.description ? (
          <Text style={styles.detailDescription}>{detail.description}</Text>
        ) : null}

        {/* Common Symptoms */}
        {detail.common_symptoms.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Common Symptoms</Text>
            {detail.common_symptoms.map((s, i) => (
              <Text key={i} style={styles.bulletItem}>• {s}</Text>
            ))}
          </View>
        )}

        {/* Red Flags */}
        {detail.red_flags.length > 0 && (
          <View style={[styles.detailSection, styles.redFlagSection]}>
            <View style={styles.redFlagHeader}>
              <AlertTriangle size={16} color="#EF4444" />
              <Text style={[styles.detailSectionTitle, styles.redFlagTitle]}>Red Flags — Seek Medical Attention</Text>
            </View>
            {detail.red_flags.map((f, i) => (
              <Text key={i} style={styles.redFlagItem}>• {f}</Text>
            ))}
          </View>
        )}

        {/* Rehab Protocol Phases */}
        {detail.phases.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Rehab Protocol</Text>
            {detail.protocol_name ? (
              <Text style={styles.protocolName}>{detail.protocol_name}</Text>
            ) : null}
            {detail.phases.map((phase) => (
              <View key={phase.id} style={styles.phaseCard}>
                <View style={styles.phaseHeader}>
                  <View style={styles.phaseNumberBadge}>
                    <Text style={styles.phaseNumberText}>{phase.phase_number}</Text>
                  </View>
                  <Text style={styles.phaseName}>{phase.name}</Text>
                </View>
                {phase.goals.length > 0 && (
                  <View style={styles.phaseDetail}>
                    <Text style={styles.phaseDetailLabel}>Goals</Text>
                    {phase.goals.map((g, i) => (
                      <Text key={i} style={styles.phaseDetailItem}>• {g}</Text>
                    ))}
                  </View>
                )}
                {phase.precautions.length > 0 && (
                  <View style={styles.phaseDetail}>
                    <Text style={[styles.phaseDetailLabel, styles.precautionLabel]}>Precautions</Text>
                    {phase.precautions.map((p, i) => (
                      <Text key={i} style={[styles.phaseDetailItem, styles.precautionItem]}>• {p}</Text>
                    ))}
                  </View>
                )}
                {phase.progress_criteria.length > 0 && (
                  <View style={styles.phaseDetail}>
                    <Text style={[styles.phaseDetailLabel, styles.criteriaLabel]}>Progress Criteria</Text>
                    {phase.progress_criteria.map((c, i) => (
                      <Text key={i} style={[styles.phaseDetailItem, styles.criteriaItem]}>• {c}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Video Slots */}
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Instructional Videos</Text>
          <Text style={styles.videoSectionHint}>Videos will be added soon by your PT</Text>
          {detail.videos.map((video) => (
            <View key={video.id} style={styles.videoSlot}>
              <View style={styles.videoSlotLeft}>
                <View style={[styles.videoSlotIcon, !video.youtube_video_id && styles.videoSlotIconEmpty]}>
                  <Play size={14} color={video.youtube_video_id ? '#FFFFFF' : '#6B7280'} />
                </View>
                <Text style={[styles.videoSlotTitle, !video.youtube_video_id && styles.videoSlotTitleEmpty]}>
                  {video.title ?? `Video ${video.slot_number}`}
                </Text>
              </View>
              {video.youtube_video_id ? (
                <TouchableOpacity
                  style={styles.watchButton}
                  onPress={() => openVideo(video.youtube_video_id!)}
                >
                  <Text style={styles.watchButtonText}>Watch</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.comingSoonText}>Coming soon</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {renderHeader()}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                if (view === 'regions') handleVisible();
                else if (view === 'injuries' && selectedRegion) handleSelectRegion(selectedRegion);
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : view === 'regions' ? (
          renderRegions()
        ) : view === 'injuries' ? (
          renderInjuries()
        ) : (
          renderDetail()
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#F9FAFB',
    textAlign: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 15,
    color: colors.primary[400],
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 16,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: colors.primary[600],
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Regions list
  regionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 12,
  },
  regionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[900] + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
  },

  // Injuries list
  injuryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 12,
  },
  injuryCardContent: {
    flex: 1,
  },
  injuryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 2,
  },
  injuryDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 17,
  },

  // Detail view
  detailDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 21,
    marginBottom: 20,
  },
  detailSection: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bulletItem: {
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 4,
  },
  redFlagSection: {
    borderColor: '#EF444440',
    backgroundColor: '#1C1010',
  },
  redFlagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  redFlagTitle: {
    color: '#EF4444',
    marginBottom: 0,
  },
  redFlagItem: {
    fontSize: 13,
    color: '#FCA5A5',
    lineHeight: 20,
    marginBottom: 4,
  },
  protocolName: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
    fontStyle: 'italic',
  },

  // Phase cards
  phaseCard: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  phaseNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  phaseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    flex: 1,
  },
  phaseDetail: {
    marginBottom: 8,
  },
  phaseDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  phaseDetailItem: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 18,
    marginBottom: 2,
  },
  precautionLabel: {
    color: '#F59E0B',
  },
  precautionItem: {
    color: '#FDE68A',
  },
  criteriaLabel: {
    color: '#10B981',
  },
  criteriaItem: {
    color: '#A7F3D0',
  },

  // Video slots
  videoSectionHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  videoSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  videoSlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  videoSlotIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoSlotIconEmpty: {
    backgroundColor: '#374151',
  },
  videoSlotTitle: {
    fontSize: 13,
    color: '#E5E7EB',
    flex: 1,
  },
  videoSlotTitleEmpty: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  watchButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: colors.primary[600],
    borderRadius: 6,
  },
  watchButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  comingSoonText: {
    fontSize: 11,
    color: '#4B5563',
    fontStyle: 'italic',
  },
});
