/**
 * OutcomeSummaryCard Component
 *
 * Displays a summary of outcome measures for patient dashboard.
 * Shows baseline vs latest scores with improvement indicators.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  ClipboardCheck,
  Activity,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import type { OutcomeSummary } from '@/services/outcomeService';

interface OutcomeSummaryCardProps {
  summary: OutcomeSummary;
  onRecheck?: () => void;
  showRecheckCTA?: boolean;
}

export default function OutcomeSummaryCard({
  summary,
  onRecheck,
  showRecheckCTA = true,
}: OutcomeSummaryCardProps) {
  const hasBaseline = summary.baseline.function || summary.baseline.pain;
  const hasFollowup = summary.latest.function !== summary.baseline.function ||
                      summary.latest.pain !== summary.baseline.pain;

  // Determine improvement direction
  // For function scores (ODI, QuickDASH): lower is better (negative change = improvement)
  // For KOOS: higher is better (positive change = improvement)
  // For pain: lower is better (negative change = improvement)
  const getFunctionImprovement = () => {
    if (summary.change.functionChange === null) return null;
    const questKey = summary.baseline.function?.questionnaire?.key;

    if (questKey === 'koos') {
      // KOOS: higher is better
      return summary.change.functionChange > 0 ? 'improved' :
             summary.change.functionChange < 0 ? 'worsened' : 'same';
    } else {
      // ODI, QuickDASH: lower is better
      return summary.change.functionChange < 0 ? 'improved' :
             summary.change.functionChange > 0 ? 'worsened' : 'same';
    }
  };

  const getPainImprovement = () => {
    if (summary.change.painChange === null) return null;
    return summary.change.painChange < 0 ? 'improved' :
           summary.change.painChange > 0 ? 'worsened' : 'same';
  };

  const functionImprovement = getFunctionImprovement();
  const painImprovement = getPainImprovement();

  const getConditionLabel = (tag: string) => {
    switch (tag) {
      case 'back': return 'Lower Back';
      case 'knee': return 'Knee';
      case 'shoulder': return 'Shoulder';
      default: return tag.charAt(0).toUpperCase() + tag.slice(1);
    }
  };

  const getQuestionnaireLabel = (key?: string) => {
    switch (key) {
      case 'odi': return 'Disability (ODI)';
      case 'koos': return 'Function (KOOS)';
      case 'quickdash': return 'Function (QuickDASH)';
      default: return 'Function';
    }
  };

  if (!hasBaseline) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ClipboardCheck size={20} color={colors.gray[400]} />
          <Text style={styles.headerTitle}>Outcome Measures</Text>
        </View>
        <View style={styles.emptyState}>
          <AlertCircle size={32} color={colors.gray[400]} />
          <Text style={styles.emptyText}>No baseline assessment yet</Text>
          <Text style={styles.emptySubtext}>
            Complete your first assessment to track your progress
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ClipboardCheck size={20} color={colors.primary[500]} />
        <Text style={styles.headerTitle}>
          {getConditionLabel(summary.condition_tag)} Progress
        </Text>
      </View>

      {/* Function Score */}
      {summary.baseline.function && (
        <View style={styles.scoreRow}>
          <View style={styles.scoreLabel}>
            <Activity size={16} color={colors.gray[500]} />
            <Text style={styles.scoreLabelText}>
              {getQuestionnaireLabel(summary.baseline.function.questionnaire?.key)}
            </Text>
          </View>
          <View style={styles.scoreValues}>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreBlockLabel}>Baseline</Text>
              <Text style={styles.scoreBlockValue}>
                {summary.baseline.function.normalized_score?.toFixed(0) ?? '--'}
              </Text>
            </View>
            {hasFollowup && summary.latest.function && (
              <>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreBlock}>
                  <Text style={styles.scoreBlockLabel}>Latest</Text>
                  <Text style={styles.scoreBlockValue}>
                    {summary.latest.function.normalized_score?.toFixed(0) ?? '--'}
                  </Text>
                </View>
                <View style={styles.changeIndicator}>
                  {functionImprovement === 'improved' && (
                    <View style={[styles.changeBadge, styles.changeBadgeGreen]}>
                      <TrendingUp size={14} color={colors.green[700]} />
                      <Text style={styles.changeBadgeTextGreen}>
                        {Math.abs(summary.change.functionChange || 0).toFixed(0)}
                      </Text>
                    </View>
                  )}
                  {functionImprovement === 'worsened' && (
                    <View style={[styles.changeBadge, styles.changeBadgeRed]}>
                      <TrendingDown size={14} color={colors.red[700]} />
                      <Text style={styles.changeBadgeTextRed}>
                        {Math.abs(summary.change.functionChange || 0).toFixed(0)}
                      </Text>
                    </View>
                  )}
                  {functionImprovement === 'same' && (
                    <View style={[styles.changeBadge, styles.changeBadgeGray]}>
                      <Minus size={14} color={colors.gray[600]} />
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Pain Score */}
      {summary.baseline.pain && (
        <View style={styles.scoreRow}>
          <View style={styles.scoreLabel}>
            <Activity size={16} color={colors.gray[500]} />
            <Text style={styles.scoreLabelText}>Pain (0-10)</Text>
          </View>
          <View style={styles.scoreValues}>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreBlockLabel}>Baseline</Text>
              <Text style={styles.scoreBlockValue}>
                {summary.baseline.pain.normalized_score?.toFixed(0) ?? '--'}
              </Text>
            </View>
            {hasFollowup && summary.latest.pain && (
              <>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreBlock}>
                  <Text style={styles.scoreBlockLabel}>Latest</Text>
                  <Text style={styles.scoreBlockValue}>
                    {summary.latest.pain.normalized_score?.toFixed(0) ?? '--'}
                  </Text>
                </View>
                <View style={styles.changeIndicator}>
                  {painImprovement === 'improved' && (
                    <View style={[styles.changeBadge, styles.changeBadgeGreen]}>
                      <TrendingDown size={14} color={colors.green[700]} />
                      <Text style={styles.changeBadgeTextGreen}>
                        {Math.abs(summary.change.painChange || 0).toFixed(0)}
                      </Text>
                    </View>
                  )}
                  {painImprovement === 'worsened' && (
                    <View style={[styles.changeBadge, styles.changeBadgeRed]}>
                      <TrendingUp size={14} color={colors.red[700]} />
                      <Text style={styles.changeBadgeTextRed}>
                        {Math.abs(summary.change.painChange || 0).toFixed(0)}
                      </Text>
                    </View>
                  )}
                  {painImprovement === 'same' && (
                    <View style={[styles.changeBadge, styles.changeBadgeGray]}>
                      <Minus size={14} color={colors.gray[600]} />
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* GROC Final Score */}
      {summary.final.groc && (
        <View style={styles.grocRow}>
          <Text style={styles.grocLabel}>Overall Change (GROC)</Text>
          <View style={[
            styles.grocBadge,
            (summary.final.groc.normalized_score || 0) > 0 && styles.grocBadgePositive,
            (summary.final.groc.normalized_score || 0) < 0 && styles.grocBadgeNegative,
            (summary.final.groc.normalized_score || 0) === 0 && styles.grocBadgeNeutral,
          ]}>
            <Text style={styles.grocScore}>
              {(summary.final.groc.normalized_score || 0) > 0 ? '+' : ''}
              {summary.final.groc.normalized_score}
            </Text>
          </View>
          <Text style={styles.grocInterpretation}>
            {summary.final.groc.interpretation}
          </Text>
        </View>
      )}

      {/* Meaningful Change Indicator */}
      {summary.change.isMeaningful && (
        <View style={styles.meaningfulBanner}>
          <TrendingUp size={16} color={colors.green[700]} />
          <Text style={styles.meaningfulText}>
            Clinically meaningful improvement detected!
          </Text>
        </View>
      )}

      {/* Re-check CTA */}
      {showRecheckCTA && !summary.final.groc && onRecheck && (
        <TouchableOpacity style={styles.recheckButton} onPress={onRecheck}>
          <Text style={styles.recheckButtonText}>Re-check Progress</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[600],
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 13,
    color: colors.gray[500],
    textAlign: 'center',
  },
  scoreRow: {
    marginBottom: 12,
  },
  scoreLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  scoreLabelText: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '500',
  },
  scoreValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBlock: {
    alignItems: 'center',
    minWidth: 60,
  },
  scoreBlockLabel: {
    fontSize: 11,
    color: colors.gray[500],
    marginBottom: 2,
  },
  scoreBlockValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
  },
  scoreDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.gray[200],
    marginHorizontal: 16,
  },
  changeIndicator: {
    marginLeft: 'auto',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  changeBadgeGreen: {
    backgroundColor: colors.green[100],
  },
  changeBadgeRed: {
    backgroundColor: colors.red[100],
  },
  changeBadgeGray: {
    backgroundColor: colors.gray[100],
  },
  changeBadgeTextGreen: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.green[700],
  },
  changeBadgeTextRed: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.red[700],
  },
  grocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: 8,
  },
  grocLabel: {
    fontSize: 13,
    color: colors.gray[600],
  },
  grocBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  grocBadgePositive: {
    backgroundColor: colors.green[100],
  },
  grocBadgeNegative: {
    backgroundColor: colors.red[100],
  },
  grocBadgeNeutral: {
    backgroundColor: colors.gray[100],
  },
  grocScore: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[800],
  },
  grocInterpretation: {
    flex: 1,
    fontSize: 12,
    color: colors.gray[600],
    fontStyle: 'italic',
  },
  meaningfulBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: colors.green[50],
    borderRadius: 8,
    gap: 8,
  },
  meaningfulText: {
    fontSize: 13,
    color: colors.green[700],
    fontWeight: '500',
  },
  recheckButton: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    alignItems: 'center',
  },
  recheckButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
});
