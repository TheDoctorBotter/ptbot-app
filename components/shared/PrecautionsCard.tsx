import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export interface Precaution {
  id: string;
  title: string;
  bullets: string[];
  severity: 'info' | 'warning';
  display_order: number;
}

interface PrecautionsCardProps {
  protocolKey: string | null;
  phaseNumber: number | null;
  redFlags?: string[];
  compact?: boolean;
  showRedFlagWarning?: boolean;
}

export default function PrecautionsCard({
  protocolKey,
  phaseNumber,
  redFlags = [],
  compact = false,
  showRedFlagWarning = true,
}: PrecautionsCardProps) {
  const [precautions, setPrecautions] = useState<Precaution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(!compact);

  const loadPrecautions = useCallback(async () => {
    if (!supabase || !protocolKey) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch precautions for this protocol/phase
      let query = supabase
        .from('precautions')
        .select('id, title, bullets, severity, display_order')
        .eq('is_active', true)
        .or(`protocol_key.eq.${protocolKey},protocol_key.eq._generic_postop`)
        .order('display_order', { ascending: true });

      // If phase is specified, filter for matching or null phase
      if (phaseNumber) {
        query = supabase
          .from('precautions')
          .select('id, title, bullets, severity, display_order')
          .eq('is_active', true)
          .or(`protocol_key.eq.${protocolKey},protocol_key.eq._generic_postop`)
          .or(`phase_number.is.null,phase_number.eq.${phaseNumber}`)
          .order('display_order', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading precautions:', error);
        return;
      }

      if (data) {
        setPrecautions(data);
      }
    } catch (err) {
      console.error('Error loading precautions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [protocolKey, phaseNumber]);

  useEffect(() => {
    loadPrecautions();
  }, [loadPrecautions]);

  const hasRedFlags = redFlags.length > 0;

  // Don't render if no precautions and no red flags
  if (!isLoading && precautions.length === 0 && !hasRedFlags) {
    return null;
  }

  // Red flags warning (critical - always show prominently)
  if (hasRedFlags && showRedFlagWarning) {
    return (
      <View style={styles.redFlagContainer}>
        <View style={styles.redFlagHeader}>
          <ShieldAlert size={24} color={colors.error[600]} />
          <Text style={styles.redFlagTitle}>Important Safety Notice</Text>
        </View>
        <Text style={styles.redFlagMessage}>
          Your assessment indicated potential red flags that require medical attention.
          Please contact your healthcare provider before continuing exercises.
        </Text>
        <View style={styles.redFlagList}>
          {redFlags.map((flag, index) => (
            <View key={`rf-${index}`} style={styles.redFlagItem}>
              <Text style={styles.redFlagBullet}>•</Text>
              <Text style={styles.redFlagText}>{flag}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.redFlagButton}>
          <Text style={styles.redFlagButtonText}>Contact Provider</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.neutral[400]} />
      </View>
    );
  }

  if (precautions.length === 0) {
    return null;
  }

  // Warning precautions (protocol-specific)
  const warningPrecautions = precautions.filter((p) => p.severity === 'warning');
  const infoPrecautions = precautions.filter((p) => p.severity === 'info');

  return (
    <View style={styles.container}>
      {/* Warning Precautions (always visible) */}
      {warningPrecautions.map((precaution) => (
        <View key={precaution.id} style={styles.warningCard}>
          <View style={styles.cardHeader}>
            <AlertTriangle size={20} color={colors.warning[600]} />
            <Text style={styles.warningTitle}>{precaution.title}</Text>
          </View>
          <View style={styles.bulletList}>
            {precaution.bullets.map((bullet, index) => (
              <View key={`${precaution.id}-${index}`} style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.warningBulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Info Precautions (collapsible in compact mode) */}
      {infoPrecautions.length > 0 && (
        <View style={styles.infoCard}>
          <TouchableOpacity
            style={styles.infoHeader}
            onPress={() => compact && setIsExpanded(!isExpanded)}
            disabled={!compact}
          >
            <Info size={18} color={colors.info[600]} />
            <Text style={styles.infoTitle}>
              {infoPrecautions.length === 1
                ? infoPrecautions[0].title
                : 'General Guidelines'}
            </Text>
            {compact && (
              isExpanded ? (
                <ChevronUp size={18} color={colors.neutral[500]} />
              ) : (
                <ChevronDown size={18} color={colors.neutral[500]} />
              )
            )}
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.infoContent}>
              {infoPrecautions.map((precaution) => (
                <View key={precaution.id} style={styles.infoPrecautionGroup}>
                  {infoPrecautions.length > 1 && (
                    <Text style={styles.infoPrecautionTitle}>{precaution.title}</Text>
                  )}
                  <View style={styles.bulletList}>
                    {precaution.bullets.map((bullet, index) => (
                      <View key={`${precaution.id}-${index}`} style={styles.bulletItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.infoBulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// Static component for displaying precautions from share payload (no DB fetch)
export function StaticPrecautionsCard({
  precautions,
  redFlags = [],
}: {
  precautions: Precaution[];
  redFlags?: string[];
}) {
  const hasRedFlags = redFlags.length > 0;

  if (hasRedFlags) {
    return (
      <View style={styles.redFlagContainer}>
        <View style={styles.redFlagHeader}>
          <ShieldAlert size={24} color={colors.error[600]} />
          <Text style={styles.redFlagTitle}>Safety Notice</Text>
        </View>
        <View style={styles.redFlagList}>
          {redFlags.map((flag, index) => (
            <View key={`rf-${index}`} style={styles.redFlagItem}>
              <Text style={styles.redFlagBullet}>•</Text>
              <Text style={styles.redFlagText}>{flag}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (precautions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {precautions.map((precaution) => (
        <View
          key={precaution.id}
          style={precaution.severity === 'warning' ? styles.warningCard : styles.infoCard}
        >
          <View style={styles.cardHeader}>
            {precaution.severity === 'warning' ? (
              <AlertTriangle size={20} color={colors.warning[600]} />
            ) : (
              <Info size={18} color={colors.info[600]} />
            )}
            <Text
              style={precaution.severity === 'warning' ? styles.warningTitle : styles.infoTitle}
            >
              {precaution.title}
            </Text>
          </View>
          <View style={styles.bulletList}>
            {precaution.bullets.map((bullet, index) => (
              <View key={`${precaution.id}-${index}`} style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text
                  style={
                    precaution.severity === 'warning'
                      ? styles.warningBulletText
                      : styles.infoBulletText
                  }
                >
                  {bullet}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  // Red Flag Styles
  redFlagContainer: {
    backgroundColor: colors.error[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.error[200],
  },
  redFlagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  redFlagTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error[700],
  },
  redFlagMessage: {
    fontSize: 14,
    color: colors.error[600],
    lineHeight: 20,
    marginBottom: 12,
  },
  redFlagList: {
    gap: 6,
  },
  redFlagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  redFlagBullet: {
    fontSize: 14,
    color: colors.error[600],
    lineHeight: 20,
  },
  redFlagText: {
    flex: 1,
    fontSize: 14,
    color: colors.error[600],
    lineHeight: 20,
  },
  redFlagButton: {
    marginTop: 16,
    backgroundColor: colors.error[600],
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  redFlagButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  // Warning Card Styles
  warningCard: {
    backgroundColor: colors.warning[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  warningTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.warning[700],
  },
  warningBulletText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning[600],
    lineHeight: 20,
  },
  // Info Card Styles
  infoCard: {
    backgroundColor: colors.info[50],
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.info[200],
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
  },
  infoTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.info[700],
  },
  infoContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  infoPrecautionGroup: {
    gap: 8,
  },
  infoPrecautionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.info[700],
  },
  infoBulletText: {
    flex: 1,
    fontSize: 14,
    color: colors.info[600],
    lineHeight: 20,
  },
  // Shared Bullet Styles
  bulletList: {
    gap: 6,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    color: colors.neutral[500],
    lineHeight: 20,
  },
});
