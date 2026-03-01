import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Activity, Baby } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { CareMode } from '@/hooks/useCareMode';

interface Props {
  careMode: CareMode;
  setCareMode: (mode: CareMode) => void;
}

export default function CareModeSwitcher({ careMode, setCareMode }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Care Mode</Text>
      <View style={styles.segmented}>
        <TouchableOpacity
          style={[styles.segment, careMode === 'adult' && styles.segmentActive]}
          onPress={() => setCareMode('adult')}
          activeOpacity={0.7}
        >
          <Activity
            size={16}
            color={careMode === 'adult' ? colors.primary[500] : colors.neutral[500]}
          />
          <Text
            style={[styles.segmentText, careMode === 'adult' && styles.segmentTextActive]}
          >
            Adult / Ortho
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, careMode === 'pediatric' && styles.segmentActive]}
          onPress={() => setCareMode('pediatric')}
          activeOpacity={0.7}
        >
          <Baby
            size={16}
            color={careMode === 'pediatric' ? colors.primary[500] : colors.neutral[500]}
          />
          <Text
            style={[
              styles.segmentText,
              careMode === 'pediatric' && styles.segmentTextActive,
            ]}
          >
            Pediatric
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 8,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  segmentActive: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[500],
    borderRadius: 9,
    margin: -1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[500],
  },
  segmentTextActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
});
