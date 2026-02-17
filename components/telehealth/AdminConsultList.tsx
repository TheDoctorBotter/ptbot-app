/**
 * Admin Consult List
 *
 * Displays list of telehealth consults for admin/clinician to manage.
 * Shows consent status, location verification, and note completion status.
 *
 * ACCESS CONTROL: Only visible to admin/clinician roles
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FileText,
  Check,
  X,
  Clock,
  MapPin,
  AlertTriangle,
  ChevronRight,
  Filter,
  Calendar,
  Video,
  RefreshCw,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { adminConsultService } from '@/services/telehealthService';
import { AdminConsultOverview } from '@/types/telehealth';

interface AdminConsultListProps {
  /**
   * Callback when a consult is selected for note editing
   */
  onSelectConsult: (consult: AdminConsultOverview) => void;

  /**
   * Callback to close the list
   */
  onClose?: () => void;
}

type FilterOption = 'all' | 'needs_notes' | 'upcoming' | 'red_flags';

export default function AdminConsultList({
  onSelectConsult,
  onClose,
}: AdminConsultListProps) {
  const [consults, setConsults] = useState<AdminConsultOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>('all');

  // Load consults
  const loadConsults = useCallback(async () => {
    try {
      setError(null);
      let data: AdminConsultOverview[];

      switch (filter) {
        case 'needs_notes':
          data = await adminConsultService.getConsultsNeedingNotes();
          break;
        case 'upcoming':
          data = await adminConsultService.getUpcomingConsults(20);
          break;
        case 'red_flags':
          data = (await adminConsultService.getConsultOverview())
            .filter(c => c.red_flags === true);
          break;
        default:
          data = await adminConsultService.getConsultOverview({ limit: 50 });
      }

      setConsults(data);
    } catch (err) {
      setError('Failed to load consults');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  // Initial load and filter change
  useEffect(() => {
    setLoading(true);
    loadConsults();
  }, [loadConsults]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadConsults();
  }, [loadConsults]);

  // Format date for display
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
  };

  // Get status badge info
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { label: 'Scheduled', color: colors.info[500], bg: colors.info[50] };
      case 'confirmed':
        return { label: 'Confirmed', color: colors.success[500], bg: colors.success[50] };
      case 'completed':
        return { label: 'Completed', color: colors.neutral[500], bg: colors.neutral[100] };
      case 'cancelled':
        return { label: 'Cancelled', color: colors.error[500], bg: colors.error[50] };
      default:
        return { label: status, color: colors.neutral[500], bg: colors.neutral[100] };
    }
  };

  // Render filter buttons
  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All Consults
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'needs_notes' && styles.filterButtonActive]}
          onPress={() => setFilter('needs_notes')}
        >
          <FileText size={14} color={filter === 'needs_notes' ? colors.white : colors.neutral[600]} />
          <Text style={[styles.filterText, filter === 'needs_notes' && styles.filterTextActive]}>
            Needs Notes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'upcoming' && styles.filterButtonActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Clock size={14} color={filter === 'upcoming' ? colors.white : colors.neutral[600]} />
          <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'red_flags' && styles.filterButtonActive]}
          onPress={() => setFilter('red_flags')}
        >
          <AlertTriangle size={14} color={filter === 'red_flags' ? colors.white : colors.error[500]} />
          <Text style={[styles.filterText, filter === 'red_flags' && styles.filterTextActive]}>
            Red Flags
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // Render consult card
  const renderConsultCard = (consult: AdminConsultOverview) => {
    const { date, time } = formatDateTime(consult.start_time);
    const statusBadge = getStatusBadge(consult.appointment_status);

    return (
      <TouchableOpacity
        key={consult.appointment_id}
        style={styles.consultCard}
        onPress={() => onSelectConsult(consult)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.patientName}>{consult.patient_name}</Text>
            {consult.patient_email && (
              <Text style={styles.patientEmail}>{consult.patient_email}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
            <Text style={[styles.statusText, { color: statusBadge.color }]}>
              {statusBadge.label}
            </Text>
          </View>
        </View>

        {/* Date/Time */}
        <View style={styles.dateTimeRow}>
          <Calendar size={16} color={colors.neutral[500]} />
          <Text style={styles.dateTimeText}>{date}</Text>
          <Clock size={16} color={colors.neutral[500]} />
          <Text style={styles.dateTimeText}>{time}</Text>
        </View>

        {/* Compliance Status */}
        <View style={styles.complianceRow}>
          {/* Consent Status */}
          <View style={styles.complianceItem}>
            <View style={[
              styles.complianceIcon,
              consult.has_consent ? styles.complianceIconSuccess : styles.complianceIconWarning
            ]}>
              {consult.has_consent ? (
                <Check size={12} color={colors.success[600]} />
              ) : (
                <X size={12} color={colors.warning[600]} />
              )}
            </View>
            <Text style={styles.complianceText}>Consent</Text>
          </View>

          {/* Location Status */}
          <View style={styles.complianceItem}>
            <View style={[
              styles.complianceIcon,
              consult.location_verified ? styles.complianceIconSuccess : styles.complianceIconWarning
            ]}>
              {consult.location_verified ? (
                <MapPin size={12} color={colors.success[600]} />
              ) : (
                <MapPin size={12} color={colors.warning[600]} />
              )}
            </View>
            <Text style={styles.complianceText}>
              {consult.confirmed_state || 'No location'}
            </Text>
          </View>

          {/* Note Status */}
          <View style={styles.complianceItem}>
            <View style={[
              styles.complianceIcon,
              consult.has_note ? styles.complianceIconSuccess : styles.complianceIconWarning
            ]}>
              {consult.has_note ? (
                <FileText size={12} color={colors.success[600]} />
              ) : (
                <FileText size={12} color={colors.warning[600]} />
              )}
            </View>
            <Text style={styles.complianceText}>
              {consult.has_note ? 'Documented' : 'Needs Note'}
            </Text>
          </View>

          {/* EMR Sync */}
          {consult.has_note && (
            <View style={styles.complianceItem}>
              <View style={[
                styles.complianceIcon,
                consult.emr_synced ? styles.complianceIconSuccess : styles.complianceIconNeutral
              ]}>
                <RefreshCw size={12} color={consult.emr_synced ? colors.success[600] : colors.neutral[400]} />
              </View>
              <Text style={styles.complianceText}>
                {consult.emr_synced ? 'Synced' : 'Not synced'}
              </Text>
            </View>
          )}
        </View>

        {/* Red flags indicator */}
        {consult.red_flags && (
          <View style={styles.redFlagsBanner}>
            <AlertTriangle size={14} color={colors.error[600]} />
            <Text style={styles.redFlagsText}>Red flags identified</Text>
          </View>
        )}

        {/* Action hint */}
        <View style={styles.actionHint}>
          <Text style={styles.actionHintText}>
            {consult.has_note ? 'View/Edit Note' : 'Complete Documentation'}
          </Text>
          <ChevronRight size={16} color={colors.primary[500]} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Consult Management</Text>
          <Text style={styles.headerSubtitle}>
            Review and document telehealth consultations
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      {renderFilters()}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Loading consults...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <AlertTriangle size={48} color={colors.error[500]} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadConsults}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : consults.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Video size={48} color={colors.neutral[400]} />
            <Text style={styles.emptyTitle}>No consults found</Text>
            <Text style={styles.emptyText}>
              {filter === 'needs_notes'
                ? 'All completed consults have been documented!'
                : filter === 'upcoming'
                ? 'No upcoming consultations scheduled.'
                : filter === 'red_flags'
                ? 'No consults with red flags.'
                : 'No consultations to display.'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>
              {consults.length} {consults.length === 1 ? 'consult' : 'consults'}
            </Text>
            {consults.map(renderConsultCard)}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    backgroundColor: colors.primary[500],
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing[1],
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[100],
  },
  closeButton: {
    padding: spacing[2],
  },
  filterContainer: {
    backgroundColor: colors.white,
    padding: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    marginRight: spacing[2],
    backgroundColor: colors.neutral[100],
    gap: spacing[1],
  },
  filterButtonActive: {
    backgroundColor: colors.primary[500],
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    fontWeight: typography.fontWeight.medium,
  },
  filterTextActive: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  loadingContainer: {
    padding: spacing[8],
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
  },
  errorContainer: {
    padding: spacing[8],
    alignItems: 'center',
  },
  errorText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.error[600],
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  emptyContainer: {
    padding: spacing[8],
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[700],
  },
  emptyText: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  resultCount: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginBottom: spacing[3],
  },
  consultCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  patientName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[900],
  },
  patientEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  dateTimeText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    marginRight: spacing[3],
  },
  complianceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  complianceIcon: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  complianceIconSuccess: {
    backgroundColor: colors.success[50],
  },
  complianceIconWarning: {
    backgroundColor: colors.warning[50],
  },
  complianceIconNeutral: {
    backgroundColor: colors.neutral[100],
  },
  complianceText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
  },
  redFlagsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    padding: spacing[2],
    borderRadius: borderRadius.sm,
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  redFlagsText: {
    fontSize: typography.fontSize.xs,
    color: colors.error[600],
    fontWeight: typography.fontWeight.medium,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing[1],
  },
  actionHintText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },
  bottomSpacer: {
    height: spacing[8],
  },
});
