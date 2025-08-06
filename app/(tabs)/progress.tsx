// ProgressScreen.tsx

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Save, Edit2, Trash2 } from 'lucide-react-native';
import { v4 as uuidv4 } from 'uuid';

interface ExerciseEntry {
  id: string;
  name: string;
  sets: number;
  reps: number;
}

interface ProgressData {
  id: string;
  date: string;
  painLevel: number;
  exercises: ExerciseEntry[];
  notes: string;
}

export default function ProgressScreen() {
  // ---- STATE ----
  const [progressEntries, setProgressEntries] = useState<ProgressData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState<{
    painLevel: string;
    exercises: ExerciseEntry[];
    notes: string;
  }>({
    painLevel: '',
    exercises: [{ id: uuidv4(), name: '', sets: 0, reps: 0 }],
    notes: '',
  });

  // ---- STATISTICS ----
  const avgPain = useMemo(() => {
    if (!progressEntries.length) return 0;
    const total = progressEntries.reduce((sum, e) => sum + e.painLevel, 0);
    return total / progressEntries.length;
  }, [progressEntries]);

  const totalExercises = useMemo(() => {
    return progressEntries.reduce((sum, e) => sum + e.exercises.length, 0);
  }, [progressEntries]);

  const improvement = useMemo(() => {
    const n = progressEntries.length;
    if (n < 2) return 0;
    const half = Math.floor(n / 2);
    const firstHalf = progressEntries.slice(half);
    const secondHalf = progressEntries.slice(0, half);
    const avgFirst =
      firstHalf.reduce((s, e) => s + e.painLevel, 0) / (firstHalf.length || 1);
    const avgSecond =
      secondHalf.reduce((s, e) => s + e.painLevel, 0) / (secondHalf.length || 1);
    return parseFloat((avgSecond - avgFirst).toFixed(1));
  }, [progressEntries]);

  // ---- HANDLERS ----
  const openAddModal = () => {
    setEditingId(null);
    setNewEntry({
      painLevel: '',
      exercises: [{ id: uuidv4(), name: '', sets: 0, reps: 0 }],
      notes: '',
    });
    setShowModal(true);
  };

  const openEditModal = (entry: ProgressData) => {
    setEditingId(entry.id);
    setNewEntry({
      painLevel: entry.painLevel.toString(),
      exercises: entry.exercises.map(ex => ({ ...ex })),
      notes: entry.notes,
    });
    setShowModal(true);
  };

  const deleteEntry = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setProgressEntries(prev => prev.filter(e => e.id !== id));
        },
      },
    ]);
  };

  const addExerciseField = () => {
    setNewEntry(prev => ({
      ...prev,
      exercises: [...prev.exercises, { id: uuidv4(), name: '', sets: 0, reps: 0 }],
    }));
  };

  const removeExerciseField = (index: number) => {
    setNewEntry(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const updateExercise = (
    index: number,
    field: keyof Omit<ExerciseEntry, 'id'>,
    value: string
  ) => {
    setNewEntry(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === index
          ? {
              ...ex,
              [field]: field === 'name' ? value : parseInt(value, 10) || 0,
            }
          : ex
      ),
    }));
  };

  const saveEntry = () => {
    const pain = parseFloat(newEntry.painLevel);
    if (isNaN(pain) || pain < 0 || pain > 10) {
      Alert.alert('Invalid Pain Level', 'Enter a number 0–10.');
      return;
    }
    const entry: ProgressData = {
      id: editingId || uuidv4(),
      date: new Date().toISOString().split('T')[0],
      painLevel: pain,
      exercises: newEntry.exercises,
      notes: newEntry.notes,
    };
    setProgressEntries(prev => {
      if (editingId) {
        return prev.map(e => (e.id === editingId ? entry : e));
      }
      return [entry, ...prev];
    });
    setShowModal(false);
  };

  // ---- RENDER MODAL ----
  const AddEditModal = () => (
    <Modal visible={showModal} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <X size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingId ? 'Edit Entry' : 'Add Entry'}
          </Text>
          <TouchableOpacity onPress={saveEntry}>
            <Save size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.label}>Pain Level (0–10)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={newEntry.painLevel}
                onChangeText={v =>
                  setNewEntry(prev => ({ ...prev, painLevel: v }))
                }
              />

              {newEntry.exercises.map((ex, idx) => (
                <View key={ex.id} style={styles.exerciseGroup}>
                  <Text style={styles.label}>Exercise {idx + 1}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={ex.name}
                    onChangeText={v => updateExercise(idx, 'name', v)}
                  />
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="Sets"
                      keyboardType="numeric"
                      value={ex.sets.toString()}
                      onChangeText={v => updateExercise(idx, 'sets', v)}
                    />
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="Reps"
                      keyboardType="numeric"
                      value={ex.reps.toString()}
                      onChangeText={v => updateExercise(idx, 'reps', v)}
                    />
                  </View>
                  {newEntry.exercises.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeExerciseField(idx)}
                    >
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                style={styles.addButton}
                onPress={addExerciseField}
              >
                <Plus size={16} color="#FFF" />
                <Text style={styles.addButtonText}>
                  Add Another Exercise
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, { minHeight: 80 }]}
                multiline
                value={newEntry.notes}
                onChangeText={v =>
                  setNewEntry(prev => ({ ...prev, notes: v }))
                }
              />
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  // ---- MAIN RENDER ----
  return (
    <SafeAreaView style={styles.container}>
      {/* Header Image */}
      <Image
        source={require('../assets/progressHeader.png')}
        style={styles.headerImage}
        resizeMode="cover"
      />
      <View style={styles.headerText}>
        <Text style={styles.title}>Progress Tracking</Text>
        <Text style={styles.subtitle}>
          Monitor your recovery journey
        </Text>
      </View>

      {/* Add Entry */}
      <TouchableOpacity
        style={styles.entryButton}
        onPress={openAddModal}
      >
        <Text style={styles.entryButtonText}>+ Add Entry</Text>
      </TouchableOpacity>

      {/* Segment Control (UI only) */}
      <View style={styles.toggleRow}>
        {['Week', 'Month', 'All Time'].map(label => (
          <View
            key={label}
            style={[
              styles.toggleItem,
              label === 'Week' && styles.toggleSelected,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                label === 'Week' && styles.toggleTextSelected,
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Stats Widgets */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Avg Pain Level</Text>
          <Text style={styles.statValue}>{avgPain.toFixed(1)}/10</Text>
          <Text style={styles.statCaption}>
            {avgPain <= 3 ? 'Stable' : 'Elevated'}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Total Exercises</Text>
          <Text style={styles.statValue}>{totalExercises}</Text>
          <Text style={styles.statCaption}>This period</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Improvement</Text>
          <Text style={styles.statValue}>
            {improvement >= 0 ? '+' : ''}
            {improvement.toFixed(1)}
          </Text>
          <Text style={styles.statCaption}>
            Pain level change
          </Text>
        </View>
      </View>

      {/* Recent Entries */}
      <Text style={styles.sectionHeader}>Recent Entries</Text>
      <ScrollView style={styles.entriesList}>
        {progressEntries.map(entry => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardDate}>{entry.date}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => openEditModal(entry)}
                >
                  <Edit2 size={18} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteEntry(entry.id)}
                  style={{ marginLeft: 12 }}
                >
                  <Trash2 size={18} color="#D00" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.cardPain}>
              Pain: {entry.painLevel}/10
            </Text>
            {entry.exercises.map(ex => (
              <Text key={ex.id} style={styles.cardExercise}>
                • {ex.name} ({ex.sets} x {ex.reps})
              </Text>
            ))}
            {entry.notes ? (
              <Text style={styles.cardNotes}>📝 {entry.notes}</Text>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <AddEditModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  headerImage: { width: '100%', height: 140 },
  headerText: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#E0EFFF', marginTop: 4 },
  entryButton: {
    backgroundColor: '#2563EB',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  entryButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  toggleItem: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  toggleSelected: { backgroundColor: '#2563EB' },
  toggleText: { color: '#333', fontWeight: '500' },
  toggleTextSelected: { color: '#fff' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  statBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    width: '30%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statTitle: { fontSize: 12, color: '#555' },
  statValue: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  statCaption: { fontSize: 12, color: '#777', marginTop: 2 },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 12,
  },
  entriesList: { marginHorizontal: 16, marginBottom: 16 },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: { fontWeight: '600' },
  cardActions: { flexDirection: 'row' },
  cardPain: { marginTop: 4 },
  cardExercise: { marginLeft: 8, marginTop: 2 },
  cardNotes: { marginTop: 6, fontStyle: 'italic', color: '#555' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalScroll: { padding: 16 },
  label: { fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 0.48 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  removeText: { color: '#D00', marginTop: -8, marginBottom: 12 },
  exerciseGroup: { marginBottom: 16 },
});
