// app/(tabs)/progress.tsx

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  ChartBar as BarChart3,
  TrendingDown,
  Minus,
  Calendar,
  Activity,
  Target,
  Award,
  Plus,
  X,
  Save,
} from 'lucide-react-native';
import { v4 as uuidv4 } from 'uuid';

interface ExerciseEntry {
  name: string;
  sets: number;
  reps: number;
}

interface ProgressData {
  date: string;
  painLevel: number;
  exercisesCompleted: number;
  exerciseDetails?: ExerciseEntry[];
  notes: string;
}

const mockProgressData: ProgressData[] = [
  {
    date: '2024-01-15',
    painLevel: 7,
    exercisesCompleted: 2,
    notes: 'Started therapy',
    exerciseDetails: [
      { name: 'Lower back stretch', sets: 3, reps: 10 },
      { name: 'Cat-cow pose', sets: 2, reps: 15 },
    ],
  },
  {
    date: '2024-01-16',
    painLevel: 6,
    exercisesCompleted: 3,
    notes: 'Feeling better',
    exerciseDetails: [
      { name: 'Neck rolls', sets: 2, reps: 8 },
      { name: 'Shoulder shrugs', sets: 3, reps: 12 },
      { name: 'Wall push-ups', sets: 2, reps: 10 },
    ],
  },
  { date: '2024-01-17', painLevel: 6, exercisesCompleted: 4, notes: 'Good progress' },
  { date: '2024-01-18', painLevel: 5, exercisesCompleted: 4, notes: 'Less morning stiffness' },
  { date: '2024-01-19', painLevel: 4, exercisesCompleted: 5, notes: 'Great day!' },
  { date: '2024-01-20', painLevel: 5, exercisesCompleted: 3, notes: 'Slight flare-up' },
  { date: '2024-01-21', painLevel: 4, exercisesCompleted: 4, notes: 'Back on track' },
];

export default function ProgressScreen() {
  const [progressData, setProgressData] = useState<ProgressData[]>(mockProgressData);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntry, setNewEntry] = useState<{
    date: string;
    painLevel: number;
    exercises: ExerciseEntry[];
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    painLevel: 0,
    exercises: [{ name: '', sets: 0, reps: 0 }],
    notes: '',
  });
  const [editingEntry, setEditingEntry] = useState<ProgressData | null>(null);
  const [showEditEntry, setShowEditEntry] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64;
  const maxPainLevel = 10;

  // Filter data by selected period
  const getFilteredData = () => {
    const now = Date.now();
    let data = progressData;
    if (selectedPeriod === 'week') {
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      data = data.filter(d => new Date(d.date).getTime() >= weekAgo);
    } else if (selectedPeriod === 'month') {
      const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
      data = data.filter(d => new Date(d.date).getTime() >= monthAgo);
    }
    return data;
  };

  // Compute stats
  const stats = useMemo(() => {
    const data = getFilteredData();
    if (data.length === 0) {
      return { avgPain: 0, trend: 'stable' as const, totalExercises: 0, improvement: 0 };
    }
    // Avg pain
    const avgPain = Math.round(
      (data.reduce((sum, d) => sum + d.painLevel, 0) / data.length) * 10
    ) / 10;
    // Total exercises
    const totalExercises = data.reduce((sum, d) => sum + d.exercisesCompleted, 0);
    // Improvement
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sorted[0].painLevel;
    const last = sorted[sorted.length - 1].painLevel;
    const improvement = Math.round((first - last) * 10) / 10;
    let trend: 'improving' | 'worsening' | 'stable' = 'stable';
    if (improvement > 0.5) trend = 'improving';
    else if (improvement < -0.5) trend = 'worsening';
    return { avgPain, trend, totalExercises, improvement };
  }, [progressData, selectedPeriod]);

  // Chart rendering
  const renderChart = () => {
    const data = getFilteredData();
    if (data.length === 0) return null;
    const pointW = chartWidth / Math.max(data.length - 1, 1);
    const H = 200;
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Pain Level Over Time</Text>
        <View style={[styles.chart, { width: chartWidth, height: H }]}>
          {/* Y-axis */}
          <View style={styles.yAxisLabels}>
            {[10, 8, 6, 4, 2, 0].map(l => (
              <Text key={l} style={styles.yAxisLabel}>{l}</Text>
            ))}
          </View>
          {/* Plot */}
          <View style={styles.chartArea}>
            {/* Grid */}
            {[0, 2, 4, 6, 8, 10].map(l => (
              <View
                key={l}
                style={[styles.gridLine, { bottom: (l / maxPainLevel) * (H - 40) }]}
              />
            ))}
            {/* Points & lines */}
            {data.map((d, i) => {
              const x = i * pointW;
              const y = H - 40 - (d.painLevel / maxPainLevel) * (H - 40);
              const next = data[i + 1];
              let lineStyle = null;
              if (next) {
                const nx = (i + 1) * pointW;
                const ny = H - 40 - (next.painLevel / maxPainLevel) * (H - 40);
                const len = Math.hypot(nx - x, ny - y);
                const angle = (Math.atan2(ny - y, nx - x) * 180) / Math.PI;
                lineStyle = { width: len, transform: [{ rotate: `${angle}deg` }], left: x, top: y };
              }
              return (
                <View key={i}>
                  {lineStyle && <View style={[styles.chartLine, lineStyle]} />}
                  <View
                    style={[
                      styles.chartPoint,
                      { left: x - 4, top: y - 4 },
                      d.painLevel >= 7 && styles.chartPointHigh,
                      d.painLevel <= 3 && styles.chartPointLow,
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
        {/* X-axis */}
        <View style={styles.xAxisLabels}>
          {data.map((d, i) => (
            <Text key={i} style={styles.xAxisLabel}>
              {new Date(d.date).getDate()}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  // Handlers for adding/editing
  const addExerciseField = () => {
    setNewEntry(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', sets: 0, reps: 0 }],
    }));
  };
  const removeExerciseField = (i: number) => {
    setNewEntry(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, idx) => idx !== i),
    }));
  };
  const updateExercise = (
    index: number,
    field: keyof ExerciseEntry,
    value: string | number
  ) => {
    setNewEntry(prev => {
      const ex = [...prev.exercises];
      if (field === 'name') {
        ex[index].name = value as string;
      } else {
        ex[index][field] = typeof value === 'string' ? parseInt(value) || 0 : value;
      }
      return { ...prev, exercises: ex };
    });
  };

  const saveEntry = () => {
    if (newEntry.painLevel === 0) {
      Alert.alert('Missing Information', 'Please select a pain level.');
      return;
    }
    const valid = newEntry.exercises.filter(e => e.name && e.sets > 0 && e.reps > 0);
    if (!valid.length) {
      Alert.alert('Missing Information', 'Add at least one exercise with sets & reps.');
      return;
    }
    const entry: ProgressData = {
      date: newEntry.date,
      painLevel: newEntry.painLevel,
      exercisesCompleted: valid.length,
      exerciseDetails: valid,
      notes: newEntry.notes.trim(),
    };
    setProgressData(prev =>
      [...prev, entry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    // reset
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      painLevel: 0,
      exercises: [{ name: '', sets: 0, reps: 0 }],
      notes: '',
    });
    setShowAddEntry(false);
    Alert.alert('Success', 'Entry added!');
  };

  const startEditEntry = (entry: ProgressData) => {
    setEditingEntry({ ...entry });
    setShowEditEntry(true);
  };

  const updateEditExercise = (
    index: number,
    field: keyof ExerciseEntry,
    value: string | number
  ) => {
    if (!editingEntry) return;
    setEditingEntry(prev => {
      if (!prev) return null;
      const ex = [...(prev.exerciseDetails || [])];
      if (field === 'name') {
        ex[index].name = value as string;
      } else {
        ex[index][field] = typeof value === 'string' ? parseInt(value) || 0 : value;
      }
      return { ...prev, exerciseDetails: ex };
    });
  };
  const addEditExerciseField = () => {
    if (!editingEntry) return;
    setEditingEntry(prev =>
      prev
        ? {
            ...prev,
            exerciseDetails: [...(prev.exerciseDetails || []), { name: '', sets: 0, reps: 0 }],
          }
        : null
    );
  };
  const removeEditExerciseField = (i: number) => {
    if (!editingEntry) return;
    setEditingEntry(prev =>
      prev
        ? {
            ...prev,
            exerciseDetails: prev.exerciseDetails?.filter((_, idx) => idx !== i),
          }
        : null
    );
  };

  const saveEditEntry = () => {
    if (!editingEntry) return;
    if (editingEntry.painLevel === 0) {
      Alert.alert('Missing Information', 'Select a pain level.');
      return;
    }
    const valid = (editingEntry.exerciseDetails || []).filter(
      e => e.name && e.sets > 0 && e.reps > 0
    );
    if (!valid.length) {
      Alert.alert('Missing Information', 'Add at least one exercise with sets & reps.');
      return;
    }
    const updated: ProgressData = {
      ...editingEntry,
      exercisesCompleted: valid.length,
      exerciseDetails: valid,
      notes: editingEntry.notes.trim(),
    };
    setProgressData(prev =>
      prev
        .map(e => (e.date === updated.date ? updated : e))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    setShowEditEntry(false);
    setEditingEntry(null);
    Alert.alert('Success', 'Entry updated!');
  };

  const deleteEntry = (entry: ProgressData) => {
    Alert.alert(
      'Delete Entry',
      `Delete entry for ${new Date(entry.date).toLocaleDateString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setProgressData(prev => prev.filter(e => e.date !== entry.date));
            Alert.alert('Deleted', 'Entry removed.');
          },
        },
      ]
    );
  };

  // Add Modal
  const AddEntryModal = () => (
    <Modal visible={showAddEntry} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddEntry(false)}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Progress Entry</Text>
          <TouchableOpacity onPress={saveEntry}>
            <Save size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Date */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Date</Text>
            <TextInput
              style={styles.dateInput}
              value={newEntry.date}
              onChangeText={d => setNewEntry(prev => ({ ...prev, date: d }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {/* Pain */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Pain Level (0–10)</Text>
            <View style={styles.painLevelContainer}>
              {[...Array(11)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.painLevelButton,
                    newEntry.painLevel === i && styles.painLevelButtonSelected,
                    i >= 7 && styles.painLevelButtonHigh,
                  ]}
                  onPress={() => setNewEntry(prev => ({ ...prev, painLevel: i }))}
                >
                  <Text
                    style={[
                      styles.painLevelText,
                      newEntry.painLevel === i && styles.painLevelTextSelected,
                    ]}
                  >
                    {i}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.painLevelLabels}>
              <Text style={styles.painLevelLabel}>No Pain</Text>
              <Text style={styles.painLevelLabel}>Severe</Text>
            </View>
          </View>
          {/* Exercises */}
          <View style={styles.modalSection}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.modalSectionTitle}>Exercises</Text>
              <TouchableOpacity onPress={addExerciseField}>
                <Plus size={16} color="#2563EB" />
                <Text style={styles.addExerciseText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>
            {newEntry.exercises.map((ex, idx) => (
              <View key={idx} style={styles.exerciseInputGroup}>
                <View style={styles.exerciseInputHeader}>
                  <Text style={styles.exerciseInputTitle}>#{idx + 1}</Text>
                  {newEntry.exercises.length > 1 && (
                    <TouchableOpacity onPress={() => removeExerciseField(idx)}>
                      <X size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.exerciseNameInput}
                  value={ex.name}
                  onChangeText={t => updateExercise(idx, 'name', t)}
                  placeholder="Name"
                  placeholderTextColor="#9CA3AF"
                />
                <View style={styles.setsRepsContainer}>
                  <View style={styles.setsRepsField}>
                    <Text style={styles.setsRepsLabel}>Sets</Text>
                    <TextInput
                      style={styles.setsRepsInput}
                      value={ex.sets === 0 ? '' : ex.sets.toString()}
                      onChangeText={t => updateExercise(idx, 'sets', t)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={styles.setsRepsField}>
                    <Text style={styles.setsRepsLabel}>Reps</Text>
                    <TextInput
                      style={styles.setsRepsInput}
                      value={ex.reps === 0 ? '' : ex.reps.toString()}
                      onChangeText={t => updateExercise(idx, 'reps', t)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
          {/* Notes */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={newEntry.notes}
              onChangeText={t => setNewEntry(prev => ({ ...prev, notes: t }))}
              placeholder="Observations..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>
          <View style={styles.modalBottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Edit Modal
  const EditEntryModal = () => (
    <Modal visible={showEditEntry} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              setShowEditEntry(false);
              setEditingEntry(null);
            }}
          >
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Progress Entry</Text>
          <TouchableOpacity onPress={saveEditEntry}>
            <Save size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {editingEntry && (
            <>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Date</Text>
                <Text style={styles.dateInput}>
                  {new Date(editingEntry.date).toLocaleDateString()}
                </Text>
              </View>
              {/* Pain level picker same as AddEntryModal */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Pain Level (0–10)</Text>
                <View style={styles.painLevelContainer}>
                  {[...Array(11)].map((_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.painLevelButton,
                        editingEntry.painLevel === i && styles.painLevelButtonSelected,
                        i >= 7 && styles.painLevelButtonHigh,
                      ]}
                      onPress={() =>
                        setEditingEntry(prev =>
                          prev ? { ...prev, painLevel: i } : prev
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.painLevelText,
                          editingEntry.painLevel === i && styles.painLevelTextSelected,
                        ]}
                      >
                        {i}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.painLevelLabels}>
                  <Text style={styles.painLevelLabel}>No Pain</Text>
                  <Text style={styles.painLevelLabel}>Severe</Text>
                </View>
              </View>
              {/* Exercises group same as AddEntryModal but using updateEditExercise, addEditExerciseField, removeEditExerciseField */}
              <View style={styles.modalSection}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.modalSectionTitle}>Exercises</Text>
                  <TouchableOpacity onPress={addEditExerciseField}>
                    <Plus size={16} color="#2563EB" />
                    <Text style={styles.addExerciseText}>Add Exercise</Text>
                  </TouchableOpacity>
                </View>
                {(editingEntry.exerciseDetails || []).map((ex, idx) => (
                  <View key={idx} style={styles.exerciseInputGroup}>
                    <View style={styles.exerciseInputHeader}>
                      <Text style={styles.exerciseInputTitle}>#{idx + 1}</Text>
                      {(editingEntry.exerciseDetails?.length || 0) > 1 && (
                        <TouchableOpacity onPress={() => removeEditExerciseField(idx)}>
                          <X size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      style={styles.exerciseNameInput}
                      value={ex.name}
                      onChangeText={t => updateEditExercise(idx, 'name', t)}
                      placeholder="Name"
                      placeholderTextColor="#9CA3AF"
                    />
                    <View style={styles.setsRepsContainer}>
                      <View style={styles.setsRepsField}>
                        <Text style={styles.setsRepsLabel}>Sets</Text>
                        <TextInput
                          style={styles.setsRepsInput}
                          value={ex.sets === 0 ? '' : ex.sets.toString()}
                          onChangeText={t => updateEditExercise(idx, 'sets', t)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={styles.setsRepsField}>
                        <Text style={styles.setsRepsLabel}>Reps</Text>
                        <TextInput
                          style={styles.setsRepsInput}
                          value={ex.reps === 0 ? '' : ex.reps.toString()}
                          onChangeText={t => updateEditExercise(idx, 'reps', t)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
              {/* Notes */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Notes (Optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  value={editingEntry.notes}
                  onChangeText={t =>
                    setEditingEntry(prev => (prev ? { ...prev, notes: t } : prev))
                  }
                  placeholder="Observations..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>
              <View style={styles.modalBottomSpacer} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <BarChart3 size={28} color="#FFF" />
          <Text style={styles.logoText}>PTBOT</Text>
        </View>
        <Text style={styles.headerTitle}>Progress Tracking</Text>
        <Text style={styles.headerSubtitle}>Monitor your recovery journey</Text>
      </View>

      <AddEntryModal />
      <EditEntryModal />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.addEntryButton}
          onPress={() => setShowAddEntry(true)}
        >
          <Plus size={20} color="#FFF" />
          <Text style={styles.addEntryButtonText}>Add Entry</Text>
        </TouchableOpacity>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'all'] as const).map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                selectedPeriod === p && styles.periodButtonSelected,
              ]}
              onPress={() => setSelectedPeriod(p)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === p && styles.periodButtonTextSelected,
                ]}
              >
                {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'All Time'}
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
              <Text
                style={[
                  styles.trendText,
                  stats.trend === 'improving' && styles.trendImproving,
                  stats.trend === 'worsening' && styles.trendWorsening,
                ]}
              >
                {stats.trend === 'improving'
                  ? 'Improving'
                  : stats.trend === 'worsening'
                  ? 'Needs attention'
                  : 'Stable'}
              </Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Target size={20} color="#0D9488" />
              <Text style={styles.statTitle}>Total Exercises</Text>
            </View>
            <Text style={styles.statValue}>{stats.totalExercises}</Text>
            <Text style={styles.statSubtext}>This period</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Award size={20} color="#F59E0B" />
              <Text style={styles.statTitle}>Improvement</Text>
            </View>
            <Text
              style={[
                styles.statValue,
                stats.improvement > 0 && styles.improvementPositive,
                stats.improvement < 0 && styles.improvementNegative,
              ]}
            >
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
          {getFilteredData()
            .slice(-5)
            .reverse()
            .map((item, idx) => (
              <View key={idx} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryDateContainer}>
                    <Text style={styles.entryDate}>
                      {new Date(item.date).toLocaleDateString()}
                    </Text>
                    <View style={styles.entryActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => startEditEntry(item)}
                      >
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteEntry(item)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.entryMetrics}>
                    <View
                      style={[
                        styles.painBadge,
                        item.painLevel >= 7 && styles.painBadgeHigh,
                        item.painLevel <= 3 && styles.painBadgeLow,
                      ]}
                    >
                      <Text style={styles.painBadgeText}>Pain: {item.painLevel}</Text>
                    </View>
                    <View style={styles.exerciseBadge}>
                      <Text style={styles.exerciseBadgeText}>
                        {item.exercisesCompleted} exercises
                      </Text>
                    </View>
                  </View>
                </View>
                {item.notes && <Text style={styles.entryNotes}>{item.notes}</Text>}
                {item.exerciseDetails?.length ? (
                  <View style={styles.exerciseDetailsContainer}>
                    <Text style={styles.exerciseDetailsTitle}>Exercises:</Text>
                    {item.exerciseDetails.map((ex, i) => (
                      <Text key={i} style={styles.exerciseDetail}>
                        • {ex.name}: {ex.sets}×{ex.reps}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles: { [key: string]: any } = StyleSheet.create({
  // ... (keep all your existing styles here unchanged)
  // Be sure to include definitions for:
  // modalContainer, modalHeader, modalTitle, modalContent,
  // modalSection, modalSectionTitle, dateInput,
  // painLevelContainer, painLevelButton, painLevelButtonSelected,
  // painLevelButtonHigh, painLevelText, painLevelTextSelected,
  // painLevelLabels, painLevelLabel,
  // exerciseHeader, addExerciseText, exerciseInputGroup,
  // exerciseInputHeader, exerciseInputTitle,
  // exerciseNameInput, setsRepsContainer, setsRepsField,
  // setsRepsLabel, setsRepsInput, notesInput,
  // modalBottomSpacer, dateDisplay, and all the chart and entry styles.
});
