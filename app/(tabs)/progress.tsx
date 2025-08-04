import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, ChartBar as BarChart3, TrendingDown, Minus, Calendar, Activity, Target, Award } from 'lucide-react-native';

interface ProgressData {
  date: string;
  painLevel: number;
  exercisesCompleted: number;
  notes: string;
}

const mockProgressData: ProgressData[] = [
  { date: '2024-01-15', painLevel: 7, exercisesCompleted: 2, notes: 'Started therapy' },
  { date: '2024-01-16', painLevel: 6, exercisesCompleted: 3, notes: 'Feeling better' },
  { date: '2024-01-17', painLevel: 6, exercisesCompleted: 4, notes: 'Good progress' },
  { date: '2024-01-18', painLevel: 5, exercisesCompleted: 4, notes: 'Less morning stiffness' },
  { date: '2024-01-19', painLevel: 4, exercisesCompleted: 5, notes: 'Great day!' },
  { date: '2024-01-20', painLevel: 5, exercisesCompleted: 3, notes: 'Slight flare-up' },
  { date: '2024-01-21', painLevel: 4, exercisesCompleted: 4, notes: 'Back on track' },
];

export default function ProgressScreen() {
  const [progressData, setProgressData] = useState<ProgressData[]>(mockProgressData);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64;
  const maxPainLevel = 10;

  const getFilteredData = () => {
    const now = new Date();
    let filteredData = progressData;

    if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredData = progressData.filter(item => new Date(item.date) >= weekAgo);
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredData = progressData.filter(item => new Date(item.date) >= monthAgo);
    }

    return filteredData;
  };

  const getStats = () => {
    const data = getFilteredData();
    if (data.length === 0) return { avgPain: 0, trend: 'stable', totalExercises: 0, improvement: 0 };

    const avgPain = data.reduce((sum, item) => sum + item.painLevel, 0) / data.length;
    const totalExercises = data.reduce((sum, item) => sum + item.exercisesCompleted, 0);
    
    const firstPain = data[0]?.painLevel || 0;
    const lastPain = data[data.length - 1]?.painLevel || 0;
    const improvement = firstPain - lastPain;
    
    let trend: 'improving' | 'worsening' | 'stable' = 'stable';
    if (improvement > 0.5) trend = 'improving';
    else if (improvement < -0.5) trend = 'worsening';

    return { avgPain, trend, totalExercises, improvement };
  };

  const renderChart = () => {
    const data = getFilteredData();
    if (data.length === 0) return null;

    const pointWidth = chartWidth / Math.max(data.length - 1, 1);
    const chartHeight = 200;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Pain Level Over Time</Text>
        <View style={[styles.chart, { width: chartWidth, height: chartHeight }]}>
          {/* Y-axis labels */}
          <View style={styles.yAxisLabels}>
            {[10, 8, 6, 4, 2, 0].map(level => (
              <Text key={level} style={styles.yAxisLabel}>{level}</Text>
            ))}
          </View>
          
          {/* Chart area */}
          <View style={styles.chartArea}>
            {/* Grid lines */}
            {[0, 2, 4, 6, 8, 10].map(level => (
              <View
                key={level}
                style={[
                  styles.gridLine,
                  { bottom: (level / maxPainLevel) * (chartHeight - 40) }
                ]}
              />
            ))}
            
            {/* Data points and lines */}
            {data.map((item, index) => {
              const x = index * pointWidth;
              const y = chartHeight - 40 - (item.painLevel / maxPainLevel) * (chartHeight - 40);
              
              const nextItem = data[index + 1];
              let lineProps = null;
              
              if (nextItem) {
                const nextX = (index + 1) * pointWidth;
                const nextY = chartHeight - 40 - (nextItem.painLevel / maxPainLevel) * (chartHeight - 40);
                const lineLength = Math.sqrt(Math.pow(nextX - x, 2) + Math.pow(nextY - y, 2));
                const angle = Math.atan2(nextY - y, nextX - x) * (180 / Math.PI);
                
                lineProps = {
                  width: lineLength,
                  transform: [{ rotate: `${angle}deg` }],
                  left: x,
                  top: y,
                };
              }
              
              return (
                <View key={index}>
                  {lineProps && (
                    <View style={[styles.chartLine, lineProps]} />
                  )}
                  <View
                    style={[
                      styles.chartPoint,
                      { left: x - 4, top: y - 4 },
                      item.painLevel >= 7 && styles.chartPointHigh,
                      item.painLevel <= 3 && styles.chartPointLow,
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
        
        {/* X-axis labels */}
        <View style={styles.xAxisLabels}>
          {data.map((item, index) => (
            <Text key={index} style={styles.xAxisLabel}>
              {new Date(item.date).getDate()}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const stats = getStats();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <View style={styles.logoContainer}>
            <BarChart3 size={28} color="#FFFFFF" />
            <Text style={styles.logoText}>PTBOT</Text>
          </View>
          <Text style={styles.headerTitle}>Progress Tracking</Text>
        </View>
        <Text style={styles.headerSubtitle}>Monitor your recovery journey</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'all'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonSelected,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextSelected,
                ]}
              >
                {period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Activity size={20} color="#2563EB" />
              <Text style={styles.statTitle}>Avg Pain Level</Text>
            </View>
            <Text style={styles.statValue}>{stats.avgPain.toFixed(1)}/10</Text>
            <View style={styles.trendContainer}>
              {stats.trend === 'improving' && <TrendingDown size={16} color="#10B981" />}
              {stats.trend === 'worsening' && <TrendingUp size={16} color="#EF4444" />}
              {stats.trend === 'stable' && <Minus size={16} color="#6B7280" />}
              <Text style={[
                styles.trendText,
                stats.trend === 'improving' && styles.trendImproving,
                stats.trend === 'worsening' && styles.trendWorsening,
              ]}>
                {stats.trend === 'improving' ? 'Improving' : 
                 stats.trend === 'worsening' ? 'Needs attention' : 'Stable'}
              </Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Target size={20} color="#0D9488" />
              <Text style={styles.statTitle}>Total Exercises</Text>
            </View>
            <Text style={styles.statValue}>{stats.totalExercises}</Text>
            <Text style={styles.statSubtext}>Completed this period</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Award size={20} color="#F59E0B" />
              <Text style={styles.statTitle}>Improvement</Text>
            </View>
            <Text style={[
              styles.statValue,
              stats.improvement > 0 && styles.improvementPositive,
              stats.improvement < 0 && styles.improvementNegative,
            ]}>
              {stats.improvement > 0 ? '-' : '+'}
              {Math.abs(stats.improvement).toFixed(1)}
            </Text>
            <Text style={styles.statSubtext}>Pain level change</Text>
          </View>
        </View>

        {/* Chart */}
        {renderChart()}

        {/* Recent Entries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Calendar size={18} color="#2563EB" /> Recent Entries
          </Text>
          {getFilteredData().slice(-5).reverse().map((item, index) => (
            <View key={index} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
                <View style={styles.entryMetrics}>
                  <View style={[
                    styles.painBadge,
                    item.painLevel >= 7 && styles.painBadgeHigh,
                    item.painLevel <= 3 && styles.painBadgeLow,
                  ]}>
                    <Text style={styles.painBadgeText}>Pain: {item.painLevel}</Text>
                  </View>
                  <View style={styles.exerciseBadge}>
                    <Text style={styles.exerciseBadgeText}>
                      {item.exercisesCompleted} exercises
                    </Text>
                  </View>
                </View>
              </View>
              {item.notes && (
                <Text style={styles.entryNotes}>{item.notes}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#2563EB',
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
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#BFDBFE',
  },
  content: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonSelected: {
    backgroundColor: '#2563EB',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodButtonTextSelected: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#6B7280',
  },
  trendImproving: {
    color: '#10B981',
  },
  trendWorsening: {
    color: '#EF4444',
  },
  improvementPositive: {
    color: '#10B981',
  },
  improvementNegative: {
    color: '#EF4444',
  },
  chartContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  chart: {
    position: 'relative',
    flexDirection: 'row',
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    height: 160,
    paddingVertical: 20,
    marginRight: 8,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    width: 20,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  chartPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chartPointHigh: {
    backgroundColor: '#EF4444',
  },
  chartPointLow: {
    backgroundColor: '#10B981',
  },
  chartLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#2563EB',
    transformOrigin: 'left center',
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingLeft: 28,
  },
  xAxisLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  entryMetrics: {
    flexDirection: 'row',
    gap: 8,
  },
  painBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  painBadgeHigh: {
    backgroundColor: '#FEE2E2',
  },
  painBadgeLow: {
    backgroundColor: '#D1FAE5',
  },
  painBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
  },
  exerciseBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3730A3',
  },
  entryNotes: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 20,
  },
});