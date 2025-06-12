export type QuizType = 'mock_test' | 'time_quiz'

export interface QuizResult {
  id: string
  user_id: string
  quiz_type: QuizType
  title: string
  score: number
  total_questions: number
  correct_answers: number
  time_spent: number
  time_limit?: number
  started_at: string
  completed_at: string
  single_choice_correct: number
  multiple_choice_correct: number
  essay_correct: number
  single_choice_total: number
  multiple_choice_total: number
  essay_total: number
  status: string
  is_timed_out: boolean
  created_at: string
  updated_at: string
}

export interface UserStats {
  id: string
  user_id: string
  total_quizzes_completed: number
  average_score: number
  total_time_spent: number
  total_questions: number
  total_correct_answers: number
  mock_test_count: number
  time_quiz_count: number
  mock_test_average: number
  time_quiz_average: number
  single_choice_accuracy: number
  multiple_choice_accuracy: number
  essay_accuracy: number
  average_time_per_question: number
  fastest_quiz_time: number
  timeout_count: number
  current_streak: number
  longest_streak: number
  last_quiz_date: string
  weekly_goal: number
  weekly_progress: number
  target_average_score: number
  updated_at: string
}

export interface Achievement {
  id: string
  user_id: string
  type: string
  title: string
  description: string
  icon_name: string
  earned_at: string
}

export interface UserResultsResponse {
  results: QuizResult[]
  stats: UserStats
  achievements: Achievement[]
  total_count: number
}

export interface QuizResultRequest {
  quiz_type: QuizType
  score: number
  total_questions: number
  correct_answers: number
  time_spent: number
  time_limit?: number
  started_at: string
  is_timed_out?: boolean
  single_choice_correct?: number
  multiple_choice_correct?: number
  essay_correct?: number
  single_choice_total?: number
  multiple_choice_total?: number
  essay_total?: number
}

export interface QuizResultsFilter {
  quiz_type?: QuizType
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

export interface PerformanceSummary {
  mock_test: {
    count: number
    average: number
  }
  time_quiz: {
    count: number
    average: number
    timeout_rate: number
  }
  question_types: {
    single_choice: number
    multiple_choice: number
    essay: number
  }
  overall: {
    total_quizzes: number
    average_score: number
    total_time_spent: number
    average_time_per_question: number
    current_streak: number
    longest_streak: number
  }
  goals: {
    weekly_goal: number
    weekly_progress: number
    target_average_score: number
  }
} 