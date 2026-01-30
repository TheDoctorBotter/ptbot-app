/*
  # Exercise Video Library Schema

  This schema supports the exercise library feature with:
  1. Organized exercise sections (body parts/categories)
  2. YouTube video references with metadata
  3. User-specific saved exercises

  ## Tables
    - `exercise_sections`: Categories for organizing exercises (e.g., "Lower Back", "Neck")
    - `exercise_videos`: YouTube videos with exercise metadata
    - `user_saved_exercises`: User's saved/bookmarked exercises

  ## Security
    - RLS enabled on all tables
    - Public read access for sections and videos (educational content)
    - User-specific policies for saved exercises
*/

-- ============================================
-- Exercise Sections (Categories)
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_sections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  icon_name text,  -- Lucide icon name for display
  display_order int default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add index for ordering
CREATE INDEX idx_exercise_sections_order ON exercise_sections(display_order);

-- Enable RLS
ALTER TABLE exercise_sections ENABLE ROW LEVEL SECURITY;

-- Public read access (educational content)
CREATE POLICY "Exercise sections are publicly readable"
  ON exercise_sections
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- ============================================
-- Exercise Videos
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_videos (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references exercise_sections(id) on delete cascade,

  -- YouTube metadata
  youtube_video_id text not null unique,  -- e.g., "dQw4w9WgXcQ"
  title text not null,
  description text,
  thumbnail_url text,
  duration_seconds int,  -- Video duration

  -- Exercise metadata
  difficulty text check (difficulty in ('Beginner', 'Intermediate', 'Advanced')) default 'Beginner',
  body_parts text[] default '{}',  -- Array of targeted body parts
  conditions text[] default '{}',  -- Conditions this exercise helps
  keywords text[] default '{}',    -- Search keywords

  -- Dosage recommendations
  recommended_sets int,
  recommended_reps int,
  recommended_hold_seconds int,
  recommended_frequency text,  -- e.g., "2-3x daily"

  -- Safety
  contraindications text[] default '{}',
  safety_notes text[] default '{}',

  -- Display
  display_order int default 0,
  is_featured boolean default false,
  is_active boolean default true,

  -- Timestamps
  published_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for common queries
CREATE INDEX idx_exercise_videos_section ON exercise_videos(section_id);
CREATE INDEX idx_exercise_videos_difficulty ON exercise_videos(difficulty);
CREATE INDEX idx_exercise_videos_featured ON exercise_videos(is_featured) WHERE is_featured = true;
CREATE INDEX idx_exercise_videos_body_parts ON exercise_videos USING gin(body_parts);
CREATE INDEX idx_exercise_videos_conditions ON exercise_videos USING gin(conditions);
CREATE INDEX idx_exercise_videos_keywords ON exercise_videos USING gin(keywords);

-- Enable RLS
ALTER TABLE exercise_videos ENABLE ROW LEVEL SECURITY;

-- Public read access (educational content)
CREATE POLICY "Exercise videos are publicly readable"
  ON exercise_videos
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- ============================================
-- User Saved Exercises
-- ============================================
CREATE TABLE IF NOT EXISTS user_saved_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  video_id uuid references exercise_videos(id) on delete cascade not null,
  notes text,  -- User's personal notes
  created_at timestamp with time zone default now(),

  -- Ensure unique save per user per video
  UNIQUE(user_id, video_id)
);

-- Index for user lookups
CREATE INDEX idx_user_saved_exercises_user ON user_saved_exercises(user_id);

-- Enable RLS
ALTER TABLE user_saved_exercises ENABLE ROW LEVEL SECURITY;

-- Users can only access their own saved exercises
CREATE POLICY "Users can view their own saved exercises"
  ON user_saved_exercises
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can save exercises"
  ON user_saved_exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unsave their exercises"
  ON user_saved_exercises
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their saved exercise notes"
  ON user_saved_exercises
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- User Assessment History (for persistence)
-- ============================================
CREATE TABLE IF NOT EXISTS user_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Assessment data
  pain_level int check (pain_level >= 0 and pain_level <= 10),
  pain_location text not null,
  pain_duration text,
  pain_type text,
  mechanism_of_injury text,
  additional_symptoms text[] default '{}',
  red_flags text[] default '{}',

  -- Results
  risk_level text check (risk_level in ('low', 'moderate', 'high', 'critical')),
  recommendations jsonb,  -- Stores the full recommendation objects
  next_steps text[] default '{}',

  -- Timestamps
  created_at timestamp with time zone default now()
);

-- Index for user lookups
CREATE INDEX idx_user_assessments_user ON user_assessments(user_id);
CREATE INDEX idx_user_assessments_created ON user_assessments(created_at desc);

-- Enable RLS
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

-- Users can only access their own assessments
CREATE POLICY "Users can view their own assessments"
  ON user_assessments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own assessments"
  ON user_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- Seed Data: Initial Exercise Sections
-- ============================================
INSERT INTO exercise_sections (name, slug, description, icon_name, display_order) VALUES
  ('Lower Back', 'lower-back', 'Exercises for lumbar spine, sciatica, and lower back pain relief', 'Activity', 1),
  ('Upper Back', 'upper-back', 'Exercises for thoracic spine and mid-back pain', 'Activity', 2),
  ('Neck', 'neck', 'Exercises for cervical spine, neck pain, and headaches', 'Circle', 3),
  ('Shoulder', 'shoulder', 'Exercises for rotator cuff, frozen shoulder, and shoulder mobility', 'Target', 4),
  ('Hip', 'hip', 'Exercises for hip mobility, piriformis, and hip pain', 'Zap', 5),
  ('Knee', 'knee', 'Exercises for knee strengthening and patellofemoral pain', 'CircleDot', 6),
  ('Ankle & Foot', 'ankle-foot', 'Exercises for ankle mobility, plantar fasciitis, and foot pain', 'Footprints', 7),
  ('Elbow & Wrist', 'elbow-wrist', 'Exercises for tennis elbow, golfer''s elbow, and wrist pain', 'Hand', 8),
  ('Core & Stability', 'core-stability', 'Core strengthening and postural exercises', 'Shield', 9),
  ('Full Body', 'full-body', 'General mobility and stretching routines', 'Heart', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Helper Function: Validate YouTube URL
-- ============================================
CREATE OR REPLACE FUNCTION extract_youtube_video_id(url text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  video_id text;
BEGIN
  -- Handle various YouTube URL formats:
  -- https://www.youtube.com/watch?v=VIDEO_ID
  -- https://youtu.be/VIDEO_ID
  -- https://www.youtube.com/embed/VIDEO_ID
  -- https://www.youtube.com/v/VIDEO_ID

  -- Extract from watch?v= format
  IF url ~ 'youtube\.com/watch\?.*v=' THEN
    video_id := regexp_replace(url, '.*[?&]v=([a-zA-Z0-9_-]{11}).*', '\1');
  -- Extract from youtu.be format
  ELSIF url ~ 'youtu\.be/' THEN
    video_id := regexp_replace(url, '.*youtu\.be/([a-zA-Z0-9_-]{11}).*', '\1');
  -- Extract from embed format
  ELSIF url ~ 'youtube\.com/embed/' THEN
    video_id := regexp_replace(url, '.*youtube\.com/embed/([a-zA-Z0-9_-]{11}).*', '\1');
  -- Extract from v/ format
  ELSIF url ~ 'youtube\.com/v/' THEN
    video_id := regexp_replace(url, '.*youtube\.com/v/([a-zA-Z0-9_-]{11}).*', '\1');
  -- Assume it's already a video ID
  ELSIF url ~ '^[a-zA-Z0-9_-]{11}$' THEN
    video_id := url;
  ELSE
    video_id := NULL;
  END IF;

  -- Validate the extracted ID
  IF video_id IS NOT NULL AND length(video_id) = 11 THEN
    RETURN video_id;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Comment on the function
COMMENT ON FUNCTION extract_youtube_video_id IS 'Extracts and validates YouTube video ID from various URL formats';
