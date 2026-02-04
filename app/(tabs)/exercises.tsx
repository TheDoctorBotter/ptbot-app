import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
  ActivityIndicator,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Youtube, ExternalLink, MapPin, Clock, Star, Play, CircleCheck as CheckCircle, Heart, Dumbbell, Search, Sparkles, Target, Share2, FileText, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { useAssessmentResults } from '@/hooks/useAssessmentResults';
import { ExerciseRecommendationService } from '@/services/exerciseRecommendationService';
import type { ExerciseRecommendation } from '@/services/assessmentService';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/theme';
import { activityService } from '@/services/activityService';
import { protocolExerciseService, type ProtocolPhaseInfo, type ProtocolExercise } from '@/services/protocolExerciseService';
import { sharePlanService, type PlanExercise } from '@/services/sharePlanService';
import { useClinicBranding } from '@/hooks/useClinicBranding';
import PrecautionsCard from '@/components/shared/PrecautionsCard';

interface Exercise {
  id: string;
  title: string;
  bodyPart: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  url: string;
  completed?: boolean;
}

// Preview exercises - these will be replaced by real YouTube data when APIs are configured
const previewExercises: Exercise[] = [
  {
    id: 'preview-1',
    title: 'Lower Back Pain Relief Stretches',
    bodyPart: 'Lower Back',
    duration: '10 min',
    difficulty: 'Beginner',
    description: 'Gentle stretches to relieve lower back tension and improve mobility. Perfect for morning stiffness or after sitting.',
    url: 'https://youtube.com/@justinlemmodpt',
  },
  {
    id: 'preview-2',
    title: 'Neck and Shoulder Tension Release',
    bodyPart: 'Neck',
    duration: '8 min',
    difficulty: 'Beginner',
    description: 'Simple exercises to reduce neck stiffness and shoulder tension from desk work.',
    url: 'https://youtube.com/@justinlemmodpt',
  },
  {
    id: 'preview-3',
    title: 'Hip Flexor Stretches for Tight Hips',
    bodyPart: 'Hip',
    duration: '12 min',
    difficulty: 'Beginner',
    description: 'Essential stretches for hip flexor tightness from prolonged sitting.',
    url: 'https://youtube.com/@justinlemmodpt',
  },
  {
    id: 'preview-4',
    title: 'Shoulder Strengthening for Rotator Cuff',
    bodyPart: 'Shoulder',
    duration: '15 min',
    difficulty: 'Intermediate',
    description: 'Build shoulder strength and stability with these targeted rotator cuff exercises.',
    url: 'https://youtube.com/@justinlemmodpt',
  },
  {
    id: 'preview-5',
    title: 'Knee Pain Relief and Strengthening',
    bodyPart: 'Knee',
    duration: '12 min',
    difficulty: 'Beginner',
    description: 'Safe exercises to strengthen the knee and surrounding muscles for better support.',
    url: 'https://youtube.com/@justinlemmodpt',
  },
  {
    id: 'preview-6',
    title: 'Sciatica Relief Exercises',
    bodyPart: 'Lower Back',
    duration: '14 min',
    difficulty: 'Beginner',
    description: 'Specific exercises to relieve sciatic nerve pain and improve mobility.',
    url: 'https://youtube.com/@justinlemmodpt',
  },
  {
    id: 'preview-7',
    title: 'Upper Back and Posture Correction',
    bodyPart: 'Upper Back',
    duration: '10 min',
    difficulty: 'Intermediate',
    description: 'Strengthen your upper back and improve posture with these targeted exercises.',
    url: 'https://youtube.com/@justinlemmodpt',
  },
  {
    id: 'preview-8',
    title: 'Ankle Mobility and Strengthening',
    bodyPart: 'Ankle',
    duration: '8 min',
    difficulty: 'Beginner',
    description: 'Improve ankle flexibility and strength for better balance and injury prevention.',
    url: 'https://youtube.com/@justinlemmodpt',
  },
];

export default function ExercisesScreen() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>(previewExercises);
  const [databaseExercises, setDatabaseExercises] = useState<Exercise[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<Exercise[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteExercises, setFavoriteExercises] = useState<Exercise[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { latestAssessment, isLoading: assessmentLoading, refreshAssessment } = useAssessmentResults();

  // Protocol Mode state
  const [protocolPhaseInfo, setProtocolPhaseInfo] = useState<ProtocolPhaseInfo | null>(null);
  const [protocolExercises, setProtocolExercises] = useState<ProtocolExercise[]>([]);
  const [protocolRoutineName, setProtocolRoutineName] = useState<string | null>(null);
  const [isLoadingProtocol, setIsLoadingProtocol] = useState(false);
  const [showProtocolMode, setShowProtocolMode] = useState(true);

  // Share Plan state
  const [isSharing, setIsSharing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Clinic branding for share
  const { branding } = useClinicBranding();

  const bodyParts = ['All', 'Lower Back', 'Upper Back', 'Neck', 'Shoulder', 'Hip', 'Hamstrings', 'Knee', 'Ankle'];

  // Get current user and load favorites
  useEffect(() => {
    const loadUserAndFavorites = async () => {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        loadFavorites(user.id);
      } else {
        setCurrentUserId(null);
        setFavoriteIds(new Set());
        setFavoriteExercises([]);
      }
    };

    loadUserAndFavorites();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase?.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setCurrentUserId(session.user.id);
          loadFavorites(session.user.id);
        } else {
          setCurrentUserId(null);
          setFavoriteIds(new Set());
          setFavoriteExercises([]);
        }
      }
    ) || { data: { subscription: null } };

    return () => subscription?.unsubscribe();
  }, []);

  // Load user's favorite exercises
  const loadFavorites = async (userId: string) => {
    if (!supabase) return;

    setIsLoadingFavorites(true);
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          exercise_id,
          exercise_videos (*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading favorites:', error);
        return;
      }

      if (data) {
        const ids = new Set(data.map((fav: any) => fav.exercise_id));
        setFavoriteIds(ids);

        const exercises: Exercise[] = data
          .filter((fav: any) => fav.exercise_videos)
          .map((fav: any) => {
            const ex = fav.exercise_videos;
            return {
              id: ex.id,
              title: ex.title,
              bodyPart: ex.body_parts?.[0] || 'General',
              duration: ex.recommended_hold_seconds
                ? `${ex.recommended_hold_seconds}s hold`
                : `${ex.recommended_sets || 2} sets`,
              difficulty: ex.difficulty || 'Beginner',
              description: ex.description || '',
              url: ex.youtube_video_id
                ? `https://www.youtube.com/watch?v=${ex.youtube_video_id}`
                : 'https://youtube.com/@justinlemmodpt',
              completed: false,
            };
          });
        setFavoriteExercises(exercises);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  // Toggle favorite for an exercise
  const toggleFavorite = async (exerciseId: string) => {
    if (!supabase || !currentUserId) {
      Alert.alert('Sign In Required', 'Please sign in to save favorite exercises.');
      return;
    }

    const isFavorite = favoriteIds.has(exerciseId);

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', currentUserId)
          .eq('exercise_id', exerciseId);

        if (error) throw error;

        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(exerciseId);
          return next;
        });
        setFavoriteExercises(prev => prev.filter(ex => ex.id !== exerciseId));
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert({ user_id: currentUserId, exercise_id: exerciseId });

        if (error) throw error;

        setFavoriteIds(prev => new Set(prev).add(exerciseId));

        // Find the exercise and add to favorites list
        const exercise = databaseExercises.find(ex => ex.id === exerciseId) ||
                         aiSearchResults.find(ex => ex.id === exerciseId);
        if (exercise) {
          setFavoriteExercises(prev => [...prev, exercise]);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites. Please try again.');
    }
  };

  // Refresh assessment data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshAssessment();
      loadProtocolExercises();
      if (currentUserId) {
        loadFavorites(currentUserId);
      }
    }, [refreshAssessment, currentUserId])
  );

  // Load protocol exercises
  const loadProtocolExercises = async () => {
    setIsLoadingProtocol(true);
    try {
      const result = await protocolExerciseService.getCurrentUserProtocolExercises();
      setProtocolPhaseInfo(result.phaseInfo);
      setProtocolExercises(result.exercises);
      setProtocolRoutineName(result.routineName);
    } catch (err) {
      console.error('Error loading protocol exercises:', err);
    } finally {
      setIsLoadingProtocol(false);
    }
  };

  // Share Plan functionality
  const handleSharePlan = async () => {
    if (!protocolPhaseInfo || protocolExercises.length === 0) {
      Alert.alert('No Plan to Share', 'Complete an assessment to get a personalized exercise plan to share.');
      return;
    }

    setIsSharing(true);
    try {
      // Build share payload
      const planExercises: PlanExercise[] = protocolExercises.map((ex) => ({
        id: ex.id,
        title: ex.title,
        description: ex.description || undefined,
        youtubeUrl: ex.youtubeVideoId ? `https://www.youtube.com/watch?v=${ex.youtubeVideoId}` : undefined,
        thumbnailUrl: ex.thumbnailUrl || undefined,
        difficulty: ex.difficulty,
        sets: ex.recommendedSets || undefined,
        reps: ex.recommendedReps || undefined,
        holdSeconds: ex.recommendedHoldSeconds || undefined,
      }));

      const payload = sharePlanService.buildSharePayload(
        branding,
        `${protocolPhaseInfo.protocolName} - Phase ${protocolPhaseInfo.phaseNumber}`,
        'protocol',
        protocolPhaseInfo.protocolKey,
        protocolPhaseInfo.phaseNumber,
        protocolPhaseInfo.phaseName,
        protocolPhaseInfo.painLocation,
        null, // patient name - not included for privacy
        planExercises,
        [], // precautions - could be loaded separately
        protocolPhaseInfo.assessmentDate
      );

      const result = await sharePlanService.createShareLink(payload);

      if (result.success && result.shareUrl) {
        // Use native share
        await Share.share({
          message: `Check out my exercise plan: ${result.shareUrl}`,
          url: result.shareUrl,
        });
      } else {
        Alert.alert('Share Failed', result.error || 'Unable to create share link.');
      }
    } catch (err) {
      console.error('Error sharing plan:', err);
      Alert.alert('Error', 'Failed to share plan. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  // Export PDF functionality
  const handleExportPdf = async () => {
    if (!protocolPhaseInfo || protocolExercises.length === 0) {
      Alert.alert('No Plan to Export', 'Complete an assessment to get a personalized exercise plan to export.');
      return;
    }

    setIsExporting(true);
    try {
      // Build share payload for PDF
      const planExercises: PlanExercise[] = protocolExercises.map((ex) => ({
        id: ex.id,
        title: ex.title,
        description: ex.description || undefined,
        youtubeUrl: ex.youtubeVideoId ? `https://www.youtube.com/watch?v=${ex.youtubeVideoId}` : undefined,
        thumbnailUrl: ex.thumbnailUrl || undefined,
        difficulty: ex.difficulty,
        sets: ex.recommendedSets || undefined,
        reps: ex.recommendedReps || undefined,
        holdSeconds: ex.recommendedHoldSeconds || undefined,
      }));

      const payload = sharePlanService.buildSharePayload(
        branding,
        `${protocolPhaseInfo.protocolName} - Phase ${protocolPhaseInfo.phaseNumber}`,
        'protocol',
        protocolPhaseInfo.protocolKey,
        protocolPhaseInfo.phaseNumber,
        protocolPhaseInfo.phaseName,
        protocolPhaseInfo.painLocation,
        null,
        planExercises,
        [],
        protocolPhaseInfo.assessmentDate
      );

      // Generate HTML and open in browser for printing
      const html = sharePlanService.generatePrintHtml(payload);

      // Create a data URL for the HTML
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

      // For now, show an alert with instructions
      // In a full implementation, you'd use a library like expo-print or react-native-html-to-pdf
      Alert.alert(
        'Export PDF',
        'PDF export requires opening the plan in a browser. Would you like to share the plan link instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share Link', onPress: handleSharePlan },
        ]
      );
    } catch (err) {
      console.error('Error exporting PDF:', err);
      Alert.alert('Error', 'Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Share Assessment-Based Recommendations
  const handleShareAssessmentPlan = async () => {
    if (!latestAssessment || latestAssessment.recommendations.length === 0) {
      Alert.alert('No Plan to Share', 'Complete an assessment to get a personalized exercise plan to share.');
      return;
    }

    setIsSharing(true);
    try {
      // Build share payload from assessment recommendations
      const planExercises: PlanExercise[] = latestAssessment.recommendations.map((rec) => ({
        id: rec.exercise.id,
        title: rec.exercise.name,
        description: rec.reasoning || undefined,
        youtubeUrl: rec.exercise.videoUrl || undefined,
        difficulty: rec.exercise.difficulty,
        sets: rec.dosage?.sets,
        reps: rec.dosage?.reps,
        holdSeconds: rec.dosage?.holdTime ? parseInt(rec.dosage.holdTime) || undefined : undefined,
      }));

      const payload = sharePlanService.buildSharePayload(
        branding,
        `Exercise Plan for ${latestAssessment.assessment.painLocation || 'Pain Relief'}`,
        'symptom',
        null,
        null,
        null,
        latestAssessment.assessment.painLocation || null,
        null,
        planExercises,
        [],
        latestAssessment.createdAt || latestAssessment.assessment.timestamp || null
      );

      const result = await sharePlanService.createShareLink(payload);

      if (result.success && result.shareUrl) {
        await Share.share({
          message: `Check out my exercise plan: ${result.shareUrl}`,
          url: result.shareUrl,
        });
      } else {
        Alert.alert('Share Failed', result.error || 'Unable to create share link.');
      }
    } catch (err) {
      console.error('Error sharing assessment plan:', err);
      Alert.alert('Error', 'Failed to share plan. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  // Export Assessment-Based Recommendations as PDF
  const handleExportAssessmentPdf = async () => {
    if (!latestAssessment || latestAssessment.recommendations.length === 0) {
      Alert.alert('No Plan to Export', 'Complete an assessment to get a personalized exercise plan to export.');
      return;
    }

    setIsExporting(true);
    try {
      // Build share payload from assessment recommendations
      const planExercises: PlanExercise[] = latestAssessment.recommendations.map((rec) => ({
        id: rec.exercise.id,
        title: rec.exercise.name,
        description: rec.reasoning || undefined,
        youtubeUrl: rec.exercise.videoUrl || undefined,
        difficulty: rec.exercise.difficulty,
        sets: rec.dosage?.sets,
        reps: rec.dosage?.reps,
        holdSeconds: rec.dosage?.holdTime ? parseInt(rec.dosage.holdTime) || undefined : undefined,
      }));

      const payload = sharePlanService.buildSharePayload(
        branding,
        `Exercise Plan for ${latestAssessment.assessment.painLocation || 'Pain Relief'}`,
        'symptom',
        null,
        null,
        null,
        latestAssessment.assessment.painLocation || null,
        null,
        planExercises,
        [],
        latestAssessment.createdAt || latestAssessment.assessment.timestamp || null
      );

      // For now, offer to share the link instead
      Alert.alert(
        'Export PDF',
        'PDF export requires opening the plan in a browser. Would you like to share the plan link instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share Link', onPress: handleShareAssessmentPlan },
        ]
      );
    } catch (err) {
      console.error('Error exporting assessment PDF:', err);
      Alert.alert('Error', 'Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch exercises from Supabase when body part changes
  useEffect(() => {
    fetchExercisesByBodyPart(selectedBodyPart);
  }, [selectedBodyPart]);

  const fetchExercisesByBodyPart = async (bodyPart: string) => {
    if (!supabase) {
      console.log('Supabase not configured, using preview exercises');
      return;
    }

    setIsLoadingExercises(true);
    try {
      let query = supabase
        .from('exercise_videos')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('id', { ascending: true });

      // Filter by body part if not "All"
      if (bodyPart !== 'All') {
        query = query.contains('body_parts', [bodyPart]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching exercises:', error);
        return;
      }

      if (data && data.length > 0) {
        const mappedExercises: Exercise[] = data.map((ex: any) => ({
          id: ex.id,
          title: ex.title,
          bodyPart: ex.body_parts?.[0] || 'General',
          duration: ex.recommended_hold_seconds
            ? `${ex.recommended_hold_seconds}s hold`
            : `${ex.recommended_sets || 2} sets`,
          difficulty: ex.difficulty || 'Beginner',
          description: ex.description || '',
          url: ex.youtube_video_id
            ? `https://www.youtube.com/watch?v=${ex.youtube_video_id}`
            : 'https://youtube.com/@justinlemmodpt',
          completed: false,
        }));
        setDatabaseExercises(mappedExercises);
      } else {
        setDatabaseExercises([]);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setIsLoadingExercises(false);
    }
  };

  // Use database exercises if available, otherwise fall back to preview exercises
  const exercisesToDisplay = databaseExercises.length > 0 ? databaseExercises : exercises;

  const filteredExercises = exercisesToDisplay.filter(ex => {
    const matchesBodyPart = selectedBodyPart === 'All' ||
      ex.bodyPart.toLowerCase().includes(selectedBodyPart.toLowerCase()) ||
      selectedBodyPart.toLowerCase().includes(ex.bodyPart.toLowerCase());
    const matchesSearch = !searchQuery ||
      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.bodyPart.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesBodyPart && matchesSearch;
  });

  const openYouTubeChannel = () => {
    Linking.openURL('https://youtube.com/@justinlemmodpt').catch(() => {
      Alert.alert('Error', 'Unable to open YouTube channel. Please try again later.');
    });
  };

  const toggleExerciseCompletion = (exerciseId: string) => {
    setExercises(prev => 
      prev.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, completed: !ex.completed }
          : ex
      )
    );
  };

  const bookConsultation = () => {
    const consultationUrl = 'https://www.justinlemmodpt.com';
    
    Linking.canOpenURL(consultationUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(consultationUrl);
        } else {
          throw new Error('URL not supported');
        }
      })
      .then(() => {
        console.log('Successfully opened consultation website');
      })
      .catch((error) => {
        console.error('Failed to open consultation URL:', error);
        Alert.alert(
          'Open Website',
          'Please visit www.justinlemmodpt.com in your browser to book a consultation.',
          [{ text: 'OK' }]
        );
      });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return '#10B981';
      case 'Intermediate': return '#F59E0B';
      case 'Advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const openExerciseVideo = (url?: string, debugInfo?: { id: string; title: string; youtubeVideoId?: string }) => {
    const videoUrl = url || 'https://youtube.com/@justinlemmodpt';

    // Debug logging to trace video mapping issues
    if (debugInfo) {
      console.log('🎬 [VIDEO TAP DEBUG]', {
        exerciseId: debugInfo.id,
        title: debugInfo.title,
        youtubeVideoId: debugInfo.youtubeVideoId || 'N/A',
        fullUrl: videoUrl,
      });
    } else {
      console.log('🎬 [VIDEO TAP]', { url: videoUrl });
    }

    Linking.openURL(videoUrl)
      .then(() => {
        // Log activity event for video opened
        if (debugInfo?.id && debugInfo?.title) {
          activityService.logVideoOpened(debugInfo.id, debugInfo.title);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open video. Please try again later.');
      });
  };

  const openAssessmentExerciseVideo = async (exerciseId: string, exerciseTitle: string, fallbackUrl?: string) => {
    if (!supabase) {
      openExerciseVideo(fallbackUrl, { id: exerciseId, title: exerciseTitle });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('exercise_videos')
        .select('youtube_video_id, title')
        .eq('id', exerciseId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching exercise video:', error);
      }

      const youtubeVideoId = data?.youtube_video_id;
      const resolvedUrl = youtubeVideoId
        ? `https://www.youtube.com/watch?v=${youtubeVideoId}`
        : fallbackUrl;

      if (!resolvedUrl) {
        Alert.alert('Error', 'Video is unavailable for this exercise.');
        return;
      }

      // Debug logging with database-resolved data
      openExerciseVideo(resolvedUrl, {
        id: exerciseId,
        title: data?.title || exerciseTitle,
        youtubeVideoId: youtubeVideoId || undefined,
      });
    } catch (fetchError) {
      console.error('Failed to resolve exercise video URL:', fetchError);
      openExerciseVideo(fallbackUrl, { id: exerciseId, title: exerciseTitle });
    }
  };

  const searchExercises = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search Required', 'Please enter a description of your pain or symptoms.');
      return;
    }

    if (!supabase) {
      Alert.alert('Error', 'Database not configured.');
      return;
    }

    setIsSearching(true);
    setAiSearchResults([]);

    try {
      // Parse search terms from query
      const query = searchQuery.toLowerCase();
      const searchTerms = query.split(/\s+/).filter(term => term.length > 2);

      // Build search conditions for keywords, conditions, and body parts
      const { data, error } = await supabase
        .from('exercise_videos')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        Alert.alert(
          'No Exercises Found',
          'No exercises found in the database. Please try again later.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Score and filter exercises based on search query
      const scoredExercises = data.map((ex: any) => {
        let score = 0;
        const bodyPartsLower = (ex.body_parts || []).map((b: string) => b.toLowerCase());
        const keywordsLower = (ex.keywords || []).map((k: string) => k.toLowerCase());
        const conditionsLower = (ex.conditions || []).map((c: string) => c.toLowerCase());
        const titleLower = ex.title.toLowerCase();
        const descLower = (ex.description || '').toLowerCase();

        // Check for body part matches
        for (const term of searchTerms) {
          if (bodyPartsLower.some((bp: string) => bp.includes(term) || term.includes(bp))) {
            score += 30;
          }
          if (conditionsLower.some((c: string) => c.includes(term))) {
            score += 25;
          }
          if (keywordsLower.some((k: string) => k.includes(term))) {
            score += 20;
          }
          if (titleLower.includes(term)) {
            score += 15;
          }
          if (descLower.includes(term)) {
            score += 10;
          }
        }

        // Check for common symptom keywords
        const symptomMatches = [
          { terms: ['stiff', 'stiffness', 'tight', 'tightness'], keywords: ['stretch', 'mobility', 'flexibility'] },
          { terms: ['pain', 'ache', 'hurt', 'sore'], keywords: ['relief', 'gentle', 'beginner'] },
          { terms: ['weak', 'weakness'], keywords: ['strengthen', 'strengthening', 'stability'] },
          { terms: ['numb', 'tingling', 'nerve'], keywords: ['nerve', 'glide', 'mobility'] },
        ];

        for (const match of symptomMatches) {
          if (match.terms.some(t => query.includes(t))) {
            if (match.keywords.some(k => keywordsLower.some((kw: string) => kw.includes(k)))) {
              score += 15;
            }
          }
        }

        return { exercise: ex, score };
      });

      // Filter exercises with score > 0 and sort by score
      const matches = scoredExercises
        .filter((s: any) => s.score > 0)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 10);

      if (matches.length > 0) {
        const mappedExercises: Exercise[] = matches.map((m: any) => ({
          id: m.exercise.id,
          title: m.exercise.title,
          bodyPart: m.exercise.body_parts?.[0] || 'General',
          duration: m.exercise.recommended_hold_seconds
            ? `${m.exercise.recommended_hold_seconds}s hold`
            : `${m.exercise.recommended_sets || 2} sets`,
          difficulty: m.exercise.difficulty || 'Beginner',
          description: m.exercise.description || '',
          url: m.exercise.youtube_video_id
            ? `https://www.youtube.com/watch?v=${m.exercise.youtube_video_id}`
            : 'https://youtube.com/@justinlemmodpt',
          completed: false,
        }));

        setAiSearchResults(mappedExercises);
      } else {
        Alert.alert(
          'No Matches',
          'No specific exercises found for your description. Try browsing the exercises below or complete a full assessment for personalized recommendations.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Exercise search error:', error);
      Alert.alert(
        'Search Error',
        'Unable to search exercises right now. Please try browsing the exercises below.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSearching(false);
    }
  };

  const hasRecommendations = latestAssessment?.recommendations && latestAssessment.recommendations.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <View style={styles.logoContainer}>
            <Dumbbell size={28} color="#FFFFFF" />
            <Text style={styles.logoText}>PTBOT</Text>
          </View>
          <Text style={styles.headerTitle}>Exercise Library</Text>
        </View>
        <Text style={styles.headerSubtitle}>Guided exercises for your recovery</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Exercise Search */}
        <View style={styles.aiSearchCard}>
          <View style={styles.aiSearchHeader}>
            <Target size={20} color="#0EA5E9" />
            <Text style={styles.aiSearchTitle}>AI Exercise Finder</Text>
          </View>
          <Text style={styles.aiSearchDescription}>
            Describe your pain or symptoms and I'll find the most relevant exercises from Dr. Lemmo's library.
          </Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="e.g., 'I have lower back pain when sitting' or 'neck stiffness in the morning'"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.searchButton, (!searchQuery.trim() || isSearching) && styles.searchButtonDisabled]}
            onPress={searchExercises}
            disabled={!searchQuery.trim() || isSearching}
          >
            <Search size={16} color="#FFFFFF" />
            <Text style={styles.searchButtonText}>
              {isSearching ? 'Searching...' : 'Find My Exercises'}
            </Text>
          </TouchableOpacity>

          {/* AI Search Results */}
          {aiSearchResults.length > 0 && (
            <View style={styles.aiSearchResults}>
              <Text style={styles.aiSearchResultsTitle}>
                Found {aiSearchResults.length} exercises for you:
              </Text>
              {aiSearchResults.map((exercise) => (
                <View key={exercise.id} style={styles.aiSearchResultCard}>
                  <View style={styles.aiSearchResultInfo}>
                    <Text style={styles.aiSearchResultTitle}>{exercise.title}</Text>
                    <Text style={styles.aiSearchResultMeta}>
                      {exercise.bodyPart} • {exercise.difficulty}
                    </Text>
                  </View>
                  <View style={styles.aiSearchResultActions}>
                    <TouchableOpacity
                      style={styles.aiSearchPlayButton}
                      onPress={() => openExerciseVideo(exercise.url, { id: exercise.id, title: exercise.title })}
                    >
                      <Play size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.aiSearchStarButton}
                      onPress={() => toggleFavorite(exercise.id)}
                    >
                      <Star
                        size={14}
                        color="#F59E0B"
                        fill={favoriteIds.has(exercise.id) ? "#F59E0B" : "transparent"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <Text style={styles.aiSearchTip}>
                For more personalized recommendations, complete a full assessment
              </Text>
              <TouchableOpacity
                style={styles.fullAssessmentButton}
                onPress={() => router.push('/assessment')}
              >
                <Target size={14} color={colors.primary[500]} />
                <Text style={styles.fullAssessmentText}>Take Full Assessment</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Protocol Mode Section */}
        {protocolPhaseInfo && showProtocolMode && (
          <View style={styles.protocolModeContainer}>
            <View style={styles.protocolModeHeader}>
              <View style={styles.protocolModeBadge}>
                <Target size={16} color="#FFFFFF" />
                <Text style={styles.protocolModeBadgeText}>Protocol Mode</Text>
              </View>
              <TouchableOpacity
                style={styles.protocolModeClose}
                onPress={() => setShowProtocolMode(false)}
              >
                <Text style={styles.protocolModeCloseText}>Browse All</Text>
                <ChevronRight size={16} color={colors.primary[500]} />
              </TouchableOpacity>
            </View>

            <View style={styles.protocolModeInfo}>
              <Text style={styles.protocolModeName}>{protocolPhaseInfo.protocolName}</Text>
              <Text style={styles.protocolModePhase}>
                Phase {protocolPhaseInfo.phaseNumber}: {protocolPhaseInfo.phaseName}
              </Text>
              {protocolPhaseInfo.phaseDescription && (
                <Text style={styles.protocolModeDescription}>
                  {protocolPhaseInfo.phaseDescription}
                </Text>
              )}
              <Text style={styles.protocolModeWeeks}>
                Weeks {protocolPhaseInfo.weekStart}
                {protocolPhaseInfo.weekEnd ? `-${protocolPhaseInfo.weekEnd}` : '+'}
              </Text>
            </View>

            {/* Precautions Card */}
            <PrecautionsCard
              protocolKey={protocolPhaseInfo.protocolKey}
              phaseNumber={protocolPhaseInfo.phaseNumber}
              compact
            />

            {/* Share/Export Actions */}
            <View style={styles.shareActionsContainer}>
              <TouchableOpacity
                style={styles.shareActionButton}
                onPress={handleSharePlan}
                disabled={isSharing || protocolExercises.length === 0}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Share2 size={16} color="#FFFFFF" />
                    <Text style={styles.shareActionText}>Share Plan</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareActionButton, styles.exportActionButton]}
                onPress={handleExportPdf}
                disabled={isExporting || protocolExercises.length === 0}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={colors.primary[500]} />
                ) : (
                  <>
                    <FileText size={16} color={colors.primary[500]} />
                    <Text style={[styles.shareActionText, styles.exportActionText]}>Export PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Protocol Exercises */}
            {isLoadingProtocol ? (
              <View style={styles.protocolLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text style={styles.protocolLoadingText}>Loading your exercises...</Text>
              </View>
            ) : protocolExercises.length > 0 ? (
              <View style={styles.protocolExercisesList}>
                <Text style={styles.protocolExercisesTitle}>
                  {protocolRoutineName || 'Your Exercises'} ({protocolExercises.length})
                </Text>
                {protocolExercises.map((exercise, index) => (
                  <View key={exercise.id} style={styles.protocolExerciseCard}>
                    <View style={styles.protocolExerciseNumber}>
                      <Text style={styles.protocolExerciseNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.protocolExerciseContent}>
                      <Text style={styles.protocolExerciseTitle}>{exercise.title}</Text>
                      <View style={styles.protocolExerciseMeta}>
                        {exercise.recommendedSets && (
                          <Text style={styles.protocolExerciseMetaText}>
                            {exercise.recommendedSets} sets
                          </Text>
                        )}
                        {exercise.recommendedReps && (
                          <Text style={styles.protocolExerciseMetaText}>
                            {exercise.recommendedReps} reps
                          </Text>
                        )}
                        {exercise.recommendedHoldSeconds && (
                          <Text style={styles.protocolExerciseMetaText}>
                            {exercise.recommendedHoldSeconds}s hold
                          </Text>
                        )}
                        <View
                          style={[
                            styles.difficultyBadge,
                            { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }
                          ]}
                        >
                          <Text
                            style={[
                              styles.difficultyText,
                              { color: getDifficultyColor(exercise.difficulty) }
                            ]}
                          >
                            {exercise.difficulty}
                          </Text>
                        </View>
                      </View>
                      {exercise.description && (
                        <Text style={styles.protocolExerciseDescription} numberOfLines={2}>
                          {exercise.description}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.protocolExercisePlayButton}
                      onPress={() => {
                        if (exercise.youtubeVideoId) {
                          openExerciseVideo(
                            `https://www.youtube.com/watch?v=${exercise.youtubeVideoId}`,
                            { id: exercise.id, title: exercise.title, youtubeVideoId: exercise.youtubeVideoId }
                          );
                        } else {
                          openExerciseVideo('https://youtube.com/@justinlemmodpt', { id: exercise.id, title: exercise.title });
                        }
                      }}
                    >
                      <Play size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.newAssessmentButton}
                  onPress={() => router.push('/assessment')}
                >
                  <Sparkles size={16} color={colors.primary[500]} />
                  <Text style={styles.newAssessmentText}>Update Assessment</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.noProtocolExercises}>
                <Text style={styles.noProtocolExercisesText}>
                  No specific exercises mapped for this protocol phase yet.
                </Text>
                <Text style={styles.noProtocolExercisesSubtext}>
                  Browse the exercise library below or check back later.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Show protocol mode toggle if hidden */}
        {protocolPhaseInfo && !showProtocolMode && (
          <TouchableOpacity
            style={styles.showProtocolModeButton}
            onPress={() => setShowProtocolMode(true)}
          >
            <Target size={16} color={colors.primary[500]} />
            <Text style={styles.showProtocolModeText}>
              Return to {protocolPhaseInfo.protocolName} Protocol
            </Text>
          </TouchableOpacity>
        )}

        {/* Assessment-Based Recommendations */}
        {hasRecommendations && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>
              🎯 Your Personalized Exercises ({latestAssessment!.recommendations.length})
            </Text>
            <Text style={styles.recommendationsSubtitle}>
              Based on your recent assessment, here are exercises specifically chosen for your condition:
            </Text>

            {/* Share/Export Actions for Assessment Recommendations */}
            <View style={styles.shareActionsContainer}>
              <TouchableOpacity
                style={styles.shareActionButton}
                onPress={handleShareAssessmentPlan}
                disabled={isSharing || latestAssessment!.recommendations.length === 0}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Share2 size={16} color="#FFFFFF" />
                    <Text style={styles.shareActionText}>Share Plan</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareActionButton, styles.exportActionButton]}
                onPress={handleExportAssessmentPdf}
                disabled={isExporting || latestAssessment!.recommendations.length === 0}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={colors.primary[500]} />
                ) : (
                  <>
                    <FileText size={16} color={colors.primary[500]} />
                    <Text style={[styles.shareActionText, styles.exportActionText]}>Export PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            {latestAssessment!.recommendations.map((recommendation, index) => {
              // Format dosage for display
              const dosageText = recommendation.dosage
                ? `${recommendation.dosage.sets} sets${recommendation.dosage.reps ? ` x ${recommendation.dosage.reps} reps` : ''}${recommendation.dosage.holdTime ? ` (${recommendation.dosage.holdTime})` : ''}`
                : '';

              return (
                <View key={recommendation.exercise.id} style={styles.recommendationCard}>
                  <View style={styles.recommendationHeader}>
                    <View style={styles.recommendationInfo}>
                      <Text style={styles.recommendationTitle}>{recommendation.exercise.name}</Text>
                      <View style={styles.recommendationMeta}>
                        <View style={styles.scoreContainer}>
                          <Text style={styles.scoreLabel}>Match: </Text>
                          <Text style={styles.scoreValue}>{recommendation.relevanceScore}%</Text>
                        </View>
                        {dosageText && (
                          <View style={styles.exerciseMetaItem}>
                            <Clock size={14} color="#6B7280" />
                            <Text style={styles.exerciseMetaText}>{dosageText}</Text>
                          </View>
                        )}
                        <View
                          style={[
                            styles.difficultyBadge,
                            { backgroundColor: getDifficultyColor(recommendation.exercise.difficulty) + '20' }
                          ]}
                        >
                          <Text
                            style={[
                              styles.difficultyText,
                              { color: getDifficultyColor(recommendation.exercise.difficulty) }
                            ]}
                          >
                            {recommendation.exercise.difficulty}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Dosage/Frequency */}
                  {recommendation.dosage && (
                    <View style={styles.dosageContainer}>
                      <Text style={styles.dosageLabel}>Dosage:</Text>
                      <Text style={styles.dosageText}>{recommendation.dosage.frequency}</Text>
                    </View>
                  )}

                  <Text style={styles.recommendationReasoning}>
                    <Text style={styles.reasoningLabel}>Why this helps: </Text>
                    {recommendation.reasoning}
                  </Text>

                  {recommendation.safetyNotes && recommendation.safetyNotes.length > 0 && (
                    <View style={styles.safetyNotesContainer}>
                      <Text style={styles.safetyNotesTitle}>Safety Notes:</Text>
                      {recommendation.safetyNotes.map((note, noteIndex) => (
                        <Text key={noteIndex} style={styles.safetyNote}>• {note}</Text>
                      ))}
                    </View>
                  )}

                  {recommendation.exercise.videoUrl ? (
                    <TouchableOpacity
                      style={styles.watchRecommendedButton}
                      onPress={() => openAssessmentExerciseVideo(
                        recommendation.exercise.id,
                        recommendation.exercise.name,
                        recommendation.exercise.videoUrl
                      )}
                    >
                      <Play size={16} color="#FFFFFF" />
                      <Text style={styles.watchRecommendedText}>Watch Exercise Video</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.noVideoContainer}>
                      <Text style={styles.noVideoText}>
                        Video coming soon - search for "{recommendation.exercise.name}" on YouTube
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
            
            <TouchableOpacity
              style={styles.newAssessmentButton}
              onPress={() => router.push('/assessment')}
            >
              <Sparkles size={16} color={colors.primary[500]} />
              <Text style={styles.newAssessmentText}>Take New Assessment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* No Assessment Prompt */}
        {!hasRecommendations && !assessmentLoading && (
          <View style={styles.noAssessmentCard}>
            <Sparkles size={24} color="#F59E0B" />
            <Text style={styles.noAssessmentTitle}>Get Personalized Exercises</Text>
            <Text style={styles.noAssessmentDescription}>
              Complete the Assessment tab to receive AI-powered exercise recommendations specifically tailored to your symptoms and condition.
            </Text>
            <TouchableOpacity
              style={styles.assessmentButton}
              onPress={() => router.push('/assessment')}
            >
              <Target size={16} color="#FFFFFF" />
              <Text style={styles.assessmentButtonText}>Start Assessment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* YouTube Channel Link */}
        <TouchableOpacity style={styles.youtubeCard} onPress={openYouTubeChannel}>
          <View style={styles.youtubeHeader}>
            <Youtube size={24} color="#FF0000" />
            <Text style={styles.youtubeTitle}>Dr. Justin Lemmo, PT, DPT</Text>
            <ExternalLink size={16} color="#6B7280" />
          </View>
          <Text style={styles.youtubeDescription}>
            Visit my YouTube channel for complete exercise videos and detailed instructions
          </Text>
          <View style={styles.youtubeStats}>
            <View style={styles.youtubeStat}>
              <Play size={16} color="#6B7280" />
              <Text style={styles.youtubeStatText}>Professional PT Videos</Text>
            </View>
            <View style={styles.youtubeStat}>
              <Star size={16} color="#F59E0B" />
              <Text style={styles.youtubeStatText}>Expert Guidance</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Texas Consultation Offer */}
        <TouchableOpacity style={styles.consultationCard} onPress={bookConsultation}>
          <View style={styles.consultationHeader}>
            <MapPin size={20} color={colors.primary[500]} />
            <Text style={styles.consultationTitle}>Texas Residents</Text>
          </View>
          <Text style={styles.consultationDescription}>
            Book a virtual consultation with Dr. Justin Lemmo, PT, DPT for personalized exercise recommendations
          </Text>
          <Text style={styles.consultationCta}>Book Virtual Consult</Text>
        </TouchableOpacity>

        {/* Body Part Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Browse by Body Part</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {bodyParts.map((bodyPart) => (
              <TouchableOpacity
                key={bodyPart}
                style={[
                  styles.filterButton,
                  selectedBodyPart === bodyPart && styles.filterButtonSelected,
                ]}
                onPress={() => setSelectedBodyPart(bodyPart)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedBodyPart === bodyPart && styles.filterButtonTextSelected,
                  ]}
                >
                  {bodyPart}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Exercise List */}
        <View style={styles.exerciseContainer}>
          <Text style={styles.exerciseTitle}>
            {selectedBodyPart === 'All'
              ? `All Exercises (${filteredExercises.length})`
              : `${selectedBodyPart} Exercises (${filteredExercises.length})`
            }
          </Text>
          {databaseExercises.length > 0 && (
            <Text style={styles.exerciseSource}>From Dr. Lemmo's exercise library</Text>
          )}

          {isLoadingExercises ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Loading exercises...</Text>
            </View>
          ) : filteredExercises.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                No exercises found matching your criteria.
              </Text>
              <Text style={styles.noResultsSubtext}>
                Try adjusting your filters or search terms.
              </Text>
              <TouchableOpacity style={styles.visitChannelButton} onPress={openYouTubeChannel}>
                <Youtube size={16} color="#FFFFFF" />
                <Text style={styles.visitChannelText}>Visit YouTube Channel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredExercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseCardTitle}>{exercise.title}</Text>
                    <View style={styles.exerciseMeta}>
                      <View style={styles.exerciseMetaItem}>
                        <Clock size={14} color="#6B7280" />
                        <Text style={styles.exerciseMetaText}>{exercise.duration}</Text>
                      </View>
                      <View 
                        style={[
                          styles.difficultyBadge,
                          { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }
                        ]}
                      >
                        <Text 
                          style={[
                            styles.difficultyText,
                            { color: getDifficultyColor(exercise.difficulty) }
                          ]}
                        >
                          {exercise.difficulty}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(exercise.id)}
                  >
                    <Star
                      size={24}
                      color="#F59E0B"
                      fill={favoriteIds.has(exercise.id) ? "#F59E0B" : "transparent"}
                    />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                
                <TouchableOpacity
                  style={styles.watchVideoButton}
                  onPress={() => openExerciseVideo(exercise.url, {
                    id: exercise.id,
                    title: exercise.title,
                  })}
                >
                  <Play size={16} color="#FFFFFF" />
                  <Text style={styles.watchVideoText}>Watch on YouTube</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Saved Exercises Section */}
        <View style={styles.savedExercisesSection}>
          <View style={styles.savedExercisesHeader}>
            <Star size={20} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.savedExercisesTitle}>Saved Exercises</Text>
            <Text style={styles.savedExercisesCount}>({favoriteExercises.length})</Text>
          </View>

          {!currentUserId ? (
            <View style={styles.signInPrompt}>
              <Text style={styles.signInPromptText}>
                Sign in to save your favorite exercises for quick access
              </Text>
              <TouchableOpacity
                style={styles.signInButton}
                onPress={() => router.push('/account')}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : isLoadingFavorites ? (
            <ActivityIndicator size="small" color={colors.primary[500]} />
          ) : favoriteExercises.length === 0 ? (
            <Text style={styles.noFavoritesText}>
              Tap the star icon on any exercise to save it here
            </Text>
          ) : (
            favoriteExercises.map((exercise) => (
              <View key={exercise.id} style={styles.favoriteExerciseCard}>
                <View style={styles.favoriteExerciseInfo}>
                  <Text style={styles.favoriteExerciseTitle}>{exercise.title}</Text>
                  <Text style={styles.favoriteExerciseMeta}>
                    {exercise.bodyPart} • {exercise.difficulty}
                  </Text>
                </View>
                <View style={styles.favoriteExerciseActions}>
                  <TouchableOpacity
                    style={styles.favoritePlayButton}
                    onPress={() => openExerciseVideo(exercise.url, { id: exercise.id, title: exercise.title })}
                  >
                    <Play size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.favoriteRemoveButton}
                    onPress={() => toggleFavorite(exercise.id)}
                  >
                    <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
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
  aiSearchCard: {
    margin: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#0EA5E9',
  },
  aiSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiSearchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C4A6E',
    marginLeft: 8,
  },
  aiSearchDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#0EA5E9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recommendationsContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 8,
  },
  recommendationsSubtitle: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 20,
  },
  recommendationCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 6,
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
  },
  recommendationReasoning: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 18,
  },
  reasoningLabel: {
    fontWeight: '600',
    color: '#065F46',
  },
  watchRecommendedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  watchRecommendedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  safetyNotesContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  safetyNotesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  safetyNote: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  newAssessmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.primary[500],
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  newAssessmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[500],
  },
  noAssessmentCard: {
    margin: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  noAssessmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  noAssessmentDescription: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  assessmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  assessmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  youtubeCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  youtubeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  youtubeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginLeft: 8,
  },
  youtubeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  youtubeStats: {
    flexDirection: 'row',
    gap: 16,
  },
  youtubeStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  youtubeStatText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  consultationCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  consultationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  consultationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary[500],
    flex: 1,
    marginLeft: 8,
  },
  consultationDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  consultationCta: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[500],
    textAlign: 'center',
  },
  filterContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterButtonSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextSelected: {
    color: '#FFFFFF',
  },
  exerciseContainer: {
    marginHorizontal: 16,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  noResultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  visitChannelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  visitChannelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exerciseInfo: {
    flex: 1,
    marginRight: 12,
  },
  exerciseCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exerciseMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  watchVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  watchVideoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // AI Search Results styles
  aiSearchResults: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0F2FE',
  },
  aiSearchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 12,
  },
  aiSearchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  aiSearchResultInfo: {
    flex: 1,
  },
  aiSearchResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  aiSearchResultMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  aiSearchResultActions: {
    flexDirection: 'row',
    gap: 8,
  },
  aiSearchPlayButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 6,
    padding: 8,
  },
  aiSearchStarButton: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    padding: 8,
  },
  aiSearchTip: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  fullAssessmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.primary[500],
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  fullAssessmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[500],
  },

  // Saved Exercises Section styles
  savedExercisesSection: {
    margin: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  savedExercisesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  savedExercisesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
  },
  savedExercisesCount: {
    fontSize: 14,
    color: '#B45309',
  },
  signInPrompt: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInPromptText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 12,
  },
  signInButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  signInButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noFavoritesText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  favoriteExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  favoriteExerciseInfo: {
    flex: 1,
  },
  favoriteExerciseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  favoriteExerciseMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  favoriteExerciseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  favoritePlayButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 6,
    padding: 8,
  },
  favoriteRemoveButton: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    padding: 8,
  },
  bottomSpacer: {
    height: 20,
  },
  dosageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
    gap: 8,
  },
  dosageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  dosageText: {
    fontSize: 13,
    color: '#10B981',
  },
  noVideoContainer: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  noVideoText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  exerciseSource: {
    fontSize: 12,
    color: '#10B981',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  // Protocol Mode styles
  protocolModeContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  protocolModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  protocolModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
  },
  protocolModeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  protocolModeClose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  protocolModeCloseText: {
    fontSize: 14,
    color: colors.primary[500],
  },
  protocolModeInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  protocolModeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  protocolModePhase: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
    marginBottom: 4,
  },
  protocolModeDescription: {
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: 4,
    lineHeight: 20,
  },
  protocolModeWeeks: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  shareActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  shareActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  exportActionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  shareActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exportActionText: {
    color: colors.primary[500],
  },
  protocolLoadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  protocolLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.neutral[600],
  },
  protocolExercisesList: {
    marginTop: 8,
  },
  protocolExercisesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 12,
  },
  protocolExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  protocolExerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  protocolExerciseNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  protocolExerciseContent: {
    flex: 1,
    marginRight: 8,
  },
  protocolExerciseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 4,
  },
  protocolExerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  protocolExerciseMetaText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  protocolExerciseDescription: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 4,
  },
  protocolExercisePlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  noProtocolExercises: {
    padding: 24,
    alignItems: 'center',
  },
  noProtocolExercisesText: {
    fontSize: 14,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 4,
  },
  noProtocolExercisesSubtext: {
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  showProtocolModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginBottom: 0,
    padding: 12,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary[200],
    gap: 8,
  },
  showProtocolModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[600],
  },
});
