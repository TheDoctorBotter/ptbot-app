/*
  # Outcome Measures Schema

  Creates tables for standardized outcome questionnaires:
  - ODI (Oswestry Disability Index) for back pain
  - KOOS (Knee Injury and Osteoarthritis Outcome Score) for knee pain
  - QuickDASH for shoulder/upper extremity
  - NPRS (Numeric Pain Rating Scale) for general pain
  - GROC (Global Rating of Change) for final assessment

  IMPORTANT: Questionnaire item text is stored as placeholders to avoid
  copyright issues. Licensed text can be added via DB update later.
*/

-- ============================================
-- TABLE: questionnaires
-- Defines available questionnaire types
-- ============================================
CREATE TABLE IF NOT EXISTS questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,  -- 'odi', 'koos', 'quickdash', 'nprs', 'groc'
  display_name text NOT NULL,
  body_region text NOT NULL,  -- 'back' | 'knee' | 'shoulder' | 'general'
  version text,
  is_active boolean DEFAULT true,
  scoring_type text NOT NULL,  -- 'percent_0_100' | 'sum' | 'nprs_0_10' | 'groc_-7_7'
  min_score numeric,
  max_score numeric,
  mcid numeric,  -- Minimal Clinically Important Difference
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- TABLE: questionnaire_items
-- Individual questions within each questionnaire
-- ============================================
CREATE TABLE IF NOT EXISTS questionnaire_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  item_key text NOT NULL,  -- e.g., 'ODI_Q1', 'KOOS_Q1'
  prompt_text text,  -- NULL or placeholder; insert licensed text later
  response_type text NOT NULL,  -- 'likert_0_5' | 'likert_1_5' | 'likert_0_4' | 'nprs_0_10' | 'groc_-7_7'
  response_options jsonb,  -- Optional: custom response labels
  display_order int NOT NULL,
  is_required boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(questionnaire_id, item_key)
);

-- ============================================
-- TABLE: outcome_assessments
-- One completed questionnaire instance per user
-- ============================================
CREATE TABLE IF NOT EXISTS outcome_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questionnaire_id uuid NOT NULL REFERENCES questionnaires(id),
  context_type text NOT NULL CHECK (context_type IN ('baseline', 'followup', 'final')),
  condition_tag text NOT NULL,  -- 'back' | 'knee' | 'shoulder'
  related_assessment_id uuid,  -- Link to main assessment record if applicable
  total_score numeric,
  normalized_score numeric,  -- 0-100 for percent tools; raw for nprs/groc
  interpretation text,  -- e.g., 'Moderate disability'
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- TABLE: outcome_responses
-- Individual item responses for each assessment
-- ============================================
CREATE TABLE IF NOT EXISTS outcome_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outcome_assessment_id uuid NOT NULL REFERENCES outcome_assessments(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES questionnaire_items(id) ON DELETE CASCADE,
  response_value numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(outcome_assessment_id, item_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_outcome_assessments_user_created
  ON outcome_assessments(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_outcome_assessments_user_questionnaire
  ON outcome_assessments(user_id, questionnaire_id, context_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_outcome_responses_assessment
  ON outcome_responses(outcome_assessment_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_items_questionnaire
  ON questionnaire_items(questionnaire_id, display_order);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_responses ENABLE ROW LEVEL SECURITY;

-- Questionnaires and items are publicly readable
CREATE POLICY "Questionnaires are publicly readable"
  ON questionnaires FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Questionnaire items are publicly readable"
  ON questionnaire_items FOR SELECT
  TO authenticated, anon
  USING (true);

-- Users can only see/modify their own outcome assessments
CREATE POLICY "Users can view own outcome assessments"
  ON outcome_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outcome assessments"
  ON outcome_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outcome assessments"
  ON outcome_assessments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only see/modify their own responses
CREATE POLICY "Users can view own outcome responses"
  ON outcome_responses FOR SELECT
  TO authenticated
  USING (
    outcome_assessment_id IN (
      SELECT id FROM outcome_assessments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own outcome responses"
  ON outcome_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    outcome_assessment_id IN (
      SELECT id FROM outcome_assessments WHERE user_id = auth.uid()
    )
  );

-- Clinicians can view their patients' outcomes
CREATE POLICY "Clinicians can view patient outcomes"
  ON outcome_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_patients cp
      JOIN clinic_staff cs ON cp.clinic_id = cs.clinic_id
      WHERE cp.patient_id = outcome_assessments.user_id
        AND cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Clinicians can view patient responses"
  ON outcome_responses FOR SELECT
  TO authenticated
  USING (
    outcome_assessment_id IN (
      SELECT oa.id FROM outcome_assessments oa
      JOIN clinic_patients cp ON cp.patient_id = oa.user_id
      JOIN clinic_staff cs ON cp.clinic_id = cs.clinic_id
      WHERE cs.user_id = auth.uid()
    )
  );
