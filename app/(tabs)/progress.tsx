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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Save } from 'lucide-react-native';
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
  const [progressEntries, setProgressEntries] = useState<ProgressData[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({
    painLevel: '',
    exercises: [{ id: uuidv4(), name: '', sets: 0, reps: 0 }],
    notes: '',
  });

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

  const updateExercise = (index: number, field: keyof Omit<ExerciseEntry, 'id'>, value: string) => {
    setNewEntry(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === index
          ? { ...ex, [field]: field === 'name' ? value : parseInt(value) || 0 }
          : ex
      ),
    }));
  };

  const saveEntry = () => {
    const pain = parseFloat(newEntry.painLevel);
    if (isNaN(pain) || pain < 0 || pain > 10) {
      Alert.alert('Invalid pain level', 'Please enter a number between 0 and 10.');
      return;
    }

    const newLog: ProgressData = {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      painLevel: pain,
      exercises: newEntry.exercises,
      notes: newEntry.notes,
    };

    setProgressEntries(prev => [newLog, ...prev]);
    setNewEntry({
      painLevel: '',
      exercises: [{ id: uuidv4(), name: '', sets: 0, reps: 0 }],
      notes: '',
    });
    setShowAdd(false);
  };
  const avgPain = useMemo(() => {
    if (progressEntries.length === 0) return 0;
    const total = progressEntries.reduce((sum, e) => sum + e.painLevel, 0);
    return total / progressEntries.length;
  }, [progressEntries]);

  const totalExercises = useMemo(() => {
    return progressEntries.reduce((sum, e) => sum + e.exercises.length, 0);
  }, [progressEntries]);

  const improvement = useMemo(() => {
    if (progressEntries.length < 4) return 0.0;
    const half = Math.floor(progressEntries.length / 2);
    const firstHalfAvg =
      progressEntries.slice(half).reduce((sum, e) => sum + e.painLevel, 0) / (progressEntries.length - half);
    const secondHalfAvg =
      progressEntries.slice(0, half).reduce((sum, e) => sum + e.painLevel, 0) / half;
    return parseFloat((firstHalfAvg - secondHalfAvg).toFixed(1));
  }, [progressEntries]);

  const AddEntryModal = () => (
    <Modal visible={showAdd} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAdd(false)}>
            <X size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Entry</Text>
          <TouchableOpacity onPress={saveEntry}>
            <Save size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={100}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.label}>Pain Level (0–10)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={newEntry.painLevel}
                onChangeText={v => setNewEntry(prev => ({ ...prev, painLevel: v }))}
              />

              {newEntry.exercises.map((ex, idx) => (
                <View key={ex.id} style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>Exercise {idx + 1}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={ex.name}
                    onChangeText={v => updateExercise(idx, 'name', v)}
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TextInput
                      style={[styles.input, { flex: 0.48 }]}
                      placeholder="Sets"
                      keyboardType="numeric"
                      value={ex.sets.toString()}
                      onChangeText={v => updateExercise(idx, 'sets', v)}
                    />
                    <TextInput
                      style={[styles.input, { flex: 0.48 }]}
                      placeholder="Reps"
                      keyboardType="numeric"
                      value={ex.reps.toString()}
                      onChangeText={v => updateExercise(idx, 'reps', v)}
                    />
                  </View>
                  {newEntry.exercises.length > 1 && (
                    <TouchableOpacity onPress={() => removeExerciseField(idx)}>
                      <Text style={{ color: 'red', marginTop: 4 }}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity onPress={addExerciseField} style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add Another Exercise</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, { minHeight: 60 }]}
                multiline
                value={newEntry.notes}
                onChangeText={v => setNewEntry(prev => ({ ...prev, notes: v }))}
              />
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress Tracking</Text>
        <Text style={styles.subtitle}>Monitor your recovery journey</Text>
      </View>

      <TouchableOpacity style={styles.entryButton} onPress={() => setShowAdd(true)}>
        <Text style={styles.entryButtonText}>+ Add Entry</Text>
      </TouchableOpacity>

      <View style={styles.toggleRow}>
        {['Week', 'Month', 'All Time'].map(label => (
          <View key={label} style={[styles.toggleItem, label === 'Week' && styles.toggleSelected]}>
            <Text style={{ fontWeight: '500', color: label === 'Week' ? '#fff' : '#333' }}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Avg Pain Level</Text>
          <Text style={styles.statValue}>{avgPain.toFixed(1)}/10</Text>
          <Text style={styles.statCaption}>{avgPain <= 3 ? 'Stable' : 'Elevated'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Total Exercises</Text>
          <Text style={styles.statValue}>{totalExercises}</Text>
          <Text style={styles.statCaption}>This period</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Improvement</Text>
          <Text style={styles.statValue}>+{improvement.toFixed(1)}</Text>
          <Text style={styles.statCaption}>Pain level change</Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Recent Entries</Text>
      <ScrollView style={{ paddingHorizontal: 16 }}>
        {progressEntries.map(entry => (
          <View key={entry.id} style={styles.entryCard}>
            <Text style={{ fontWeight: '600' }}>{entry.date}</Text>
            <Text style={{ marginTop: 4 }}>Pain: {entry.painLevel}/10</Text>
            {entry.exercises.map(ex => (
              <Text key={ex.id}>• {ex.name} ({ex.sets} x {ex.reps})</Text>
            ))}
            {entry.notes && <Text style={{ fontStyle: 'italic', marginTop: 4 }}>📝 {entry.notes}</Text>}
          </View>
        ))}
      </ScrollView>

      <AddEntryModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, backgroundColor: '#2563EB' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: '#E0EFFF', marginTop: 4 },
  entryButton: {
    backgroundColor: '#2563EB',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  entryButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  toggleItem: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  toggleSelected: {
    backgroundColor: '#2563EB',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
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
    marginLeft: 16,
    marginBottom: 8,
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
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
  addButton: {
    padding: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
});
