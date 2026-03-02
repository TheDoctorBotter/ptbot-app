import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Baby,
  CalendarSearch,
  Target,
  Heart,
  ArrowRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { CareMode } from '@/hooks/useCareMode';
import PediatricDisclaimer from './PediatricDisclaimer';

interface Props {
  setCareMode: (mode: CareMode) => void;
}

const QUICK_LINKS = [
  {
    key: 'age',
    title: 'Browse by Age',
    subtitle: 'Find activities for your child\'s age group',
    icon: CalendarSearch,
    path: '/(tabs)/exercises?pedTab=age',
    color: colors.info[500],
    bgColor: colors.info[50],
  },
  {
    key: 'concern',
    title: 'Browse by Concern',
    subtitle: 'Activities for specific developmental concerns',
    icon: Target,
    path: '/(tabs)/exercises?pedTab=concern',
    color: colors.primary[500],
    bgColor: colors.primary[50],
  },
  {
    key: 'milestones',
    title: 'Milestones',
    subtitle: 'Track your child\'s developmental milestones',
    icon: Heart,
    path: '/(tabs)/dashboard',
    color: colors.success[500],
    bgColor: colors.success[50],
  },
];

export default function PediatricHome({ setCareMode }: Props) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <View style={styles.logoContainer}>
            <Baby size={28} color="#FFFFFF" />
            <Text style={styles.logoText}>PTBOT</Text>
          </View>
          <Text style={styles.headerTitle}>Pediatric Development</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Supporting your child's motor milestones
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <PediatricDisclaimer />

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to Pediatric Mode</Text>
          <Text style={styles.welcomeText}>
            Explore age-appropriate activities, track developmental milestones,
            and find guidance for common pediatric motor concerns.
          </Text>
        </View>

        {/* Quick Links */}
        <Text style={styles.sectionTitle}>Get Started</Text>
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <TouchableOpacity
              key={link.key}
              style={styles.linkCard}
              onPress={() => router.navigate(link.path as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.linkIcon, { backgroundColor: link.bgColor }]}>
                <Icon size={24} color={link.color} />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <Text style={styles.linkSubtitle}>{link.subtitle}</Text>
              </View>
              <ArrowRight size={18} color={colors.neutral[400]} />
            </TouchableOpacity>
          );
        })}

        {/* Switch Mode */}
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setCareMode('adult')}
          activeOpacity={0.7}
        >
          <Text style={styles.switchButtonText}>Switch to Adult / Orthopedic Mode</Text>
        </TouchableOpacity>
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
    paddingBottom: 20,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.primary[200],
    marginTop: 2,
  },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 40 },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[800],
    marginBottom: 12,
  },
  linkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  linkIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  linkContent: { flex: 1 },
  linkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  linkSubtitle: {
    fontSize: 13,
    color: colors.neutral[500],
  },
  switchButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[600],
  },
});
