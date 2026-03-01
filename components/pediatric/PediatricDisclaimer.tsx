import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TriangleAlert as AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors } from '@/constants/theme';

const EMERGENCY_RED_FLAGS = [
  'Loss of previously acquired skills (regression)',
  'Seizures or unusual movements',
  'Severe asymmetry in movement or posture',
  'Sudden inability to bear weight',
  'High-pitched or inconsolable crying',
  'Difficulty breathing or swallowing',
];

export default function PediatricDisclaimer({ compact = false }: { compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <AlertTriangle size={14} color={colors.warning[600]} />
        <Text style={styles.compactText}>
          Educational only — not a substitute for in-person evaluation.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <AlertTriangle size={18} color={colors.warning[600]} />
          <Text style={styles.headerText}>Important Information</Text>
        </View>
        {expanded ? (
          <ChevronUp size={18} color={colors.neutral[500]} />
        ) : (
          <ChevronDown size={18} color={colors.neutral[500]} />
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimerText}>
        This content is for educational purposes only and is not a substitute for
        an in-person evaluation by a licensed pediatric physical therapist.
      </Text>

      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.sectionTitle}>Seek immediate care if you notice:</Text>
          {EMERGENCY_RED_FLAGS.map((flag, i) => (
            <View key={i} style={styles.flagRow}>
              <View style={styles.flagDot} />
              <Text style={styles.flagText}>{flag}</Text>
            </View>
          ))}
          <Text style={styles.encourageText}>
            When in doubt, contact your pediatrician or a pediatric physical
            therapist. Early intervention leads to the best outcomes.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[500],
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning[700],
  },
  disclaimerText: {
    fontSize: 13,
    color: colors.neutral[700],
    lineHeight: 18,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.warning[100],
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error[700],
    marginBottom: 8,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingLeft: 4,
  },
  flagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error[500],
    marginTop: 5,
    marginRight: 8,
  },
  flagText: {
    fontSize: 13,
    color: colors.neutral[700],
    flex: 1,
    lineHeight: 18,
  },
  encourageText: {
    fontSize: 13,
    color: colors.neutral[600],
    fontStyle: 'italic',
    marginTop: 10,
    lineHeight: 18,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warning[50],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  compactText: {
    fontSize: 12,
    color: colors.warning[700],
    flex: 1,
  },
});
