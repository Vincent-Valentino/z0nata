import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '@/contexts/QuizContext'
import {
  MockTestHeader,
  MockTestWelcome,
  MockTestLoading,
  MockTestExpired,
  MockTestNavigationPanel,
  MockTestQuestionCard,
  MockTestControls,
  MockTestReviewModal,
  type QuestionStats,
  type QuestionFilter,
  type FilteredQuestion
} from '@/components/block/mock-test'

const MockTestPage: React.FC = () => {
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
    checkForActiveSession
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

  const handleSkipQuestion = async () => {
    await skipQuestion(state.currentQuestionIndex)
    
    if (state.currentQuestionIndex < state.totalQuestions - 1) {
      await nextQuestion()
    }
  }

  const handleQuestionNavigation = async (questionIndex: number) => {
    await goToQuestion(questionIndex)
  }

  const handleSubmitQuiz = async () => {
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
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
                selectedAnswer={selectedAnswer}
                isAnswered={isAnswered}
                isSkipped={isSkipped}
                isExpired={state.isExpired}
                onAnswerSelect={handleAnswerSelect}
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
  )
}

export default MockTestPage 