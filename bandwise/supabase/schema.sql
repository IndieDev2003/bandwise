-- BandWise Database Schema
-- PostgreSQL for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE subscription_status AS ENUM ('free', 'pro');
CREATE TYPE test_section AS ENUM ('reading', 'listening', 'writing', 'speaking');
CREATE TYPE question_type AS ENUM ('mcq', 'true-false', 'summary-completion', 'matching', 'form-completion', 'table-completion');
CREATE TYPE task_type AS ENUM ('task1', 'task2');
CREATE TYPE speaking_part AS ENUM ('part1', 'part2', 'part3');
CREATE TYPE attempt_status AS ENUM ('in_progress', 'completed', 'submitted');
CREATE TYPE payment_status AS ENUM ('created', 'paid', 'failed', 'refunded');
CREATE TYPE subscription_plan AS ENUM ('monthly', 'yearly', 'credits');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- ============================================
-- PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  email TEXT NOT NULL,
  subscription_status subscription_status NOT NULL DEFAULT 'free',
  razorpay_customer_id TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Update updated_at on profile changes
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================
-- TESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tests (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  section test_section NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_json JSONB NOT NULL, -- Module-specific content
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  estimated_time INTEGER NOT NULL, -- in minutes
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users
);

-- Update updated_at on test changes
CREATE OR REPLACE FUNCTION update_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tests_updated_at_trigger
  BEFORE UPDATE ON tests
  FOR EACH ROW
  EXECUTE FUNCTION update_tests_updated_at();

-- ============================================
-- USER ATTEMPTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_attempts (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  test_id UUID REFERENCES tests NOT NULL,
  section test_section NOT NULL,
  answers_json JSONB NOT NULL, -- User's answers
  band_score NUMERIC(3,1), -- Calculated band score (0-9)
  ai_feedback_json JSONB, -- AI-generated feedback
  status attempt_status NOT NULL DEFAULT 'in_progress',
  time_taken INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Update updated_at on attempt changes
CREATE OR REPLACE FUNCTION update_user_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_attempts_updated_at_trigger
  BEFORE UPDATE ON user_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_attempts_updated_at();

-- ============================================
-- PAYMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT NOT NULL,
  amount BIGINT NOT NULL, -- in paise (INR)
  currency TEXT NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'created',
  plan subscription_plan NOT NULL,
  subscription_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Update updated_at on payment changes
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at_trigger
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  razorpay_subscription_id TEXT NOT NULL,
  plan subscription_plan NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Update updated_at on subscription changes
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at_trigger
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================
-- AI FEEDBACK TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  attempt_id UUID REFERENCES user_attempts NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  section test_section NOT NULL,
  overall_band NUMERIC(3,1) NOT NULL,
  task_response_score NUMERIC(3,1),
  task_response_feedback TEXT,
  coherence_cohesion_score NUMERIC(3,1),
  coherence_cohesion_feedback TEXT,
  lexical_resource_score NUMERIC(3,1),
  lexical_resource_feedback TEXT,
  grammatical_range_accuracy_score NUMERIC(3,1),
  grammatical_range_accuracy_feedback TEXT,
  pronunciation_score NUMERIC(3,1),
  pronunciation_feedback TEXT,
  fluency_score NUMERIC(3,1),
  fluency_feedback TEXT,
  suggestions JSONB,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- AUDIO RECORDINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audio_recordings (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  attempt_id UUID REFERENCES user_attempts NOT NULL,
  section test_section NOT NULL DEFAULT 'speaking',
  part speaking_part NOT NULL,
  audio_url TEXT NOT NULL, -- Supabase Storage URL
  transcript TEXT,
  duration INTEGER, -- in seconds
  file_size BIGINT, -- in bytes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- WRITING SUBMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS writing_submissions (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  attempt_id UUID REFERENCES user_attempts NOT NULL,
  task_type task_type NOT NULL,
  prompt TEXT NOT NULL,
  response_text TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  time_taken INTEGER, -- in seconds
  ai_feedback_id UUID REFERENCES ai_feedback,
  band_score NUMERIC(3,1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Update updated_at on writing submission changes
CREATE OR REPLACE FUNCTION update_writing_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_writing_submissions_updated_at_trigger
  BEFORE UPDATE ON writing_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_writing_submissions_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_submissions ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS POLICIES
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- TESTS RLS POLICIES
CREATE POLICY "Public read access to active tests" ON tests
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Authenticated users can create tests" ON tests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Test creators can update their tests" ON tests
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Test creators can delete their tests" ON tests
  FOR DELETE USING (auth.uid() = created_by);

-- USER ATTEMPTS RLS POLICIES
CREATE POLICY "Users can view their own attempts" ON user_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attempts" ON user_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts" ON user_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- PAYMENTS RLS POLICIES
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SUBSCRIPTIONS RLS POLICIES
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- AI FEEDBACK RLS POLICIES
CREATE POLICY "Users can view their own AI feedback" ON ai_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- AUDIO RECORDINGS RLS POLICIES
CREATE POLICY "Users can view their own audio recordings" ON audio_recordings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audio recordings" ON audio_recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WRITING SUBMISSIONS RLS POLICIES
CREATE POLICY "Users can view their own writing submissions" ON writing_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own writing submissions" ON writing_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own writing submissions" ON writing_submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_razorpay_customer_id ON profiles(razorpay_customer_id);

CREATE INDEX IF NOT EXISTS idx_tests_section ON tests(section);
CREATE INDEX IF NOT EXISTS idx_tests_difficulty ON tests(difficulty);
CREATE INDEX IF NOT EXISTS idx_tests_is_active ON tests(is_active);

CREATE INDEX IF NOT EXISTS idx_user_attempts_user_id ON user_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_attempts_test_id ON user_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_user_attempts_section ON user_attempts(section);
CREATE INDEX IF NOT EXISTS idx_user_attempts_status ON user_attempts(status);
CREATE INDEX IF NOT EXISTS idx_user_attempts_created_at ON user_attempts(created_at);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_attempt_id ON ai_feedback(attempt_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_audio_recordings_user_id ON audio_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_submissions_user_id ON writing_submissions(user_id);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert sample reading test
INSERT INTO tests (section, title, description, content_json, difficulty, estimated_time, is_active) 
VALUES (
  'reading',
  'Reading Practice Test 1 - The History of Writing',
  'Academic Reading Practice Test - Passage about the history and evolution of writing systems',
  '{
    "passages": [
      {
        "id": "passage-1",
        "title": "The History of Writing",
        "content": "Writing is one of the most significant inventions in human history. It allows us to record information, communicate across distances, and preserve knowledge for future generations. The earliest known writing systems appeared around 3200 BCE in Mesopotamia, where the Sumerians developed cuneiform script. This system used wedge-shaped marks on clay tablets to represent words and sounds.\n\nAround the same time, ancient Egyptians developed hieroglyphic writing, which used pictures to represent objects and sounds. The Egyptian writing system was more complex than cuneiform and was primarily used for religious texts and official documents.\n\nThe development of alphabetic writing systems marked a significant advancement. The Phoenician alphabet, developed around 1200 BCE, used symbols to represent individual sounds rather than whole words or syllables. This innovation made writing more accessible and efficient. The Greek alphabet, which developed from the Phoenician system, added symbols for vowel sounds, making it one of the first true alphabets.\n\nWriting systems continued to evolve throughout history. The Roman alphabet, which forms the basis for many modern writing systems, was developed from the Greek alphabet. The invention of the printing press in the 15th century by Johannes Gutenberg revolutionized the spread of written information, making books more accessible to the general public.",
        "questions": [
          {
            "id": "q1",
            "type": "mcq",
            "question": "What was the primary purpose of writing according to the passage?",
            "options": [
              "To entertain people",
              "To record information, communicate across distances, and preserve knowledge",
              "To create art",
              "To make money"
            ],
            "correct_answer": "To record information, communicate across distances, and preserve knowledge",
            "marks": 1
          },
          {
            "id": "q2",
            "type": "mcq",
            "question": "Which civilization developed the cuneiform script?",
            "options": ["Egyptians", "Sumerians", "Greeks", "Romans"],
            "correct_answer": "Sumerians",
            "marks": 1
          },
          {
            "id": "q3",
            "type": "true-false",
            "question": "Hieroglyphic writing was simpler than cuneiform.",
            "correct_answer": "false",
            "marks": 1
          },
          {
            "id": "q4",
            "type": "true-false",
            "question": "The Phoenician alphabet used symbols for individual sounds.",
            "correct_answer": "true",
            "marks": 1
          },
          {
            "id": "q5",
            "type": "summary-completion",
            "question": "Complete the sentence: The ______ alphabet added symbols for vowel sounds.",
            "correct_answer": "Greek",
            "marks": 1
          },
          {
            "id": "q6",
            "type": "matching",
            "question": "Match the writing systems with their civilizations",
            "options": ["Cuneiform", "Hieroglyphic", "Phoenician", "Greek"],
            "correct_answer": ["Sumerians", "Egyptians", "Phoenicians", "Greeks"],
            "marks": 2
          }
        ]
      }
    ]
  }'::JSONB,
  'medium',
  60,
  TRUE
);

-- Insert sample listening test
INSERT INTO tests (section, title, description, content_json, difficulty, estimated_time, is_active)
VALUES (
  'listening',
  'Listening Practice Test 1 - University Orientation',
  'Academic Listening Practice Test - Conversation about university orientation',
  '{
    "audio_url": "/audio/listening-university-orientation.mp3",
    "duration": 1200,
    "sections": [
      {
        "id": "section-1",
        "title": "University Orientation",
        "start_time": 0,
        "end_time": 600,
        "instructions": "Listen to the conversation and answer the questions",
        "questions": [
          {
            "id": "q1",
            "type": "mcq",
            "question": "What is the main purpose of the orientation program?",
            "options": [
              "To introduce new students to the campus",
              "To register for classes",
              "To pay tuition fees",
              "To graduate"
            ],
            "correct_answer": "To introduce new students to the campus",
            "marks": 1,
            "timestamp": 30
          },
          {
            "id": "q2",
            "type": "form-completion",
            "question": "The orientation starts at ______ AM.",
            "correct_answer": "9:00",
            "marks": 1,
            "timestamp": 60
          },
          {
            "id": "q3",
            "type": "mcq",
            "question": "Where will the campus tour begin?",
            "options": ["Library", "Student Center", "Main Gate", "Cafeteria"],
            "correct_answer": "Main Gate",
            "marks": 1,
            "timestamp": 120
          }
        ]
      }
    ]
  }'::JSONB,
  'medium',
  30,
  TRUE
);

-- Insert sample writing test
INSERT INTO tests (section, title, description, content_json, difficulty, estimated_time, is_active)
VALUES (
  'writing',
  'Writing Practice Test 1',
  'Academic Writing Practice Test - Task 1 and Task 2',
  '{
    "tasks": [
      {
        "id": "task1-1",
        "task_type": "task1",
        "title": "Task 1: Academic",
        "prompt": "The graph below shows the number of international students studying in four different countries from 2010 to 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "instructions": "Write at least 150 words. Spend about 20 minutes on this task.",
        "min_words": 150,
        "max_words": 200,
        "suggested_time": 20
      },
      {
        "id": "task2-1",
        "task_type": "task2",
        "title": "Task 2: Essay",
        "prompt": "Some people believe that universities should focus more on practical skills rather than theoretical knowledge. To what extent do you agree or disagree?",
        "instructions": "Write at least 250 words. Give reasons for your answer and include any relevant examples from your own knowledge or experience. Spend about 40 minutes on this task.",
        "min_words": 250,
        "max_words": 300,
        "suggested_time": 40
      }
    ]
  }'::JSONB,
  'medium',
  60,
  TRUE
);

-- Insert sample speaking test
INSERT INTO tests (section, title, description, content_json, difficulty, estimated_time, is_active)
VALUES (
  'speaking',
  'Speaking Practice Test 1',
  'IELTS Speaking Practice Test - Parts 1, 2, and 3',
  '{
    "parts": [
      {
        "id": "part1-1",
        "part": 1,
        "title": "Part 1: Introduction and Interview",
        "instructions": "Answer the examiner\'s questions naturally. Give extended responses where appropriate.",
        "suggested_time": 4,
        "questions": [
          {
            "id": "q1",
            "question": "Let\'s talk about your hometown. Where are you from?",
            "follow_up": "What do you like most about your hometown?"
          },
          {
            "id": "q2",
            "question": "Do you like reading books?",
            "follow_up": "What kind of books do you enjoy reading?"
          }
        ]
      },
      {
        "id": "part2-1",
        "part": 2,
        "title": "Part 2: Long Turn",
        "instructions": "You will have 1 minute to prepare, then speak for 1-2 minutes on the topic.",
        "suggested_time": 3,
        "cue_card": {
          "topic": "Describe a person who has influenced you the most in your life",
          "points": [
            "Who this person is",
            "How you know them",
            "What they have done to influence you",
            "And explain why they are important to you"
          ]
        }
      },
      {
        "id": "part3-1",
        "part": 3,
        "title": "Part 3: Discussion",
        "instructions": "Discuss the topic in more depth with the examiner.",
        "suggested_time": 5,
        "questions": [
          {
            "id": "q1",
            "question": "How do you think role models influence young people?",
            "follow_up": "Do you think the influence of role models has changed over time?"
          },
          {
            "id": "q2",
            "question": "What qualities do you think make someone a good role model?",
            "follow_up": "Can you give an example of someone who demonstrates these qualities?"
          }
        ]
      }
    ]
  }'::JSONB,
  'medium',
  15,
  TRUE
);

COMMENT ON TABLE profiles IS 'User profiles with subscription information';
COMMENT ON TABLE tests IS 'IELTS test modules (reading, listening, writing, speaking)';
COMMENT ON TABLE user_attempts IS 'User attempts at tests with answers and scores';
COMMENT ON TABLE payments IS 'Payment records for subscriptions';
COMMENT ON TABLE subscriptions IS 'User subscription information';
COMMENT ON TABLE ai_feedback IS 'AI-generated feedback for writing and speaking attempts';
COMMENT ON TABLE audio_recordings IS 'Audio recordings for speaking module';
COMMENT ON TABLE writing_submissions IS 'Writing task submissions with AI feedback';
