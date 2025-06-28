import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import type { 
  QuizState, 
  QuizType, 
  QuizSession, 
  DetailedQuizResult,
  SessionQuestion,
  SaveAnswerResponse 
} from '@/types/quiz'
import { QUIZ_CONSTANTS } from '@/types/quiz'
import { quizService } from '@/services/quizService'
import { quizStorage } from '@/lib/quizStorage'

// Action Types
type QuizAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION'; payload: QuizSession }
  | { type: 'SET_TIME_REMAINING'; payload: number }
  | { type: 'SET_EXPIRED'; payload: boolean }
  | { type: 'SET_CURRENT_QUESTION'; payload: number }
  | { type: 'SET_ANSWER'; payload: { questionIndex: number; answer: string | string[] } }
  | { type: 'MARK_QUESTION_VISITED'; payload: number }
  | { type: 'MARK_QUESTION_ANSWERED'; payload: number }
  | { type: 'MARK_QUESTION_SKIPPED'; payload: number }
  | { type: 'UPDATE_PROGRESS'; payload: { answered: number; skipped: number } }
  | { type: 'SET_QUESTION_START_TIME'; payload: number | null }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_RESULT'; payload: DetailedQuizResult }
  | { type: 'SHOW_RESULTS'; payload: boolean }
  | { type: 'RESET_QUIZ' }
  | { type: 'RESTORE_FROM_STORAGE'; payload: Partial<QuizState> }
  | { type: 'SET_TIMER_INTERVAL'; payload: NodeJS.Timeout | null }

// Initial State
const initialState: QuizState = {
  // Current Session
  session: null,
  isLoading: false,
  error: null,

  // Timer
  timeRemaining: 0,
  isExpired: false,
  timerInterval: null,

  // Navigation
  currentQuestionIndex: 0,
  answeredQuestions: new Set(),
  skippedQuestions: new Set(),
  visitedQuestions: new Set(),

  // Quiz Progress
  totalQuestions: 0,
  answeredCount: 0,
  skippedCount: 0,
  progressPercentage: 0,

  // User Interaction
  answers: new Map(),
  questionStartTime: null,
  isSubmitting: false,

  // Results
  result: null,
  showResults: false
}

// Reducer
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'SET_SESSION':
      const session = action.payload
      const answeredQuestions = new Set<number>()
      const skippedQuestions = new Set<number>()
      const visitedQuestions = new Set<number>()
      
      // Rebuild question states from session data
      session.questions.forEach((question, index) => {
        if (question.is_answered) {
          answeredQuestions.add(index)
        }
        if (question.is_skipped) {
          skippedQuestions.add(index)
        }
        if (question.visit_count > 0) {
          visitedQuestions.add(index)
        }
      })

      return {
        ...state,
        session,
        totalQuestions: session.total_questions,
        currentQuestionIndex: session.current_question,
        answeredCount: session.answered_count,
        skippedCount: session.skipped_count,
        answeredQuestions,
        skippedQuestions,
        visitedQuestions,
        progressPercentage: ((session.answered_count + session.skipped_count) / session.total_questions) * 100
      }

    case 'SET_TIME_REMAINING':
      return { ...state, timeRemaining: action.payload }

    case 'SET_EXPIRED':
      return { ...state, isExpired: action.payload }

    case 'SET_CURRENT_QUESTION':
      const newIndex = action.payload
      const newVisited = new Set(state.visitedQuestions)
      newVisited.add(newIndex)
      
      return {
        ...state,
        currentQuestionIndex: newIndex,
        visitedQuestions: newVisited,
        questionStartTime: Date.now()
      }

    case 'SET_ANSWER':
      const { questionIndex, answer } = action.payload
      const newAnswers = new Map(state.answers)
      newAnswers.set(questionIndex, answer)
      
      return {
        ...state,
        answers: newAnswers
      }

    case 'MARK_QUESTION_VISITED':
      const visitedSet = new Set(state.visitedQuestions)
      visitedSet.add(action.payload)
      return {
        ...state,
        visitedQuestions: visitedSet
      }

    case 'MARK_QUESTION_ANSWERED':
      const answeredSet = new Set(state.answeredQuestions)
      const skippedSetAnswered = new Set(state.skippedQuestions)
      answeredSet.add(action.payload)
      skippedSetAnswered.delete(action.payload) // Remove from skipped if it was there
      
      return {
        ...state,
        answeredQuestions: answeredSet,
        skippedQuestions: skippedSetAnswered,
        answeredCount: answeredSet.size,
        skippedCount: skippedSetAnswered.size,
        progressPercentage: ((answeredSet.size + skippedSetAnswered.size) / state.totalQuestions) * 100
      }

    case 'MARK_QUESTION_SKIPPED':
      const skippedSet = new Set(state.skippedQuestions)
      const answeredSetSkipped = new Set(state.answeredQuestions)
      skippedSet.add(action.payload)
      answeredSetSkipped.delete(action.payload) // Remove from answered if it was there
      
      return {
        ...state,
        skippedQuestions: skippedSet,
        answeredQuestions: answeredSetSkipped,
        answeredCount: answeredSetSkipped.size,
        skippedCount: skippedSet.size,
        progressPercentage: ((answeredSetSkipped.size + skippedSet.size) / state.totalQuestions) * 100
      }

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        answeredCount: action.payload.answered,
        skippedCount: action.payload.skipped,
        progressPercentage: ((action.payload.answered + action.payload.skipped) / state.totalQuestions) * 100
      }

    case 'SET_QUESTION_START_TIME':
      return { ...state, questionStartTime: action.payload }

    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload }

    case 'SET_RESULT':
      return { ...state, result: action.payload }

    case 'SHOW_RESULTS':
      return { ...state, showResults: action.payload }

    case 'SET_TIMER_INTERVAL':
      return { ...state, timerInterval: action.payload }

    case 'RESTORE_FROM_STORAGE':
      return {
        ...state,
        ...action.payload
      }

    case 'RESET_QUIZ':
      // Clear timer interval before reset
      if (state.timerInterval) {
        clearInterval(state.timerInterval)
      }
      return {
        ...initialState,
        // Keep any persistent data that should survive reset
      }

    default:
      return state
  }
}

// Context Types
interface QuizContextType {
  state: QuizState
  
  // Quiz Session Management
  startQuiz: (quizType: QuizType) => Promise<void>
  resumeQuiz: () => Promise<void>
  submitQuiz: () => Promise<void>
  
  // Question Navigation
  goToQuestion: (index: number) => Promise<void>
  nextQuestion: () => Promise<void>
  previousQuestion: () => Promise<void>
  
  // Answer Management
  saveAnswer: (questionIndex: number, answer: string | string[], autoSave?: boolean) => Promise<SaveAnswerResponse | null>
  skipQuestion: (questionIndex: number) => Promise<void>
  
  // Timer Management
  startTimer: () => void
  stopTimer: () => void
  
  // Utility
  resetQuiz: () => void
  checkForActiveSession: () => Promise<boolean>
  getCurrentQuestion: () => SessionQuestion | null
  getQuestionNavigationItems: () => Array<{
    index: number
    isAnswered: boolean
    isSkipped: boolean
    isVisited: boolean
    isCurrent: boolean
  }>
}

// Create Context
const QuizContext = createContext<QuizContextType | null>(null)

// Custom Hook
export const useQuiz = () => {
  const context = useContext(QuizContext)
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider')
  }
  return context
}

// Provider Props
interface QuizProviderProps {
  children: ReactNode
}

// Provider Component
export const QuizProvider: React.FC<QuizProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState)

  // Timer Management
  const startTimer = useCallback(() => {
    if (state.timerInterval) {
      clearInterval(state.timerInterval)
    }

    const interval = setInterval(() => {
      const timeRemaining = quizStorage.calculateTimeRemaining()
      dispatch({ type: 'SET_TIME_REMAINING', payload: timeRemaining })
      
      if (timeRemaining <= 0) {
        dispatch({ type: 'SET_EXPIRED', payload: true })
        clearInterval(interval)
        toast.error('Quiz time has expired!')
        
        // Auto-submit if session is still active
        if (state.session && !state.isSubmitting) {
          submitQuiz()
        }
      } else {
        // Check for warnings
        QUIZ_CONSTANTS.WARNING_TIMES.forEach(warningTime => {
          if (timeRemaining === warningTime) {
            const minutes = Math.floor(warningTime / 60)
            const seconds = warningTime % 60
            const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds} seconds`
            toast.warning(`⏰ Only ${timeStr} remaining!`)
          }
        })
      }
    }, QUIZ_CONSTANTS.TIMER_UPDATE_INTERVAL)

    dispatch({ type: 'SET_TIMER_INTERVAL', payload: interval })
  }, [state.timerInterval, state.session, state.isSubmitting])

  const stopTimer = useCallback(() => {
    if (state.timerInterval) {
      clearInterval(state.timerInterval)
      dispatch({ type: 'SET_TIMER_INTERVAL', payload: null })
    }
  }, [state.timerInterval])

  // Start Quiz
  const startQuiz = useCallback(async (quizType: QuizType) => {
    console.log(`🎯 Starting ${quizType} quiz...`)
    
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      // Clear any existing session data
      quizStorage.clearAllQuizData()
      
      console.log('📡 Calling quiz service to start quiz...')
      const response = await quizService.startQuiz(quizType)
      console.log('✅ Quiz start response received:', {
        sessionId: response.session.id,
        questionCount: response.session.questions.length,
        timeLimit: response.session.time_limit_minutes,
        message: response.message
      })

      // Store session data
      quizStorage.setSessionToken(response.session.session_token)
      quizStorage.setQuizType(quizType)
      quizStorage.setSessionData(response.session)
      quizStorage.setTimerStart(response.session.start_time)

      // Initialize state
      dispatch({ type: 'SET_SESSION', payload: response.session })
      dispatch({ type: 'SET_TIME_REMAINING', payload: response.session.time_remaining })
      dispatch({ type: 'SET_QUESTION_START_TIME', payload: Date.now() })
      
      // Start timer
      startTimer()
      
      console.log(`✅ ${quizType} quiz started successfully!`)
      console.log(`📊 Quiz details: ${response.session.total_questions} questions, ${response.session.time_limit_minutes} minutes`)
      
      toast.success(response.message)
      
    } catch (error: any) {
      console.error('❌ Failed to start quiz:', error)
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to start quiz. Please try again.'
      
      if (error?.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.'
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error. The quiz system might be temporarily unavailable.'
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      toast.error(errorMessage)
      
      // Log detailed error for debugging
      console.error('Detailed error info:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message,
        stack: error?.stack
      })
      
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [startTimer])

  // Resume Quiz
  const resumeQuiz = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      const sessionInfo = quizStorage.getActiveSessionInfo()
      if (!sessionInfo) {
        throw new Error('No active session found')
      }

      const response = await quizService.getSession(sessionInfo.token)
      
      if (response.is_expired) {
        quizStorage.clearAllQuizData()
        throw new Error('Quiz session has expired')
      }

      // Update state
      dispatch({ type: 'SET_SESSION', payload: response.session })
      dispatch({ type: 'SET_TIME_REMAINING', payload: response.time_remaining })

      // Restore local state
      const storedAnswers = quizStorage.getAnswers()
      const currentQuestion = quizStorage.getCurrentQuestion()
      
      storedAnswers.forEach((answer, index) => {
        dispatch({ type: 'SET_ANSWER', payload: { questionIndex: index, answer } })
        dispatch({ type: 'MARK_QUESTION_ANSWERED', payload: index })
      })

      dispatch({ type: 'SET_CURRENT_QUESTION', payload: currentQuestion })

      // Start timer
      startTimer()

      toast.success('Quiz session resumed')
    } catch (error: any) {
      console.error('Failed to resume quiz:', error)
      const errorMessage = error?.response?.data?.details || error?.response?.data?.error || 'Failed to resume quiz'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      quizStorage.clearAllQuizData()
      toast.error(errorMessage)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [startTimer])

  // Submit Quiz
  const submitQuiz = useCallback(async () => {
    if (!state.session || state.isSubmitting) return

    try {
      dispatch({ type: 'SET_SUBMITTING', payload: true })
      stopTimer()

      const response = await quizService.submitQuiz(state.session.session_token)
      
      dispatch({ type: 'SET_RESULT', payload: response.result })
      dispatch({ type: 'SHOW_RESULTS', payload: true })
      
      // Clear stored data
      quizStorage.clearAllQuizData()

      toast.success('Quiz submitted successfully!')
    } catch (error: any) {
      console.error('Failed to submit quiz:', error)
      const errorMessage = error?.response?.data?.details || error?.response?.data?.error || 'Failed to submit quiz'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      toast.error(errorMessage)
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false })
    }
  }, [state.session, state.isSubmitting, stopTimer])

  // Save Answer
  const saveAnswer = useCallback(async (
    questionIndex: number, 
    answer: string | string[], 
    autoSave: boolean = true
  ): Promise<SaveAnswerResponse | null> => {
    if (!state.session || state.isExpired) return null

    try {
      // Calculate time spent on this question
      const timeSpent = state.questionStartTime ? 
        Math.floor((Date.now() - state.questionStartTime) / 1000) : 0

      // Update local state immediately
      dispatch({ type: 'SET_ANSWER', payload: { questionIndex, answer } })
      dispatch({ type: 'MARK_QUESTION_ANSWERED', payload: questionIndex })

      // Store in localStorage
      const updatedAnswers = new Map(state.answers)
      updatedAnswers.set(questionIndex, answer)
      quizStorage.setAnswers(updatedAnswers)

      if (autoSave) {
        // Save to backend
        const response = await quizService.saveAnswer(
          state.session.session_token,
          questionIndex,
          answer,
          timeSpent
        )
        return response
      }

      return null
    } catch (error: any) {
      console.error('Failed to save answer:', error)
      if (quizService.isQuizExpiredError(error)) {
        dispatch({ type: 'SET_EXPIRED', payload: true })
        toast.error('Quiz session has expired')
      } else {
        toast.error('Failed to save answer')
      }
      return null
    }
  }, [state.session, state.isExpired, state.questionStartTime, state.answers])

  // Question Navigation
  const goToQuestion = useCallback(async (index: number) => {
    if (!state.session || index < 0 || index >= state.session.questions.length) return

    try {
      // Update local state immediately for better UX
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: index })
      quizStorage.setCurrentQuestion(index)
      
      // Then sync with backend (non-blocking)
      await quizService.navigateToQuestion(state.session.session_token, index)
    } catch (error: any) {
      console.error('Failed to sync navigation with backend:', error)
      // Don't show error toast for navigation sync issues as local state is already updated
      // Only log the error for debugging
      if (quizService.isQuizExpiredError(error)) {
        dispatch({ type: 'SET_EXPIRED', payload: true })
        toast.error('Quiz session has expired')
      }
    }
  }, [state.session])

  const nextQuestion = useCallback(async () => {
    if (state.currentQuestionIndex < state.totalQuestions - 1) {
      const nextIndex = state.currentQuestionIndex + 1
      await goToQuestion(nextIndex)
    }
  }, [state.currentQuestionIndex, state.totalQuestions, goToQuestion])

  const previousQuestion = useCallback(async () => {
    if (state.currentQuestionIndex > 0) {
      const prevIndex = state.currentQuestionIndex - 1
      await goToQuestion(prevIndex)
    }
  }, [state.currentQuestionIndex, goToQuestion])

  // Skip Question
  const skipQuestion = useCallback(async (questionIndex: number) => {
    if (!state.session) return

    try {
      // Calculate time spent on this question
      const timeSpent = state.questionStartTime ? 
        Math.floor((Date.now() - state.questionStartTime) / 1000) : 0

      // Update local state immediately
      dispatch({ type: 'MARK_QUESTION_SKIPPED', payload: questionIndex })
      
      // Save to backend to persist skip state
      await quizService.skipQuestion(state.session.session_token, questionIndex, timeSpent)
      
      toast.info('Question skipped')
    } catch (error: any) {
      console.error('Failed to skip question:', error)
      if (quizService.isQuizExpiredError(error)) {
        dispatch({ type: 'SET_EXPIRED', payload: true })
        toast.error('Quiz session has expired')
      } else {
        toast.error('Failed to skip question')
      }
    }
  }, [state.session, state.questionStartTime])

  // Utility Functions
  const resetQuiz = useCallback(() => {
    stopTimer()
    quizStorage.clearAllQuizData()
    dispatch({ type: 'RESET_QUIZ' })
  }, [stopTimer])

  const checkForActiveSession = useCallback(async (): Promise<boolean> => {
    const sessionInfo = quizStorage.getActiveSessionInfo()
    if (!sessionInfo) return false

    try {
      const response = await quizService.getSession(sessionInfo.token)
      return !response.is_expired
    } catch {
      quizStorage.clearAllQuizData()
      return false
    }
  }, [])

  const getCurrentQuestion = useCallback((): SessionQuestion | null => {
    if (!state.session || state.currentQuestionIndex >= state.session.questions.length) {
      return null
    }
    return state.session.questions[state.currentQuestionIndex]
  }, [state.session, state.currentQuestionIndex])

  const getQuestionNavigationItems = useCallback(() => {
    if (!state.session) return []

    return state.session.questions.map((_, index) => ({
      index,
      isAnswered: state.answeredQuestions.has(index),
      isSkipped: state.skippedQuestions.has(index),
      isVisited: state.visitedQuestions.has(index),
      isCurrent: index === state.currentQuestionIndex
    }))
  }, [state.session, state.answeredQuestions, state.skippedQuestions, state.visitedQuestions, state.currentQuestionIndex])

  // Auto-save effect
  useEffect(() => {
    if (!state.session || state.answers.size === 0) return

    const autoSaveInterval = setInterval(() => {
      quizStorage.setAnswers(state.answers)
    }, QUIZ_CONSTANTS.AUTO_SAVE_INTERVAL)

    return () => clearInterval(autoSaveInterval)
  }, [state.session, state.answers])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (state.timerInterval) {
        clearInterval(state.timerInterval)
      }
    }
  }, [state.timerInterval])

  const contextValue: QuizContextType = {
    state,
    startQuiz,
    resumeQuiz,
    submitQuiz,
    goToQuestion,
    nextQuestion,
    previousQuestion,
    saveAnswer,
    skipQuestion,
    startTimer,
    stopTimer,
    resetQuiz,
    checkForActiveSession,
    getCurrentQuestion,
    getQuestionNavigationItems
  }

  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  )
}

export default QuizProvider 