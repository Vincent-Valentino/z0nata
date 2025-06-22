import type { QuizSession, QuizType } from '@/types/quiz'
import { STORAGE_KEYS } from '@/types/quiz'

class QuizStorage {
  // Session Token Management
  setSessionToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token)
  }

  getSessionToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
  }

  clearSessionToken(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN)
  }

  // Quiz Type Management
  setQuizType(quizType: QuizType): void {
    localStorage.setItem(STORAGE_KEYS.QUIZ_TYPE, quizType)
  }

  getQuizType(): QuizType | null {
    const stored = localStorage.getItem(STORAGE_KEYS.QUIZ_TYPE)
    return stored as QuizType | null
  }

  clearQuizType(): void {
    localStorage.removeItem(STORAGE_KEYS.QUIZ_TYPE)
  }

  // Session Data Management
  setSessionData(session: QuizSession): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(session))
    } catch (error) {
      console.warn('Failed to save session data to localStorage:', error)
    }
  }

  getSessionData(): QuizSession | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION_DATA)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.warn('Failed to parse session data from localStorage:', error)
      return null
    }
  }

  clearSessionData(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION_DATA)
  }

  // Answers Management
  setAnswers(answers: Map<number, string | string[]>): void {
    try {
      const answersArray = Array.from(answers.entries())
      localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answersArray))
    } catch (error) {
      console.warn('Failed to save answers to localStorage:', error)
    }
  }

  getAnswers(): Map<number, string | string[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ANSWERS)
      if (stored) {
        const answersArray = JSON.parse(stored)
        return new Map(answersArray)
      }
    } catch (error) {
      console.warn('Failed to parse answers from localStorage:', error)
    }
    return new Map()
  }

  clearAnswers(): void {
    localStorage.removeItem(STORAGE_KEYS.ANSWERS)
  }

  // Timer Start Time (for persistent timer calculation)
  setTimerStart(startTime: string): void {
    localStorage.setItem(STORAGE_KEYS.TIMER_START, startTime)
  }

  getTimerStart(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TIMER_START)
  }

  clearTimerStart(): void {
    localStorage.removeItem(STORAGE_KEYS.TIMER_START)
  }

  // Current Question Index
  setCurrentQuestion(index: number): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_QUESTION, index.toString())
  }

  getCurrentQuestion(): number {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_QUESTION)
    return stored ? parseInt(stored, 10) : 0
  }

  clearCurrentQuestion(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_QUESTION)
  }

  // Clear All Quiz Data
  clearAllQuizData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }

  // Check if there's an active quiz session
  hasActiveSession(): boolean {
    return !!(this.getSessionToken() && this.getQuizType() && this.getSessionData())
  }

  // Get quiz session info for resume check
  getActiveSessionInfo(): { token: string; quizType: QuizType } | null {
    const token = this.getSessionToken()
    const quizType = this.getQuizType()
    
    if (token && quizType) {
      return { token, quizType }
    }
    
    return null
  }

  // Validate stored data integrity
  validateStoredData(): boolean {
    try {
      const sessionData = this.getSessionData()
      const sessionToken = this.getSessionToken()
      const quizType = this.getQuizType()

      // Check if we have the essential data
      if (!sessionData || !sessionToken || !quizType) {
        return false
      }

      // Check if session data matches stored token and type
      if (sessionData.session_token !== sessionToken || sessionData.quiz_type !== quizType) {
        console.warn('Quiz storage data mismatch detected')
        return false
      }

      return true
    } catch (error) {
      console.warn('Quiz storage validation failed:', error)
      return false
    }
  }

  // Calculate time remaining based on stored data
  calculateTimeRemaining(): number {
    const sessionData = this.getSessionData()
    if (!sessionData) return 0

    const startTime = new Date(sessionData.start_time)
    const now = new Date()
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
    const timeLimit = sessionData.time_limit_minutes * 60
    const remaining = timeLimit - elapsed

    return Math.max(0, remaining)
  }

  // Check if session has expired based on stored data
  isSessionExpired(): boolean {
    return this.calculateTimeRemaining() <= 0
  }

  // Get storage usage info (for debugging)
  getStorageInfo(): {
    hasToken: boolean
    hasQuizType: boolean
    hasSessionData: boolean
    hasAnswers: boolean
    answersCount: number
    isValid: boolean
    timeRemaining: number
  } {
    const answers = this.getAnswers()
    
    return {
      hasToken: !!this.getSessionToken(),
      hasQuizType: !!this.getQuizType(),
      hasSessionData: !!this.getSessionData(),
      hasAnswers: answers.size > 0,
      answersCount: answers.size,
      isValid: this.validateStoredData(),
      timeRemaining: this.calculateTimeRemaining()
    }
  }
}

export const quizStorage = new QuizStorage()
export default quizStorage 