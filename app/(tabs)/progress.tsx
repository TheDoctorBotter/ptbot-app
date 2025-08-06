import React, { useState } from 'react';
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
  exercisesCompleted: number;
  exerciseDetails: ExerciseEntry[];
  notes: string;
}

export default function ProgressScreen() {
  const [progressList, setProgressList] = useState<ProgressData[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    painLevel: 0,
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
        i === index ? { ...ex, [field]: field === 'name' ? value : parseInt(value) || 0 } : ex
      ),
    }));
  };

  const saveEntry = () => {
    const completed = newEntry.exercises.length;
    const newProgressEntry: ProgressData = {
      id: uuidv4(),
      date: newEntry.date,
      painLevel: newEntry.painLevel,
      exercisesCompleted: completed,
      exerciseDetails: newEntry.exercises,
      notes: newEntry.notes,
    };

    setProgressList(prev => [newProgressEntry, ...prev]);
    setShowAdd(false);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      painLevel: 0,
      exercises: [{ id: uuidv4(), name: '', sets: 0, reps: 0 }],
      notes: '',
    });
  };

  const AddEntryModal = () => (
    <Modal visible={showAdd} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAdd(false)}>
            <X size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Exercise Entry</Text>
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
              contentContainerStyle={styles.modalContentContainer}
              keyboardShouldPersistTaps="handled"
            >
              {newEntry.exercises.map((ex, idx) => (
                <View key={ex.id} style={styles.exerciseGroup}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseLabel}>Exercise {idx + 1}</Text>
                    {newEntry.exercises.length > 1 && (
                      <TouchableOpacity onPress={() => removeExerciseField(idx)}>
                        <X size={18} color="#D00" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={ex.name}
                    onChangeText={v => updateExercise(idx, 'name', v)}
                    returnKeyType="done"
                    blurOnSubmit={false}
                  />
                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <TextInput
                        style={styles.input}
                        placeholder="Sets"
                        keyboardType="number-pad"
                        value={ex.sets.toString()}
                        onChangeText={v => updateExercise(idx, 'sets', v)}
                      />
                    </View>
                    <View style={styles.halfInput}>
                      <TextInput
                        style={styles.input}
                        placeholder="Reps"
                        keyboardType="number-pad"
                        value={ex.reps.toString()}
                        onChangeText={v => updateExercise(idx, 'reps', v)}
                      />
                    </View>
                  </View>
                </View>
              ))}

              {/* Notes Field */}
              <Text style={styles.sectionLabel}>Notes</Text>
              <TextInput
                style={[styles.input, { minHeight: 80 }]}
                placeholder="Enter notes here"
                multiline
                value={newEntry.notes}
                onChangeText={v => setNewEntry(prev => ({ ...prev, notes: v }))}
              />

              <TouchableOpacity style={styles.addButton} onPress={addExerciseField}>
                <Plus size={20} color="#FFF" />
                <Text style={styles.addButtonText}>Add Exercise</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Progress Tracker</Text>
        <TouchableOpacity style={styles.openButton} onPress={() => setShowAdd(true)}>
          <Text style={styles.openButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.progressList}>
        {progressList.length === 0 ? (
          <Text style={styles.emptyText}>No progress entries yet.</Text>
        ) : (
          progressList.map(entry => (
            <View key={entry.id} style={styles.progressCard}>
              <Text style={styles.entryDate}>📅 {entry.date}</Text>
              <Text style={styles.entrySummary}>Exercises: {entry.exercisesCompleted}</Text>
              {entry.exerciseDetails.map(ex => (
                <Text key={ex.id} style={styles.entryDetail}>
                  • {ex.name} — {ex.sets} x {ex.reps}
                </Text>
              ))}
              {entry.notes.length > 0 && (
                <Text style={styles.entryNotes}>📝 {entry.notes}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <AddEntryModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '600' },
  openButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  openButtonText: { color: '#FFF', fontWeight: '500' },
  progressList: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#777' },
  progressCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  entryDate: { fontWeight: '600', marginBottom: 4 },
  entrySummary: { fontStyle: 'italic', marginBottom: 4 },
  entryDetail: { marginLeft: 8 },
  entryNotes: { marginTop: 6, fontStyle: 'italic', color: '#555' },
  modalContainer: { flex: 1, backgroundColor: '#FFF' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#DDD',
  },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalContentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  exerciseGroup: { marginBottom: 16 },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseLabel: { fontSize: 16, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#FFF',
  },
  sectionLabel: { fontWeight: '600', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 0.48 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#10B981',
    borderRadius: 8,
    marginTop: 20,
  },
  addButtonText: { color: '#FFF', marginLeft: 8, fontWeight: '500' },
});
