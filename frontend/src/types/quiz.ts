export type QuizType = 'mock_test' | 'time_quiz'

export type QuizStatus = 'in_progress' | 'completed' | 'timeout' | 'abandoned'

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export type QuestionType = 'single_choice' | 'multiple_choice' | 'essay'

export interface Option {
  id: string
  text: string
  isCorrect?: boolean // Only used in admin/results view
}

export interface SessionQuestion {
  question_id: string
  title: string
  type: QuestionType
  difficulty: DifficultyLevel
  points: number
  options: Option[]
  correct_answers?: string[] // Hidden from frontend during quiz
  user_answer?: string | string[]
  is_answered: boolean
  is_skipped: boolean
  is_correct?: boolean
  points_earned: number
  time_spent: number
  first_attempt_at?: string
  last_modified_at?: string
  visit_count: number
}

export interface QuizSession {
  id: string
  user_id: string
  quiz_type: QuizType
  session_token: string
  
  // Quiz Configuration
  total_questions: number
  max_points: number
  time_limit_minutes: number
  
  // Questions
  questions: SessionQuestion[]
  
  // Timing
  start_time: string
  end_time?: string
  time_remaining: number // seconds left
  
  // Progress
  current_question: number // 0-based index
  answered_count: number
  skipped_count: number
  
  // Status
  status: QuizStatus
  is_submitted: boolean
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface QuestionResult {
  question_id: string
  title: string
  type: QuestionType
  difficulty: DifficultyLevel
  points: number
  user_answer: string | string[]
  correct_answer: string | string[]
  is_correct: boolean
  is_skipped: boolean
  points_earned: number
  time_spent: number
  options: Option[]
}

export interface DetailedQuizResult {
  id: string
  user_id: string
  session_id: string
  quiz_type: QuizType
  
  // Basic Info
  title: string
  score: number // 0-100 percentage
  total_questions: number
  correct_answers: number
  wrong_answers: number
  skipped_questions: number
  
  // Enhanced Scoring
  total_points: number
  earned_points: number
  time_bonus: number
  final_score: number
  score_percentage: number
  
  // Timing
  time_limit_minutes: number
  time_used_seconds: number
  time_left_seconds: number
  started_at: string
  completed_at: string
  
  // Performance by Difficulty
  easy_correct: number
  easy_total: number
  medium_correct: number
  medium_total: number
  hard_correct: number
  hard_total: number
  
  // Detailed Results
  question_results: QuestionResult[]
  
  // Status
  completion_status: QuizStatus
  submitted_at: string
  is_timed_out: boolean
}

// API Request Types
export interface StartQuizRequest {
  quiz_type: QuizType
}

export interface StartQuizResponse {
  session: QuizSession
  message: string
  resume_token: string
}

export interface SaveAnswerRequest {
  question_index: number
  answer: string | string[]
  time_spent: number
}

export interface SaveAnswerResponse {
  success: boolean
  is_correct?: boolean // Only for TimeQuiz
  correct_answer?: string | string[]
  points_earned?: number
  sample_answer?: string // For essay questions in TimeQuiz
  message: string
}

export interface NavigateQuestionRequest {
  question_index: number
}

export interface SkipQuestionRequest {
  question_index: number
  time_spent: number
}

export interface SubmitQuizRequest {
  session_token: string
}

export interface SubmitQuizResponse {
  result: DetailedQuizResult
  success: boolean
  message: string
}

export interface GetSessionResponse {
  session: QuizSession
  time_remaining: number
  is_expired: boolean
}

export interface ResumeSessionResponse {
  has_active_session: boolean
  session?: GetSessionResponse
  resume_token?: string
  message: string
}

// Frontend State Types
export interface QuizState {
  // Current Session
  session: QuizSession | null
  isLoading: boolean
  error: string | null
  
  // Timer
  timeRemaining: number
  isExpired: boolean
  timerInterval: NodeJS.Timeout | null
  
  // Navigation
  currentQuestionIndex: number
  answeredQuestions: Set<number>
  skippedQuestions: Set<number>
  visitedQuestions: Set<number>
  
  // Quiz Progress
  totalQuestions: number
  answeredCount: number
  skippedCount: number
  progressPercentage: number
  
  // User Interaction
  answers: Map<number, string | string[]>
  questionStartTime: number | null
  isSubmitting: boolean
  
  // Results
  result: DetailedQuizResult | null
  showResults: boolean
}

export interface QuizConfig {
  type: QuizType
  max_points: number
  time_limit_minutes: number
  easy_questions: number
  medium_questions: number
  hard_questions: number
  total_questions: number
  easy_points: number
  medium_points: number
  hard_points: number
}

// Quiz Navigation Types
export interface QuestionNavigationItem {
  index: number
  isAnswered: boolean
  isSkipped: boolean
  isVisited: boolean
  isCurrent: boolean
}

// Local Storage Keys
export const STORAGE_KEYS = {
  SESSION_TOKEN: 'quiz_session_token',
  QUIZ_TYPE: 'quiz_type',
  SESSION_DATA: 'quiz_session_data',
  ANSWERS: 'quiz_answers',
  TIMER_START: 'quiz_timer_start',
  CURRENT_QUESTION: 'quiz_current_question'
} as const

// Quiz Constants
export const QUIZ_CONSTANTS = {
  MOCK_TEST: {
    TIME_LIMIT: 60, // minutes
    MAX_POINTS: 1000,
    MIN_QUESTIONS: 50,
    MAX_QUESTIONS: 100
  },
  TIME_QUIZ: {
    TIME_LIMIT: 5, // minutes
    MAX_POINTS: 200,
    TOTAL_QUESTIONS: 20,
    TIME_BONUS_MAX: 50
  },
  AUTO_SAVE_INTERVAL: 2000, // 2 seconds
  TIMER_UPDATE_INTERVAL: 1000, // 1 second
  WARNING_TIMES: [300, 60, 30], // Warning at 5min, 1min, 30sec left
} as const 