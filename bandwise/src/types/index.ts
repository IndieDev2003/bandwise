// User and Auth Types
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  subscription_status: 'free' | 'pro';
  razorpay_customer_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  subscription_status: 'free' | 'pro';
  razorpay_customer_id: string | null;
  avatar_url: string | null;
  updated_at: string;
}

// Test Types
export type TestSection = 'reading' | 'listening' | 'writing' | 'speaking';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Test {
  id: string;
  section: TestSection;
  title: string;
  description: string | null;
  content_json: any;
  difficulty: DifficultyLevel;
  estimated_time: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Reading Test Types
export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  questions: ReadingQuestion[];
}

export type ReadingQuestionType = 'mcq' | 'true-false' | 'summary-completion' | 'matching';

export interface ReadingQuestion {
  id: string;
  type: ReadingQuestionType;
  question: string;
  options?: string[];
  correct_answer: string | string[];
  marks: number;
  passage_reference?: string;
}

// Listening Test Types
export interface ListeningAudio {
  id: string;
  url: string;
  duration: number;
  sections: ListeningSection[];
}

export interface ListeningSection {
  id: string;
  title?: string;
  start_time: number;
  end_time: number;
  instructions?: string;
  questions: ListeningQuestion[];
}

export type ListeningQuestionType = 'mcq' | 'form-completion' | 'table-completion' | 'matching';

export interface ListeningQuestion {
  id: string;
  type: ListeningQuestionType;
  question: string;
  options?: string[];
  correct_answer: string | string[];
  marks: number;
  timestamp?: number;
}

// Writing Test Types
export type TaskType = 'task1' | 'task2';

export interface WritingTask {
  id: string;
  task_type: TaskType;
  title?: string;
  prompt: string;
  instructions: string;
  min_words: number;
  max_words: number;
  suggested_time: number;
}

// Speaking Test Types
export type SpeakingPart = 1 | 2 | 3;

export interface SpeakingTask {
  id: string;
  part: SpeakingPart;
  title?: string;
  instructions: string;
  suggested_time: number;
  questions?: SpeakingQuestion[];
  cue_card?: {
    topic: string;
    points: string[];
  };
}

export interface SpeakingQuestion {
  id: string;
  question: string;
  follow_up?: string;
}

// User Attempt Types
export type AttemptStatus = 'in_progress' | 'completed' | 'submitted';

export interface UserAttempt {
  id: string;
  user_id: string;
  test_id: string;
  section: TestSection;
  answers_json: any;
  band_score: number | null;
  ai_feedback_json: any | null;
  status: AttemptStatus;
  time_taken: number | null;
  created_at: string;
  updated_at: string;
}

// AI Feedback Types
export interface AIFeedback {
  id: string;
  attempt_id: string;
  user_id: string;
  section: TestSection;
  overall_band: number;
  task_response_score?: number;
  task_response_feedback?: string;
  coherence_cohesion_score?: number;
  coherence_cohesion_feedback?: string;
  lexical_resource_score?: number;
  lexical_resource_feedback?: string;
  grammatical_range_accuracy_score?: number;
  grammatical_range_accuracy_feedback?: string;
  pronunciation_score?: number;
  pronunciation_feedback?: string;
  fluency_score?: number;
  fluency_feedback?: string;
  suggestions?: string[];
  generated_at: string;
}

// Payment Types
export type PaymentStatus = 'created' | 'paid' | 'failed' | 'refunded';
export type SubscriptionPlan = 'monthly' | 'yearly' | 'credits';

export interface Payment {
  id: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  plan: SubscriptionPlan;
  subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

// Subscription Types
export type SubscriptionState = 'active' | 'cancelled' | 'paused' | 'completed';

export interface Subscription {
  id: string;
  user_id: string;
  razorpay_subscription_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionState;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

// Audio Recording Types
export interface AudioRecording {
  id: string;
  user_id: string;
  attempt_id: string;
  section: TestSection;
  part: SpeakingPart;
  audio_url: string;
  transcript: string | null;
  duration: number | null;
  file_size: number | null;
  created_at: string;
}

// Writing Submission Types
export interface WritingSubmission {
  id: string;
  user_id: string;
  attempt_id: string;
  task_type: TaskType;
  prompt: string;
  response_text: string;
  word_count: number;
  time_taken: number | null;
  ai_feedback_id: string | null;
  band_score: number | null;
  created_at: string;
  updated_at: string;
}

// Dashboard Types
export interface ProgressData {
  date: string;
  section: TestSection;
  band_score: number;
  attempt_count: number;
}

export interface TestHistory {
  attempt_id: string;
  test_id: string;
  section: TestSection;
  title: string;
  band_score: number | null;
  time_taken: number | null;
  created_at: string;
  status: AttemptStatus;
}

// UI State Types
export interface TimerState {
  isRunning: boolean;
  timeRemaining: number;
  startTime: number | null;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Razorpay Types
export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

// Auth Session Type
export interface Session {
  user: User;
  access_token: string;
}
