import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, User, Activity } from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function HomeScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm PTBot, your virtual physical therapy assistant. I'm here to help you with your pain management and recovery. How are you feeling today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenHeight(window.height);
    });
    return () => subscription?.remove();
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // Check if the message is about pain/exercises and get personalized recommendations
      let exerciseRecommendations = '';
      const painKeywords = ['pain', 'hurt', 'ache', 'sore', 'stiff', 'exercise', 'stretch'];
      const containsPainKeywords = painKeywords.some(keyword => 
        currentInput.toLowerCase().includes(keyword)
      );
      
      if (containsPainKeywords) {
        exerciseRecommendations = `\n\n💡 Once Dr. Lemmo's YouTube channel is set up, I'll be able to recommend specific exercises tailored to your exact pain condition!`;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are PTBot, a virtual physical therapy assistant. You help patients with pain management, exercise recommendations, and general physical therapy guidance. 

Key guidelines:
- Always be empathetic and professional
- Ask about pain levels, location, and symptoms
- Recommend the Assessment tab for detailed symptom tracking
- Suggest exercises from the Exercises tab
- Monitor for red flags that need medical attention
- Be encouraging about recovery and progress
- Never diagnose or replace professional medical care
- If serious symptoms are mentioned, recommend seeing a healthcare provider

Remember: You are an assistant to help guide users through their recovery journey.`,
            },
            ...messages.slice(-5).map(msg => ({
              role: msg.isUser ? 'user' as const : 'assistant' as const,
              content: msg.text,
            })),
            {
              role: 'user',
              content: currentInput + exerciseRecommendations,
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('OpenAI API Error:', data);
        throw new Error(`OpenAI API Error: ${data.error?.message || 'Unknown error'}`);
      }
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.choices[0].message.content,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Dismiss keyboard so user can read the response
        Keyboard.dismiss();
      } else {
        throw new Error('Invalid response structure from OpenAI API');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response when API fails
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now, but I'm here to help! You can use the Assessment tab to track your symptoms or check out the Exercises tab for helpful activities. If you're experiencing severe pain, please consult with a healthcare provider.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.botMessage,
      ]}
    >
      <View style={styles.messageHeader}>
        {message.isUser ? (
          <User size={16} color="#2563EB" />
        ) : (
          <Bot size={16} color="#0D9488" />
        )}
        <Text style={styles.messageAuthor}>
          {message.isUser ? 'You' : 'PTBot'}
        </Text>
      </View>
      <Text style={[
        styles.messageText,
        message.isUser ? styles.userMessageText : styles.botMessageText
      ]}>
        {message.text}
      </Text>
      <Text style={styles.messageTime}>
        {message.timestamp.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <View style={styles.logoContainer}>
            <Activity size={28} color="#FFFFFF" />
            <Text style={styles.logoText}>PTBOT</Text>
          </View>
          <Text style={styles.headerTitle}>Virtual Assistant</Text>
        </View>
        <Text style={styles.headerSubtitle}>Your Virtual Physical Therapy Guide</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>PTBot is typing...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask PTBot about your symptoms, pain, or exercises..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color={!inputText.trim() ? "#9CA3AF" : "#FFFFFF"} />
          </TouchableOpacity>
        </View>
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
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userMessage: {
    backgroundColor: '#2563EB',
    alignSelf: 'flex-end',
  },
  botMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageAuthor: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    color: '#6B7280',
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
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
  },
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});