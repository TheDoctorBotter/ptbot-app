import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Send,
  Bot,
  User,
  ExternalLink,
  MapPin,
  Youtube,
  Play,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Dumbbell,
  Clock,
  CheckCircle,
  Zap,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { openaiProxy } from '@/services/openaiProxyService';
import { supabase } from '@/lib/supabase';
import {
  chatbotContextService,
  ChatbotContext,
  QUICK_COMMANDS,
  ExerciseRecommendation,
} from '@/services/chatbotContextService';

interface ExerciseSuggestion {
  id: string;
  title: string;
  bodyPart: string;
  url: string;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'exercises' | 'progress' | 'pain_prompt' | 'quick_actions';
  exercises?: ExerciseRecommendation[];
  painLogData?: { painLevel: number; location: string };
}

interface PainLogState {
  isLogging: boolean;
  step: 'level' | 'notes';
  level: number | null;
  location: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [exerciseSuggestions, setExerciseSuggestions] = useState<ExerciseSuggestion[]>([]);
  const [userContext, setUserContext] = useState<ChatbotContext | null>(null);
  const [painLogState, setPainLogState] = useState<PainLogState>({
    isLogging: false,
    step: 'level',
    level: null,
    location: '',
  });
  const scrollViewRef = useRef<ScrollView>(null);
  // Track when we last initialised so we don't repeat the round-trip on every
  // tab switch.  Five minutes is enough to feel fresh without re-fetching constantly.
  const lastInitAt = useRef<number>(0);
  const CHAT_STALE_MS = 5 * 60 * 1000;

  // Load user context and generate personalized greeting
  const initializeChat = useCallback(async () => {
    setIsInitializing(true);
    lastInitAt.current = Date.now(); // stamp early to prevent parallel invocations
    try {
      const context = await chatbotContextService.getUserContext();
      setUserContext(context);

      // Generate personalized greeting
      const greeting = generatePersonalizedGreeting(context);
      setMessages([{
        id: '1',
        text: greeting,
        isUser: false,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setMessages([{
        id: '1',
        text: "Hi! I'm PTBot, your virtual physical therapy assistant. How can I help you today?",
        isUser: false,
        timestamp: new Date(),
      }]);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Re-init only when the cached context is stale; skips the round-trip on
  // rapid tab switching so transitions feel instant.
  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastInitAt.current > CHAT_STALE_MS) {
        initializeChat();
      }
    }, [initializeChat])
  );

  // Generate personalized greeting based on user context
  const generatePersonalizedGreeting = (context: ChatbotContext): string => {
    if (!context.isAuthenticated) {
      return "Hi! I'm PTBot, your virtual physical therapy assistant created by Dr. Justin Lemmo, PT, DPT. Sign in to get personalized exercise recommendations and track your recovery progress. How can I help you today?";
    }

    const parts: string[] = [];
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    parts.push(`${timeGreeting}! I'm PTBot, here to help with your recovery.`);

    // Context-aware greeting
    if (context.latestAssessment) {
      const daysAgo = context.daysSinceLastAssessment;

      if (context.protocolInfo) {
        // Post-op patient
        parts.push(`You're in ${context.protocolInfo.phaseName} of your ${context.protocolInfo.protocolName.replace(/_/g, ' ')} recovery.`);

        if (context.latestAssessment.weeksSinceSurgery) {
          parts.push(`Week ${context.latestAssessment.weeksSinceSurgery} post-op - keep up the great work!`);
        }
      } else {
        // Regular pain management
        parts.push(`I see you're working on your ${context.latestAssessment.painLocation.toLowerCase()} recovery.`);

        // Pain trend feedback
        if (context.painTrend === 'improving') {
          parts.push("Your pain levels have been improving - that's excellent progress!");
        } else if (context.painTrend === 'worsening') {
          parts.push("I noticed your pain has increased recently. Let me know how I can help adjust your plan.");
        }
      }

      // Reassessment prompt
      if (context.needsReassessment && daysAgo && daysAgo > 5) {
        parts.push(`It's been ${daysAgo} days since your last check-in. A quick reassessment can help us fine-tune your exercises.`);
      }
    } else {
      parts.push("Complete an assessment to get personalized exercise recommendations tailored to your needs.");
    }

    // Engagement-based messaging
    if (context.activitySummary.daysSinceLastActivity !== null) {
      if (context.activitySummary.daysSinceLastActivity > 3) {
        parts.push("Ready to get back on track with your exercises?");
      } else if (context.activitySummary.sessionsThisWeek >= 3) {
        parts.push("You've been consistent this week - great job!");
      }
    }

    parts.push("\nTry asking: 'Show my exercises', 'Log pain', or 'What should I do today?'");

    return parts.join(' ');
  };

  // Search for exercises based on symptoms
  const searchExercisesForSymptoms = async (userMessage: string): Promise<ExerciseSuggestion[]> => {
    if (!supabase) return [];

    try {
      const query = userMessage.toLowerCase();

      // Symptom keywords to body parts mapping
      const bodyPartKeywords: Record<string, string[]> = {
        'Lower Back': ['lower back', 'lumbar', 'back pain', 'sciatica', 'spine'],
        'Neck': ['neck', 'cervical', 'stiff neck', 'neck pain', 'neck stiffness'],
        'Shoulder': ['shoulder', 'rotator cuff', 'shoulder pain'],
        'Hip': ['hip', 'hip pain', 'hip flexor', 'glute'],
        'Hamstrings': ['hamstring', 'hamstrings', 'back of thigh', 'posterior thigh', 'leg curl'],
        'Knee': ['knee', 'knee pain', 'quad', 'patella'],
        'Ankle': ['ankle', 'ankle pain', 'foot', 'calf', 'achilles'],
        'Upper Back': ['upper back', 'thoracic', 'posture'],
      };

      // Special conditions that warrant AAROM exercises
      const aaromConditions = [
        'frozen shoulder', 'adhesive capsulitis', 'post-op', 'post-surgical',
        'surgery', 'after surgery', 'cant move', "can't move", 'cannot move',
        'limited motion', 'limited range', 'very stiff', 'severe stiffness'
      ];
      const shouldIncludeAAROM = aaromConditions.some(condition => query.includes(condition));

      // Find matching body parts
      const matchingBodyParts: string[] = [];
      for (const [bodyPart, keywords] of Object.entries(bodyPartKeywords)) {
        if (keywords.some(kw => query.includes(kw))) {
          matchingBodyParts.push(bodyPart);
        }
      }

      // Search for common symptom terms
      const symptomTerms = ['pain', 'stiff', 'tight', 'ache', 'sore', 'weak', 'numb', 'tingling'];
      const hasSymptoms = symptomTerms.some(term => query.includes(term));

      if (matchingBodyParts.length === 0 && !hasSymptoms) {
        return [];
      }

      // Query exercises from database
      const { data, error } = await supabase
        .from('exercise_videos')
        .select('id, title, body_parts, youtube_video_id, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(20);

      if (error || !data) return [];

      // Score exercises based on matches
      const scored = data.map((ex: any) => {
        let score = 0;
        const exBodyParts = (ex.body_parts || []).map((b: string) => b.toLowerCase());
        const titleLower = ex.title.toLowerCase();

        // Exclude AAROM exercises unless user has specific conditions
        if (titleLower.includes('aarom') && !shouldIncludeAAROM) {
          return { exercise: ex, score: 0 };
        }

        for (const bodyPart of matchingBodyParts) {
          if (exBodyParts.some((bp: string) => bp.toLowerCase().includes(bodyPart.toLowerCase()) ||
              bodyPart.toLowerCase().includes(bp.toLowerCase()))) {
            score += 20;
          }
        }

        // Prefer beginner exercises for pain/symptoms
        if (titleLower.includes('stretch') || titleLower.includes('gentle') || titleLower.includes('relief')) {
          score += 10;
        }

        return { exercise: ex, score };
      });

      // Get top 2 exercises
      const topExercises = scored
        .filter((s: any) => s.score > 0)
        .sort((a: any, b: any) => {
          const orderA = a.exercise.display_order ?? 999;
          const orderB = b.exercise.display_order ?? 999;
          if (orderA !== orderB) return orderA - orderB;
          return b.score - a.score;
        })
        .slice(0, 2)
        .map((s: any) => ({
          id: s.exercise.id,
          title: s.exercise.title,
          bodyPart: s.exercise.body_parts?.[0] || 'General',
          url: s.exercise.youtube_video_id
            ? `https://www.youtube.com/watch?v=${s.exercise.youtube_video_id}`
            : 'https://youtube.com/@justinlemmodpt',
        }));

      return topExercises;
    } catch (error) {
      console.error('Error searching exercises:', error);
      return [];
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Handle quick commands
  const handleQuickCommand = async (command: typeof QUICK_COMMANDS[0]): Promise<string> => {
    if (!userContext) {
      return "Please sign in to use this feature.";
    }

    switch (command.action) {
      case 'show_exercises':
        if (userContext.currentExercises.length === 0) {
          return "You don't have any exercises assigned yet. Complete an assessment to get personalized exercise recommendations, or ask me about exercises for a specific body part!";
        }
        // Add exercises message
        const exerciseMessage: ChatMessage = {
          id: Date.now().toString(),
          text: `Here are your ${userContext.currentExercises.length} assigned exercises:`,
          isUser: false,
          timestamp: new Date(),
          type: 'exercises',
          exercises: userContext.currentExercises.slice(0, 6),
        };
        setMessages(prev => [...prev, exerciseMessage]);
        return '';

      case 'log_pain':
        setPainLogState({
          isLogging: true,
          step: 'level',
          level: null,
          location: userContext.latestAssessment?.painLocation || 'General',
        });
        return `Let's log your pain level. On a scale of 0-10, how would you rate your ${userContext.latestAssessment?.painLocation?.toLowerCase() || 'current'} pain right now?\n\n(0 = no pain, 10 = worst pain imaginable)`;

      case 'show_progress':
        return generateProgressSummary(userContext);

      case 'today_routine':
        if (userContext.currentExercises.length === 0) {
          return "You don't have a routine set up yet. Complete an assessment first, and I'll create a personalized daily routine for you!";
        }
        const routineExercises = userContext.currentExercises.slice(0, 4);
        const routineList = routineExercises.map((e, i) => {
          const dosage = e.dosage ? `${e.dosage.sets || 2}×${e.dosage.reps || 10}` : '';
          return `${i + 1}. ${e.exercise.name}${dosage ? ` (${dosage})` : ''}`;
        }).join('\n');

        return `Here's your routine for today:\n\n${routineList}\n\nStart with gentle movements and stop if you experience sharp pain. Ready to begin? Tap on an exercise to watch the video!`;

      case 'check_in':
        const painLevel = userContext.latestAssessment?.painLevel;
        const lastPain = userContext.painLogs.length > 0 ? userContext.painLogs[0].painLevel : null;

        let checkInResponse = "Let's do a quick check-in!\n\n";

        if (painLevel !== undefined) {
          checkInResponse += `Your last assessment pain level was ${painLevel}/10. `;
          if (lastPain !== null) {
            const diff = lastPain - painLevel;
            if (diff > 0) {
              checkInResponse += `And your most recent pain log (${lastPain}/10) shows improvement! `;
            } else if (diff < 0) {
              checkInResponse += `Your recent pain log (${lastPain}/10) shows some increase. `;
            }
          }
        }

        checkInResponse += "\n\nHow are you feeling today? Would you like to:\n";
        checkInResponse += "- Log your current pain level\n";
        checkInResponse += "- View today's exercises\n";
        checkInResponse += "- Take a reassessment";

        return checkInResponse;

      case 'help':
        return `Here's what I can help you with:\n\n` +
          `**Quick Commands:**\n` +
          `- "Show my exercises" - View your exercise program\n` +
          `- "Log pain" - Record your current pain level\n` +
          `- "What should I do today" - Get your daily routine\n` +
          `- "Show my progress" - See your recovery trends\n` +
          `- "Check in" - Quick daily check-in\n\n` +
          `**Ask me about:**\n` +
          `- Specific exercises (e.g., "How do I do a bird dog?")\n` +
          `- Your protocol phase (for post-op patients)\n` +
          `- Exercise modifications\n` +
          `- When to progress or regress exercises\n` +
          `- Red flag symptoms to watch for\n\n` +
          `What would you like help with?`;

      default:
        return "I'm not sure how to handle that command. Try 'help' to see what I can do!";
    }
  };

  // Generate progress summary
  const generateProgressSummary = (context: ChatbotContext): string => {
    const parts: string[] = [];

    parts.push("**Your Recovery Progress**\n");

    // Pain trend
    if (context.painTrend !== 'unknown') {
      const trendEmoji = context.painTrend === 'improving' ? '📉' : context.painTrend === 'worsening' ? '📈' : '➡️';
      parts.push(`${trendEmoji} Pain Trend: ${context.painTrend.charAt(0).toUpperCase() + context.painTrend.slice(1)}`);
    }

    // Assessment history
    if (context.assessmentHistory.length > 0) {
      const first = context.assessmentHistory[context.assessmentHistory.length - 1];
      const last = context.assessmentHistory[0];

      if (context.assessmentHistory.length > 1) {
        const painChange = first.painLevel - last.painLevel;
        if (painChange > 0) {
          parts.push(`✅ Pain reduced by ${painChange} points since you started!`);
        } else if (painChange < 0) {
          parts.push(`⚠️ Pain has increased by ${Math.abs(painChange)} points. Consider a reassessment.`);
        } else {
          parts.push(`📊 Pain level has stayed consistent at ${last.painLevel}/10`);
        }
      }

      parts.push(`📋 Assessments completed: ${context.assessmentHistory.length}`);
    }

    // Activity
    if (context.activitySummary.sessionsThisWeek > 0) {
      parts.push(`💪 Sessions this week: ${context.activitySummary.sessionsThisWeek}`);
    }

    if (context.activitySummary.videosWatched > 0) {
      parts.push(`🎬 Exercises watched: ${context.activitySummary.videosWatched}`);
    }

    // Protocol progress
    if (context.protocolInfo) {
      parts.push(`\n**${context.protocolInfo.protocolName}**`);
      parts.push(`Phase: ${context.protocolInfo.phaseName}`);
      if (context.latestAssessment?.weeksSinceSurgery) {
        parts.push(`Weeks post-op: ${context.latestAssessment.weeksSinceSurgery}`);
      }
    }

    // Encouragement
    if (context.painTrend === 'improving') {
      parts.push("\n🌟 Great progress! Keep up the consistent effort!");
    } else if (context.painTrend === 'worsening') {
      parts.push("\n💡 Consider taking a reassessment so we can adjust your exercises.");
    } else {
      parts.push("\n💪 Every session counts. Stay consistent!");
    }

    return parts.join('\n');
  };

  // Handle pain log input
  const handlePainLogInput = async (input: string): Promise<string> => {
    if (painLogState.step === 'level') {
      const level = parseInt(input, 10);
      if (isNaN(level) || level < 0 || level > 10) {
        return "Please enter a number between 0 and 10.";
      }

      setPainLogState(prev => ({
        ...prev,
        step: 'notes',
        level: level,
      }));

      return `Pain level: ${level}/10. Any notes about how you're feeling? (type 'done' to skip)`;
    }

    if (painLogState.step === 'notes') {
      const notes = input.toLowerCase() === 'done' ? undefined : input;
      const level = painLogState.level!;

      // Save pain log
      if (userContext?.user?.id) {
        const success = await chatbotContextService.logPain(
          userContext.user.id,
          level,
          painLogState.location,
          notes
        );

        if (success) {
          // Reset state
          setPainLogState({
            isLogging: false,
            step: 'level',
            level: null,
            location: '',
          });

          // Generate response based on pain level
          let response = `Logged: ${level}/10 pain`;
          if (notes) response += ` with note: "${notes}"`;
          response += "\n\n";

          if (level >= 7) {
            response += "Your pain is quite high. Consider:\n";
            response += "- Taking a rest day or doing only gentle stretches\n";
            response += "- Applying ice or heat as appropriate\n";
            response += "- Contacting a healthcare provider if this persists";
          } else if (level >= 4) {
            response += "Moderate pain - proceed with your exercises gently. Stop if pain increases significantly.";
          } else {
            response += "That's a good pain level for exercise. You're doing great!";
          }

          // Refresh context to include new pain log
          const newContext = await chatbotContextService.getUserContext();
          setUserContext(newContext);

          return response;
        }
      }

      setPainLogState({
        isLogging: false,
        step: 'level',
        level: null,
        location: '',
      });
      return "There was an issue logging your pain. Please try again.";
    }

    return "Something went wrong. Let's start over - type 'log pain' to try again.";
  };

  // Build enhanced system prompt
  const buildSystemPrompt = (context: ChatbotContext, userMessage: string): string => {
    const contextString = chatbotContextService.buildContextString(context);

    return `You are PTBot, an AI-powered virtual physical therapy assistant created by Dr. Justin Lemmo, PT, DPT. You are the primary engagement point for the PTBot app.

${contextString}

CORE CAPABILITIES:
1. **Exercise Guidance**: Help users understand their exercises, provide form cues, explain muscle targets, and offer modifications
2. **Post-Op Protocol Q&A**: For post-op patients, answer questions about their current phase, restrictions, what activities are safe
3. **Pain Management**: Provide evidence-based advice on managing pain, when to ice vs heat, activity modification
4. **Progress Tracking**: Reference their pain trends, encourage when improving, suggest reassessment when worsening
5. **Red Flag Triage**: If user mentions concerning symptoms, guide them to seek appropriate care
6. **Educational Content**: Explain conditions, anatomy, and healing timelines in simple terms

RESPONSE GUIDELINES:
- Be conversational but concise (2-3 paragraphs max unless they ask for details)
- Reference their specific data when relevant ("I see your pain has decreased from 7 to 4...")
- For exercise questions, include practical tips they can use immediately
- Always maintain professional boundaries - you educate, not diagnose
- If they have exercises assigned, reference those specifically
- For post-op patients, be especially careful about restrictions and protocol adherence

WHEN TO SUGGEST REASSESSMENT:
- Pain has increased significantly
- It's been 7+ days since last assessment
- They're asking about progressing to harder exercises
- Their symptoms have changed

WHEN TO ESCALATE TO PROFESSIONAL CARE:
- Red flag symptoms (loss of bowel/bladder control, severe weakness, fever, trauma)
- Pain 8/10 or higher that isn't improving
- Symptoms not responding to exercise program after 2+ weeks
- Any post-op concerns about surgical site

FOR POST-OP PATIENTS:
- Always respect their current phase restrictions
- Reference their weight-bearing status if applicable
- Remind them to follow surgeon's specific instructions
- Encourage them but don't rush progression

FORMATTING:
- Use bullet points for lists
- Use **bold** for emphasis
- Keep paragraphs short
- Include specific, actionable advice

For Texas residents, you can mention booking a virtual telehealth consultation through the Schedule tab in the app.

Remember: You're helping them on their recovery journey. Be encouraging, helpful, and always prioritize safety.`;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessageText = inputText.trim();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: userMessageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setExerciseSuggestions([]);

    try {
      // Handle pain logging flow
      if (painLogState.isLogging) {
        const response = await handlePainLogInput(userMessageText);
        if (response) {
          const botMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: response,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, botMessage]);
        }
        setIsLoading(false);
        return;
      }

      // Check for quick commands
      const command = chatbotContextService.detectQuickCommand(userMessageText);
      if (command) {
        const response = await handleQuickCommand(command);
        if (response) {
          const botMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: response,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, botMessage]);
        }
        setIsLoading(false);
        return;
      }

      // Check for red flags
      const redFlags = chatbotContextService.detectRedFlags(userMessageText);
      if (redFlags.length > 0) {
        const urgentMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: `⚠️ **Important**: You mentioned "${redFlags[0]}" which could indicate a serious condition.\n\n` +
            `**Please seek medical attention if you experience:**\n` +
            `- Loss of bowel or bladder control\n` +
            `- Severe or spreading numbness/weakness\n` +
            `- High fever with back/neck pain\n` +
            `- Pain following trauma or accident\n\n` +
            `If this is an emergency, call 911. Otherwise, contact your healthcare provider today.\n\n` +
            `Would you like me to help with anything else in the meantime?`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, urgentMessage]);
        setIsLoading(false);
        return;
      }

      // Search for exercise suggestions based on symptoms
      const suggestions = await searchExercisesForSymptoms(userMessageText);
      setExerciseSuggestions(suggestions);

      // Build context-aware prompt
      let exerciseContext = '';
      if (suggestions.length > 0) {
        exerciseContext = `\n\nI found ${suggestions.length} exercise(s) that might help: ${suggestions.map(s => s.title).join(', ')}. Mention these exercises in your response and encourage the user to try them.`;
      }

      // Get fresh context if not available
      let context = userContext;
      if (!context) {
        context = await chatbotContextService.getUserContext();
        setUserContext(context);
      }

      const systemPrompt = buildSystemPrompt(context, userMessageText) + exerciseContext;

      const chatMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.slice(-10).map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.text,
        })),
        { role: 'user' as const, content: userMessageText },
      ];

      const responseText = await openaiProxy.chat(chatMessages, {
        max_tokens: 500,
        temperature: 0.7,
      });

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorText = error instanceof Error && error.message.includes('sign in')
        ? "Please sign in to use the chatbot. Go to the Account tab to create an account or log in."
        : "I'm sorry, I'm having trouble responding right now. Please try again in a moment, or use the Assessment tab to get personalized exercise recommendations.";

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const openYouTubeChannel = () => {
    Linking.openURL('http://www.youtube.com/@justinlemmodpt').catch(() => {
      Alert.alert('Error', 'Unable to open YouTube channel. Please try again later.');
    });
  };

  const bookConsultation = () => {
    router.push('/(tabs)/schedule');
  };

  // Render exercise card for recommendations
  const renderExerciseCard = (exercise: ExerciseRecommendation, index: number) => (
    <TouchableOpacity
      key={exercise.exercise.id || index}
      style={styles.exerciseCard}
      onPress={() => {
        if (exercise.exercise.videoUrl) {
          Linking.openURL(exercise.exercise.videoUrl);
        }
      }}
    >
      <View style={styles.exerciseCardContent}>
        <View style={styles.exerciseNumber}>
          <Text style={styles.exerciseNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseTitle} numberOfLines={1}>
            {exercise.exercise.name}
          </Text>
          {exercise.dosage && (
            <Text style={styles.exerciseDosage}>
              {exercise.dosage.sets && `${exercise.dosage.sets} sets`}
              {exercise.dosage.sets && exercise.dosage.reps && ' × '}
              {exercise.dosage.reps && `${exercise.dosage.reps} reps`}
            </Text>
          )}
        </View>
        {exercise.exercise.videoUrl && (
          <View style={styles.playButton}>
            <Play size={14} color="#FFFFFF" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMessage = (message: ChatMessage) => {
    // Special rendering for exercise list messages
    if (message.type === 'exercises' && message.exercises) {
      return (
        <View key={message.id} style={styles.messageContainer}>
          <View style={styles.messageHeader}>
            <Bot size={16} color="#10B981" />
            <Text style={styles.messageAuthor}>PTBot</Text>
            <Text style={styles.messageTime}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.botMessageBubble}>
            <Text style={styles.botMessageText}>{message.text}</Text>
            <View style={styles.exerciseList}>
              {message.exercises.map((ex, i) => renderExerciseCard(ex, i))}
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/(tabs)/exercises')}
            >
              <Text style={styles.viewAllButtonText}>View All Exercises</Text>
              <Dumbbell size={14} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Standard message rendering
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isUser ? styles.userMessageContainer : styles.botMessageContainer,
        ]}
      >
        <View style={styles.messageHeader}>
          {message.isUser ? (
            <User size={16} color={colors.primary[500]} />
          ) : (
            <Bot size={16} color="#10B981" />
          )}
          <Text style={styles.messageAuthor}>
            {message.isUser ? 'You' : 'PTBot'}
          </Text>
          <Text style={styles.messageTime}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View
          style={[
            styles.messageBubble,
            message.isUser ? styles.userMessageBubble : styles.botMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              message.isUser ? styles.userMessageText : styles.botMessageText,
            ]}
          >
            {message.text}
          </Text>
        </View>
      </View>
    );
  };

  // Quick action buttons
  const renderQuickActions = () => {
    if (!userContext?.isAuthenticated) return null;

    return (
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={styles.quickActionPill}
          onPress={() => {
            setInputText('show my exercises');
            sendMessage();
          }}
        >
          <Dumbbell size={14} color={colors.primary[600]} />
          <Text style={styles.quickActionPillText}>My Exercises</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionPill}
          onPress={() => {
            setInputText('log pain');
            sendMessage();
          }}
        >
          <TrendingDown size={14} color={colors.primary[600]} />
          <Text style={styles.quickActionPillText}>Log Pain</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionPill}
          onPress={() => {
            setInputText('what should i do today');
            sendMessage();
          }}
        >
          <Zap size={14} color={colors.primary[600]} />
          <Text style={styles.quickActionPillText}>Today</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Progress indicator in header
  const renderProgressIndicator = () => {
    if (!userContext?.latestAssessment) return null;

    const pain = userContext.latestAssessment.painLevel;
    const trend = userContext.painTrend;

    return (
      <View style={styles.progressIndicator}>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Pain</Text>
          <Text style={[
            styles.progressValue,
            pain >= 7 && styles.progressValueHigh,
            pain <= 3 && styles.progressValueLow,
          ]}>
            {pain}/10
          </Text>
        </View>
        <View style={styles.progressDivider} />
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Trend</Text>
          <View style={styles.progressTrend}>
            {trend === 'improving' && <TrendingDown size={16} color={colors.success[600]} />}
            {trend === 'worsening' && <TrendingUp size={16} color={colors.error[600]} />}
            {trend === 'stable' && <Minus size={16} color={colors.neutral[500]} />}
            {trend === 'unknown' && <Minus size={16} color={colors.neutral[400]} />}
          </View>
        </View>
      </View>
    );
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <Image
              source={require('@/assets/images/icon/Logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>AI Physical Therapy Assistant</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading your recovery data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLogo}>
            <Image
              source={require('@/assets/images/icon/Logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>AI Physical Therapy Assistant</Text>
          </View>
          {renderProgressIndicator()}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.youtubeCard} onPress={openYouTubeChannel}>
            <View style={styles.quickActionHeader}>
              <Youtube size={20} color="#FF0000" />
              <Text style={styles.quickActionTitle}>Dr. Lemmo's Channel</Text>
              <ExternalLink size={14} color="#6B7280" />
            </View>
            <Text style={styles.quickActionDescription}>
              Professional PT videos and exercise demonstrations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.consultationCard} onPress={bookConsultation}>
            <View style={styles.quickActionHeader}>
              <MapPin size={20} color={colors.primary[500]} />
              <Text style={styles.quickActionTitle}>Texas Consultations</Text>
            </View>
            <Text style={styles.quickActionDescription}>
              Book virtual sessions with Dr. Lemmo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatContent}
        >
          {messages.map(renderMessage)}

          {isLoading && (
            <View style={styles.loadingBubbleContainer}>
              <View style={styles.loadingBubble}>
                <Text style={styles.loadingBubbleText}>PTBot is typing...</Text>
              </View>
            </View>
          )}

          {/* Exercise Suggestions from symptom search */}
          {exerciseSuggestions.length > 0 && !isLoading && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionsHeader}>
                <Target size={16} color="#059669" />
                <Text style={styles.suggestionsTitle}>Suggested Exercises</Text>
              </View>
              {exerciseSuggestions.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={styles.suggestionCard}
                  onPress={() => Linking.openURL(exercise.url)}
                >
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionTitle}>{exercise.title}</Text>
                    <Text style={styles.suggestionMeta}>{exercise.bodyPart}</Text>
                  </View>
                  <View style={styles.suggestionPlayButton}>
                    <Play size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.fullAssessmentPrompt}
                onPress={() => router.push('/assessment')}
              >
                <Text style={styles.fullAssessmentText}>
                  Want a complete recovery plan? Take a full assessment
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Quick Action Pills */}
        {renderQuickActions()}

        {/* Chat Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                painLogState.isLogging
                  ? painLogState.step === 'level'
                    ? "Enter pain level (0-10)..."
                    : "Add notes or type 'done'..."
                  : "Ask about exercises, log pain, or get help..."
              }
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Send size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>
            Try: "Show my exercises" or "How do I do a bird dog?"
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoImage: {
    height: 36,
    width: 100,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 3,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.primary[200],
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 10,
    color: colors.primary[200],
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressValueHigh: {
    color: '#FCA5A5',
  },
  progressValueLow: {
    color: '#86EFAC',
  },
  progressDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  progressTrend: {
    marginTop: 2,
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.neutral[600],
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  youtubeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  consultationCard: {
    flex: 1,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  quickActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginLeft: 6,
  },
  quickActionDescription: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 14,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatContent: {
    paddingVertical: 12,
  },
  messageContainer: {
    marginBottom: 14,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  messageAuthor: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
    marginRight: 8,
  },
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userMessageBubble: {
    backgroundColor: colors.primary[500],
    borderBottomRightRadius: 4,
  },
  botMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomLeftRadius: 4,
    maxWidth: '90%',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#374151',
  },
  loadingBubbleContainer: {
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  loadingBubble: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  loadingBubbleText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  // Quick action pills
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary[200],
    gap: 6,
  },
  quickActionPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary[700],
  },
  // Exercise list in chat
  exerciseList: {
    marginTop: 10,
  },
  exerciseCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  exerciseCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  exerciseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral[800],
  },
  exerciseDosage: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: 6,
  },
  viewAllButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary[500],
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 16,
    padding: 10,
    marginLeft: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  inputHint: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
  },
  // Exercise Suggestions styles
  suggestionsContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  suggestionMeta: {
    fontSize: 11,
    color: '#6B7280',
  },
  suggestionPlayButton: {
    backgroundColor: '#059669',
    borderRadius: 6,
    padding: 8,
  },
  fullAssessmentPrompt: {
    paddingVertical: 8,
  },
  fullAssessmentText: {
    fontSize: 12,
    color: '#059669',
    textAlign: 'center',
    fontWeight: '500',
  },
});
