import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LayoutDashboard, Users, User } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useUserRole } from '@/hooks/useUserRole';
import PatientDashboard from '@/components/dashboard/PatientDashboard';
import ClinicDashboard from '@/components/dashboard/ClinicDashboard';

export default function DashboardScreen() {
  const { roleData, isLoading, error, isClinicStaff } = useUserRole();

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <View style={styles.logoContainer}>
              <LayoutDashboard size={28} color="#FFFFFF" />
              <Text style={styles.logoText}>PTBOT</Text>
            </View>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <Text style={styles.headerSubtitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <View style={styles.logoContainer}>
              <LayoutDashboard size={28} color="#FFFFFF" />
              <Text style={styles.logoText}>PTBOT</Text>
            </View>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <Text style={styles.headerSubtitle}>Error loading dashboard</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine which dashboard to show based on role
  const showClinicDashboard = isClinicStaff && roleData?.clinicId;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <View style={styles.logoContainer}>
            <LayoutDashboard size={28} color="#FFFFFF" />
            <Text style={styles.logoText}>PTBOT</Text>
          </View>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.headerSubtitleRow}>
          {showClinicDashboard ? (
            <>
              <Users size={14} color={colors.primary[200]} />
              <Text style={styles.headerSubtitle}>Clinic View</Text>
            </>
          ) : (
            <>
              <User size={14} color={colors.primary[200]} />
              <Text style={styles.headerSubtitle}>My Progress</Text>
            </>
          )}
        </View>
      </View>

      {/* Role-based Dashboard */}
      {showClinicDashboard ? (
        <ClinicDashboard
          clinicId={roleData?.clinicId || null}
          clinicName={roleData?.clinicName || null}
          userId={roleData?.userId || null}
        />
      ) : (
        <PatientDashboard
          userId={roleData?.userId || null}
          firstName={roleData?.firstName || null}
        />
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.primary[200],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.neutral[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: colors.error[600],
    textAlign: 'center',
  },
});
