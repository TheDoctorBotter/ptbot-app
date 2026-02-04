# PTBOT - AI-Powered Physical Therapy Assistant

A mobile application that provides AI-powered physical therapy triage, personalized exercise recommendations, and post-operative rehabilitation protocols. Built with React Native and Expo.

## Features

- **AI Assessment**: Interactive pain assessment with red flag screening and risk stratification
- **Exercise Recommendations**: Personalized exercise plans based on pain location, severity, and condition
- **Protocol Mode**: Post-operative rehabilitation protocols (TKA, ACL, Rotator Cuff, etc.) with phase-based progression
- **Exercise Library**: Curated video exercises from Dr. Justin Lemmo's YouTube channel
- **PDF Export**: Generate and share exercise plan PDFs
- **Clinic Branding**: White-label support for physical therapy clinics
- **Progress Tracking**: Dashboard with assessment history and exercise recommendations

## Tech Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: React Hooks + Context
- **Navigation**: Expo Router
- **Styling**: React Native StyleSheet
- **Icons**: Lucide React Native

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/TheDoctorBotter/ptbot-app.git
cd ptbot-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your Supabase credentials in `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npx expo start
```

5. Run on your device:
- Scan the QR code with Expo Go (iOS/Android)
- Press `i` for iOS simulator
- Press `a` for Android emulator

## Project Structure

```
ptbot-app/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Dashboard
│   │   ├── assessment.tsx # AI Assessment flow
│   │   ├── exercises.tsx  # Exercise library
│   │   └── account.tsx    # User account
│   └── assessment/        # Assessment flow screens
├── components/
│   ├── account/           # Account settings components
│   ├── assessment/        # Assessment UI components
│   ├── dashboard/         # Dashboard components
│   └── shared/            # Shared/reusable components
├── services/
│   ├── assessmentService.ts       # Assessment logic
│   ├── exerciseRecommendationService.ts  # Exercise matching
│   ├── protocolExerciseService.ts # Protocol management
│   └── sharePlanService.ts        # PDF/share functionality
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configs
├── constants/             # Theme and constants
└── supabase/
    └── migrations/        # Database migrations
```

## Database Schema

Key tables:
- `assessments` - User pain assessments and results
- `exercise_videos` - Exercise library with YouTube links
- `protocols` - Post-op rehabilitation protocols
- `protocol_phases` - Phase definitions for each protocol
- `protocol_phase_exercises` - Exercise assignments per phase
- `user_favorites` - Saved exercises per user
- `clinic_branding` - White-label clinic customization

## Key Features

### Assessment Flow
1. Pain location selection
2. Pain severity rating (0-10)
3. Red flag screening
4. Risk stratification (Low/Medium/High)
5. Post-op protocol detection
6. Personalized exercise recommendations

### Protocol Mode
Supports structured rehabilitation for:
- Total Knee Arthroplasty (TKA)
- ACL Reconstruction
- Rotator Cuff Repair
- And more...

Each protocol includes:
- Multiple phases with week ranges
- Phase-specific exercises
- Safety precautions
- Progression criteria

### Exercise Library
- Body part filtering
- AI-powered exercise search
- YouTube video integration
- Favorite/save functionality
- Dosage recommendations (sets, reps, hold time)

## Development

### Running Migrations
```bash
npx supabase db push
```

### Building for Production
```bash
npx expo build:ios
npx expo build:android
```

### EAS Build
```bash
npx eas build --platform ios
npx eas build --platform android
```

## License

This project is proprietary and confidential. All rights reserved by Dr. Justin Lemmo, DPT.

## Contact

- **Email**: justinlemmodpt@gmail.com
- **YouTube**: [@justinlemmodpt](https://www.youtube.com/@justinlemmodpt)
- **Website**: [justinlemmodpt.com](https://justinlemmodpt.com)
