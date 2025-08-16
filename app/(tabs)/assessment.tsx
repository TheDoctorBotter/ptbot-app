import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TriangleAlert as AlertTriangle, MapPin, Clock, Activity, CircleCheck as CheckCircle, Send, Stethoscope } from 'lucide-react-native';

interface SymptomData {
  painLevel: number;
  painLocation: string;
  painDuration: string;
  painType: string;
  mechanismOfInjury: string;
  medications: string;
  additionalSymptoms: string[];
  redFlags: string[];
  location: string;
}

const painLocations = [
  'Neck', 'Upper Back', 'Lower Back', 'Middle Back', 'Shoulder', 'Elbow', 
  'Wrist', 'Hand', 'Hip', 'Groin', 'Knee', 'Ankle', 'Foot'
];

const painTypes = [
  'Sharp/Stabbing', 'Dull/Aching', 'Burning', 'Throbbing', 
  'Tingling/Numbness', 'Stiffness', 'Other'
];

const commonSymptoms = [
  'Morning stiffness', 'Pain with Standing', 'Pain with Sitting', 'Pain with Stairs', 'Pain at rest',
  'Swelling', 'Weakness', 'Limited range of motion',
  'Muscle spasms', 'Radiating/Shooting pain'
];

const redFlagSymptoms = [
  'Severe unrelenting pain', 'Loss of bowel/bladder control',
  'Numbness in groin/genital area', 'Weakness in both legs',
  'Fever with back pain', 'Recent significant trauma',
  'Progressive neurological deficits', 'Severe night pain',
  'Unexplained weight loss', 'History of cancer'
];

export default function AssessmentScreen() {
  const [symptomData, setSymptomData] = useState<SymptomData>({
    painLevel: 0,
    painLocation: '',
    painDuration: '',
    painType: '',
    mechanismOfInjury: '',
    medications: '',
    additionalSymptoms: [],
    redFlags: [],
    location: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSymptomToggle = (symptom: string, isRedFlag: boolean = false) => {
    const key = isRedFlag ? 'redFlags' : 'additionalSymptoms';
    setSymptomData(prev => ({
      ...prev,
      [key]: prev[key].includes(symptom)
        ? prev[key].filter(s => s !== symptom)
        : [...prev[key], symptom],
    }));
  };

  const sendRedFlagAlert = async () => {
    // In a real app, this would be an API call to your backend
    try {
      const alertData = {
        timestamp: new Date().toISOString(),
        redFlags: symptomData.redFlags,
        painLevel: symptomData.painLevel,
        painLocation: symptomData.painLocation,
        patientLocation: symptomData.location,
      };

      // Simulated email alert
      console.log('RED FLAG ALERT:', alertData);
      
      Alert.alert(
        'Alert Sent',
        'A red flag alert has been sent to Dr. Justin Lemmo. You should seek immediate medical attention.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to send red flag alert:', error);
    }
  };

  const handleSubmit = async () => {
    if (!symptomData.painLocation || symptomData.painLevel === 0) {
      Alert.alert('Incomplete Assessment', 'Please fill in your pain level and location.');
      return;
    }

    setIsSubmitting(true);

    // Check for red flags
    if (symptomData.redFlags.length > 0) {
      await sendRedFlagAlert();
    }

    // Save assessment data (in real app, this would go to backend/database)
    const assessmentRecord = {
      ...symptomData,
      timestamp: new Date().toISOString(),
      id: Date.now().toString(),
    };

    console.log('Assessment saved:', assessmentRecord);

    // Show success message with next steps
    let message = 'Assessment completed successfully! ';
    
    if (symptomData.redFlags.length > 0) {
      message += 'Due to concerning symptoms, please seek immediate medical attention.';
    } else if (symptomData.location.toLowerCase().includes('texas')) {
      message += 'As a Texas resident, you can book a virtual consultation for personalized treatment recommendations.';
    } else {
      message += 'Check the Exercises tab for recommended activities based on your symptoms.';
    }

    Alert.alert('Assessment Complete', message, [
      { text: 'OK', onPress: () => {
        // Reset form
        setSymptomData({
          painLevel: 0,
          painLocation: '',
          painDuration: '',
          painType: '',
          mechanismOfInjury: '',
          medications: '',
          additionalSymptoms: [],
          redFlags: [],
          location: '',
        });
      }}
    ]);

    setIsSubmitting(false);
  };

  const PainLevelSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Pain Level (0-10)</Text>
      <View style={styles.painLevelContainer}>
        {[...Array(11)].map((_, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.painLevelButton,
              symptomData.painLevel === i && styles.painLevelButtonSelected,
              i >= 7 && styles.painLevelButtonHigh,
            ]}
            onPress={() => setSymptomData(prev => ({ ...prev, painLevel: i }))}
          >
            <Text
              style={[
                styles.painLevelText,
                symptomData.painLevel === i && styles.painLevelTextSelected,
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
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <View style={styles.logoContainer}>
            <Stethoscope size={28} color="#FFFFFF" />
            <Text style={styles.logoText}>PTBOT</Text>
          </View>
          <Text style={styles.headerTitle}>Assessment</Text>
        </View>
        <Text style={styles.headerSubtitle}>Help us understand your current condition</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <PainLevelSelector />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MapPin size={16} color="#2563EB" /> Pain Location
          </Text>
          <View style={styles.optionGrid}>
            {painLocations.map((location) => (
              <TouchableOpacity
                key={location}
                style={[
                  styles.optionButton,
                  symptomData.painLocation === location && styles.optionButtonSelected,
                ]}
                onPress={() => setSymptomData(prev => ({ ...prev, painLocation: location }))}
              >
                <Text
                  style={[
                    styles.optionText,
                    symptomData.painLocation === location && styles.optionTextSelected,
                  ]}
                >
                  {location}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Clock size={16} color="#2563EB" /> Pain Duration
          </Text>
          <TextInput
            style={styles.textInput}
            value={symptomData.painDuration}
            onChangeText={(text) => setSymptomData(prev => ({ ...prev, painDuration: text }))}
            placeholder="e.g., 3 days, 2 weeks, 6 months"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Activity size={16} color="#2563EB" /> Pain Type
          </Text>
          <View style={styles.optionGrid}>
            {painTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  symptomData.painType === type && styles.optionButtonSelected,
                ]}
                onPress={() => setSymptomData(prev => ({ ...prev, painType: type }))}
              >
                <Text
                  style={[
                    styles.optionText,
                    symptomData.painType === type && styles.optionTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mechanism of Injury</Text>
          <Text style={styles.sectionSubtitle}>
            How did you hurt yourself? Describe what happened.
          </Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={symptomData.mechanismOfInjury}
            onChangeText={(text) => setSymptomData(prev => ({ ...prev, mechanismOfInjury: text }))}
            placeholder="e.g., Lifted heavy box, fell down stairs, car accident, gradual onset..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Medications</Text>
          <Text style={styles.sectionSubtitle}>
            List any medications, supplements, or treatments you're currently taking
          </Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={symptomData.medications}
            onChangeText={(text) => setSymptomData(prev => ({ ...prev, medications: text }))}
            placeholder="e.g., Ibuprofen 400mg twice daily, Vitamin D, Physical therapy..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Symptoms</Text>
          <Text style={styles.sectionSubtitle}>Select all that apply</Text>
          <View style={styles.checkboxContainer}>
            {commonSymptoms.map((symptom) => (
              <TouchableOpacity
                key={symptom}
                style={styles.checkboxItem}
                onPress={() => handleSymptomToggle(symptom)}
              >
                <View style={[
                  styles.checkbox,
                  symptomData.additionalSymptoms.includes(symptom) && styles.checkboxSelected,
                ]}>
                  {symptomData.additionalSymptoms.includes(symptom) && (
                    <CheckCircle size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.checkboxText}>{symptom}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.redFlagSection]}>
          <Text style={[styles.sectionTitle, styles.redFlagTitle]}>
            <AlertTriangle size={16} color="#DC2626" /> Red Flag Symptoms
          </Text>
          <Text style={styles.redFlagSubtitle}>
            These symptoms require immediate medical attention
          </Text>
          <View style={styles.checkboxContainer}>
            {redFlagSymptoms.map((symptom) => (
              <TouchableOpacity
                key={symptom}
                style={styles.checkboxItem}
                onPress={() => handleSymptomToggle(symptom, true)}
              >
                <View style={[
                  styles.checkbox,
                  styles.redFlagCheckbox,
                  symptomData.redFlags.includes(symptom) && styles.redFlagCheckboxSelected,
                ]}>
                  {symptomData.redFlags.includes(symptom) && (
                    <AlertTriangle size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.checkboxText}>{symptom}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Location</Text>
          <Text style={styles.sectionSubtitle}>
            Texas residents can book virtual consultations
          </Text>
          <TextInput
            style={styles.textInput}
            value={symptomData.location}
            onChangeText={(text) => setSymptomData(prev => ({ ...prev, location: text }))}
            placeholder="e.g., Dallas, Texas"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Send size={20} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Complete Assessment'}
          </Text>
        </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
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
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  painLevelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  painLevelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  painLevelButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  painLevelButtonHigh: {
    borderColor: '#DC2626',
  },
  painLevelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  painLevelTextSelected: {
    color: '#FFFFFF',
  },
  painLevelLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  painLevelLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    gap: 12,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  redFlagSection: {
    borderWidth: 2,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  redFlagTitle: {
    color: '#DC2626',
  },
  redFlagSubtitle: {
    color: '#B91C1C',
    fontWeight: '500',
  },
  redFlagCheckbox: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEE2E2',
  },
  redFlagCheckboxSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 20,
  },
});