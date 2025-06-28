import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '@/contexts/QuizContext'
import { useAuthStore } from '@/store/authStore'
import {
  TimeQuizHeader,
  TimeQuizWelcome,
  TimeQuizLoading,
  TimeQuizExpired,
  TimeQuizNavigationPanel,
  TimeQuizMobileNavigation,
  TimeQuizQuestionCard,
  TimeQuizControls,
  type TimeQuizStats,
  type QuestionNavigationItem,
  type SaveAnswerResponse
} from '@/components/block/time-quiz'

const TimeQuizPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { 
    state, 
    startQuiz, 
    resumeQuiz, 
    submitQuiz, 
    goToQuestion, 
    nextQuestion, 
    previousQuestion,
    saveAnswer, 
    skipQuestion,
    resetQuiz,
    getCurrentQuestion,
    getQuestionNavigationItems,
    checkForActiveSession
  } = useQuiz()

  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>('')
  const [feedbackVisible, setFeedbackVisible] = useState(false)
  const [lastFeedback, setLastFeedback] = useState<SaveAnswerResponse | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)

  // Essay answer debouncing
  const [essayAnswer, setEssayAnswer] = useState<string>('')
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedAnswerRef = useRef<string>('')

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('🔒 User not authenticated, redirecting to login page...')
      navigate('/login', { replace: true })
      return
    }
  }, [isAuthenticated, navigate])

  // Check for active session on component mount
  useEffect(() => {
    const checkActiveSession = async () => {
      const sessionExists = await state.session !== null
      if (sessionExists) {
        setShowWelcome(false)
        setHasStarted(true)
        await resumeQuiz()
      }
    }
    
    if (!hasStarted) {
      checkActiveSession()
    }
  }, [hasStarted, resumeQuiz, state.session])

  // Load saved answer when question changes
  useEffect(() => {
    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion) return

    const savedAnswer = state.answers.get(state.currentQuestionIndex)
    if (savedAnswer !== undefined) {
      setSelectedAnswer(savedAnswer)
      if (currentQuestion.type === 'essay') {
        setEssayAnswer(typeof savedAnswer === 'string' ? savedAnswer : '')
      }
    } else {
      setSelectedAnswer(currentQuestion.type === 'multiple_choice' ? [] : '')
      if (currentQuestion.type === 'essay') {
        setEssayAnswer('')
      }
    }

    // Reset feedback when changing questions
    setFeedbackVisible(false)
    setLastFeedback(null)
  }, [state.currentQuestionIndex, state.answers, getCurrentQuestion])

  // Reset states when quiz expires
  useEffect(() => {
    if (state.isExpired) {
      setFeedbackVisible(false)
      setLastFeedback(null)
    }
  }, [state.isExpired])

  // Debounced save for essay answers
  const debouncedSaveEssayAnswer = (answer: string) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Only save if answer has actually changed
    if (answer === lastSavedAnswerRef.current) {
      return
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(async () => {
      if (answer !== lastSavedAnswerRef.current) {
        lastSavedAnswerRef.current = answer
        // Save without auto-save to prevent immediate feedback for essays
        await saveAnswer(state.currentQuestionIndex, answer, false)
      }
    }, 1000) // Save after 1 second of no typing
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Handle quiz completion
  useEffect(() => {
    if (state.showResults && state.result) {
      navigate('/results', { state: { result: state.result } })
    }
  }, [state.showResults, state.result, navigate])

  const handleStartQuiz = async () => {
    try {
      await startQuiz('time_quiz')
      setShowWelcome(false)
      setHasStarted(true)
    } catch (error) {
      console.error('Failed to start time quiz:', error)
    }
  }

  const handleNavigateHome = () => {
    navigate('/')
  }

  const handleAnswerSelect = async (optionId: string) => {
    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion || state.isExpired) return

    let newAnswer: string | string[]
    
    if (currentQuestion.type === 'multiple_choice') {
      // Handle multiple choice
      const currentAnswers = Array.isArray(selectedAnswer) ? selectedAnswer : []
      if (currentAnswers.includes(optionId)) {
        newAnswer = currentAnswers.filter(id => id !== optionId)
      } else {
        newAnswer = [...currentAnswers, optionId]
      }
    } else {
      // Handle single choice
      newAnswer = optionId
    }

    setSelectedAnswer(newAnswer)

    // Save answer and get immediate feedback for choice questions only
    const feedback = await saveAnswer(state.currentQuestionIndex, newAnswer, true)
    if (feedback && currentQuestion.type !== 'essay') {
      setLastFeedback(feedback)
      setFeedbackVisible(true)
      
      // Auto-advance after showing feedback (except for last question)
      if (state.currentQuestionIndex < state.totalQuestions - 1) {
        setTimeout(() => {
          nextQuestion()
        }, 2000) // Show feedback for 2 seconds
      }
    }
  }

  const handleEssayAnswerChange = (answer: string) => {
    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion || state.isExpired) return

    setEssayAnswer(answer)
    setSelectedAnswer(answer)

    // Use debounced saving for essay answers
    debouncedSaveEssayAnswer(answer)
  }

  const handleSkipQuestion = async () => {
    // Save essay answer before skipping if there's unsaved content
    const currentQuestion = getCurrentQuestion()
    if (currentQuestion?.type === 'essay' && essayAnswer !== lastSavedAnswerRef.current) {
      await saveAnswer(state.currentQuestionIndex, essayAnswer, false)
      lastSavedAnswerRef.current = essayAnswer
    }

    await skipQuestion(state.currentQuestionIndex)
    
    if (state.currentQuestionIndex < state.totalQuestions - 1) {
      await nextQuestion()
    }
  }

  const handleQuestionNavigation = async (questionIndex: number) => {
    // Save essay answer before navigating if there's unsaved content
    const currentQuestion = getCurrentQuestion()
    if (currentQuestion?.type === 'essay' && essayAnswer !== lastSavedAnswerRef.current) {
      await saveAnswer(state.currentQuestionIndex, essayAnswer, false)
      lastSavedAnswerRef.current = essayAnswer
    }

    await goToQuestion(questionIndex)
  }

  const handleSubmitQuiz = async () => {
    // Save essay answer before submitting if there's unsaved content
    const currentQuestion = getCurrentQuestion()
    if (currentQuestion?.type === 'essay' && essayAnswer !== lastSavedAnswerRef.current) {
      await saveAnswer(state.currentQuestionIndex, essayAnswer, false)
      lastSavedAnswerRef.current = essayAnswer
    }

    await submitQuiz()
  }

  const handleResetAndHome = () => {
    resetQuiz()
    navigate('/')
  }

  // Prepare data for components
  const currentQuestion = getCurrentQuestion()
  const navigationItems: QuestionNavigationItem[] = getQuestionNavigationItems()
  const isAnswered = state.answeredQuestions.has(state.currentQuestionIndex)
  const isSkipped = state.skippedQuestions.has(state.currentQuestionIndex)
  
  const timeQuizStats: TimeQuizStats = {
    answeredCount: state.answeredCount,
    skippedCount: state.skippedCount,
    totalQuestions: state.totalQuestions,
    progressPercentage: state.progressPercentage
  }

  // If user hasn't started quiz yet, show welcome screen
  if (showWelcome && !state.session) {
    return (
      <TimeQuizWelcome 
        onStartQuiz={handleStartQuiz}
        onNavigateHome={() => navigate('/')}
        isLoading={state.isLoading}
        error={state.error || undefined}
      />
    )
  }

  // Loading state
  if (state.isLoading) {
    return <TimeQuizLoading />
  }

  // Error state  
  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Quiz Error</h2>
          <p className="text-gray-700 mb-4">{state.error}</p>
          <button 
            onClick={() => {
              resetQuiz()
              setShowWelcome(true)
              setHasStarted(false)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Quiz expired state
  if (state.isExpired) {
    return (
      <TimeQuizExpired 
        onSubmitQuiz={handleSubmitQuiz}
        onResetAndHome={() => {
          resetQuiz()
          navigate('/')
        }}
        isSubmitting={state.isSubmitting}
      />
    )
  }

  // Quiz completed - show results
  if (state.showResults && state.result) {
    navigate('/results', { state: { result: state.result } })
    return null
  }

  // Main quiz interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Desktop/Tablet Layout */}
      <div className="hidden md:block p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header with Timer and Progress */}
          <TimeQuizHeader
            timeRemaining={state.timeRemaining}
            currentQuestionIndex={state.currentQuestionIndex}
            totalQuestions={state.totalQuestions}
            progressPercentage={state.progressPercentage}
            stats={timeQuizStats}
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Question Navigation Sidebar */}
            <TimeQuizNavigationPanel
              navigationItems={navigationItems}
              onQuestionNavigation={handleQuestionNavigation}
            />

            {/* Main Question Area */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Question Card */}
              {currentQuestion && (
                <TimeQuizQuestionCard
                  question={currentQuestion}
                  selectedAnswer={currentQuestion.type === 'essay' ? essayAnswer : selectedAnswer}
                  feedbackVisible={feedbackVisible}
                  lastFeedback={lastFeedback}
                  isAnswered={isAnswered}
                  isSkipped={isSkipped}
                  isExpired={state.isExpired}
                  onAnswerSelect={handleAnswerSelect}
                  onEssayAnswerChange={handleEssayAnswerChange}
                />
              )}

              {/* Navigation Controls */}
              <TimeQuizControls
                currentQuestionIndex={state.currentQuestionIndex}
                totalQuestions={state.totalQuestions}
                isAnswered={isAnswered}
                isSkipped={isSkipped}
                feedbackVisible={feedbackVisible}
                isSubmitting={state.isSubmitting}
                onPreviousQuestion={previousQuestion}
                onNextQuestion={nextQuestion}
                onSkipQuestion={handleSkipQuestion}
                onSubmitQuiz={handleSubmitQuiz}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="pb-32"> {/* Bottom padding for mobile navigation */}
          
          {/* Mobile Header */}
          <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
            <TimeQuizHeader
              timeRemaining={state.timeRemaining}
              currentQuestionIndex={state.currentQuestionIndex}
              totalQuestions={state.totalQuestions}
              progressPercentage={state.progressPercentage}
              stats={timeQuizStats}
            />
          </div>

          {/* Mobile Question Content */}
          <div className="p-3 sm:p-4 space-y-6">
            
            {/* Question Card */}
            {currentQuestion && (
              <TimeQuizQuestionCard
                question={currentQuestion}
                selectedAnswer={currentQuestion.type === 'essay' ? essayAnswer : selectedAnswer}
                feedbackVisible={feedbackVisible}
                lastFeedback={lastFeedback}
                isAnswered={isAnswered}
                isSkipped={isSkipped}
                isExpired={state.isExpired}
                onAnswerSelect={handleAnswerSelect}
                onEssayAnswerChange={handleEssayAnswerChange}
              />
            )}

            {/* Mobile Navigation Controls */}
            <TimeQuizControls
              currentQuestionIndex={state.currentQuestionIndex}
              totalQuestions={state.totalQuestions}
              isAnswered={isAnswered}
              isSkipped={isSkipped}
              feedbackVisible={feedbackVisible}
              isSubmitting={state.isSubmitting}
              onPreviousQuestion={previousQuestion}
              onNextQuestion={nextQuestion}
              onSkipQuestion={handleSkipQuestion}
              onSubmitQuiz={handleSubmitQuiz}
            />
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <TimeQuizMobileNavigation
          navigationItems={navigationItems}
          onQuestionNavigation={handleQuestionNavigation}
          currentQuestionIndex={state.currentQuestionIndex}
          totalQuestions={state.totalQuestions}
        />
      </div>
    </div>
  )
}

export default TimeQuizPage 