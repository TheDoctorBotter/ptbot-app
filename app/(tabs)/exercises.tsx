import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Youtube, ExternalLink, MapPin, Clock, Star, Play, CircleCheck as CheckCircle, Calendar, DollarSign, Dumbbell } from 'lucide-react-native';

interface Exercise {
  id: string;
  title: string;
  bodyPart: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  completed?: boolean;
}

// Sample exercises - in real app these would be fetched from your YouTube channel
const sampleExercises: Exercise[] = [
  {
    id: '1',
    title: 'Lower Back Stretches for Pain Relief',
    bodyPart: 'Lower Back',
    duration: '10 min',
    difficulty: 'Beginner',
    description: 'Gentle stretches to relieve lower back tension and improve mobility.',
  },
  {
    id: '2',
    title: 'Neck Pain Relief Exercises',
    bodyPart: 'Neck',
    duration: '8 min',
    difficulty: 'Beginner',
    description: 'Simple exercises to reduce neck stiffness and improve range of motion.',
  },
  {
    id: '3',
    title: 'Shoulder Strengthening Routine',
    bodyPart: 'Shoulder',
    duration: '15 min',
    difficulty: 'Intermediate',
    description: 'Build shoulder strength and stability with these targeted exercises.',
  },
  {
    id: '4',
    title: 'Knee Rehabilitation Exercises',
    bodyPart: 'Knee',
    duration: '12 min',
    difficulty: 'Beginner',
    description: 'Safe exercises to strengthen the knee and surrounding muscles.',
  },
  {
    id: '5',
    title: 'Hip Mobility and Strengthening',
    bodyPart: 'Hip',
    duration: '20 min',
    difficulty: 'Intermediate',
    description: 'Comprehensive hip exercises for better mobility and strength.',
  },
];

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>(sampleExercises);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('All');
  const [isTexasResident, setIsTexasResident] = useState<boolean>(false);

  const bodyParts = ['All', 'Lower Back', 'Neck', 'Shoulder', 'Knee', 'Hip'];

  const filteredExercises = selectedBodyPart === 'All' 
    ? exercises 
    : exercises.filter(ex => ex.bodyPart === selectedBodyPart);

  const openYouTubeChannel = () => {
    Linking.openURL('http://www.youtube.com/@justinlemmodpt').catch(() => {
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
    Alert.alert(
      'Virtual Consultation',
      'Book a personalized virtual consultation with Dr. Justin Lemmo, PT, DPT to discuss your specific condition and get customized exercise recommendations.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book Now', onPress: () => {
          const consultationUrl = 'https://justinlemmodpt.com';
          Linking.openURL(consultationUrl).catch(() => {
            Alert.alert('Error', 'Unable to open website. Please visit justinlemmodpt.com directly.');
          });
        }}
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return '#10B981';
      case 'Intermediate': return '#F59E0B';
      case 'Advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

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
            <MapPin size={20} color="#2563EB" />
            <Text style={styles.consultationTitle}>Texas Residents</Text>
          </View>
          <Text style={styles.consultationDescription}>
            Book a virtual consultation with Dr. Justin Lemmo, PT, DPT for personalized exercise recommendations
          </Text>
          <Text style={styles.consultationCta}>Book Virtual Consult</Text>
        </TouchableOpacity>

        {/* Body Part Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Filter by Body Part</Text>
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
          
          {filteredExercises.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                No exercises available yet for {selectedBodyPart}.
              </Text>
              <Text style={styles.noResultsSubtext}>
                Check back soon or visit the YouTube channel for updates!
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
                    style={styles.completeButton}
                    onPress={() => toggleExerciseCompletion(exercise.id)}
                  >
                    <CheckCircle 
                      size={24} 
                      color={exercise.completed ? '#10B981' : '#D1D5DB'} 
                    />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                
                <TouchableOpacity 
                  style={styles.watchVideoButton}
                  onPress={openYouTubeChannel}
                >
                  <Play size={16} color="#FFFFFF" />
                  <Text style={styles.watchVideoText}>Watch on YouTube</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Progress Summary */}
        <View style={styles.progressSummary}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.progressStatText}>
                {exercises.filter(ex => ex.completed).length} completed
              </Text>
            </View>
            <View style={styles.progressStat}>
              <Calendar size={20} color="#2563EB" />
              <Text style={styles.progressStatText}>
                {exercises.length} total exercises
              </Text>
            </View>
          </View>
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
    borderColor: '#2563EB',
  },
  consultationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  consultationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
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
    color: '#2563EB',
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
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
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
  completeButton: {
    padding: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  watchVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  watchVideoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressSummary: {
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
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  progressStats: {
    flexDirection: 'row',
    gap: 16,
  },
  progressStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressStatText: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomSpacer: {
    height: 20,
  },
  aiSearchCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#0EA5E9',
  },
  aiSearchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C4A6E',
    marginBottom: 8,
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
    minHeight: 60,
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
});