import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '@/contexts/QuizContext'
import { useAuthStore } from '@/store/authStore'
import {
  MockTestHeader,
  MockTestWelcome,
  MockTestLoading,
  MockTestExpired,
  MockTestNavigationPanel,
  MockTestMobileNavigation,
  MockTestQuestionCard,
  MockTestControls,
  MockTestReviewModal,
  type QuestionStats,
  type QuestionFilter,
  type FilteredQuestion
} from '@/components/block/mock-test'

const MockTestPage: React.FC = () => {
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
    checkForActiveSession,
    getQuestionNavigationItems
  } = useQuiz()

  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>('')
  const [isInitialized, setIsInitialized] = useState(false)
  const [showQuestionPanel, setShowQuestionPanel] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>({
    difficulty: 'all',
    status: 'all',
    type: 'all'
  })
  const [showReviewMode, setShowReviewMode] = useState(false)
  const [showStats, setShowStats] = useState(false)

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

  // Sync selectedAnswer when current question changes
  useEffect(() => {
    const savedAnswer = state.answers.get(state.currentQuestionIndex)
    if (savedAnswer !== undefined) {
      setSelectedAnswer(savedAnswer)
    } else {
      setSelectedAnswer('')
    }
  }, [state.currentQuestionIndex, state.answers])

  // Initialize quiz on page load
  useEffect(() => {
    if (!isAuthenticated) return // Don't initialize if not authenticated
    
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
    }
  }, [state.currentQuestionIndex, state.answers, state.session])

  // Handle quiz completion
  useEffect(() => {
    if (state.showResults && state.result) {
      navigate('/results', { state: { result: state.result } })
    }
  }, [state.showResults, state.result, navigate])

  // Calculate question statistics
  const questionStats: QuestionStats = useMemo(() => {
    if (!state.session) {
      return {
        total: 0, answered: 0, skipped: 0,
        easy: 0, medium: 0, hard: 0,
        easyAnswered: 0, mediumAnswered: 0, hardAnswered: 0
      }
    }

    const questions = state.session.questions
    const stats = {
      total: questions.length,
      answered: state.answeredQuestions.size,
      skipped: state.skippedQuestions.size,
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length,
      easyAnswered: 0,
      mediumAnswered: 0,
      hardAnswered: 0
    }

    // Count answered by difficulty
    questions.forEach((q, index) => {
      if (state.answeredQuestions.has(index)) {
        switch (q.difficulty) {
          case 'easy': stats.easyAnswered++; break
          case 'medium': stats.mediumAnswered++; break
          case 'hard': stats.hardAnswered++; break
        }
      }
    })

    return stats
  }, [state.session, state.answeredQuestions, state.skippedQuestions])

  // Filter questions based on current filters and search
  const filteredQuestions: FilteredQuestion[] = useMemo(() => {
    if (!state.session) return []

    let filtered = state.session.questions.map((q, index) => ({ question: q, index }))

    // Apply difficulty filter
    if (questionFilter.difficulty !== 'all') {
      filtered = filtered.filter(item => item.question.difficulty === questionFilter.difficulty)
    }

    // Apply status filter
    if (questionFilter.status !== 'all') {
      filtered = filtered.filter(item => {
        switch (questionFilter.status) {
          case 'answered': return state.answeredQuestions.has(item.index)
          case 'unanswered': return !state.answeredQuestions.has(item.index) && !state.skippedQuestions.has(item.index)
          case 'skipped': return state.skippedQuestions.has(item.index)
          default: return true
        }
      })
    }

    // Apply type filter
    if (questionFilter.type !== 'all') {
      filtered = filtered.filter(item => item.question.type === questionFilter.type)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.question.title.toLowerCase().includes(query) ||
        item.question.options.some(opt => opt.text.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [state.session, questionFilter, searchQuery, state.answeredQuestions, state.skippedQuestions])

  // Event handlers
  const handleStartQuiz = async () => {
    await startQuiz('mock_test')
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

    // Save answer without immediate feedback for MockTest
    await saveAnswer(state.currentQuestionIndex, newAnswer, false)
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

  const clearFilters = () => {
    setQuestionFilter({
      difficulty: 'all',
      status: 'all',
      type: 'all'
    })
    setSearchQuery('')
  }

  const currentQuestion = getCurrentQuestion()
  const isAnswered = state.answeredQuestions.has(state.currentQuestionIndex)
  const isSkipped = state.skippedQuestions.has(state.currentQuestionIndex)

  // Essay answer debouncing
  useEffect(() => {
    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion) return

    const savedAnswer = state.answers.get(state.currentQuestionIndex)
    if (savedAnswer !== undefined) {
      if (currentQuestion.type === 'essay') {
        setEssayAnswer(typeof savedAnswer === 'string' ? savedAnswer : '')
      }
    } else {
      if (currentQuestion.type === 'essay') {
        setEssayAnswer('')
      }
    }
  }, [state.currentQuestionIndex, state.answers, getCurrentQuestion])

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
        // Save without auto-save for MockTest (no immediate feedback)
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

  // Loading state
  if (state.isLoading) {
    return <MockTestLoading />
  }

  // Quiz not started state
  if (!state.session) {
    return (
      <MockTestWelcome
        onStartQuiz={handleStartQuiz}
        isLoading={state.isLoading}
        error={state.error}
      />
    )
  }

  // Quiz expired state
  if (state.isExpired) {
    return (
      <MockTestExpired
        onSubmitQuiz={handleSubmitQuiz}
        onResetQuiz={resetQuiz}
        isSubmitting={state.isSubmitting}
      />
    )
  }

  // Main quiz interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Desktop/Tablet Layout */}
      <div className="hidden md:block p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header with Timer and Progress */}
          <MockTestHeader
            timeRemaining={state.timeRemaining}
            currentQuestionIndex={state.currentQuestionIndex}
            totalQuestions={state.totalQuestions}
            progressPercentage={state.progressPercentage}
            questionStats={questionStats}
            showStats={showStats}
            showQuestionPanel={showQuestionPanel}
            onToggleStats={() => setShowStats(!showStats)}
            onToggleQuestionPanel={() => setShowQuestionPanel(!showQuestionPanel)}
          />

          <div className={`grid ${showQuestionPanel ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
            
            {/* Advanced Question Navigation Panel */}
            {showQuestionPanel && (
              <MockTestNavigationPanel
                viewMode={viewMode}
                searchQuery={searchQuery}
                questionFilter={questionFilter}
                filteredQuestions={filteredQuestions}
                currentQuestionIndex={state.currentQuestionIndex}
                answeredQuestions={state.answeredQuestions}
                skippedQuestions={state.skippedQuestions}
                onViewModeChange={setViewMode}
                onSearchChange={setSearchQuery}
                onFilterChange={setQuestionFilter}
                onClearFilters={clearFilters}
                onQuestionNavigation={handleQuestionNavigation}
              />
            )}

            {/* Main Question Area */}
            <div className={`${showQuestionPanel ? 'lg:col-span-3 lg:order-1' : ''} space-y-6`}>
              
              {/* Question Card */}
              {currentQuestion && (
                <MockTestQuestionCard
                  question={currentQuestion}
                  selectedAnswer={currentQuestion.type === 'essay' ? essayAnswer : selectedAnswer}
                  isAnswered={isAnswered}
                  isSkipped={isSkipped}
                  isExpired={state.isExpired}
                  onAnswerSelect={handleAnswerSelect}
                  onEssayAnswerChange={handleEssayAnswerChange}
                />
              )}

              {/* Navigation Controls */}
              <MockTestControls
                currentQuestionIndex={state.currentQuestionIndex}
                totalQuestions={state.totalQuestions}
                isAnswered={isAnswered}
                isSkipped={isSkipped}
                isSubmitting={state.isSubmitting}
                onPreviousQuestion={previousQuestion}
                onNextQuestion={nextQuestion}
                onSkipQuestion={handleSkipQuestion}
                onShowReview={() => setShowReviewMode(true)}
                onSubmitQuiz={handleSubmitQuiz}
              />
            </div>
          </div>

          {/* Review Mode Modal */}
          <MockTestReviewModal
            isOpen={showReviewMode}
            questionStats={questionStats}
            isSubmitting={state.isSubmitting}
            onClose={() => setShowReviewMode(false)}
            onSubmitQuiz={handleSubmitQuiz}
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="pb-32"> {/* Bottom padding for mobile navigation */}
          
          {/* Mobile Header */}
          <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
            <MockTestHeader
              timeRemaining={state.timeRemaining}
              currentQuestionIndex={state.currentQuestionIndex}
              totalQuestions={state.totalQuestions}
              progressPercentage={state.progressPercentage}
              questionStats={questionStats}
              showStats={showStats}
              showQuestionPanel={false} // Always false on mobile
              onToggleStats={() => setShowStats(!showStats)}
              onToggleQuestionPanel={() => {}} // No-op on mobile
            />
          </div>

          {/* Mobile Question Content */}
          <div className="p-3 sm:p-4 space-y-6">
            
            {/* Question Card */}
            {currentQuestion && (
              <MockTestQuestionCard
                question={currentQuestion}
                selectedAnswer={currentQuestion.type === 'essay' ? essayAnswer : selectedAnswer}
                isAnswered={isAnswered}
                isSkipped={isSkipped}
                isExpired={state.isExpired}
                onAnswerSelect={handleAnswerSelect}
                onEssayAnswerChange={handleEssayAnswerChange}
              />
            )}

            {/* Mobile Navigation Controls */}
            <MockTestControls
              currentQuestionIndex={state.currentQuestionIndex}
              totalQuestions={state.totalQuestions}
              isAnswered={isAnswered}
              isSkipped={isSkipped}
              isSubmitting={state.isSubmitting}
              onPreviousQuestion={previousQuestion}
              onNextQuestion={nextQuestion}
              onSkipQuestion={handleSkipQuestion}
              onShowReview={() => setShowReviewMode(true)}
              onSubmitQuiz={handleSubmitQuiz}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <MockTestMobileNavigation
            filteredQuestions={filteredQuestions}
            currentQuestionIndex={state.currentQuestionIndex}
            answeredQuestions={state.answeredQuestions}
            skippedQuestions={state.skippedQuestions}
            onQuestionNavigation={handleQuestionNavigation}
            searchQuery={searchQuery}
            questionFilter={questionFilter}
            onSearchChange={setSearchQuery}
            onFilterChange={setQuestionFilter}
            onClearFilters={clearFilters}
            totalQuestions={state.totalQuestions}
          />
        </div>

        {/* Review Mode Modal */}
        <MockTestReviewModal
          isOpen={showReviewMode}
          questionStats={questionStats}
          isSubmitting={state.isSubmitting}
          onClose={() => setShowReviewMode(false)}
          onSubmitQuiz={handleSubmitQuiz}
        />
      </div>
    </div>
  )
}

export default MockTestPage 