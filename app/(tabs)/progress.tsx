import React, { useState } from 'react';
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
import { Plus, X, Save } from 'lucide-react-native';
import { v4 as uuidv4 } from 'uuid';

// Data types
interface ExerciseEntry {
  id: string;
  name: string;
  sets: number;
  reps: number;
}
interface ProgressData {
  date: string;
  painLevel: number;
  exercisesCompleted: number;
  exerciseDetails: ExerciseEntry[];
  notes: string;
}

const mockProgressData: ProgressData[] = [];

export default function ProgressScreen() {
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    painLevel: 0,
    exercises: [{ id: uuidv4(), name: '', sets: 0, reps: 0 }],
    notes: '',
  } as { date: string; painLevel: number; exercises: ExerciseEntry[]; notes: string });

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
    setShowAdd(false);
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
          b
