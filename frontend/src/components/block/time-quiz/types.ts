import type { SaveAnswerResponse } from '@/types/quiz'

export interface TimeQuizStats {
  answeredCount: number
  skippedCount: number
  totalQuestions: number
  progressPercentage: number
}

export interface QuestionNavigationItem {
  index: number
  isCurrent: boolean
  isAnswered: boolean
  isSkipped: boolean
  isVisited: boolean
}

// Re-export types from main types
export type { SaveAnswerResponse } from '@/types/quiz' 