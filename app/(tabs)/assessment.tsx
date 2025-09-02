import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, MapPin, Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, ArrowRight, Calendar, Stethoscope, Brain, Heart, Shield } from 'lucide-react-native';
import { AssessmentService } from '@/services/assessmentService';
import type { AssessmentData, AssessmentResult } from '@/services/assessmentService';
import { sendRedFlagAlert, showRedFlagWarning } from '@/components/RedFlagAlert';

const redFlagSymptoms = [
  'Bowel or bladder dysfunction',
  'Progressive neurological deficits',
  'Saddle anesthesia',
  'Severe night pain',
  'Fever with back pain',
  'Recent significant trauma',
  'History of cancer',
  'Unexplained weight loss',
  'Weakness in both legs',
  'Loss of reflexes',
];

const additionalSymptoms = [
  'Numbness or tingling',
  'Muscle weakness',
  'Stiffness in the morning',
  'Pain with movement',
  'Pain at rest',
  'Swelling',
  'Limited range of motion',
  'Muscle spasms',
  'Headaches',
  'Dizziness',
];

export default function AssessmentScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentData, setAssessmentData] = useState<Partial<AssessmentData>>({
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  const assessmentService = new AssessmentService(
    process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || '',
    process.env.EXPO_PUBLIC_YOUTUBE_CHANNEL_ID || ''
  );

  const totalSteps = 7;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateAssessmentData = (field: keyof AssessmentData, value: any) => {
    setAssessmentData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSymptom = (symptom: string, isRedFlag: boolean = false) => {
    const field = isRedFlag ? 'redFlags' : 'additionalSymptoms';
    const currentSymptoms = assessmentData[field] || [];
    
    if (currentSymptoms.includes(symptom)) {
      updateAssessmentData(field, currentSymptoms.filter(s => s !== symptom));
    } else {
      updateAssessmentData(field, [...currentSymptoms, symptom]);
    }
  };

  const processAssessment = async () => {
    if (!assessmentData.painLevel || !assessmentData.painLocation || !assessmentData.painDuration) {
      Alert.alert('Incomplete Assessment', 'Please complete all required fields before submitting.');
      return;
    }

    setIsProcessing(true);

    try {
      // Check for red flags first
      if (assessmentData.redFlags && assessmentData.redFlags.length > 0) {
        showRedFlagWarning(assessmentData.redFlags);
        
        // Send alert to medical professional
        await sendRedFlagAlert({
          symptoms: assessmentData.redFlags,
          painLevel: assessmentData.painLevel!,
          location: assessmentData.location || 'Unknown',
          timestamp: new Date().toISOString(),
        });
      }

      // Process the assessment
      const result = await assessmentService.processAssessment(assessmentData as AssessmentData);
      
      // Save the result
      assessmentService.saveAssessmentResult(result);
      
      setAssessmentResult(result);
      setCurrentStep(totalSteps + 1); // Go to results step

      Alert.alert(
        'Assessment Complete',
        `Your assessment has been processed. ${result.recommendations.length} personalized exercises have been found for your condition. Check the Exercises tab to see your recommendations!`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Assessment processing error:', error);
      Alert.alert(
        'Processing Error',
        'Unable to process your assessment right now. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAssessment = () => {
    setCurrentStep(1);
    setAssessmentData({
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
    setAssessmentResult(null);
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${(currentStep / totalSteps) * 100}%` }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        Step {Math.min(currentStep, totalSteps)} of {totalSteps}
      </Text>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Pain Level Assessment</Text>
            <Text style={styles.stepDescription}>
              On a scale of 0-10, how would you rate your current pain level?
            </Text>
            
            <View style={styles.painLevelContainer}>
              {[...Array(11)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.painLevelButton,
                    assessmentData.painLevel === i && styles.painLevelButtonSelected,
                    i >= 7 && styles.painLevelButtonHigh,
                  ]}
                  onPress={() => updateAssessmentData('painLevel', i)}
                >
                  <Text
                    style={[
                      styles.painLevelText,
                      assessmentData.painLevel === i && styles.painLevelTextSelected,
                    ]}
                  >
                    {i}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.painLevelLabels}>
              <Text style={styles.painLevelLabel}>No Pain</Text>
              <Text style={styles.painLevelLabel}>Worst Possible</Text>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Pain Location</Text>
            <Text style={styles.stepDescription}>
              Where is your pain located? Select the primary area.
            </Text>
            
            <View style={styles.locationGrid}>
              {[
                'Neck', 'Upper Back', 'Lower Back', 'Shoulder',
                'Elbow', 'Wrist', 'Hip', 'Knee', 'Ankle', 'Other'
              ].map((location) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.locationButton,
                    assessmentData.painLocation === location && styles.locationButtonSelected,
                  ]}
                  onPress={() => updateAssessmentData('painLocation', location)}
                >
                  <Text
                    style={[
                      styles.locationButtonText,
                      assessmentData.painLocation === location && styles.locationButtonTextSelected,
                    ]}
                  >
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Pain Duration</Text>
            <Text style={styles.stepDescription}>
              How long have you been experiencing this pain?
            </Text>
            
            <View style={styles.durationContainer}>
              {[
                'Less than 1 week',
                '1-4 weeks',
                '1-3 months',
                '3-6 months',
                'More than 6 months'
              ].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationButton,
                    assessmentData.painDuration === duration && styles.durationButtonSelected,
                  ]}
                  onPress={() => updateAssessmentData('painDuration', duration)}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      assessmentData.painDuration === duration && styles.durationButtonTextSelected,
                    ]}
                  >
                    {duration}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Pain Type</Text>
            <Text style={styles.stepDescription}>
              How would you describe your pain?
            </Text>
            
            <View style={styles.painTypeContainer}>
              {[
                'Sharp/Stabbing',
                'Dull/Aching',
                'Burning',
                'Throbbing',
                'Tingling/Numbness',
                'Stiffness'
              ].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.painTypeButton,
                    assessmentData.painType === type && styles.painTypeButtonSelected,
                  ]}
                  onPress={() => updateAssessmentData('painType', type)}
                >
                  <Text
                    style={[
                      styles.painTypeButtonText,
                      assessmentData.painType === type && styles.painTypeButtonTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>How did this start?</Text>
            <Text style={styles.stepDescription}>
              Describe what caused your pain or how it began.
            </Text>
            
            <TextInput
              style={styles.textAreaInput}
              value={assessmentData.mechanismOfInjury}
              onChangeText={(text) => updateAssessmentData('mechanismOfInjury', text)}
              placeholder="e.g., Lifted heavy box, fell down stairs, gradual onset while working at desk..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Additional Symptoms</Text>
            <Text style={styles.stepDescription}>
              Select any additional symptoms you're experiencing:
            </Text>
            
            <View style={styles.symptomsContainer}>
              {additionalSymptoms.map((symptom) => (
                <TouchableOpacity
                  key={symptom}
                  style={[
                    styles.symptomButton,
                    assessmentData.additionalSymptoms?.includes(symptom) && styles.symptomButtonSelected,
                  ]}
                  onPress={() => toggleSymptom(symptom)}
                >
                  <Text
                    style={[
                      styles.symptomButtonText,
                      assessmentData.additionalSymptoms?.includes(symptom) && styles.symptomButtonTextSelected,
                    ]}
                  >
                    {symptom}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 7:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>⚠️ Red Flag Screening</Text>
            <Text style={styles.stepDescription}>
              Please check any of the following that apply to you. These symptoms may require immediate medical attention:
            </Text>
            
            <View style={styles.redFlagsContainer}>
              {redFlagSymptoms.map((symptom) => (
                <TouchableOpacity
                  key={symptom}
                  style={[
                    styles.redFlagButton,
                    assessmentData.redFlags?.includes(symptom) && styles.redFlagButtonSelected,
                  ]}
                  onPress={() => toggleSymptom(symptom, true)}
                >
                  <View style={styles.redFlagContent}>
                    <AlertTriangle 
                      size={16} 
                      color={assessmentData.redFlags?.includes(symptom) ? "#FFFFFF" : "#EF4444"} 
                    />
                    <Text
                      style={[
                        styles.redFlagButtonText,
                        assessmentData.redFlags?.includes(symptom) && styles.redFlagButtonTextSelected,
                      ]}
                    >
                      {symptom}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.redFlagNote}>
              <Shield size={16} color="#F59E0B" />
              <Text style={styles.redFlagNoteText}>
                If you select any red flag symptoms, a medical professional will be notified immediately.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!assessmentResult) return null;

    const getRiskColor = (risk: string) => {
      switch (risk) {
        case 'low': return '#10B981';
        case 'moderate': return '#F59E0B';
        case 'high': return '#EF4444';
        case 'critical': return '#DC2626';
        default: return '#6B7280';
      }
    };

    const getRiskIcon = (risk: string) => {
      switch (risk) {
        case 'low': return <CheckCircle size={20} color="#10B981" />;
        case 'moderate': return <Clock size={20} color="#F59E0B" />;
        case 'high': return <AlertTriangle size={20} color="#EF4444" />;
        case 'critical': return <AlertTriangle size={20} color="#DC2626" />;
        default: return <Activity size={20} color="#6B7280" />;
      }
    };

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Assessment Complete</Text>
        
        {/* Risk Level */}
        <View style={[styles.riskCard, { borderColor: getRiskColor(assessmentResult.riskLevel) }]}>
          <View style={styles.riskHeader}>
            {getRiskIcon(assessmentResult.riskLevel)}
            <Text style={[styles.riskLevel, { color: getRiskColor(assessmentResult.riskLevel) }]}>
              {assessmentResult.riskLevel.toUpperCase()} RISK
            </Text>
          </View>
          <Text style={styles.riskDescription}>
            Based on your symptoms and assessment responses
          </Text>
        </View>

        {/* Exercise Recommendations */}
        {assessmentResult.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.recommendationsTitle}>
              🎯 Personalized Exercise Recommendations
            </Text>
            <Text style={styles.recommendationsCount}>
              {assessmentResult.recommendations.length} exercises found for your condition
            </Text>
            <TouchableOpacity 
              style={styles.viewExercisesButton}
              onPress={() => {
                Alert.alert(
                  'View Exercises',
                  'Your personalized exercises are now available in the Exercises tab.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text style={styles.viewExercisesText}>View My Exercises</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Next Steps */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>Recommended Next Steps</Text>
          {assessmentResult.nextSteps.map((step, index) => (
            <View key={index} style={styles.nextStepItem}>
              <Text style={styles.nextStepNumber}>{index + 1}</Text>
              <Text style={styles.nextStepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.newAssessmentButton} onPress={resetAssessment}>
            <Text style={styles.newAssessmentText}>Take New Assessment</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return assessmentData.painLevel !== undefined && assessmentData.painLevel > 0;
      case 2: return !!assessmentData.painLocation;
      case 3: return !!assessmentData.painDuration;
      case 4: return !!assessmentData.painType;
      case 5: return !!assessmentData.mechanismOfInjury?.trim();
      case 6: return true; // Additional symptoms are optional
      case 7: return true; // Red flags are optional but important
      default: return false;
    }
  };

  // Show results if assessment is complete
  if (currentStep > totalSteps) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <View style={styles.logoContainer}>
              <Stethoscope size={28} color="#FFFFFF" />
              <Text style={styles.logoText}>PTBOT</Text>
            </View>
            <Text style={styles.headerTitle}>Assessment Results</Text>
          </View>
          <Text style={styles.headerSubtitle}>Your personalized recovery plan</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderResults()}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <View style={styles.logoContainer}>
            <Brain size={28} color="#FFFFFF" />
            <Text style={styles.logoText}>PTBOT</Text>
          </View>
          <Text style={styles.headerTitle}>Symptom Assessment</Text>
        </View>
        <Text style={styles.headerSubtitle}>Help us understand your condition</Text>
      </View>

      <View style={styles.content}>
        {renderProgressBar()}
        
        <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.navigationSpacer} />
          
          {currentStep < totalSteps ? (
            <TouchableOpacity
              style={[
                styles.nextButton,
                !canProceed() && styles.nextButtonDisabled,
              ]}
              onPress={nextStep}
              disabled={!canProceed()}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!canProceed() || isProcessing) && styles.submitButtonDisabled,
              ]}
              onPress={processAssessment}
              disabled={!canProceed() || isProcessing}
            >
              <Heart size={16} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {isProcessing ? 'Processing...' : 'Complete Assessment'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  painLevelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  painLevelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  painLevelTextSelected: {
    color: '#FFFFFF',
  },
  painLevelLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  painLevelLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: '45%',
  },
  locationButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  locationButtonTextSelected: {
    color: '#FFFFFF',
  },
  durationContainer: {
    gap: 12,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  durationButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  durationButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  durationButtonTextSelected: {
    color: '#FFFFFF',
  },
  painTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  painTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: '45%',
  },
  painTypeButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  painTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  painTypeButtonTextSelected: {
    color: '#FFFFFF',
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  symptomButtonSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  symptomButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  symptomButtonTextSelected: {
    color: '#FFFFFF',
  },
  redFlagsContainer: {
    gap: 8,
  },
  redFlagButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  redFlagButtonSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  redFlagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redFlagButtonText: {
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
  },
  redFlagButtonTextSelected: {
    color: '#FFFFFF',
  },
  redFlagNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  redFlagNoteText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  navigationSpacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultsContainer: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  riskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  riskDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  recommendationsCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 8,
  },
  recommendationsCount: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  viewExercisesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  viewExercisesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextStepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nextStepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563EB',
    backgroundColor: '#EBF4FF',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  nextStepText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
  },
  newAssessmentButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  newAssessmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  bottomSpacer: {
    height: 20,
  },
});