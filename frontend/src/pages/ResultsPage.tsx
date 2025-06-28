import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { userActivityService } from '@/services/userActivityService'
import type { QuizResult, UserStats, Achievement, QuizType } from '@/types/userActivity'
import type { DetailedQuizResult } from '@/types/quiz'
import {
  ResultsHeader,
  ResultsStatsCards,
  ResultsQuizHistory,
  ResultsPerformancePanel,
  QuizResultsDisplay,
  ResultsLoadingState,
  ResultsErrorState
} from '@/components/block/results'

export const ResultsPage = () => {
  const { user } = useAuthStore()
  const location = useLocation()
  const [selectedQuizType, setSelectedQuizType] = useState<'all' | QuizType>('all')
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if we have a detailed quiz result from navigation
  const detailedResult = location.state?.result as DetailedQuizResult | undefined

  // Load user results data
  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const filter = selectedQuizType !== 'all' ? { quiz_type: selectedQuizType } : {}
      const data = await userActivityService.getUserResults(filter)
      
      setQuizResults(data.results)
      setUserStats(data.stats)
      setAchievements(data.achievements)
    } catch (err) {
      setError('Failed to load quiz results')
      console.error('Error loading user results:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, selectedQuizType])

  // If we have a detailed result from quiz completion, show that instead
  if (detailedResult) {
    return <QuizResultsDisplay result={detailedResult} />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to view your results.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <ResultsLoadingState />
  }

  if (error) {
    return <ResultsErrorState error={error} onRetry={loadData} />
  }

  const filteredResults = selectedQuizType === 'all' 
    ? quizResults 
    : quizResults.filter(quiz => quiz.quiz_type === selectedQuizType)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Header */}
      <ResultsHeader 
        userName={user?.full_name}
        overallAverage={userStats ? userStats.average_score : 0}
      />

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
        {/* Statistics Overview */}
        <ResultsStatsCards userStats={userStats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Results List */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <ResultsQuizHistory
              filteredResults={filteredResults}
              selectedQuizType={selectedQuizType}
              onQuizTypeChange={setSelectedQuizType}
            />
          </div>

          {/* Performance Summary */}
          <div className="space-y-4 sm:space-y-6">
            <ResultsPerformancePanel
              userStats={userStats}
              achievements={achievements}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 