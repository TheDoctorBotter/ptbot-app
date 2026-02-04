import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import {
  Users,
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock,
  ChevronRight,
  X,
  Calendar,
  Heart,
  Filter,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

interface PatientSummary {
  patient_id: string;
  first_name: string | null;
  last_name: string | null;
  clinic_id: string | null;
  role: string;
  last_activity_at: string | null;
  sessions_this_week: number;
  latest_assessment: {
    id: string;
    pain_level: number;
    pain_location: string;
    risk_level: string;
    protocol_key: string | null;
    phase_number: number | null;
    red_flags: string[];
    created_at: string;
  } | null;
}

interface AlertItem {
  id: string;
  type: 'red_flag' | 'inactive' | 'high_pain';
  patientId: string;
  patientName: string;
  message: string;
  severity: 'critical' | 'warning';
  timestamp: string;
}

type AlertFilter = 'all' | 'red_flag' | 'inactive' | 'high_pain';

interface ClinicDashboardProps {
  clinicId: string | null;
  clinicName: string | null;
  userId: string | null;
}

export default function ClinicDashboard({ clinicId, clinicName, userId }: ClinicDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activePatientCount, setActivePatientCount] = useState(0);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [avgSessionsPerWeek, setAvgSessionsPerWeek] = useState(0);
  const [alertFilter, setAlertFilter] = useState<AlertFilter>('all');
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [showPatientDetail, setShowPatientDetail] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!supabase || !clinicId) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch patient activity summary view
      const { data: patientData, error: patientError } = await supabase
        .from('patient_activity_summary')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('last_activity_at', { ascending: false, nullsFirst: false });

      if (patientError) {
        console.error('Error fetching patients:', patientError);
        // Fallback to direct query if view doesn't exist
        const { data: fallbackData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, clinic_id, role')
          .eq('clinic_id', clinicId)
          .eq('role', 'patient')
          .order('first_name', { ascending: true });

        if (fallbackData) {
          const simplifiedPatients: PatientSummary[] = fallbackData.map(p => ({
            patient_id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            clinic_id: p.clinic_id,
            role: p.role,
            last_activity_at: null,
            sessions_this_week: 0,
            latest_assessment: null,
          }));
          setPatients(simplifiedPatients);
        }
      } else if (patientData) {
        setPatients(patientData);
      }

      // Calculate metrics
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const patientList = patientData || [];

      // Active patients (activity in last 7 days)
      const activeCount = patientList.filter(p => {
        if (!p.last_activity_at) return false;
        return new Date(p.last_activity_at) >= sevenDaysAgo;
      }).length;
      setActivePatientCount(activeCount);

      // Build alerts
      const newAlerts: AlertItem[] = [];

      patientList.forEach(patient => {
        const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient';

        // Red flag alerts
        if (patient.latest_assessment?.red_flags?.length > 0) {
          newAlerts.push({
            id: `rf-${patient.patient_id}`,
            type: 'red_flag',
            patientId: patient.patient_id,
            patientName,
            message: 'Red flags detected in recent assessment',
            severity: 'critical',
            timestamp: patient.latest_assessment.created_at,
          });
        }

        // High pain alerts
        if (patient.latest_assessment?.pain_level >= 7) {
          newAlerts.push({
            id: `hp-${patient.patient_id}`,
            type: 'high_pain',
            patientId: patient.patient_id,
            patientName,
            message: `Pain level ${patient.latest_assessment.pain_level}/10`,
            severity: 'warning',
            timestamp: patient.latest_assessment.created_at,
          });
        }

        // Inactive alerts
        if (patient.last_activity_at) {
          const lastActive = new Date(patient.last_activity_at);
          if (lastActive < sevenDaysAgo) {
            newAlerts.push({
              id: `in-${patient.patient_id}`,
              type: 'inactive',
              patientId: patient.patient_id,
              patientName,
              message: 'Inactive for more than 7 days',
              severity: 'warning',
              timestamp: patient.last_activity_at,
            });
          }
        } else if (patient.latest_assessment) {
          // Has assessment but no activity tracked
          newAlerts.push({
            id: `in-${patient.patient_id}`,
            type: 'inactive',
            patientId: patient.patient_id,
            patientName,
            message: 'No recent activity recorded',
            severity: 'warning',
            timestamp: patient.latest_assessment.created_at,
          });
        }
      });

      // Sort alerts by severity then timestamp
      newAlerts.sort((a, b) => {
        if (a.severity === 'critical' && b.severity !== 'critical') return -1;
        if (b.severity === 'critical' && a.severity !== 'critical') return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setAlerts(newAlerts);

      // At-risk count (inactive or red-flagged)
      const atRisk = new Set(newAlerts.filter(a => a.type === 'red_flag' || a.type === 'inactive').map(a => a.patientId)).size;
      setAtRiskCount(atRisk);

      // Average sessions per week
      const totalSessions = patientList.reduce((sum, p) => sum + (p.sessions_this_week || 0), 0);
      const avg = patientList.length > 0 ? totalSessions / patientList.length : 0;
      setAvgSessionsPerWeek(Math.round(avg * 10) / 10);

    } catch (err) {
      console.error('Error loading clinic dashboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clinicId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  const getFilteredAlerts = (): AlertItem[] => {
    if (alertFilter === 'all') return alerts;
    return alerts.filter(a => a.type === alertFilter);
  };

  const getPatientStatus = (patient: PatientSummary): { status: string; color: string } => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Check for red flags
    if (patient.latest_assessment?.red_flags?.length > 0) {
      return { status: 'Needs Follow-up', color: colors.error[500] };
    }

    // Check for activity
    if (patient.last_activity_at) {
      const lastActive = new Date(patient.last_activity_at);
      if (lastActive >= sevenDaysAgo) {
        return { status: 'Active', color: colors.success[500] };
      }
    }

    return { status: 'Inactive', color: colors.warning[500] };
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handlePatientPress = (patient: PatientSummary) => {
    setSelectedPatient(patient);
    setShowPatientDetail(true);
  };

  const handleAlertPress = (alert: AlertItem) => {
    const patient = patients.find(p => p.patient_id === alert.patientId);
    if (patient) {
      handlePatientPress(patient);
    }
  };

  const renderPatientItem = ({ item }: { item: PatientSummary }) => {
    const status = getPatientStatus(item);
    const patientName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown Patient';

    return (
      <TouchableOpacity
        style={styles.patientRow}
        onPress={() => handlePatientPress(item)}
      >
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{patientName}</Text>
          <Text style={styles.patientCondition}>
            {item.latest_assessment?.protocol_key
              ? item.latest_assessment.protocol_key.replace(/_/g, ' ')
              : item.latest_assessment?.pain_location || 'No assessment'}
          </Text>
        </View>

        {item.latest_assessment?.phase_number && (
          <View style={styles.phaseBadge}>
            <Text style={styles.phaseText}>P{item.latest_assessment.phase_number}</Text>
          </View>
        )}

        <Text style={styles.lastActive}>
          {formatDate(item.last_activity_at)}
        </Text>

        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.status}
          </Text>
        </View>

        <ChevronRight size={16} color={colors.neutral[400]} />
      </TouchableOpacity>
    );
  };

  const renderAlertItem = ({ item }: { item: AlertItem }) => (
    <TouchableOpacity
      style={styles.alertItem}
      onPress={() => handleAlertPress(item)}
    >
      <View style={[
        styles.alertIcon,
        item.severity === 'critical' ? styles.alertIconCritical : styles.alertIconWarning
      ]}>
        <AlertTriangle
          size={16}
          color={item.severity === 'critical' ? colors.error[600] : colors.warning[600]}
        />
      </View>
      <View style={styles.alertContent}>
        <Text style={styles.alertPatientName}>{item.patientName}</Text>
        <Text style={styles.alertMessage}>{item.message}</Text>
      </View>
      <ChevronRight size={16} color={colors.neutral[400]} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading clinic dashboard...</Text>
      </View>
    );
  }

  if (!clinicId) {
    return (
      <View style={styles.emptyContainer}>
        <Users size={48} color={colors.neutral[400]} />
        <Text style={styles.emptyTitle}>No Clinic Assigned</Text>
        <Text style={styles.emptyText}>
          You need to be assigned to a clinic to view the dashboard.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary[500]]}
          tintColor={colors.primary[500]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.clinicName}>{clinicName || 'Clinic Dashboard'}</Text>
        <Text style={styles.headerSubtitle}>
          {patients.length} total patient{patients.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* KPI Tiles */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiTile}>
          <Users size={24} color={colors.success[500]} />
          <Text style={styles.kpiValue}>{activePatientCount}</Text>
          <Text style={styles.kpiLabel}>Active Patients</Text>
        </View>

        <View style={styles.kpiTile}>
          <AlertTriangle size={24} color={colors.error[500]} />
          <Text style={styles.kpiValue}>{atRiskCount}</Text>
          <Text style={styles.kpiLabel}>At Risk</Text>
        </View>

        <View style={styles.kpiTile}>
          <TrendingUp size={24} color={colors.info[500]} />
          <Text style={styles.kpiValue}>{avgSessionsPerWeek}</Text>
          <Text style={styles.kpiLabel}>Avg Sessions/Wk</Text>
        </View>
      </View>

      {/* Alerts Panel */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alerts</Text>
          <View style={styles.filterContainer}>
            {(['all', 'red_flag', 'inactive', 'high_pain'] as AlertFilter[]).map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  alertFilter === filter && styles.filterButtonActive
                ]}
                onPress={() => setAlertFilter(filter)}
              >
                <Text style={[
                  styles.filterButtonText,
                  alertFilter === filter && styles.filterButtonTextActive
                ]}>
                  {filter === 'all' ? 'All' :
                   filter === 'red_flag' ? 'Red Flag' :
                   filter === 'inactive' ? 'Inactive' : 'High Pain'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {getFilteredAlerts().length > 0 ? (
          <View style={styles.alertsList}>
            {getFilteredAlerts().slice(0, 5).map(alert => (
              <View key={alert.id}>
                {renderAlertItem({ item: alert })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noAlerts}>
            <Heart size={24} color={colors.success[500]} />
            <Text style={styles.noAlertsText}>No alerts at this time</Text>
          </View>
        )}
      </View>

      {/* Patient List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Patients</Text>
        </View>

        {patients.length > 0 ? (
          <View style={styles.patientList}>
            {patients.map(patient => (
              <View key={patient.patient_id}>
                {renderPatientItem({ item: patient })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noPatients}>
            <Users size={32} color={colors.neutral[400]} />
            <Text style={styles.noPatientsText}>No patients in this clinic yet</Text>
          </View>
        )}
      </View>

      {/* Patient Detail Modal */}
      <Modal
        visible={showPatientDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPatientDetail(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Patient Details</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPatientDetail(false)}
            >
              <X size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          {selectedPatient && (
            <ScrollView style={styles.modalContent}>
              {/* Patient Name */}
              <Text style={styles.detailPatientName}>
                {`${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() || 'Unknown Patient'}
              </Text>

              {/* Status Badge */}
              <View style={styles.detailStatusContainer}>
                {(() => {
                  const status = getPatientStatus(selectedPatient);
                  return (
                    <View style={[styles.detailStatusBadge, { backgroundColor: status.color + '20' }]}>
                      <Text style={[styles.detailStatusText, { color: status.color }]}>
                        {status.status}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              {/* Protocol Info */}
              {selectedPatient.latest_assessment && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Current Plan</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Protocol</Text>
                    <Text style={styles.detailValue}>
                      {selectedPatient.latest_assessment.protocol_key
                        ? selectedPatient.latest_assessment.protocol_key.replace(/_/g, ' ')
                        : 'Symptom-based plan'}
                    </Text>
                  </View>
                  {selectedPatient.latest_assessment.phase_number && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Phase</Text>
                      <Text style={styles.detailValue}>
                        Phase {selectedPatient.latest_assessment.phase_number}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Focus Area</Text>
                    <Text style={styles.detailValue}>
                      {selectedPatient.latest_assessment.pain_location}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pain Level</Text>
                    <Text style={[
                      styles.detailValue,
                      selectedPatient.latest_assessment.pain_level >= 7 && styles.highPainText
                    ]}>
                      {selectedPatient.latest_assessment.pain_level}/10
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Last Assessment</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedPatient.latest_assessment.created_at)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Engagement Card */}
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Engagement (Last 30 Days)</Text>
                <View style={styles.engagementGrid}>
                  <View style={styles.engagementItem}>
                    <Calendar size={20} color={colors.neutral[500]} />
                    <Text style={styles.engagementValue}>
                      {formatDate(selectedPatient.last_activity_at)}
                    </Text>
                    <Text style={styles.engagementLabel}>Last Active</Text>
                  </View>
                  <View style={styles.engagementItem}>
                    <Activity size={20} color={colors.neutral[500]} />
                    <Text style={styles.engagementValue}>
                      {selectedPatient.sessions_this_week}
                    </Text>
                    <Text style={styles.engagementLabel}>Sessions This Week</Text>
                  </View>
                </View>
              </View>

              {/* Red Flags Warning */}
              {selectedPatient.latest_assessment?.red_flags?.length > 0 && (
                <View style={styles.redFlagCard}>
                  <AlertTriangle size={20} color={colors.error[600]} />
                  <View style={styles.redFlagContent}>
                    <Text style={styles.redFlagTitle}>Red Flags Detected</Text>
                    {selectedPatient.latest_assessment.red_flags.map((flag, index) => (
                      <Text key={index} style={styles.redFlagText}>• {flag}</Text>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.neutral[600],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.neutral[50],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.neutral[600],
    textAlign: 'center',
    marginTop: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  clinicName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
    marginTop: 4,
  },
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 16,
  },
  kpiTile: {
    flex: 1,
    backgroundColor: colors.white,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
  },
  filterButtonActive: {
    backgroundColor: colors.primary[500],
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral[600],
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  alertsList: {},
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconCritical: {
    backgroundColor: colors.error[100],
  },
  alertIconWarning: {
    backgroundColor: colors.warning[100],
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertPatientName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  alertMessage: {
    fontSize: 12,
    color: colors.neutral[600],
    marginTop: 2,
  },
  noAlerts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  noAlertsText: {
    fontSize: 14,
    color: colors.success[600],
    marginLeft: 8,
  },
  patientList: {},
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  patientCondition: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
    textTransform: 'capitalize',
  },
  phaseBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  phaseText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[700],
  },
  lastActive: {
    fontSize: 11,
    color: colors.neutral[500],
    marginRight: 8,
    width: 60,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  noPatients: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  noPatientsText: {
    fontSize: 14,
    color: colors.neutral[500],
    marginTop: 12,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[800],
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailPatientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  detailStatusContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  detailStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  detailLabel: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[800],
    textTransform: 'capitalize',
  },
  highPainText: {
    color: colors.error[600],
  },
  engagementGrid: {
    flexDirection: 'row',
  },
  engagementItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  engagementValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginTop: 8,
  },
  engagementLabel: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 4,
    textAlign: 'center',
  },
  redFlagCard: {
    flexDirection: 'row',
    backgroundColor: colors.error[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.error[200],
  },
  redFlagContent: {
    flex: 1,
    marginLeft: 12,
  },
  redFlagTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error[700],
    marginBottom: 8,
  },
  redFlagText: {
    fontSize: 13,
    color: colors.error[600],
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 32,
  },
});
