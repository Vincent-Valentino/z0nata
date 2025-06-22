export interface QuestionStats {
  total: number
  answered: number
  skipped: number
  easy: number
  medium: number
  hard: number
  easyAnswered: number
  mediumAnswered: number
  hardAnswered: number
}

export interface QuestionFilter {
  difficulty: 'all' | 'easy' | 'medium' | 'hard'
  status: 'all' | 'answered' | 'unanswered' | 'skipped'
  type: 'all' | 'single_choice' | 'multiple_choice'
}

export interface FilteredQuestion {
  question: SessionQuestion
  index: number
}

// Re-export from types/quiz for convenience
export type { SessionQuestion } from '@/types/quiz' 