import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '@/contexts/QuizContext'
import {
  TimeQuizHeader,
  TimeQuizWelcome,
  TimeQuizLoading,
  TimeQuizExpired,
  TimeQuizNavigationPanel,
  TimeQuizQuestionCard,
  TimeQuizControls,
  type TimeQuizStats,
  type QuestionNavigationItem,
  type SaveAnswerResponse
} from '@/components/block/time-quiz'

const TimeQuizPage: React.FC = () => {
  const navigate = useNavigate()
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
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize quiz on page load
  useEffect(() => {
    const initializeQuiz = async () => {
      if (!isInitialized) {
        setIsInitialized(true)
        
        // Check for existing session first
        const hasActiveSession = await checkForActiveSession()
        if (hasActiveSession) {
          await resumeQuiz()
        }
      }
    }

    initializeQuiz()
  }, [isInitialized, checkForActiveSession, resumeQuiz])

  // Update selected answer when question changes
  useEffect(() => {
    if (state.session) {
      const currentAnswer = state.answers.get(state.currentQuestionIndex)
      setSelectedAnswer(currentAnswer || '')
      setFeedbackVisible(false)
      setLastFeedback(null)
    }
  }, [state.currentQuestionIndex, state.answers, state.session])

  // Handle quiz completion
  useEffect(() => {
    if (state.showResults && state.result) {
      navigate('/results', { state: { result: state.result } })
    }
  }, [state.showResults, state.result, navigate])

  const handleStartQuiz = async () => {
    await startQuiz('time_quiz')
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

    // Save answer and get immediate feedback for TimeQuiz
    const feedback = await saveAnswer(state.currentQuestionIndex, newAnswer, true)
    if (feedback) {
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

  const handleSkipQuestion = async () => {
    await skipQuestion(state.currentQuestionIndex)
    setFeedbackVisible(false)
    setLastFeedback(null)
    
    if (state.currentQuestionIndex < state.totalQuestions - 1) {
      await nextQuestion()
    }
  }

  const handleQuestionNavigation = async (questionIndex: number) => {
    await goToQuestion(questionIndex)
  }

  const handleSubmitQuiz = async () => {
    setFeedbackVisible(false)
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

  // Loading state
  if (state.isLoading) {
    return <TimeQuizLoading />
  }

  // Quiz not started state
  if (!state.session) {
    return (
      <TimeQuizWelcome
        onStartQuiz={handleStartQuiz}
        onNavigateHome={handleNavigateHome}
        isLoading={state.isLoading}
        error={state.error || undefined}
      />
    )
  }

  // Quiz expired state
  if (state.isExpired) {
    return (
      <TimeQuizExpired
        onSubmitQuiz={handleSubmitQuiz}
        onResetAndHome={handleResetAndHome}
        isSubmitting={state.isSubmitting}
      />
    )
  }

  // Main quiz interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
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
          <div className="lg:col-span-3 lg:order-1 space-y-6">
            
            {/* Question Card */}
            {currentQuestion && (
              <TimeQuizQuestionCard
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                feedbackVisible={feedbackVisible}
                lastFeedback={lastFeedback}
                isAnswered={isAnswered}
                isSkipped={isSkipped}
                isExpired={state.isExpired}
                onAnswerSelect={handleAnswerSelect}
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
  )
}

export default TimeQuizPage 