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
  Youtube,
  Play,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Dumbbell,
  Zap,
  CalendarDays,
  Activity,
  ArrowRight,
  Video,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Baby,
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
import { appointmentService, Appointment } from '@/services/appointmentService';
import { useCareMode } from '@/hooks/useCareMode';
import PediatricHome from '@/components/pediatric/PediatricHome';

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
  const { careMode, setCareMode } = useCareMode();
  if (careMode === 'pediatric') {
    return <PediatricHome setCareMode={setCareMode} />;
  }

  return <AdultHomeScreen setCareMode={setCareMode} />;
}

function AdultHomeScreen({ setCareMode }: { setCareMode: (mode: 'adult' | 'pediatric') => void }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [exerciseSuggestions, setExerciseSuggestions] = useState<ExerciseSuggestion[]>([]);
  const [userContext, setUserContext] = useState<ChatbotContext | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [painLogState, setPainLogState] = useState<PainLogState>({
    isLogging: false,
    step: 'level',
    level: null,
    location: '',
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const chatScrollRef = useRef<ScrollView>(null);
  const lastInitAt = useRef<number>(0);
  const CHAT_STALE_MS = 5 * 60 * 1000;

  // Load user context + appointments
  const initializeHome = useCallback(async () => {
    setIsInitializing(true);
    lastInitAt.current = Date.now();
    try {
      const [context, apptResult] = await Promise.all([
        chatbotContextService.getUserContext(),
        appointmentService.getMyAppointments({ upcoming: true, limit: 3 }).catch(() => ({ appointments: [] as Appointment[] })),
      ]);
      setUserContext(context);
      setUpcomingAppointments(apptResult.appointments.filter(a => a.status !== 'cancelled'));

      const greeting = generateGreeting(context);
      setMessages([{ id: '1', text: greeting, isUser: false, timestamp: new Date() }]);
    } catch (error) {
      console.error('Error initializing:', error);
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

  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastInitAt.current > CHAT_STALE_MS) {
        initializeHome();
      }
    }, [initializeHome])
  );

  const generateGreeting = (context: ChatbotContext): string => {
    if (!context.isAuthenticated) {
      return "Hi! I'm PTBot, your virtual physical therapy assistant. Sign in to get personalized recommendations and track your recovery.";
    }
    const hour = new Date().getHours();
    const time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const parts: string[] = [`${time}! How can I help with your recovery today?`];
    if (context.needsReassessment && context.daysSinceLastAssessment && context.daysSinceLastAssessment > 5) {
      parts.push(`It's been ${context.daysSinceLastAssessment} days since your last check-in.`);
    }
    return parts.join(' ');
  };

  // ── Exercise search ─────────────────────────────────────────────────
  const searchExercisesForSymptoms = async (userMessage: string): Promise<ExerciseSuggestion[]> => {
    if (!supabase) return [];
    try {
      const query = userMessage.toLowerCase();
      const bodyPartKeywords: Record<string, string[]> = {
        'Lower Back': ['lower back', 'lumbar', 'back pain', 'sciatica', 'spine'],
        'Neck': ['neck', 'cervical', 'stiff neck', 'neck pain'],
        'Shoulder': ['shoulder', 'rotator cuff', 'shoulder pain'],
        'Hip': ['hip', 'hip pain', 'hip flexor', 'glute'],
        'Hamstrings': ['hamstring', 'hamstrings', 'back of thigh'],
        'Knee': ['knee', 'knee pain', 'quad', 'patella'],
        'Ankle': ['ankle', 'ankle pain', 'foot', 'calf', 'achilles'],
        'Upper Back': ['upper back', 'thoracic', 'posture'],
      };
      const aaromConditions = ['frozen shoulder', 'adhesive capsulitis', 'post-op', 'surgery'];
      const shouldIncludeAAROM = aaromConditions.some(c => query.includes(c));
      const matchingBodyParts: string[] = [];
      for (const [bp, kws] of Object.entries(bodyPartKeywords)) {
        if (kws.some(kw => query.includes(kw))) matchingBodyParts.push(bp);
      }
      const symptomTerms = ['pain', 'stiff', 'tight', 'ache', 'sore', 'weak', 'numb', 'tingling'];
      if (matchingBodyParts.length === 0 && !symptomTerms.some(t => query.includes(t))) return [];

      const { data, error } = await supabase
        .from('exercise_videos')
        .select('id, title, body_parts, youtube_video_id, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(20);
      if (error || !data) return [];

      const scored = data.map((ex: any) => {
        let score = 0;
        const exBP = (ex.body_parts || []).map((b: string) => b.toLowerCase());
        const titleLower = ex.title.toLowerCase();
        if (titleLower.includes('aarom') && !shouldIncludeAAROM) return { exercise: ex, score: 0 };
        for (const bp of matchingBodyParts) {
          if (exBP.some((b: string) => b.includes(bp.toLowerCase()) || bp.toLowerCase().includes(b))) score += 20;
        }
        if (titleLower.includes('stretch') || titleLower.includes('gentle') || titleLower.includes('relief')) score += 10;
        return { exercise: ex, score };
      });
      return scored.filter((s: any) => s.score > 0)
        .sort((a: any, b: any) => (a.exercise.display_order ?? 999) - (b.exercise.display_order ?? 999) || b.score - a.score)
        .slice(0, 2)
        .map((s: any) => ({
          id: s.exercise.id, title: s.exercise.title,
          bodyPart: s.exercise.body_parts?.[0] || 'General',
          url: s.exercise.youtube_video_id ? `https://www.youtube.com/watch?v=${s.exercise.youtube_video_id}` : 'https://youtube.com/@justinlemmodpt',
        }));
    } catch { return []; }
  };

  useEffect(() => {
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // ── Quick commands ──────────────────────────────────────────────────
  const handleQuickCommand = async (command: typeof QUICK_COMMANDS[0]): Promise<string> => {
    if (!userContext) return "Please sign in to use this feature.";
    switch (command.action) {
      case 'show_exercises':
        if (userContext.currentExercises.length === 0) return "No exercises assigned yet. Complete an assessment to get recommendations!";
        setMessages(prev => [...prev, {
          id: Date.now().toString(), text: `Here are your ${userContext.currentExercises.length} assigned exercises:`,
          isUser: false, timestamp: new Date(), type: 'exercises', exercises: userContext.currentExercises.slice(0, 6),
        }]);
        return '';
      case 'log_pain':
        setPainLogState({ isLogging: true, step: 'level', level: null, location: userContext.latestAssessment?.painLocation || 'General' });
        return `On a scale of 0-10, how would you rate your ${userContext.latestAssessment?.painLocation?.toLowerCase() || 'current'} pain right now?`;
      case 'show_progress': return generateProgressSummary(userContext);
      case 'today_routine':
        if (userContext.currentExercises.length === 0) return "No routine yet. Complete an assessment first!";
        return `Today's routine:\n\n${userContext.currentExercises.slice(0, 4).map((e, i) => {
          const d = e.dosage ? `${e.dosage.sets || 2}×${e.dosage.reps || 10}` : '';
          return `${i + 1}. ${e.exercise.name}${d ? ` (${d})` : ''}`;
        }).join('\n')}\n\nStart gently and stop if pain increases.`;
      case 'check_in': return "How are you feeling today? You can:\n- Log your pain level\n- View today's exercises\n- Take a reassessment";
      case 'help':
        return `**Quick Commands:**\n- "Show my exercises"\n- "Log pain"\n- "What should I do today"\n- "Show my progress"\n\n**Ask me about:**\n- Exercise form cues\n- Your protocol phase\n- Exercise modifications`;
      default: return "Try 'help' to see what I can do!";
    }
  };

  const generateProgressSummary = (ctx: ChatbotContext): string => {
    const p: string[] = ["**Your Recovery Progress**\n"];
    if (ctx.painTrend !== 'unknown') p.push(`Pain Trend: ${ctx.painTrend.charAt(0).toUpperCase() + ctx.painTrend.slice(1)}`);
    if (ctx.assessmentHistory.length > 1) {
      const change = ctx.assessmentHistory[ctx.assessmentHistory.length - 1].painLevel - ctx.assessmentHistory[0].painLevel;
      if (change > 0) p.push(`Pain reduced by ${change} points!`);
      else if (change < 0) p.push(`Pain increased by ${Math.abs(change)} points.`);
    }
    if (ctx.activitySummary.sessionsThisWeek > 0) p.push(`Sessions this week: ${ctx.activitySummary.sessionsThisWeek}`);
    if (ctx.protocolInfo) p.push(`\n**${ctx.protocolInfo.protocolName}** — ${ctx.protocolInfo.phaseName}`);
    return p.join('\n');
  };

  // ── Pain logging ────────────────────────────────────────────────────
  const handlePainLogInput = async (input: string): Promise<string> => {
    if (painLogState.step === 'level') {
      const level = parseInt(input, 10);
      if (isNaN(level) || level < 0 || level > 10) return "Please enter a number between 0 and 10.";
      setPainLogState(prev => ({ ...prev, step: 'notes', level }));
      return `Pain level: ${level}/10. Any notes? (type 'done' to skip)`;
    }
    if (painLogState.step === 'notes') {
      const notes = input.toLowerCase() === 'done' ? undefined : input;
      const level = painLogState.level!;
      if (userContext?.user?.id) {
        const success = await chatbotContextService.logPain(userContext.user.id, level, painLogState.location, notes);
        if (success) {
          setPainLogState({ isLogging: false, step: 'level', level: null, location: '' });
          let resp = `Logged: ${level}/10 pain${notes ? ` — "${notes}"` : ''}\n\n`;
          if (level >= 7) resp += "Pain is high. Consider rest, ice/heat, or contacting a provider.";
          else if (level >= 4) resp += "Moderate pain — proceed gently with exercises.";
          else resp += "Good level for exercise. You're doing great!";
          const newCtx = await chatbotContextService.getUserContext();
          setUserContext(newCtx);
          return resp;
        }
      }
      setPainLogState({ isLogging: false, step: 'level', level: null, location: '' });
      return "Issue logging pain. Please try again.";
    }
    return "Type 'log pain' to try again.";
  };

  // ── Chat send ───────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const txt = inputText.trim();
    setMessages(prev => [...prev, { id: Date.now().toString(), text: txt, isUser: true, timestamp: new Date() }]);
    setInputText('');
    setIsLoading(true);
    setExerciseSuggestions([]);
    if (!chatExpanded) setChatExpanded(true);

    try {
      if (painLogState.isLogging) {
        const r = await handlePainLogInput(txt);
        if (r) setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: r, isUser: false, timestamp: new Date() }]);
        setIsLoading(false); return;
      }
      const cmd = chatbotContextService.detectQuickCommand(txt);
      if (cmd) {
        const r = await handleQuickCommand(cmd);
        if (r) setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: r, isUser: false, timestamp: new Date() }]);
        setIsLoading(false); return;
      }
      const redFlags = chatbotContextService.detectRedFlags(txt);
      if (redFlags.length > 0) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), isUser: false, timestamp: new Date(),
          text: `**Important**: You mentioned "${redFlags[0]}" which could be serious.\n\n**Seek care if:**\n- Loss of bowel/bladder control\n- Severe numbness/weakness\n- High fever with pain\n\nIf emergency, call 911.`,
        }]);
        setIsLoading(false); return;
      }
      const suggestions = await searchExercisesForSymptoms(txt);
      setExerciseSuggestions(suggestions);
      let ctx = userContext;
      if (!ctx) { ctx = await chatbotContextService.getUserContext(); setUserContext(ctx); }
      const contextStr = chatbotContextService.buildContextString(ctx);
      const sysPrompt = `You are PTBot, an AI PT assistant by Dr. Justin Lemmo, PT, DPT.\n\n${contextStr}\n\nBe concise (2-3 paragraphs). Reference user data when relevant. Use **bold** and bullet points.${suggestions.length > 0 ? `\n\nSuggest these exercises: ${suggestions.map(s => s.title).join(', ')}` : ''}`;
      const chatMsgs = [
        { role: 'system' as const, content: sysPrompt },
        ...messages.slice(-10).map(m => ({ role: m.isUser ? 'user' as const : 'assistant' as const, content: m.text })),
        { role: 'user' as const, content: txt },
      ];
      const resp = await openaiProxy.chat(chatMsgs, { max_tokens: 500, temperature: 0.7 });
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: resp, isUser: false, timestamp: new Date() }]);
    } catch (error) {
      const errTxt = error instanceof Error && error.message.includes('sign in') ? "Please sign in to use the chatbot." : "Having trouble responding. Please try again.";
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: errTxt, isUser: false, timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  };

  // ── Render helpers ──────────────────────────────────────────────────
  const renderExerciseCard = (exercise: ExerciseRecommendation, index: number) => (
    <TouchableOpacity key={exercise.exercise.id || index} style={s.exCard}
      onPress={() => { if (exercise.exercise.videoUrl) Linking.openURL(exercise.exercise.videoUrl); }}>
      <View style={s.exCardRow}>
        <View style={s.exNum}><Text style={s.exNumText}>{index + 1}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.exTitle} numberOfLines={1}>{exercise.exercise.name}</Text>
          {exercise.dosage && <Text style={s.exDosage}>{exercise.dosage.sets && `${exercise.dosage.sets}×`}{exercise.dosage.reps && `${exercise.dosage.reps}`}</Text>}
        </View>
        {exercise.exercise.videoUrl && <View style={s.playBtn}><Play size={14} color="#FFF" /></View>}
      </View>
    </TouchableOpacity>
  );

  const renderMessage = (message: ChatMessage) => {
    if (message.type === 'exercises' && message.exercises) {
      return (
        <View key={message.id} style={s.msgWrap}>
          <View style={s.msgHead}><Bot size={14} color="#10B981" /><Text style={s.msgAuthor}>PTBot</Text></View>
          <View style={s.botBubble}>
            <Text style={s.botText}>{message.text}</Text>
            <View style={{ marginTop: 8 }}>{message.exercises.map((ex, i) => renderExerciseCard(ex, i))}</View>
            <TouchableOpacity style={s.viewAllBtn} onPress={() => router.push('/(tabs)/exercises')}>
              <Text style={s.viewAllText}>View All Exercises</Text><Dumbbell size={14} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View key={message.id} style={[s.msgWrap, message.isUser && { alignItems: 'flex-end' }]}>
        <View style={s.msgHead}>
          {message.isUser ? <User size={14} color={colors.primary[500]} /> : <Bot size={14} color="#10B981" />}
          <Text style={s.msgAuthor}>{message.isUser ? 'You' : 'PTBot'}</Text>
        </View>
        <View style={message.isUser ? s.userBubble : s.botBubble}>
          <Text style={message.isUser ? s.userText : s.botText}>{message.text}</Text>
        </View>
      </View>
    );
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  if (isInitializing) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Image source={require('@/assets/images/icon/Logo.png')} style={s.logoImg} resizeMode="contain" />
          <Text style={s.headerTitle}>PTBOT</Text>
        </View>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={s.loadingLabel}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pain = userContext?.latestAssessment?.painLevel;
  const trend = userContext?.painTrend;
  const activity = userContext?.activitySummary;
  const assessment = userContext?.latestAssessment;

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Image source={require('@/assets/images/icon/Logo.png')} style={s.logoImg} resizeMode="contain" />
        <Text style={s.headerTitle}>PTBOT</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── At-a-Glance Status ──────────────────────────────── */}
          {userContext?.isAuthenticated && assessment && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Your Recovery</Text>
              <View style={s.statsRow}>
                <View style={s.stat}>
                  <Text style={s.statLabel}>PAIN</Text>
                  <Text style={[s.statVal, pain !== undefined && pain >= 7 && { color: colors.error[500] }, pain !== undefined && pain <= 3 && { color: colors.success[500] }]}>
                    {pain ?? '-'}/10
                  </Text>
                  <Text style={s.statSub}>{assessment.painLocation}</Text>
                </View>
                <View style={s.statDiv} />
                <View style={s.stat}>
                  <Text style={s.statLabel}>TREND</Text>
                  <View style={s.trendRow}>
                    {trend === 'improving' && <TrendingDown size={18} color={colors.success[500]} />}
                    {trend === 'worsening' && <TrendingUp size={18} color={colors.error[500]} />}
                    {(trend === 'stable' || !trend || trend === 'unknown') && <Minus size={18} color={colors.neutral[400]} />}
                    <Text style={[s.statVal, { fontSize: 14, marginLeft: 4 }]}>
                      {trend && trend !== 'unknown' ? trend.charAt(0).toUpperCase() + trend.slice(1) : 'N/A'}
                    </Text>
                  </View>
                </View>
                <View style={s.statDiv} />
                <View style={s.stat}>
                  <Text style={s.statLabel}>THIS WEEK</Text>
                  <Text style={s.statVal}>{activity?.sessionsThisWeek ?? 0}</Text>
                  <Text style={s.statSub}>sessions</Text>
                </View>
              </View>

              {userContext.protocolInfo && (
                <View style={s.protoBadge}>
                  <Activity size={14} color={colors.primary[600]} />
                  <Text style={s.protoText}>{userContext.protocolInfo.phaseName} — {userContext.protocolInfo.protocolName.replace(/_/g, ' ')}</Text>
                </View>
              )}

              {userContext.needsReassessment && (
                <TouchableOpacity style={s.reassessBanner} onPress={() => router.push('/(tabs)/assessment')}>
                  <AlertTriangle size={14} color={colors.warning[700]} />
                  <Text style={s.reassessText}>{userContext.reassessmentReason || 'Time for a check-in!'} Tap to reassess.</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Upcoming Appointments ───────────────────────────── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Upcoming Appointments</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/schedule')}>
                <Text style={s.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.slice(0, 2).map((appt) => {
                const info = appointmentService.getStatusInfo(appt.status);
                const d = new Date(appt.start_time);
                return (
                  <View key={appt.id} style={s.apptCard}>
                    <View style={s.apptDate}>
                      <Text style={s.apptMon}>{d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>
                      <Text style={s.apptDay}>{d.getDate()}</Text>
                      <Text style={s.apptWkday}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.apptTime}>{d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} — {appt.duration_minutes} min</Text>
                      <Text style={s.apptType}>Virtual Consultation</Text>
                      <View style={[s.apptBadge, { backgroundColor: info.color + '20' }]}>
                        <View style={[s.apptDot, { backgroundColor: info.color }]} />
                        <Text style={[s.apptBadgeText, { color: info.color }]}>{info.label}</Text>
                      </View>
                    </View>
                    {appt.zoom_meeting_url && (
                      <TouchableOpacity style={s.joinBtn} onPress={() => Linking.openURL(appt.zoom_meeting_url!)}>
                        <Video size={16} color="#FFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={s.noAppt}>
                <CalendarDays size={24} color={colors.neutral[300]} />
                <Text style={s.noApptText}>No upcoming appointments</Text>
                <TouchableOpacity style={s.bookBtn} onPress={() => router.push('/(tabs)/schedule')}>
                  <Text style={s.bookBtnText}>Book a Consultation</Text>
                  <ArrowRight size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Quick Actions ───────────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Quick Actions</Text>
            <View style={s.qGrid}>
              <TouchableOpacity style={s.qCard} onPress={() => router.push('/(tabs)/assessment')}>
                <View style={[s.qIcon, { backgroundColor: colors.primary[50] }]}><Activity size={22} color={colors.primary[500]} /></View>
                <Text style={s.qLabel}>Assessment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.qCard} onPress={() => router.push('/(tabs)/exercises')}>
                <View style={[s.qIcon, { backgroundColor: colors.info[50] }]}><Dumbbell size={22} color={colors.info[500]} /></View>
                <Text style={s.qLabel}>Exercises</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.qCard} onPress={() => { setChatExpanded(true); setInputText('log pain'); setTimeout(() => sendMessage(), 100); }}>
                <View style={[s.qIcon, { backgroundColor: colors.warning[50] }]}><TrendingDown size={22} color={colors.warning[600]} /></View>
                <Text style={s.qLabel}>Log Pain</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.qCard} onPress={() => router.push('/(tabs)/schedule')}>
                <View style={[s.qIcon, { backgroundColor: colors.success[50] }]}><CalendarDays size={22} color={colors.success[600]} /></View>
                <Text style={s.qLabel}>Schedule</Text>
              </TouchableOpacity>
            </View>

            <View style={s.linksRow}>
              <TouchableOpacity style={s.linkCard} onPress={() => Linking.openURL('http://www.youtube.com/@justinlemmodpt').catch(() => {})}>
                <Youtube size={16} color="#FF0000" /><Text style={s.linkText}>Dr. Lemmo's Channel</Text><ExternalLink size={12} color={colors.neutral[400]} />
              </TouchableOpacity>
              <TouchableOpacity style={s.linkCard} onPress={() => router.push('/(tabs)/dashboard')}>
                <Target size={16} color={colors.primary[500]} /><Text style={s.linkText}>My Dashboard</Text><ArrowRight size={12} color={colors.neutral[400]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Chat Section ────────────────────────────────────── */}
          <View style={s.card}>
            <TouchableOpacity style={s.chatHeader} onPress={() => setChatExpanded(!chatExpanded)} activeOpacity={0.7}>
              <View style={s.chatHeaderLeft}>
                <MessageCircle size={18} color={colors.primary[500]} />
                <Text style={s.cardTitle}>Ask PTBot</Text>
              </View>
              {chatExpanded ? <ChevronUp size={18} color={colors.neutral[400]} /> : <ChevronDown size={18} color={colors.neutral[400]} />}
            </TouchableOpacity>

            {chatExpanded ? (
              <ScrollView ref={chatScrollRef} style={s.chatExpanded} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {messages.map(renderMessage)}
                {isLoading && <View style={s.typing}><Text style={s.typingText}>PTBot is typing...</Text></View>}
              </ScrollView>
            ) : messages.length > 0 && (
              <View style={s.chatPreview}>
                <Bot size={14} color="#10B981" />
                <Text style={s.chatPreviewText} numberOfLines={2}>{messages[messages.length - 1].text}</Text>
              </View>
            )}

            <View style={s.chatInputRow}>
              <TextInput
                style={s.chatInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={painLogState.isLogging ? (painLogState.step === 'level' ? "Pain level (0-10)..." : "Notes or 'done'...") : "Ask about exercises, log pain..."}
                placeholderTextColor={colors.neutral[400]}
                multiline maxLength={500}
                onSubmitEditing={sendMessage} blurOnSubmit={false}
                onFocus={() => { if (!chatExpanded) setChatExpanded(true); }}
              />
              <TouchableOpacity
                style={[s.sendBtn, (!inputText.trim() || isLoading) && s.sendBtnOff]}
                onPress={sendMessage} disabled={!inputText.trim() || isLoading}
              >
                <Send size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Care Mode Banner ────────────────────────────────── */}
          <TouchableOpacity style={s.careMode} onPress={() => setCareMode('pediatric')} activeOpacity={0.7}>
            <Baby size={18} color={colors.primary[500]} />
            <Text style={s.careModeText}>
              Looking for pediatric development?{' '}
              <Text style={s.careModeLink}>Switch to Pediatric Mode</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: { backgroundColor: colors.primary[500], paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  logoImg: { height: 36, width: 100, marginRight: 10, backgroundColor: '#FFF', borderRadius: 6, padding: 3 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingLabel: { marginTop: 12, fontSize: 14, color: colors.neutral[500] },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Card
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.neutral[200] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral[800], marginBottom: 2 },
  seeAll: { fontSize: 13, fontWeight: '500', color: colors.primary[500] },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  stat: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.neutral[500], letterSpacing: 0.5, marginBottom: 4 },
  statVal: { fontSize: 22, fontWeight: '700', color: colors.neutral[900] },
  statSub: { fontSize: 11, color: colors.neutral[400], marginTop: 2 },
  statDiv: { width: 1, height: 40, backgroundColor: colors.neutral[200] },
  trendRow: { flexDirection: 'row', alignItems: 'center' },
  protoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: colors.primary[50], paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  protoText: { fontSize: 12, fontWeight: '500', color: colors.primary[700], flex: 1 },
  reassessBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: colors.warning[50], paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  reassessText: { fontSize: 12, fontWeight: '500', color: colors.warning[700], flex: 1 },

  // Appointments
  apptCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[50], marginBottom: 8 },
  apptDate: { alignItems: 'center', marginRight: 14, width: 44 },
  apptMon: { fontSize: 10, fontWeight: '700', color: colors.primary[500] },
  apptDay: { fontSize: 22, fontWeight: '700', color: colors.neutral[900], lineHeight: 26 },
  apptWkday: { fontSize: 10, color: colors.neutral[500] },
  apptTime: { fontSize: 14, fontWeight: '600', color: colors.neutral[800] },
  apptType: { fontSize: 12, color: colors.neutral[500], marginTop: 1 },
  apptBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start' },
  apptDot: { width: 6, height: 6, borderRadius: 3 },
  apptBadgeText: { fontSize: 11, fontWeight: '600' },
  joinBtn: { backgroundColor: colors.primary[500], padding: 10, borderRadius: 10 },
  noAppt: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  noApptText: { fontSize: 13, color: colors.neutral[500] },
  bookBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary[500], paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginTop: 4 },
  bookBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },

  // Quick actions
  qGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  qCard: { width: '47%' as any, alignItems: 'center', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[50] },
  qIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  qLabel: { fontSize: 13, fontWeight: '600', color: colors.neutral[700] },
  linksRow: { flexDirection: 'row', gap: 10 },
  linkCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.neutral[200] },
  linkText: { fontSize: 12, fontWeight: '500', color: colors.neutral[700], flex: 1 },

  // Chat
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chatPreview: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: colors.neutral[50], borderRadius: 10, padding: 12, marginBottom: 10 },
  chatPreviewText: { flex: 1, fontSize: 13, color: colors.neutral[600], lineHeight: 18 },
  chatExpanded: { maxHeight: 300, marginBottom: 10 },
  msgWrap: { marginBottom: 10 },
  msgHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 3, gap: 4 },
  msgAuthor: { fontSize: 11, fontWeight: '500', color: colors.neutral[500] },
  userBubble: { backgroundColor: colors.primary[500], paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderBottomRightRadius: 4, maxWidth: '85%' },
  userText: { fontSize: 14, color: '#FFF', lineHeight: 19 },
  botBubble: { backgroundColor: colors.neutral[50], paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderBottomLeftRadius: 4, maxWidth: '90%', borderWidth: 1, borderColor: colors.neutral[200] },
  botText: { fontSize: 14, color: colors.neutral[800], lineHeight: 19 },
  typing: { paddingHorizontal: 12, paddingVertical: 8 },
  typingText: { fontSize: 13, color: colors.neutral[500], fontStyle: 'italic' },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  chatInput: { flex: 1, backgroundColor: colors.neutral[50], borderRadius: 20, borderWidth: 1, borderColor: colors.neutral[200], paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 80, minHeight: 40, color: colors.neutral[900] },
  sendBtn: { backgroundColor: colors.primary[500], padding: 10, borderRadius: 20 },
  sendBtnOff: { backgroundColor: colors.neutral[300] },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 8, marginTop: 6, borderTopWidth: 1, borderTopColor: colors.neutral[200], gap: 6 },
  viewAllText: { fontSize: 13, fontWeight: '500', color: colors.primary[500] },

  // Exercise cards
  exCard: { backgroundColor: '#FFF', borderRadius: 8, marginBottom: 4, borderWidth: 1, borderColor: colors.neutral[200] },
  exCardRow: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  exNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  exNumText: { fontSize: 11, fontWeight: '600', color: colors.primary[700] },
  exTitle: { fontSize: 12, fontWeight: '500', color: colors.neutral[800] },
  exDosage: { fontSize: 10, color: colors.neutral[500], marginTop: 1 },
  playBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center' },

  // Care mode
  careMode: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.info[50], paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.info[100], marginBottom: 10 },
  careModeText: { fontSize: 13, color: colors.neutral[600], flex: 1 },
  careModeLink: { color: colors.primary[500], fontWeight: '600' },
});
