import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageCircle, Send, Bot, User, ExternalLink, MapPin, Youtube, Play, Target } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { openaiProxy } from '@/services/openaiProxyService';
import { supabase } from '@/lib/supabase';

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
}

export default function HomeScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hi! I'm PTBot, your virtual physical therapy assistant created by Dr. Justin Lemmo, PT, DPT. I can help you understand your symptoms, recommend exercises, and guide your recovery. How are you feeling today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [exerciseSuggestions, setExerciseSuggestions] = useState<ExerciseSuggestion[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

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
      // Only show AAROM exercises if user mentions these specific conditions
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
      let dbQuery = supabase
        .from('exercise_videos')
        .select('id, title, body_parts, youtube_video_id')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(20);

      const { data, error } = await dbQuery;

      if (error || !data) return [];

      // Score exercises based on matches
      const scored = data.map((ex: any) => {
        let score = 0;
        const exBodyParts = (ex.body_parts || []).map((b: string) => b.toLowerCase());
        const titleLower = ex.title.toLowerCase();

        // Exclude AAROM exercises unless user has specific conditions
        // AAROM exercises are for frozen shoulder/post-op patients only
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
        .sort((a: any, b: any) => b.score - a.score)
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
      // Search for exercise suggestions based on symptoms
      const suggestions = await searchExercisesForSymptoms(userMessageText);
      setExerciseSuggestions(suggestions);

      // Build context about found exercises for the AI
      let exerciseContext = '';
      if (suggestions.length > 0) {
        exerciseContext = `\n\nI found ${suggestions.length} exercise(s) that might help: ${suggestions.map(s => s.title).join(', ')}. Mention these exercises in your response and encourage the user to try them. Also suggest they complete a full assessment for a personalized recovery plan.`;
      }

      const systemPrompt = `You are PTBot, a helpful virtual physical therapy assistant created by Dr. Justin Lemmo, PT, DPT. You provide educational information about physical therapy, exercises, and general wellness.

IMPORTANT GUIDELINES:
- Always emphasize that you provide educational information, not medical diagnosis
- If the user mentions pain or symptoms, acknowledge their concern and provide brief general advice
- Recommend users complete the Assessment tab for personalized exercise recommendations
- For Texas residents, mention they can book virtual consultations with Dr. Lemmo at justinlemmodpt.com
- Be encouraging and supportive about their recovery journey
- Keep responses concise (2-3 short paragraphs max) and actionable
- If exercises were found for their symptoms, mention them and encourage trying them
- Always remind users to consult healthcare providers for serious concerns${exerciseContext}

NEVER:
- Provide specific medical diagnoses
- Recommend prescription medications
- Replace professional medical advice
- Give advice for serious injuries without proper assessment

Your goal is to guide users through the app features while providing helpful, safe, and educational physical therapy information.`;

      const chatMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.slice(-5).map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.text,
        })),
        { role: 'user' as const, content: userMessageText },
      ];

      const responseText = await openaiProxy.chat(chatMessages, {
        max_tokens: 350,
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

  const renderMessage = (message: ChatMessage) => (
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <View style={styles.logoContainer}>
            <MessageCircle size={28} color="#FFFFFF" />
            <Text style={styles.logoText}>PTBOT</Text>
          </View>
          <Text style={styles.headerTitle}>AI Physical Therapy Assistant</Text>
        </View>
        <Text style={styles.headerSubtitle}>Chat with PTBot for personalized guidance</Text>
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
            <View style={styles.loadingContainer}>
              <View style={styles.loadingBubble}>
                <Text style={styles.loadingText}>PTBot is typing...</Text>
              </View>
            </View>
          )}

          {/* Exercise Suggestions */}
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
                  Want a complete recovery plan? Take a full assessment →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Chat Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask PTBot about your symptoms, exercises, or recovery..."
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
            💡 Try: "I have lower back pain" or "What exercises help with neck stiffness?"
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
  keyboardContainer: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  youtubeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  consultationCard: {
    flex: 1,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  quickActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginLeft: 6,
  },
  quickActionDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
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
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#374151',
  },
  loadingContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  loadingBubble: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 16,
    padding: 10,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  // Exercise Suggestions styles
  suggestionsContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  suggestionMeta: {
    fontSize: 12,
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
    fontSize: 13,
    color: '#059669',
    textAlign: 'center',
    fontWeight: '500',
  },
});