/**
 * Exercise Library - Deterministic Exercise Database
 *
 * This library contains a curated list of exercises with:
 * - Body part targeting
 * - Condition-specific recommendations
 * - Pre-defined dosage (sets, reps, duration, frequency)
 * - Safety contraindications
 * - Red flag warnings
 *
 * Exercises are matched using rules-based logic for consistency.
 */

export interface ExerciseDosage {
  sets: number;
  reps?: number;           // For rep-based exercises
  duration?: string;       // For time-based exercises (e.g., "30 seconds")
  frequency: string;       // e.g., "2-3x daily", "once daily"
  holdTime?: string;       // For stretches (e.g., "30 seconds")
  restBetweenSets?: string; // e.g., "30-60 seconds"
}

export interface LibraryExercise {
  id: string;
  name: string;
  description: string;
  videoUrl?: string;         // YouTube video URL if available
  thumbnailUrl?: string;
  bodyParts: string[];       // e.g., ["lower back", "hip"]
  conditions: string[];      // e.g., ["sciatica", "herniated disc"]
  painTypes: string[];       // e.g., ["sharp", "aching", "stiffness"]
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'stretch' | 'strengthening' | 'mobility' | 'nerve_glide' | 'postural';
  dosage: ExerciseDosage;
  contraindications: string[];
  redFlagWarnings: string[];
  progressionTips: string[];
  regressionTips: string[];  // How to make it easier
  maxPainLevel: number;      // Don't recommend above this pain level (1-10)
}

// Curated exercise library from Dr. Lemmo's recommendations
export const exerciseLibrary: LibraryExercise[] = [
  // ============ LOWER BACK EXERCISES ============
  {
    id: 'cat-cow',
    name: 'Cat-Cow Stretch',
    description: 'A gentle spinal mobility exercise that alternates between arching and rounding the back to reduce stiffness and improve flexibility.',
    bodyParts: ['lower back', 'upper back', 'spine'],
    conditions: ['general back stiffness', 'muscle tension', 'posture issues'],
    painTypes: ['stiffness', 'aching', 'dull'],
    difficulty: 'Beginner',
    category: 'mobility',
    dosage: {
      sets: 2,
      reps: 10,
      frequency: '2-3x daily',
      restBetweenSets: '30 seconds',
    },
    contraindications: ['acute disc herniation', 'spinal fracture', 'severe spinal stenosis'],
    redFlagWarnings: ['Stop if you experience shooting pain down legs', 'Discontinue if numbness worsens'],
    progressionTips: ['Increase range of motion gradually', 'Add child\'s pose between sets'],
    regressionTips: ['Reduce range of motion', 'Perform on forearms instead of hands'],
    maxPainLevel: 7,
  },
  {
    id: 'prone-press-up',
    name: 'Prone Press-Up (McKenzie Extension)',
    description: 'Lie face down and gently press up through your arms while keeping hips on the floor. Helps centralize disc-related pain.',
    bodyParts: ['lower back', 'spine'],
    conditions: ['herniated disc', 'disc bulge', 'sciatica'],
    painTypes: ['sharp', 'shooting', 'radiating'],
    difficulty: 'Beginner',
    category: 'mobility',
    dosage: {
      sets: 3,
      reps: 10,
      holdTime: '2-3 seconds at top',
      frequency: 'Every 2 hours',
      restBetweenSets: '30 seconds',
    },
    contraindications: ['spinal stenosis', 'facet joint arthritis', 'spondylolisthesis'],
    redFlagWarnings: ['Stop immediately if pain radiates further down leg', 'Do not perform if causes increased numbness'],
    progressionTips: ['Hold at top position longer', 'Progress to standing extension'],
    regressionTips: ['Start with just propping on elbows', 'Limit how high you press'],
    maxPainLevel: 8,
  },
  {
    id: 'knee-to-chest',
    name: 'Single Knee to Chest Stretch',
    description: 'Lying on back, gently pull one knee toward chest while keeping other leg straight or bent. Stretches lower back and hip.',
    bodyParts: ['lower back', 'hip', 'glute'],
    conditions: ['lower back stiffness', 'hip tightness', 'muscle strain'],
    painTypes: ['aching', 'stiffness', 'tightness'],
    difficulty: 'Beginner',
    category: 'stretch',
    dosage: {
      sets: 2,
      reps: 5,
      holdTime: '20-30 seconds each side',
      frequency: '2-3x daily',
    },
    contraindications: ['acute disc herniation with radiculopathy', 'hip replacement (first 6 weeks)'],
    redFlagWarnings: ['Avoid if causes shooting leg pain'],
    progressionTips: ['Pull knee deeper toward chest', 'Add double knee to chest'],
    regressionTips: ['Use towel around thigh to pull', 'Keep opposite knee bent'],
    maxPainLevel: 6,
  },
  {
    id: 'bird-dog',
    name: 'Bird Dog Exercise',
    description: 'On hands and knees, extend opposite arm and leg while maintaining a neutral spine. Builds core stability.',
    bodyParts: ['lower back', 'core', 'glute'],
    conditions: ['core weakness', 'back instability', 'chronic low back pain'],
    painTypes: ['aching', 'weakness', 'instability'],
    difficulty: 'Beginner',
    category: 'strengthening',
    dosage: {
      sets: 2,
      reps: 10,
      holdTime: '5-10 seconds each side',
      frequency: 'Daily',
      restBetweenSets: '60 seconds',
    },
    contraindications: ['wrist pain', 'knee pain on all fours'],
    redFlagWarnings: ['Stop if back arches excessively'],
    progressionTips: ['Increase hold time', 'Add resistance band'],
    regressionTips: ['Do arm only, then leg only', 'Reduce range of motion'],
    maxPainLevel: 5,
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug Exercise',
    description: 'Lying on back with arms and legs raised, slowly lower opposite arm and leg while maintaining core brace.',
    bodyParts: ['lower back', 'core', 'hip flexor'],
    conditions: ['core weakness', 'lower back pain', 'posture issues'],
    painTypes: ['aching', 'weakness'],
    difficulty: 'Intermediate',
    category: 'strengthening',
    dosage: {
      sets: 2,
      reps: 10,
      frequency: 'Daily',
      restBetweenSets: '60 seconds',
    },
    contraindications: ['acute lower back injury'],
    redFlagWarnings: ['Lower back should stay flat - stop if arching'],
    progressionTips: ['Slow down movement', 'Add ankle weights'],
    regressionTips: ['Keep knees bent at 90 degrees', 'Move only legs at first'],
    maxPainLevel: 5,
  },
  {
    id: 'sciatic-nerve-glide',
    name: 'Sciatic Nerve Glide',
    description: 'Seated nerve mobilization to help reduce sciatic symptoms by gently gliding the nerve through surrounding tissues.',
    bodyParts: ['lower back', 'hip', 'leg'],
    conditions: ['sciatica', 'piriformis syndrome', 'nerve entrapment'],
    painTypes: ['shooting', 'tingling', 'numbness', 'radiating'],
    difficulty: 'Beginner',
    category: 'nerve_glide',
    dosage: {
      sets: 2,
      reps: 15,
      frequency: '3x daily',
      restBetweenSets: '30 seconds',
    },
    contraindications: ['acute disc herniation', 'cauda equina syndrome'],
    redFlagWarnings: ['Stop if symptoms worsen or spread further down leg', 'Should not increase numbness'],
    progressionTips: ['Increase range as symptoms improve'],
    regressionTips: ['Reduce range of motion', 'Perform lying down instead of seated'],
    maxPainLevel: 6,
  },

  // ============ NECK EXERCISES ============
  {
    id: 'chin-tuck',
    name: 'Chin Tuck Exercise',
    description: 'Gently draw chin back creating a "double chin" while keeping eyes level. Strengthens deep neck flexors and improves posture.',
    bodyParts: ['neck', 'upper back'],
    conditions: ['forward head posture', 'neck pain', 'cervicogenic headache', 'tech neck'],
    painTypes: ['aching', 'stiffness', 'tension'],
    difficulty: 'Beginner',
    category: 'postural',
    dosage: {
      sets: 3,
      reps: 10,
      holdTime: '5 seconds',
      frequency: 'Every hour when sitting',
    },
    contraindications: ['cervical radiculopathy (if causes arm pain)'],
    redFlagWarnings: ['Stop if causes dizziness or arm numbness'],
    progressionTips: ['Add resistance with finger on chin', 'Progress to lying down with towel roll'],
    regressionTips: ['Reduce hold time', 'Perform less intensely'],
    maxPainLevel: 7,
  },
  {
    id: 'neck-rotation',
    name: 'Gentle Neck Rotation',
    description: 'Slowly rotate head side to side within comfortable range. Improves neck mobility.',
    bodyParts: ['neck'],
    conditions: ['neck stiffness', 'cervical arthritis', 'muscle tension'],
    painTypes: ['stiffness', 'tightness'],
    difficulty: 'Beginner',
    category: 'mobility',
    dosage: {
      sets: 2,
      reps: 10,
      holdTime: '3-5 seconds each side',
      frequency: '2-3x daily',
    },
    contraindications: ['cervical instability', 'vertebral artery insufficiency'],
    redFlagWarnings: ['Stop if dizzy or nauseous', 'Avoid if causes arm symptoms'],
    progressionTips: ['Gently increase range over time'],
    regressionTips: ['Reduce range of motion', 'Perform lying down'],
    maxPainLevel: 6,
  },
  {
    id: 'upper-trap-stretch',
    name: 'Upper Trapezius Stretch',
    description: 'Gently tilt head to one side while anchoring opposite shoulder down. Stretches tight upper trap muscles.',
    bodyParts: ['neck', 'shoulder', 'upper back'],
    conditions: ['neck tension', 'shoulder tension', 'stress-related neck pain', 'headache'],
    painTypes: ['tension', 'tightness', 'aching'],
    difficulty: 'Beginner',
    category: 'stretch',
    dosage: {
      sets: 2,
      holdTime: '30 seconds each side',
      frequency: '3x daily',
    },
    contraindications: ['cervical disc herniation with arm symptoms'],
    redFlagWarnings: ['Should not cause arm pain or tingling'],
    progressionTips: ['Gently add hand pressure to deepen stretch'],
    regressionTips: ['Reduce angle of tilt', 'Hold for less time'],
    maxPainLevel: 6,
  },

  // ============ SHOULDER EXERCISES ============
  {
    id: 'pendulum',
    name: 'Pendulum Exercise',
    description: 'Lean forward with arm hanging, gently swing arm in circles. Promotes gentle shoulder mobility without stress.',
    bodyParts: ['shoulder'],
    conditions: ['frozen shoulder', 'rotator cuff injury', 'shoulder stiffness', 'post-surgical'],
    painTypes: ['stiffness', 'aching', 'limited motion'],
    difficulty: 'Beginner',
    category: 'mobility',
    dosage: {
      sets: 2,
      duration: '1-2 minutes',
      frequency: '3-4x daily',
    },
    contraindications: ['unstable shoulder dislocation'],
    redFlagWarnings: ['Should be pain-free or very minimal discomfort'],
    progressionTips: ['Hold light weight (1-2 lbs)', 'Increase circle size'],
    regressionTips: ['Smaller circles', 'Shorter duration'],
    maxPainLevel: 8,
  },
  {
    id: 'shoulder-external-rotation',
    name: 'Shoulder External Rotation',
    description: 'With elbow at side, rotate forearm outward against resistance. Strengthens rotator cuff.',
    bodyParts: ['shoulder', 'rotator cuff'],
    conditions: ['rotator cuff weakness', 'impingement', 'shoulder instability'],
    painTypes: ['weakness', 'aching'],
    difficulty: 'Beginner',
    category: 'strengthening',
    dosage: {
      sets: 3,
      reps: 15,
      frequency: 'Daily',
      restBetweenSets: '60 seconds',
    },
    contraindications: ['acute rotator cuff tear', 'acute shoulder dislocation'],
    redFlagWarnings: ['Stop if sharp pain occurs'],
    progressionTips: ['Increase resistance band strength'],
    regressionTips: ['Use lighter resistance', 'Reduce range'],
    maxPainLevel: 5,
  },
  {
    id: 'wall-angels',
    name: 'Wall Angels',
    description: 'Stand with back against wall, slide arms up and down like making a snow angel. Improves posture and shoulder mobility.',
    bodyParts: ['shoulder', 'upper back', 'thoracic spine'],
    conditions: ['poor posture', 'rounded shoulders', 'thoracic stiffness'],
    painTypes: ['stiffness', 'tightness'],
    difficulty: 'Intermediate',
    category: 'mobility',
    dosage: {
      sets: 2,
      reps: 10,
      frequency: 'Daily',
    },
    contraindications: ['acute shoulder injury', 'shoulder impingement (if painful)'],
    redFlagWarnings: ['Keep back flat against wall - stop if lower back arches'],
    progressionTips: ['Increase range of motion', 'Add band resistance'],
    regressionTips: ['Smaller range', 'Step feet further from wall'],
    maxPainLevel: 5,
  },

  // ============ KNEE EXERCISES ============
  {
    id: 'quad-set',
    name: 'Quad Set (Isometric)',
    description: 'Seated or lying, tighten thigh muscle by pressing knee down. Basic strengthening for quad activation.',
    bodyParts: ['knee', 'quadriceps'],
    conditions: ['knee pain', 'post-surgical', 'quad weakness', 'patellofemoral syndrome'],
    painTypes: ['aching', 'weakness', 'instability'],
    difficulty: 'Beginner',
    category: 'strengthening',
    dosage: {
      sets: 3,
      reps: 10,
      holdTime: '5-10 seconds',
      frequency: '3x daily',
    },
    contraindications: [],
    redFlagWarnings: ['Should be pain-free'],
    progressionTips: ['Increase hold time', 'Progress to straight leg raise'],
    regressionTips: ['Reduce hold time', 'Use towel roll under knee'],
    maxPainLevel: 8,
  },
  {
    id: 'straight-leg-raise',
    name: 'Straight Leg Raise',
    description: 'Lying on back, keep one leg straight and lift 12 inches off ground. Strengthens quads without bending knee.',
    bodyParts: ['knee', 'quadriceps', 'hip flexor'],
    conditions: ['knee weakness', 'patellofemoral syndrome', 'post-ACL surgery'],
    painTypes: ['weakness', 'instability'],
    difficulty: 'Beginner',
    category: 'strengthening',
    dosage: {
      sets: 3,
      reps: 10,
      holdTime: '3-5 seconds',
      frequency: 'Daily',
      restBetweenSets: '60 seconds',
    },
    contraindications: ['acute hip flexor strain'],
    redFlagWarnings: ['Keep back flat - stop if back arches'],
    progressionTips: ['Add ankle weight', 'Increase hold time'],
    regressionTips: ['Reduce height of lift', 'Bend opposite knee'],
    maxPainLevel: 6,
  },
  {
    id: 'heel-slides',
    name: 'Heel Slides',
    description: 'Lying on back, slide heel toward buttocks bending knee, then straighten. Improves knee range of motion.',
    bodyParts: ['knee'],
    conditions: ['knee stiffness', 'post-surgical', 'arthritis'],
    painTypes: ['stiffness', 'limited motion'],
    difficulty: 'Beginner',
    category: 'mobility',
    dosage: {
      sets: 2,
      reps: 15,
      frequency: '3x daily',
    },
    contraindications: [],
    redFlagWarnings: ['Should have minimal pain'],
    progressionTips: ['Use strap to increase range', 'Progress to active knee flexion'],
    regressionTips: ['Reduce range of motion', 'Use socks on smooth surface'],
    maxPainLevel: 6,
  },

  // ============ HIP EXERCISES ============
  {
    id: 'hip-flexor-stretch',
    name: 'Kneeling Hip Flexor Stretch',
    description: 'In half-kneeling position, shift weight forward to stretch front of hip. Addresses tight hip flexors from sitting.',
    bodyParts: ['hip', 'hip flexor', 'lower back'],
    conditions: ['hip tightness', 'lower back pain', 'anterior pelvic tilt'],
    painTypes: ['tightness', 'aching'],
    difficulty: 'Beginner',
    category: 'stretch',
    dosage: {
      sets: 2,
      holdTime: '30-60 seconds each side',
      frequency: '2x daily',
    },
    contraindications: ['knee pain on kneeling'],
    redFlagWarnings: ['Should feel stretch in front of hip, not pain in knee'],
    progressionTips: ['Raise arm overhead on stretch side', 'Add gentle trunk rotation'],
    regressionTips: ['Use cushion under knee', 'Reduce forward shift'],
    maxPainLevel: 5,
  },
  {
    id: 'piriformis-stretch',
    name: 'Piriformis Stretch (Figure 4)',
    description: 'Lying on back, cross ankle over opposite knee and pull toward chest. Stretches deep hip rotator.',
    bodyParts: ['hip', 'glute', 'piriformis'],
    conditions: ['piriformis syndrome', 'sciatica', 'hip tightness'],
    painTypes: ['aching', 'shooting', 'radiating'],
    difficulty: 'Beginner',
    category: 'stretch',
    dosage: {
      sets: 2,
      holdTime: '30-60 seconds each side',
      frequency: '2-3x daily',
    },
    contraindications: ['hip replacement', 'severe hip arthritis'],
    redFlagWarnings: ['Should not cause knee pain'],
    progressionTips: ['Pull deeper toward chest'],
    regressionTips: ['Rest foot on wall instead of pulling'],
    maxPainLevel: 6,
  },
  {
    id: 'clamshell',
    name: 'Clamshell Exercise',
    description: 'Lying on side with knees bent, lift top knee while keeping feet together. Strengthens hip abductors.',
    bodyParts: ['hip', 'glute'],
    conditions: ['hip weakness', 'IT band syndrome', 'patellofemoral syndrome', 'hip bursitis'],
    painTypes: ['weakness', 'aching'],
    difficulty: 'Beginner',
    category: 'strengthening',
    dosage: {
      sets: 3,
      reps: 15,
      frequency: 'Daily',
      restBetweenSets: '30 seconds',
    },
    contraindications: ['greater trochanteric bursitis (if painful)'],
    redFlagWarnings: ['Should not cause lateral hip pain'],
    progressionTips: ['Add resistance band around thighs'],
    regressionTips: ['Reduce range of motion', 'Rest head on arm'],
    maxPainLevel: 5,
  },

  // ============ ANKLE EXERCISES ============
  {
    id: 'ankle-abc',
    name: 'Ankle Alphabet',
    description: 'Draw letters of the alphabet with your foot to improve ankle mobility in all directions.',
    bodyParts: ['ankle', 'foot'],
    conditions: ['ankle sprain', 'ankle stiffness', 'post-fracture'],
    painTypes: ['stiffness', 'limited motion'],
    difficulty: 'Beginner',
    category: 'mobility',
    dosage: {
      sets: 1,
      reps: 1, // Full alphabet = 1 rep
      frequency: '3x daily',
    },
    contraindications: ['acute fracture'],
    redFlagWarnings: ['Stop if significant pain occurs'],
    progressionTips: ['Make letters larger', 'Do uppercase and lowercase'],
    regressionTips: ['Just do half the alphabet', 'Make smaller movements'],
    maxPainLevel: 6,
  },
  {
    id: 'calf-stretch',
    name: 'Standing Calf Stretch',
    description: 'Step one foot back, keep heel down and lean forward to stretch calf. Addresses tight calves.',
    bodyParts: ['ankle', 'calf'],
    conditions: ['calf tightness', 'plantar fasciitis', 'Achilles tendinitis'],
    painTypes: ['tightness', 'stiffness'],
    difficulty: 'Beginner',
    category: 'stretch',
    dosage: {
      sets: 2,
      holdTime: '30 seconds each side',
      frequency: '3x daily',
    },
    contraindications: ['acute Achilles rupture'],
    redFlagWarnings: ['Should be a stretch, not sharp pain'],
    progressionTips: ['Lean further forward', 'Add bent knee for soleus'],
    regressionTips: ['Reduce lean', 'Hold onto wall for balance'],
    maxPainLevel: 5,
  },

  // ============ ELBOW/WRIST EXERCISES ============
  {
    id: 'wrist-flexor-stretch',
    name: 'Wrist Flexor Stretch',
    description: 'Extend arm with palm up, use other hand to gently bend wrist back. Helps with golfer\'s elbow.',
    bodyParts: ['elbow', 'wrist', 'forearm'],
    conditions: ['golfer\'s elbow', 'wrist pain', 'forearm tightness'],
    painTypes: ['aching', 'tightness'],
    difficulty: 'Beginner',
    category: 'stretch',
    dosage: {
      sets: 2,
      holdTime: '30 seconds each arm',
      frequency: '3x daily',
    },
    contraindications: ['acute wrist fracture'],
    redFlagWarnings: ['Should be gentle stretch, not sharp pain'],
    progressionTips: ['Increase stretch intensity gradually'],
    regressionTips: ['Less pressure with other hand'],
    maxPainLevel: 5,
  },
  {
    id: 'wrist-extensor-stretch',
    name: 'Wrist Extensor Stretch',
    description: 'Extend arm with palm down, use other hand to gently bend wrist down. Helps with tennis elbow.',
    bodyParts: ['elbow', 'wrist', 'forearm'],
    conditions: ['tennis elbow', 'lateral epicondylitis', 'wrist pain'],
    painTypes: ['aching', 'tightness'],
    difficulty: 'Beginner',
    category: 'stretch',
    dosage: {
      sets: 2,
      holdTime: '30 seconds each arm',
      frequency: '3x daily',
    },
    contraindications: ['acute wrist fracture'],
    redFlagWarnings: ['Should be gentle stretch, not sharp pain'],
    progressionTips: ['Increase stretch intensity gradually'],
    regressionTips: ['Less pressure with other hand'],
    maxPainLevel: 5,
  },
];

/**
 * Body part mapping for flexible matching
 */
export const bodyPartAliases: Record<string, string[]> = {
  'lower back': ['lower back', 'lumbar', 'low back', 'lumbosacral'],
  'upper back': ['upper back', 'thoracic', 'mid back', 'middle back'],
  'neck': ['neck', 'cervical', 'cervicothoracic'],
  'shoulder': ['shoulder', 'rotator cuff', 'deltoid'],
  'elbow': ['elbow', 'forearm'],
  'wrist': ['wrist', 'hand', 'carpal'],
  'hip': ['hip', 'pelvis', 'groin'],
  'knee': ['knee', 'patella', 'patellar'],
  'ankle': ['ankle', 'foot', 'achilles'],
};

/**
 * Get exercises matching a specific body part
 */
export function getExercisesByBodyPart(bodyPart: string): LibraryExercise[] {
  const normalizedPart = bodyPart.toLowerCase();

  // Check direct match and aliases
  const matchingParts = Object.entries(bodyPartAliases)
    .filter(([_, aliases]) => aliases.some(alias => normalizedPart.includes(alias)))
    .map(([key]) => key);

  if (matchingParts.length === 0) {
    matchingParts.push(normalizedPart);
  }

  return exerciseLibrary.filter(exercise =>
    exercise.bodyParts.some(part =>
      matchingParts.some(matchPart =>
        part.toLowerCase().includes(matchPart) || matchPart.includes(part.toLowerCase())
      )
    )
  );
}

/**
 * Get exercises safe for a given pain level
 */
export function getExercisesByPainLevel(exercises: LibraryExercise[], painLevel: number): LibraryExercise[] {
  return exercises.filter(ex => ex.maxPainLevel >= painLevel);
}

/**
 * Get exercises matching pain type
 */
export function getExercisesByPainType(exercises: LibraryExercise[], painType: string): LibraryExercise[] {
  const types = painType.toLowerCase().split(/[,/]/).map(t => t.trim());

  return exercises.filter(ex =>
    ex.painTypes.some(pt =>
      types.some(t => pt.toLowerCase().includes(t) || t.includes(pt.toLowerCase()))
    )
  );
}

/**
 * Score and rank exercises based on match criteria
 */
export interface ExerciseMatchScore {
  exercise: LibraryExercise;
  score: number;
  matchReasons: string[];
}

export function scoreExercises(
  exercises: LibraryExercise[],
  criteria: {
    bodyPart: string;
    painLevel: number;
    painType: string;
    painDuration: string;
    symptoms: string[];
  }
): ExerciseMatchScore[] {
  return exercises.map(exercise => {
    let score = 0;
    const matchReasons: string[] = [];

    // Body part match (40 points)
    const bodyPartMatch = exercise.bodyParts.some(bp =>
      criteria.bodyPart.toLowerCase().includes(bp.toLowerCase()) ||
      bp.toLowerCase().includes(criteria.bodyPart.toLowerCase())
    );
    if (bodyPartMatch) {
      score += 40;
      matchReasons.push(`Targets ${criteria.bodyPart}`);
    }

    // Pain type match (20 points)
    const painTypes = criteria.painType.toLowerCase().split(/[,/]/).map(t => t.trim());
    const painTypeMatch = exercise.painTypes.some(pt =>
      painTypes.some(t => pt.includes(t) || t.includes(pt))
    );
    if (painTypeMatch) {
      score += 20;
      matchReasons.push(`Addresses ${criteria.painType} pain`);
    }

    // Difficulty appropriateness (20 points)
    const isChronicPain = criteria.painDuration.toLowerCase().includes('month');
    const highPain = criteria.painLevel >= 7;

    if (highPain && exercise.difficulty === 'Beginner') {
      score += 20;
      matchReasons.push('Gentle enough for high pain level');
    } else if (!highPain && exercise.difficulty !== 'Advanced') {
      score += 15;
      matchReasons.push('Appropriate difficulty level');
    }

    // Pain level safety (20 points)
    if (exercise.maxPainLevel >= criteria.painLevel) {
      score += 20;
      matchReasons.push('Safe for your current pain level');
    }

    // Symptom match bonus (up to 10 points)
    const symptomMatches = criteria.symptoms.filter(symptom =>
      exercise.conditions.some(condition =>
        condition.toLowerCase().includes(symptom.toLowerCase()) ||
        symptom.toLowerCase().includes(condition.toLowerCase())
      )
    );
    if (symptomMatches.length > 0) {
      score += Math.min(symptomMatches.length * 5, 10);
      matchReasons.push(`Addresses: ${symptomMatches.join(', ')}`);
    }

    return { exercise, score, matchReasons };
  })
  .sort((a, b) => b.score - a.score);
}
