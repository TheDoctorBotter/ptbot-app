import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Activity, Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, ArrowRight, Stethoscope, Brain, Heart, Shield, Dumbbell, Target, Info, Play, LogIn, Phone, Square, CheckSquare } from 'lucide-react-native';
import { AssessmentService } from '@/services/assessmentService';
import type { AssessmentData, AssessmentResult, ExerciseRecommendation, PostOpData } from '@/services/assessmentService';
import { sendRedFlagAlert, showRedFlagWarning } from '@/components/RedFlagAlert';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
// Note: Outcome service functions are imported but questionnaire steps are disabled
// To re-enable questionnaires, uncomment the steps in getStepConfig()
import {
  getQuestionnaireByKey,
  getQuestionnaireItems,
  saveOutcomeAssessment,
  calculateScore,
  mapPainLocationToCondition,
  getQuestionnaireKeyForCondition,
  type Questionnaire,
  type QuestionnaireItem,
} from '@/services/outcomeService';

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

// Post-op surgery type mappings
const surgeryTypesByRegion: Record<string, { label: string; key: string; hasModifier?: boolean; modifiers?: string[] }[]> = {
  'Shoulder': [
    { label: 'Rotator Cuff Repair', key: 'rotator_cuff_repair', hasModifier: true, modifiers: ['Grade 1 (Small Tear)', 'Grade 2 (Medium Tear)', 'Grade 3 (Large/Massive Tear)'] },
    { label: 'Labral Repair (SLAP/Bankart)', key: 'labral_repair' },
    { label: 'Shoulder Stabilization', key: 'stabilization' },
    { label: 'Total Shoulder Arthroplasty', key: 'total_shoulder_arthroplasty' },
    { label: 'Reverse Total Shoulder Arthroplasty', key: 'reverse_total_shoulder_arthroplasty' },
  ],
  'Knee': [
    { label: 'ACL Reconstruction', key: 'acl_reconstruction' },
    { label: 'PCL Reconstruction', key: 'pcl_reconstruction' },
    { label: 'Meniscus Repair', key: 'meniscus_repair' },
    { label: 'Partial Meniscectomy', key: 'partial_meniscectomy' },
    { label: 'Patellar Tendon Repair', key: 'patellar_tendon_repair' },
    { label: 'Total Knee Arthroplasty', key: 'total_knee_arthroplasty' },
  ],
  'Hip': [
    { label: 'Total Hip Arthroplasty (Anterior)', key: 'total_hip_arthroplasty_anterior' },
    { label: 'Total Hip Arthroplasty (Posterior)', key: 'total_hip_arthroplasty_posterior' },
    { label: 'Hip Labral Repair', key: 'labral_repair' },
    { label: 'FAI Surgery', key: 'fai_surgery' },
  ],
  'Elbow': [
    { label: 'UCL Reconstruction (Tommy John)', key: 'ucl_reconstruction' },
    { label: 'UCL Repair', key: 'ucl_repair' },
    { label: 'Distal Biceps Tendon Repair', key: 'distal_biceps_repair' },
    { label: 'Lateral Epicondyle Repair', key: 'lateral_epicondyle_repair' },
  ],
  'Foot/Ankle': [
    { label: 'Achilles Tendon Repair', key: 'achilles_tendon_repair' },
    { label: 'Ankle Ligament Reconstruction', key: 'ankle_ligament_reconstruction' },
    { label: 'Ankle Arthroscopy', key: 'ankle_arthroscopy' },
    { label: 'Plantar Fascia Release', key: 'plantar_fascia_release' },
    { label: 'Lisfranc Repair', key: 'lisfranc_repair' },
  ],
};

const weeksSinceSurgeryOptions = [
  '0-2 weeks',
  '2-6 weeks',
  '6-12 weeks',
  '12+ weeks',
];

const weightBearingOptions = [
  'Non-weight-bearing (NWB)',
  'Partial weight-bearing (PWB)',
  'Weight-bearing as tolerated (WBAT)',
  'Full weight-bearing',
  'Not sure',
];

export default function AssessmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; conditionTag?: string }>();

  // Follow-up mode state - TEMPORARILY DISABLED
  // To re-enable, change false to: params.mode === 'followup'
  const isFollowUpMode = false; // params.mode === 'followup';
  const followUpConditionTag = params.conditionTag || null;

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
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

  // Auth state
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Consent state
  const [consentContact, setConsentContact] = useState(false);
  const [consentDataUse, setConsentDataUse] = useState(false);
  const [legalWaiverAccepted, setLegalWaiverAccepted] = useState(false);

  // Post-op state
  const [surgeryStatus, setSurgeryStatus] = useState<'no_surgery' | 'post_op' | 'not_sure' | ''>('');
  const [postOpRegion, setPostOpRegion] = useState('');
  const [surgeryType, setSurgeryType] = useState('');
  const [procedureModifier, setProcedureModifier] = useState('');
  const [weeksSinceSurgery, setWeeksSinceSurgery] = useState('');
  const [weightBearingStatus, setWeightBearingStatus] = useState('');
  const [surgeonPrecautions, setSurgeonPrecautions] = useState<'yes' | 'no' | 'not_sure' | ''>('');

  // Baseline outcome measures state
  const [functionQuestionnaire, setFunctionQuestionnaire] = useState<Questionnaire | null>(null);
  const [functionItems, setFunctionItems] = useState<QuestionnaireItem[]>([]);
  const [functionResponses, setFunctionResponses] = useState<Map<string, number>>(new Map());
  const [currentFunctionItemIndex, setCurrentFunctionItemIndex] = useState(0);
  const [functionResult, setFunctionResult] = useState<{
    totalScore: number;
    normalizedScore: number;
    interpretation: string;
  } | null>(null);
  const [baselinePainScore, setBaselinePainScore] = useState<number | null>(null);
  const [isLoadingQuestionnaire, setIsLoadingQuestionnaire] = useState(false);

  const assessmentService = new AssessmentService();

  // Check authentication on mount and listen for auth changes
  useEffect(() => {
    checkAuth();

    // Subscribe to auth state changes so we detect sign-in from other pages
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('[Assessment] Auth state changed:', event);
          if (session?.user) {
            setUser(session.user);
            setUserEmail(session.user.email || '');
            setUserPhone(session.user.user_metadata?.phone || session.user.phone || '');
          } else {
            setUser(null);
          }
          setIsCheckingAuth(false);
        }
      );

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const checkAuth = async () => {
    if (!supabase) {
      setIsCheckingAuth(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        setUserEmail(user.email || '');
        // Get phone from user metadata if available
        setUserPhone(user.user_metadata?.phone || user.phone || '');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Load function questionnaire based on pain location
  const loadFunctionQuestionnaire = async () => {
    if (!assessmentData.painLocation) return;

    setIsLoadingQuestionnaire(true);
    try {
      const conditionTag = mapPainLocationToCondition(assessmentData.painLocation);
      const questionnaireKey = getQuestionnaireKeyForCondition(conditionTag);

      const questionnaire = await getQuestionnaireByKey(questionnaireKey);
      if (questionnaire) {
        setFunctionQuestionnaire(questionnaire);
        const items = await getQuestionnaireItems(questionnaire.id);
        setFunctionItems(items);
        setFunctionResponses(new Map());
        setCurrentFunctionItemIndex(0);
        setFunctionResult(null);
      }
    } catch (error) {
      console.error('Error loading questionnaire:', error);
    } finally {
      setIsLoadingQuestionnaire(false);
    }
  };

  const toggleExerciseExpanded = (exerciseId: string) => {
    setExpandedExercises(prev => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const openExerciseVideo = (videoUrl: string, exerciseName: string) => {
    console.log('🎬 Opening video:', { exerciseName, videoUrl });
    Linking.openURL(videoUrl).catch(() => {
      Alert.alert('Error', 'Unable to open video. Please try again later.');
    });
  };

  // Calculate total steps based on surgery status and mode
  const getStepConfig = () => {
    // Follow-up mode temporarily disabled - redirect to full assessment
    // if (isFollowUpMode) {
    //   return [
    //     'followUpIntro',
    //     'followUpFunction',
    //     'followUpPain',
    //   ];
    // }

    // Full assessment mode
    // Base steps: 1-Pain Level, 2-Pain Location, 3-Surgery Status
    // Then continue with: 4-Duration, 5-Pain Type, 6-Mechanism, 7-Additional, 8-Red Flags, 9-Consent
    // Post-op adds: Region, Surgery Type, (Modifier), Weeks, (Weight Bearing), Precautions

    const isPostOp = surgeryStatus === 'post_op';
    const isLowerExtremity = ['Knee', 'Hip', 'Foot/Ankle'].includes(postOpRegion);
    const selectedSurgery = surgeryTypesByRegion[postOpRegion]?.find(s => s.key === surgeryType);
    const needsModifier = selectedSurgery?.hasModifier && selectedSurgery?.modifiers;

    let steps = [
      'painLevel',        // 1
      'painLocation',     // 2
      'surgeryStatus',    // 3
    ];

    if (isPostOp) {
      steps.push('postOpRegion');      // 4
      steps.push('surgeryType');       // 5
      if (needsModifier) {
        steps.push('procedureModifier'); // 6
      }
      steps.push('weeksSinceSurgery'); // 6 or 7
      if (isLowerExtremity) {
        steps.push('weightBearing');   // 7 or 8
      }
      steps.push('surgeonPrecautions'); // 8 or 9
    }

    steps.push('painDuration');        // varies
    steps.push('painType');
    steps.push('mechanism');
    steps.push('additionalSymptoms');
    steps.push('redFlags');
    steps.push('consent');

    // Note: Baseline outcome measures (NPRS, ODI, KOOS, etc.) temporarily disabled for testing
    // steps.push('baselineFunctionIntro');
    // steps.push('baselineFunction');
    // steps.push('baselinePain');

    return steps;
  };

  const stepConfig = getStepConfig();
  const totalSteps = stepConfig.length;
  const currentStepName = stepConfig[currentStep - 1];

  // Load function questionnaire when entering baseline or follow-up steps
  // TEMPORARILY DISABLED - questionnaires not in use
  // useEffect(() => {
  //   const shouldLoadQuestionnaire =
  //     (currentStepName === 'baselineFunctionIntro' || currentStepName === 'followUpIntro') &&
  //     !functionQuestionnaire;
  //
  //   if (shouldLoadQuestionnaire) {
  //     if (isFollowUpMode && followUpConditionTag) {
  //       loadFunctionQuestionnaireForCondition(followUpConditionTag);
  //     } else {
  //       loadFunctionQuestionnaire();
  //     }
  //   }
  // }, [currentStepName, functionQuestionnaire, isFollowUpMode, followUpConditionTag]);

  // Load questionnaire for a specific condition (used in follow-up mode)
  const loadFunctionQuestionnaireForCondition = async (conditionTag: string) => {
    setIsLoadingQuestionnaire(true);
    try {
      const questionnaireKey = getQuestionnaireKeyForCondition(conditionTag);
      const questionnaire = await getQuestionnaireByKey(questionnaireKey);
      if (questionnaire) {
        setFunctionQuestionnaire(questionnaire);
        const items = await getQuestionnaireItems(questionnaire.id);
        setFunctionItems(items);
        setFunctionResponses(new Map());
        setCurrentFunctionItemIndex(0);
        setFunctionResult(null);
      }
    } catch (error) {
      console.error('Error loading questionnaire:', error);
    } finally {
      setIsLoadingQuestionnaire(false);
    }
  };

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

    // Validate consent
    if (!consentContact || !consentDataUse || !legalWaiverAccepted) {
      Alert.alert('Consent Required', 'Please accept all consent checkboxes and the legal waiver to continue.');
      return;
    }

    if (!userPhone.trim() || userPhone.trim().length < 10) {
      Alert.alert('Phone Required', 'Please enter a valid phone number.');
      return;
    }

    // Note: baselinePainScore validation removed since NPRS questionnaire is disabled
    // if (baselinePainScore === null) {
    //   Alert.alert('Incomplete', 'Please complete the pain assessment.');
    //   return;
    // }

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

        // If red flags, don't proceed with recommendations
        setAssessmentResult({
          riskLevel: 'critical',
          recommendations: [],
          nextSteps: [
            'Please seek immediate medical attention',
            'Contact your healthcare provider or call 911 if symptoms are severe',
            'Do not attempt exercises until cleared by a medical professional',
          ],
          summary: 'Red flag symptoms detected. Please consult a healthcare professional.',
        });
        setCurrentStep(totalSteps + 1);
        return;
      }

      // Generate protocol key and phase for post-op patients
      const protocolKey = generateProtocolKey();
      const safePhase = getSafePhase();

      // Build post-op data object if applicable
      const postOpDataForProcessing: PostOpData | undefined = surgeryStatus === 'post_op' ? {
        surgeryStatus,
        postOpRegion,
        surgeryType,
        procedureModifier,
        weeksSinceSurgery,
        weightBearingStatus,
        surgeonPrecautions,
        protocolKey,
        phaseNumber: safePhase,
      } : undefined;

      // Process the assessment with post-op data
      const result = await assessmentService.processAssessment(assessmentData as AssessmentData, postOpDataForProcessing);

      // Note: Baseline outcome assessments (NPRS, ODI, KOOS, etc.) temporarily disabled for testing
      // const conditionTag = mapPainLocationToCondition(assessmentData.painLocation);
      // const functionQuestionnaireKey = getQuestionnaireKeyForCondition(conditionTag);

      // Save function questionnaire (ODI/KOOS/QuickDASH) - TEMPORARILY DISABLED
      // if (functionResponses.size > 0) {
      //   try {
      //     const savedFunctionAssessment = await saveOutcomeAssessment(
      //       functionQuestionnaireKey,
      //       'baseline',
      //       conditionTag,
      //       functionResponses
      //     );
      //
      //     if (savedFunctionAssessment) {
      //       const functionScoreResult = calculateScore(
      //         functionQuestionnaireKey,
      //         Array.from(functionResponses.values())
      //       );
      //       setFunctionResult(functionScoreResult);
      //     }
      //   } catch (error) {
      //     console.error('Error saving function assessment:', error);
      //   }
      // }

      // Save pain assessment (NPRS) - TEMPORARILY DISABLED
      // if (baselinePainScore !== null) {
      //   try {
      //     const nprsQuestionnaire = await getQuestionnaireByKey('nprs');
      //     if (nprsQuestionnaire) {
      //       const nprsItems = await getQuestionnaireItems(nprsQuestionnaire.id);
      //       if (nprsItems.length > 0) {
      //         const painResponseMap = new Map<string, number>();
      //         painResponseMap.set(nprsItems[0].id, baselinePainScore);
      //
      //         await saveOutcomeAssessment(
      //           'nprs',
      //           'baseline',
      //           conditionTag,
      //           painResponseMap
      //         );
      //       }
      //     }
      //   } catch (error) {
      //     console.error('Error saving pain assessment:', error);
      //   }
      // }

      // Save the result with consent and post-op data
      await assessmentService.saveAssessmentResult(result, {
        userEmail,
        userPhone: userPhone.trim(),
        consentContact,
        consentDataUse,
        legalWaiverAccepted,
        // Post-op data
        surgeryStatus,
        postOpRegion: surgeryStatus === 'post_op' ? postOpRegion : null,
        surgeryType: surgeryStatus === 'post_op' ? surgeryType : null,
        procedureModifier: surgeryStatus === 'post_op' ? procedureModifier : null,
        weeksSinceSurgery: surgeryStatus === 'post_op' ? weeksSinceSurgery : null,
        weightBearingStatus: surgeryStatus === 'post_op' ? weightBearingStatus : null,
        surgeonPrecautions: surgeryStatus === 'post_op' ? surgeonPrecautions : null,
        protocolKeySelected: protocolKey,
        phaseNumberSelected: surgeryStatus === 'post_op' ? safePhase : null,
      });

      setAssessmentResult(result);
      setCurrentStep(totalSteps + 1); // Go to results step

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

  // Process follow-up assessment (simplified flow)
  const processFollowUp = async () => {
    if (baselinePainScore === null) {
      Alert.alert('Incomplete', 'Please complete the pain assessment.');
      return;
    }

    if (!followUpConditionTag) {
      Alert.alert('Error', 'Missing condition information. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const conditionTag = followUpConditionTag;
      const functionQuestionnaireKey = getQuestionnaireKeyForCondition(conditionTag);

      // Save function questionnaire (ODI/KOOS/QuickDASH) as follow-up
      if (functionResponses.size > 0) {
        try {
          const savedAssessment = await saveOutcomeAssessment(
            functionQuestionnaireKey,
            'followup',
            conditionTag,
            functionResponses
          );

          if (savedAssessment) {
            const result = calculateScore(
              functionQuestionnaireKey,
              Array.from(functionResponses.values())
            );
            setFunctionResult(result);
          }
        } catch (error) {
          console.error('Error saving follow-up function assessment:', error);
        }
      }

      // Save pain assessment (NPRS) as follow-up
      try {
        const nprsQuestionnaire = await getQuestionnaireByKey('nprs');
        if (nprsQuestionnaire) {
          const nprsItems = await getQuestionnaireItems(nprsQuestionnaire.id);
          if (nprsItems.length > 0) {
            const painResponseMap = new Map<string, number>();
            painResponseMap.set(nprsItems[0].id, baselinePainScore);

            await saveOutcomeAssessment(
              'nprs',
              'followup',
              conditionTag,
              painResponseMap
            );
          }
        }
      } catch (error) {
        console.error('Error saving follow-up pain assessment:', error);
      }

      // Show success and navigate back to dashboard
      Alert.alert(
        'Progress Saved',
        'Your follow-up assessment has been recorded. Check your dashboard to see how you\'ve improved!',
        [
          {
            text: 'View Dashboard',
            onPress: () => router.replace('/(tabs)/dashboard'),
          },
        ]
      );

    } catch (error) {
      console.error('Follow-up processing error:', error);
      Alert.alert(
        'Error',
        'Unable to save your follow-up assessment. Please try again.',
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
    setExpandedExercises(new Set());
    // Reset consent (keep phone number)
    setConsentContact(false);
    setConsentDataUse(false);
    setLegalWaiverAccepted(false);
    // Reset post-op state
    setSurgeryStatus('');
    setPostOpRegion('');
    setSurgeryType('');
    setProcedureModifier('');
    setWeeksSinceSurgery('');
    setWeightBearingStatus('');
    setSurgeonPrecautions('');
    // Reset baseline questionnaire state
    setFunctionQuestionnaire(null);
    setFunctionItems([]);
    setFunctionResponses(new Map());
    setCurrentFunctionItemIndex(0);
    setFunctionResult(null);
    setBaselinePainScore(null);
  };

  // Generate protocol key from post-op selections
  const generateProtocolKey = (): string | null => {
    if (surgeryStatus !== 'post_op' || !postOpRegion || !surgeryType) {
      return null;
    }

    const regionKey = postOpRegion.toLowerCase().replace(/\//g, '_');
    let key = `${regionKey}_${surgeryType}`;

    // Add modifier for rotator cuff
    if (surgeryType === 'rotator_cuff_repair' && procedureModifier) {
      if (procedureModifier.includes('Grade 1')) {
        key += '_grade1';
      } else if (procedureModifier.includes('Grade 2')) {
        key += '_grade2';
      } else if (procedureModifier.includes('Grade 3')) {
        key += '_grade3';
      }
    }

    return key;
  };

  // Determine phase based on weeks since surgery
  const determinePhase = (): number => {
    if (!weeksSinceSurgery) return 1;

    // Conservative phase mapping based on time
    if (weeksSinceSurgery === '0-2 weeks') return 1;
    if (weeksSinceSurgery === '2-6 weeks') return 2;
    if (weeksSinceSurgery === '6-12 weeks') return 3;
    if (weeksSinceSurgery === '12+ weeks') return 4;

    return 1;
  };

  // Apply safety gates for phase progression
  const getSafePhase = (): number => {
    let phase = determinePhase();

    // Safety gate: high pain keeps user at earlier phase
    if (assessmentData.painLevel && assessmentData.painLevel >= 7) {
      phase = Math.min(phase, 1);
    }

    // Safety gate: swelling or severe symptoms
    const severeSymptoms = ['Swelling', 'Numbness or tingling', 'Muscle weakness'];
    const hasSevereSymptoms = assessmentData.additionalSymptoms?.some(s => severeSymptoms.includes(s));
    if (hasSevereSymptoms && phase > 2) {
      phase = 2;
    }

    // Safety gate: NWB status limits functional progression
    if (weightBearingStatus === 'Non-weight-bearing (NWB)' && phase > 2) {
      phase = 2;
    }

    return phase;
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
    const currentStepName = stepConfig[currentStep - 1];
    const selectedSurgery = surgeryTypesByRegion[postOpRegion]?.find(s => s.key === surgeryType);

    switch (currentStepName) {
      case 'painLevel':
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

      case 'painLocation':
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

      case 'surgeryStatus':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Surgery Status</Text>
            <Text style={styles.stepDescription}>
              Have you had surgery related to your current symptoms?
            </Text>

            <View style={styles.durationContainer}>
              {[
                { value: 'no_surgery', label: 'No surgery / not post-op' },
                { value: 'post_op', label: 'Post-op (I had surgery)' },
                { value: 'not_sure', label: "I'm not sure" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.durationButton,
                    surgeryStatus === option.value && styles.durationButtonSelected,
                  ]}
                  onPress={() => {
                    setSurgeryStatus(option.value as any);
                    // Reset post-op fields if not post-op
                    if (option.value !== 'post_op') {
                      setPostOpRegion('');
                      setSurgeryType('');
                      setProcedureModifier('');
                      setWeeksSinceSurgery('');
                      setWeightBearingStatus('');
                      setSurgeonPrecautions('');
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      surgeryStatus === option.value && styles.durationButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {surgeryStatus === 'not_sure' && (
              <View style={styles.redFlagNote}>
                <Info size={16} color="#F59E0B" />
                <Text style={styles.redFlagNoteText}>
                  If you're unsure about your surgical history, we recommend consulting with your healthcare provider.
                </Text>
              </View>
            )}
          </View>
        );

      case 'postOpRegion':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Surgery Body Region</Text>
            <Text style={styles.stepDescription}>
              Which body region was your surgery on?
            </Text>

            <View style={styles.locationGrid}>
              {['Shoulder', 'Knee', 'Hip', 'Elbow', 'Foot/Ankle'].map((region) => (
                <TouchableOpacity
                  key={region}
                  style={[
                    styles.locationButton,
                    postOpRegion === region && styles.locationButtonSelected,
                  ]}
                  onPress={() => {
                    setPostOpRegion(region);
                    setSurgeryType(''); // Reset surgery type when region changes
                    setProcedureModifier('');
                  }}
                >
                  <Text
                    style={[
                      styles.locationButtonText,
                      postOpRegion === region && styles.locationButtonTextSelected,
                    ]}
                  >
                    {region}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'surgeryType':
        const surgeryOptions = surgeryTypesByRegion[postOpRegion] || [];
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Surgery Type</Text>
            <Text style={styles.stepDescription}>
              What type of surgery did you have?
            </Text>

            <View style={styles.durationContainer}>
              {surgeryOptions.map((surgery) => (
                <TouchableOpacity
                  key={surgery.key}
                  style={[
                    styles.durationButton,
                    surgeryType === surgery.key && styles.durationButtonSelected,
                  ]}
                  onPress={() => {
                    setSurgeryType(surgery.key);
                    setProcedureModifier(''); // Reset modifier when surgery changes
                  }}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      surgeryType === surgery.key && styles.durationButtonTextSelected,
                    ]}
                  >
                    {surgery.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'procedureModifier':
        const modifiers = selectedSurgery?.modifiers || [];
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Procedure Details</Text>
            <Text style={styles.stepDescription}>
              Please specify the grade or type of your {selectedSurgery?.label}:
            </Text>

            <View style={styles.durationContainer}>
              {modifiers.map((modifier) => (
                <TouchableOpacity
                  key={modifier}
                  style={[
                    styles.durationButton,
                    procedureModifier === modifier && styles.durationButtonSelected,
                  ]}
                  onPress={() => setProcedureModifier(modifier)}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      procedureModifier === modifier && styles.durationButtonTextSelected,
                    ]}
                  >
                    {modifier}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'weeksSinceSurgery':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Time Since Surgery</Text>
            <Text style={styles.stepDescription}>
              How long ago was your surgery?
            </Text>

            <View style={styles.durationContainer}>
              {weeksSinceSurgeryOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.durationButton,
                    weeksSinceSurgery === option && styles.durationButtonSelected,
                  ]}
                  onPress={() => setWeeksSinceSurgery(option)}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      weeksSinceSurgery === option && styles.durationButtonTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'weightBearing':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Weight-Bearing Status</Text>
            <Text style={styles.stepDescription}>
              What is your current weight-bearing status as instructed by your surgeon?
            </Text>

            <View style={styles.durationContainer}>
              {weightBearingOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.durationButton,
                    weightBearingStatus === option && styles.durationButtonSelected,
                  ]}
                  onPress={() => setWeightBearingStatus(option)}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      weightBearingStatus === option && styles.durationButtonTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'surgeonPrecautions':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Surgeon Restrictions</Text>
            <Text style={styles.stepDescription}>
              Has your surgeon given you specific movement restrictions or precautions?
            </Text>

            <View style={styles.durationContainer}>
              {[
                { value: 'yes', label: 'Yes, I have restrictions' },
                { value: 'no', label: 'No restrictions that I know of' },
                { value: 'not_sure', label: 'Not sure' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.durationButton,
                    surgeonPrecautions === option.value && styles.durationButtonSelected,
                  ]}
                  onPress={() => setSurgeonPrecautions(option.value as any)}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      surgeonPrecautions === option.value && styles.durationButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {surgeonPrecautions === 'yes' && (
              <View style={styles.redFlagNote}>
                <Shield size={16} color="#F59E0B" />
                <Text style={styles.redFlagNoteText}>
                  Please follow your surgeon's specific instructions. Our recommendations will be conservative to respect your recovery.
                </Text>
              </View>
            )}
          </View>
        );

      case 'painDuration':
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

      case 'painType':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Pain Type</Text>
            <Text style={styles.stepDescription}>
              How would you describe your pain? (Select all that apply)
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
                    assessmentData.painType?.includes(type) && styles.painTypeButtonSelected,
                  ]}
                  onPress={() => {
                    const currentTypes = assessmentData.painType ? assessmentData.painType.split(', ') : [];
                    if (currentTypes.includes(type)) {
                      const newTypes = currentTypes.filter(t => t !== type);
                      updateAssessmentData('painType', newTypes.join(', '));
                    } else {
                      updateAssessmentData('painType', [...currentTypes, type].join(', '));
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.painTypeButtonText,
                      assessmentData.painType?.includes(type) && styles.painTypeButtonTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'mechanism':
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

      case 'additionalSymptoms':
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

      case 'redFlags':
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

      case 'consent':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Consent & Agreement</Text>
            <Text style={styles.stepDescription}>
              Please review and accept the following before submitting your assessment:
            </Text>

            {/* Phone Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number (required)</Text>
              <View style={styles.phoneInputContainer}>
                <Phone size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.phoneInput}
                  value={userPhone}
                  onChangeText={setUserPhone}
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <Text style={styles.inputHelper}>
                We may contact you regarding your assessment results
              </Text>
            </View>

            {/* Consent Checkboxes */}
            <View style={styles.consentSection}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setConsentContact(!consentContact)}
              >
                {consentContact ? (
                  <CheckSquare size={24} color={colors.primary[500]} />
                ) : (
                  <Square size={24} color="#9CA3AF" />
                )}
                <Text style={styles.checkboxText}>
                  I consent to being contacted by PTBot regarding my assessment results and any health concerns identified.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setConsentDataUse(!consentDataUse)}
              >
                {consentDataUse ? (
                  <CheckSquare size={24} color={colors.primary[500]} />
                ) : (
                  <Square size={24} color="#9CA3AF" />
                )}
                <Text style={styles.checkboxText}>
                  I consent to PTBot collecting and using my health information to provide personalized exercise recommendations and improve services.
                </Text>
              </TouchableOpacity>
            </View>

            {/* Legal Waiver */}
            <View style={styles.legalWaiverContainer}>
              <Text style={styles.legalWaiverTitle}>Legal Disclaimer & Waiver</Text>
              <ScrollView style={styles.legalWaiverScroll} nestedScrollEnabled>
                <Text style={styles.legalWaiverText}>
                  By using PTBot, I acknowledge and agree to the following:{'\n\n'}
                  1. <Text style={styles.legalBold}>Not Medical Advice:</Text> PTBot provides educational information and exercise recommendations only. It is NOT a substitute for professional medical advice, diagnosis, or treatment.{'\n\n'}
                  2. <Text style={styles.legalBold}>Consult Healthcare Provider:</Text> I understand I should consult with a qualified healthcare provider before starting any exercise program, especially if I have existing health conditions.{'\n\n'}
                  3. <Text style={styles.legalBold}>Assumption of Risk:</Text> I voluntarily assume all risks associated with using PTBot and performing any recommended exercises. I understand that physical activity carries inherent risks of injury.{'\n\n'}
                  4. <Text style={styles.legalBold}>Release of Liability:</Text> I release PTBot, its creators, affiliates, and Dr. Justin Lemmo from any and all claims, damages, or liability arising from my use of this application or performance of recommended exercises.{'\n\n'}
                  5. <Text style={styles.legalBold}>Emergency Situations:</Text> I understand that if I experience severe symptoms or medical emergencies, I should seek immediate medical attention and not rely on this application.
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setLegalWaiverAccepted(!legalWaiverAccepted)}
              >
                {legalWaiverAccepted ? (
                  <CheckSquare size={24} color={colors.primary[500]} />
                ) : (
                  <Square size={24} color="#9CA3AF" />
                )}
                <Text style={styles.checkboxText}>
                  I have read, understand, and agree to the above disclaimer and waiver. I acknowledge that PTBot is not a replacement for direct medical intervention.
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'baselineFunctionIntro':
        const conditionTagDisplay = mapPainLocationToCondition(assessmentData.painLocation || '');
        const questionnaireLabel = functionQuestionnaire?.display_name || 'Function Assessment';
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Baseline Assessment</Text>
            <Text style={styles.stepDescription}>
              Before we provide your exercise recommendations, we'd like to measure your current function level. This helps us track your progress over time.
            </Text>

            <View style={styles.baselineInfoCard}>
              <Activity size={32} color={colors.primary[500]} />
              <Text style={styles.baselineInfoTitle}>{questionnaireLabel}</Text>
              <Text style={styles.baselineInfoText}>
                {functionItems.length > 0
                  ? `This assessment has ${functionItems.length} questions and takes about 2-3 minutes.`
                  : 'Loading assessment...'}
              </Text>
            </View>

            {isLoadingQuestionnaire && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary[500]} />
                <Text style={styles.loadingText}>Loading questionnaire...</Text>
              </View>
            )}

            <View style={styles.baselineNote}>
              <Info size={16} color={colors.primary[600]} />
              <Text style={styles.baselineNoteText}>
                Your responses help us measure improvement and tailor your exercise program.
              </Text>
            </View>
          </View>
        );

      case 'baselineFunction':
        if (isLoadingQuestionnaire || !functionQuestionnaire || functionItems.length === 0) {
          return (
            <View style={styles.stepContainer}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text style={styles.loadingText}>Loading questionnaire...</Text>
              </View>
            </View>
          );
        }

        const currentFunctionItem = functionItems[currentFunctionItemIndex];
        const currentFunctionValue = currentFunctionItem ? functionResponses.get(currentFunctionItem.id) : undefined;
        const responseType = currentFunctionItem?.response_type || 'likert_0_5';

        // Build response options based on type
        let functionOptions: { value: number; label: string }[] = [];
        if (responseType === 'likert_0_5') {
          functionOptions = [
            { value: 0, label: '0 - No difficulty / No pain' },
            { value: 1, label: '1 - Mild' },
            { value: 2, label: '2 - Moderate' },
            { value: 3, label: '3 - Fairly severe' },
            { value: 4, label: '4 - Very severe' },
            { value: 5, label: '5 - Unable / Maximum' },
          ];
        } else if (responseType === 'likert_0_4') {
          functionOptions = [
            { value: 0, label: '0 - None' },
            { value: 1, label: '1 - Mild' },
            { value: 2, label: '2 - Moderate' },
            { value: 3, label: '3 - Severe' },
            { value: 4, label: '4 - Extreme' },
          ];
        } else if (responseType === 'likert_1_5') {
          functionOptions = [
            { value: 1, label: '1 - No difficulty' },
            { value: 2, label: '2 - Mild difficulty' },
            { value: 3, label: '3 - Moderate difficulty' },
            { value: 4, label: '4 - Severe difficulty' },
            { value: 5, label: '5 - Unable' },
          ];
        }

        return (
          <View style={styles.stepContainer}>
            <View style={styles.questionnaireHeader}>
              <Text style={styles.questionnaireTitle}>{functionQuestionnaire.display_name}</Text>
              <Text style={styles.questionnaireProgress}>
                Question {currentFunctionItemIndex + 1} of {functionItems.length}
              </Text>
            </View>

            <View style={styles.questionCard}>
              <Text style={styles.questionText}>
                {currentFunctionItem?.prompt_text || `Question ${currentFunctionItem?.item_key}`}
              </Text>
              {currentFunctionItem?.prompt_text?.includes('PLACEHOLDER') && (
                <View style={styles.placeholderNote}>
                  <AlertTriangle size={14} color="#F59E0B" />
                  <Text style={styles.placeholderNoteText}>
                    Licensed questionnaire text to be added
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.functionOptionsContainer}>
              {functionOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.functionOption,
                    currentFunctionValue === option.value && styles.functionOptionSelected,
                  ]}
                  onPress={() => {
                    if (currentFunctionItem) {
                      setFunctionResponses(prev => {
                        const newMap = new Map(prev);
                        newMap.set(currentFunctionItem.id, option.value);
                        return newMap;
                      });
                    }
                  }}
                >
                  <View style={styles.functionOptionRadio}>
                    {currentFunctionValue === option.value && (
                      <View style={styles.functionOptionRadioInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.functionOptionLabel,
                      currentFunctionValue === option.value && styles.functionOptionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mini navigation for questionnaire items */}
            <View style={styles.questionnaireNav}>
              {currentFunctionItemIndex > 0 && (
                <TouchableOpacity
                  style={styles.questionnaireNavButton}
                  onPress={() => setCurrentFunctionItemIndex(prev => prev - 1)}
                >
                  <Text style={styles.questionnaireNavText}>Previous</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              {currentFunctionItemIndex < functionItems.length - 1 && currentFunctionValue !== undefined && (
                <TouchableOpacity
                  style={[styles.questionnaireNavButton, styles.questionnaireNavButtonPrimary]}
                  onPress={() => setCurrentFunctionItemIndex(prev => prev + 1)}
                >
                  <Text style={styles.questionnaireNavTextPrimary}>Next Question</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      case 'baselinePain':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Pain Level Assessment</Text>
            <Text style={styles.stepDescription}>
              Rate your current pain level on a scale of 0 to 10:
            </Text>

            <View style={styles.nprsFullContainer}>
              <View style={styles.nprsLabelsRow}>
                <Text style={styles.nprsLabelText}>No Pain</Text>
                <Text style={styles.nprsLabelText}>Worst Possible</Text>
              </View>
              <View style={styles.nprsButtonsRow}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.nprsScaleButton,
                      baselinePainScore === value && styles.nprsScaleButtonSelected,
                      value <= 3 && styles.nprsScaleButtonGreen,
                      value > 3 && value <= 6 && styles.nprsScaleButtonYellow,
                      value > 6 && styles.nprsScaleButtonRed,
                    ]}
                    onPress={() => setBaselinePainScore(value)}
                  >
                    <Text
                      style={[
                        styles.nprsScaleButtonText,
                        baselinePainScore === value && styles.nprsScaleButtonTextSelected,
                      ]}
                    >
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {baselinePainScore !== null && (
              <View style={styles.painInterpretation}>
                <Text style={styles.painInterpretationText}>
                  {baselinePainScore === 0 ? 'No pain' :
                   baselinePainScore <= 3 ? 'Mild pain' :
                   baselinePainScore <= 6 ? 'Moderate pain' :
                   baselinePainScore <= 9 ? 'Severe pain' : 'Worst possible pain'}
                </Text>
              </View>
            )}
          </View>
        );

      // Follow-up mode steps
      case 'followUpIntro':
        const followUpQuestionnaireLabel = functionQuestionnaire?.display_name || 'Progress Check';
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Progress Check-in</Text>
            <Text style={styles.stepDescription}>
              Let's see how you're doing since your last assessment. This helps us track your improvement.
            </Text>

            <View style={styles.baselineInfoCard}>
              <Activity size={32} color={colors.primary[500]} />
              <Text style={styles.baselineInfoTitle}>{followUpQuestionnaireLabel}</Text>
              <Text style={styles.baselineInfoText}>
                {functionItems.length > 0
                  ? `Answer ${functionItems.length} questions to measure your current function.`
                  : 'Loading assessment...'}
              </Text>
            </View>

            {isLoadingQuestionnaire && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary[500]} />
                <Text style={styles.loadingText}>Loading questionnaire...</Text>
              </View>
            )}

            <View style={styles.baselineNote}>
              <Info size={16} color={colors.primary[600]} />
              <Text style={styles.baselineNoteText}>
                We'll compare your results with your baseline to show your progress.
              </Text>
            </View>
          </View>
        );

      case 'followUpFunction':
        if (isLoadingQuestionnaire || !functionQuestionnaire || functionItems.length === 0) {
          return (
            <View style={styles.stepContainer}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text style={styles.loadingText}>Loading questionnaire...</Text>
              </View>
            </View>
          );
        }

        const followUpCurrentItem = functionItems[currentFunctionItemIndex];
        const followUpCurrentValue = followUpCurrentItem ? functionResponses.get(followUpCurrentItem.id) : undefined;
        const followUpResponseType = followUpCurrentItem?.response_type || 'likert_0_5';

        let followUpOptions: { value: number; label: string }[] = [];
        if (followUpResponseType === 'likert_0_5') {
          followUpOptions = [
            { value: 0, label: '0 - No difficulty / No pain' },
            { value: 1, label: '1 - Mild' },
            { value: 2, label: '2 - Moderate' },
            { value: 3, label: '3 - Fairly severe' },
            { value: 4, label: '4 - Very severe' },
            { value: 5, label: '5 - Unable / Maximum' },
          ];
        } else if (followUpResponseType === 'likert_0_4') {
          followUpOptions = [
            { value: 0, label: '0 - None' },
            { value: 1, label: '1 - Mild' },
            { value: 2, label: '2 - Moderate' },
            { value: 3, label: '3 - Severe' },
            { value: 4, label: '4 - Extreme' },
          ];
        } else if (followUpResponseType === 'likert_1_5') {
          followUpOptions = [
            { value: 1, label: '1 - No difficulty' },
            { value: 2, label: '2 - Mild difficulty' },
            { value: 3, label: '3 - Moderate difficulty' },
            { value: 4, label: '4 - Severe difficulty' },
            { value: 5, label: '5 - Unable' },
          ];
        }

        return (
          <View style={styles.stepContainer}>
            <View style={styles.questionnaireHeader}>
              <Text style={styles.questionnaireTitle}>{functionQuestionnaire.display_name}</Text>
              <Text style={styles.questionnaireProgress}>
                Question {currentFunctionItemIndex + 1} of {functionItems.length}
              </Text>
            </View>

            <View style={styles.questionCard}>
              <Text style={styles.questionText}>
                {followUpCurrentItem?.prompt_text || `Question ${followUpCurrentItem?.item_key}`}
              </Text>
              {followUpCurrentItem?.prompt_text?.includes('PLACEHOLDER') && (
                <View style={styles.placeholderNote}>
                  <AlertTriangle size={14} color="#F59E0B" />
                  <Text style={styles.placeholderNoteText}>
                    Licensed questionnaire text to be added
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.functionOptionsContainer}>
              {followUpOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.functionOption,
                    followUpCurrentValue === option.value && styles.functionOptionSelected,
                  ]}
                  onPress={() => {
                    if (followUpCurrentItem) {
                      setFunctionResponses(prev => {
                        const newMap = new Map(prev);
                        newMap.set(followUpCurrentItem.id, option.value);
                        return newMap;
                      });
                    }
                  }}
                >
                  <View style={styles.functionOptionRadio}>
                    {followUpCurrentValue === option.value && (
                      <View style={styles.functionOptionRadioInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.functionOptionLabel,
                      followUpCurrentValue === option.value && styles.functionOptionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.questionnaireNav}>
              {currentFunctionItemIndex > 0 && (
                <TouchableOpacity
                  style={styles.questionnaireNavButton}
                  onPress={() => setCurrentFunctionItemIndex(prev => prev - 1)}
                >
                  <Text style={styles.questionnaireNavText}>Previous</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              {currentFunctionItemIndex < functionItems.length - 1 && followUpCurrentValue !== undefined && (
                <TouchableOpacity
                  style={[styles.questionnaireNavButton, styles.questionnaireNavButtonPrimary]}
                  onPress={() => setCurrentFunctionItemIndex(prev => prev + 1)}
                >
                  <Text style={styles.questionnaireNavTextPrimary}>Next Question</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      case 'followUpPain':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Current Pain Level</Text>
            <Text style={styles.stepDescription}>
              How is your pain right now, on a scale of 0 to 10?
            </Text>

            <View style={styles.nprsFullContainer}>
              <View style={styles.nprsLabelsRow}>
                <Text style={styles.nprsLabelText}>No Pain</Text>
                <Text style={styles.nprsLabelText}>Worst Possible</Text>
              </View>
              <View style={styles.nprsButtonsRow}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.nprsScaleButton,
                      baselinePainScore === value && styles.nprsScaleButtonSelected,
                      value <= 3 && styles.nprsScaleButtonGreen,
                      value > 3 && value <= 6 && styles.nprsScaleButtonYellow,
                      value > 6 && styles.nprsScaleButtonRed,
                    ]}
                    onPress={() => setBaselinePainScore(value)}
                  >
                    <Text
                      style={[
                        styles.nprsScaleButtonText,
                        baselinePainScore === value && styles.nprsScaleButtonTextSelected,
                      ]}
                    >
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {baselinePainScore !== null && (
              <View style={styles.painInterpretation}>
                <Text style={styles.painInterpretationText}>
                  {baselinePainScore === 0 ? 'No pain' :
                   baselinePainScore <= 3 ? 'Mild pain' :
                   baselinePainScore <= 6 ? 'Moderate pain' :
                   baselinePainScore <= 9 ? 'Severe pain' : 'Worst possible pain'}
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const formatDosage = (rec: ExerciseRecommendation): string => {
    const { dosage } = rec;
    const parts: string[] = [];

    if (dosage.sets) parts.push(`${dosage.sets} sets`);
    if (dosage.reps) parts.push(`${dosage.reps} reps`);
    if (dosage.duration) parts.push(dosage.duration);
    if (dosage.holdTime) parts.push(`Hold: ${dosage.holdTime}`);

    return parts.join(' x ') + ` | ${dosage.frequency}`;
  };

  const renderExerciseCard = (rec: ExerciseRecommendation, index: number) => {
    const expanded = expandedExercises.has(rec.exercise.id);

    return (
      <View key={rec.exercise.id} style={styles.exerciseCard}>
        <TouchableOpacity onPress={() => toggleExerciseExpanded(rec.exercise.id)} activeOpacity={0.8}>
          <View style={styles.exerciseHeader}>
            <View style={styles.exerciseNumberBadge}>
              <Text style={styles.exerciseNumber}>{index + 1}</Text>
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{rec.exercise.name}</Text>
              <View style={styles.exerciseMeta}>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{rec.exercise.difficulty}</Text>
                </View>
                <Text style={styles.categoryText}>{rec.exercise.category}</Text>
              </View>
            </View>
            <ArrowRight
              size={20}
              color={colors.neutral[400]}
              style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
            />
          </View>

          {/* Dosage - always visible */}
          <View style={styles.dosageContainer}>
            <Dumbbell size={14} color={colors.primary[500]} />
            <Text style={styles.dosageText}>{formatDosage(rec)}</Text>
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.exerciseDetails}>
            {/* Description */}
            <Text style={styles.exerciseDescription}>{rec.exercise.description}</Text>

            {/* Rationale */}
            <View style={styles.rationaleContainer}>
              <Target size={14} color="#10B981" />
              <Text style={styles.rationaleText}>{rec.reasoning}</Text>
            </View>

            {/* Safety Notes */}
            {rec.safetyNotes.length > 0 && (
              <View style={styles.safetyContainer}>
                <Text style={styles.sectionLabel}>Safety Notes:</Text>
                {rec.safetyNotes.map((note, i) => (
                  <View key={i} style={styles.safetyItem}>
                    <Info size={12} color="#F59E0B" />
                    <Text style={styles.safetyText}>{note}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Red Flag Warnings */}
            {rec.redFlagWarnings.length > 0 && (
              <View style={styles.redFlagContainer}>
                <Text style={styles.sectionLabel}>Stop If:</Text>
                {rec.redFlagWarnings.map((warning, i) => (
                  <View key={i} style={styles.redFlagItem}>
                    <AlertTriangle size={12} color="#EF4444" />
                    <Text style={styles.redFlagText}>{warning}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Progression Tips */}
            {rec.progressionTips.length > 0 && (
              <View style={styles.tipsContainer}>
                <Text style={styles.sectionLabel}>Progression Tips:</Text>
                {rec.progressionTips.map((tip, i) => (
                  <Text key={i} style={styles.tipText}>• {tip}</Text>
                ))}
              </View>
            )}

            {/* Watch Video Button */}
            {rec.exercise.videoUrl ? (
              <TouchableOpacity
                style={styles.watchVideoButton}
                onPress={() => openExerciseVideo(rec.exercise.videoUrl!, rec.exercise.name)}
              >
                <Play size={16} color="#FFFFFF" />
                <Text style={styles.watchVideoText}>Watch Exercise Video</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.noVideoContainer}>
                <Text style={styles.noVideoText}>Video coming soon</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
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

        {/* Exercise Recommendations - Displayed Inline */}
        {assessmentResult.recommendations.length > 0 && (
          <View style={styles.exercisesSection}>
            <Text style={styles.exercisesSectionTitle}>
              Your Personalized Exercises
            </Text>
            <Text style={styles.exercisesSectionSubtitle}>
              {assessmentResult.recommendations.length} exercises matched for your {assessmentData.painLocation?.toLowerCase()} pain
            </Text>

            {assessmentResult.recommendations.map((rec, index) => renderExerciseCard(rec, index))}

            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>
                These exercises are educational recommendations, not medical advice.
                Consult with a healthcare provider before starting any exercise program,
                especially if you have significant pain or medical conditions.
              </Text>
            </View>
          </View>
        )}

        {/* No Recommendations (Critical Risk) */}
        {assessmentResult.recommendations.length === 0 && assessmentResult.riskLevel === 'critical' && (
          <View style={styles.criticalWarningCard}>
            <AlertTriangle size={24} color="#DC2626" />
            <Text style={styles.criticalWarningTitle}>Exercise Not Recommended</Text>
            <Text style={styles.criticalWarningText}>
              Due to your symptoms, we recommend seeking immediate medical evaluation
              before starting any exercise program.
            </Text>
          </View>
        )}

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
    const stepName = stepConfig[currentStep - 1];
    const selectedSurgery = surgeryTypesByRegion[postOpRegion]?.find(s => s.key === surgeryType);

    switch (stepName) {
      case 'painLevel':
        return assessmentData.painLevel !== undefined && assessmentData.painLevel > 0;
      case 'painLocation':
        return !!assessmentData.painLocation;
      case 'surgeryStatus':
        return !!surgeryStatus;
      case 'postOpRegion':
        return !!postOpRegion;
      case 'surgeryType':
        return !!surgeryType;
      case 'procedureModifier':
        return !!procedureModifier || !selectedSurgery?.hasModifier;
      case 'weeksSinceSurgery':
        return !!weeksSinceSurgery;
      case 'weightBearing':
        return !!weightBearingStatus;
      case 'surgeonPrecautions':
        return !!surgeonPrecautions;
      case 'painDuration':
        return !!assessmentData.painDuration;
      case 'painType':
        return !!assessmentData.painType;
      case 'mechanism':
        return !!assessmentData.mechanismOfInjury?.trim();
      case 'additionalSymptoms':
        return true; // Additional symptoms are optional
      case 'redFlags':
        return true; // Red flags are optional but important
      case 'consent':
        return userPhone.trim().length >= 10 && consentContact && consentDataUse && legalWaiverAccepted;
      case 'baselineFunctionIntro':
        return !isLoadingQuestionnaire && functionItems.length > 0;
      case 'baselineFunction':
        // Can proceed when all function items have responses and we're on the last item
        const allFunctionAnswered = functionItems.every(item => functionResponses.has(item.id));
        const onLastFunctionItem = currentFunctionItemIndex === functionItems.length - 1;
        const currentItemAnswered = functionItems[currentFunctionItemIndex]
          ? functionResponses.has(functionItems[currentFunctionItemIndex].id)
          : false;
        return allFunctionAnswered && onLastFunctionItem && currentItemAnswered;
      case 'baselinePain':
        return baselinePainScore !== null;
      // Follow-up mode steps
      case 'followUpIntro':
        return !isLoadingQuestionnaire && functionItems.length > 0;
      case 'followUpFunction':
        const allFollowUpAnswered = functionItems.every(item => functionResponses.has(item.id));
        const onLastFollowUpItem = currentFunctionItemIndex === functionItems.length - 1;
        const currentFollowUpItemAnswered = functionItems[currentFunctionItemIndex]
          ? functionResponses.has(functionItems[currentFunctionItemIndex].id)
          : false;
        return allFollowUpAnswered && onLastFollowUpItem && currentFollowUpItemAnswered;
      case 'followUpPain':
        return baselinePainScore !== null;
      default:
        return false;
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show login required screen if not logged in
  if (!user) {
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

        <View style={styles.loginRequiredContainer}>
          <LogIn size={64} color={colors.primary[500]} />
          <Text style={styles.loginRequiredTitle}>Sign In Required</Text>
          <Text style={styles.loginRequiredText}>
            To take an assessment and receive personalized exercise recommendations, please sign in or create an account first.
          </Text>
          <Text style={styles.loginRequiredSubtext}>
            We need your contact information to follow up on your assessment results and ensure your safety.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/account')}
          >
            <LogIn size={20} color="#FFFFFF" />
            <Text style={styles.loginButtonText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>
            {isFollowUpMode ? 'Progress Check-in' : 'Symptom Assessment'}
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {isFollowUpMode ? 'Track your improvement over time' : 'Help us understand your condition'}
        </Text>
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
              onPress={isFollowUpMode ? processFollowUp : processAssessment}
              disabled={!canProceed() || isProcessing}
            >
              <Heart size={16} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {isProcessing
                  ? 'Saving...'
                  : isFollowUpMode
                    ? 'Save Progress'
                    : 'Complete Assessment'}
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
    backgroundColor: colors.primary[500],
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
    backgroundColor: colors.primary[600],
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
    color: colors.primary[200],
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
    backgroundColor: colors.primary[500],
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
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
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
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
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
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
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
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
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
    backgroundColor: colors.primary[500],
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
    color: colors.primary[500],
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
  // Exercise Card Styles
  exercisesSection: {
    marginTop: 8,
  },
  exercisesSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  exercisesSectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  dosageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  dosageText: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '500',
  },
  exerciseDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  rationaleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  rationaleText: {
    fontSize: 13,
    color: '#065F46',
    flex: 1,
  },
  safetyContainer: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 6,
  },
  safetyText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
  },
  redFlagContainer: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  redFlagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 6,
  },
  redFlagText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
    lineHeight: 16,
  },
  tipsContainer: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  disclaimerBox: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  criticalWarningCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#DC2626',
    alignItems: 'center',
  },
  criticalWarningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 12,
    marginBottom: 8,
  },
  criticalWarningText: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
    lineHeight: 20,
  },
  watchVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  watchVideoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noVideoContainer: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  noVideoText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Loading and Login Required styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  loginRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginRequiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 12,
  },
  loginRequiredText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  loginRequiredSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Consent step styles
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputHelper: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  consentSection: {
    marginBottom: 20,
    gap: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  legalWaiverContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legalWaiverTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  legalWaiverScroll: {
    maxHeight: 200,
    marginBottom: 16,
  },
  legalWaiverText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
  },
  legalBold: {
    fontWeight: '600',
  },
  // Baseline questionnaire styles
  baselineInfoCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  baselineInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary[700],
    marginTop: 12,
    marginBottom: 8,
  },
  baselineInfoText: {
    fontSize: 14,
    color: colors.primary[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  baselineNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  baselineNoteText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  questionnaireHeader: {
    marginBottom: 16,
  },
  questionnaireTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  questionnaireProgress: {
    fontSize: 13,
    color: colors.primary[600],
  },
  questionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray[900],
    lineHeight: 24,
  },
  placeholderNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    gap: 6,
  },
  placeholderNoteText: {
    fontSize: 11,
    color: '#92400E',
  },
  functionOptionsContainer: {
    gap: 10,
  },
  functionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  functionOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  functionOptionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray[400],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  functionOptionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
  },
  functionOptionLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[700],
  },
  functionOptionLabelSelected: {
    color: colors.primary[700],
    fontWeight: '500',
  },
  questionnaireNav: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  questionnaireNavButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  questionnaireNavButtonPrimary: {
    backgroundColor: colors.primary[500],
  },
  questionnaireNavText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  },
  questionnaireNavTextPrimary: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
  },
  // NPRS full scale styles
  nprsFullContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  nprsLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nprsLabelText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
  },
  nprsButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nprsScaleButton: {
    width: 28,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
  nprsScaleButtonGreen: {
    backgroundColor: colors.green[100],
  },
  nprsScaleButtonYellow: {
    backgroundColor: colors.amber[100],
  },
  nprsScaleButtonRed: {
    backgroundColor: colors.red[100],
  },
  nprsScaleButtonSelected: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  nprsScaleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  nprsScaleButtonTextSelected: {
    color: colors.primary[700],
  },
  painInterpretation: {
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  painInterpretationText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
});