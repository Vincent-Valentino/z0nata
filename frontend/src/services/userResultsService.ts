import { api } from '@/lib/api'
import type { DetailedQuizResult } from '@/types/quiz'

export interface UserQuizStatistics {
  totalQuizzes: number
  mockTestCount: number
  timeQuizCount: number
  averageScore: number
  bestScore: number
  totalTimeSpent: number // in minutes
  questionsAnswered: number
  questionsCorrect: number
  accuracyRate: number
  
  // Performance by difficulty
  easyQuestions: {
    answered: number
    correct: number
    accuracy: number
  }
  mediumQuestions: {
    answered: number
    correct: number
    accuracy: number
  }
  hardQuestions: {
    answered: number
    correct: number
    accuracy: number
  }
  
  // Recent activity
  recentQuizzes: DetailedQuizResult[]
  
  // Trends
  weeklyActivity: Array<{
    week: string
    quizCount: number
    avgScore: number
  }>
  
  // Achievements
  streaks: {
    currentStreak: number
    longestStreak: number
  }
}

// Backend UserStats structure (matches backend models/user-activity.go)
export interface BackendUserStats {
  id: string
  user_id: string
  total_quizzes_completed: number
  average_score: number
  total_time_spent: number // in seconds
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

// Backend response structure (matches backend models/user-activity.go)
export interface UserResultsResponse {
  results: DetailedQuizResult[]
  stats: BackendUserStats
  achievements: any[] // TODO: Define Achievement interface
  total_count: number
}

class UserResultsService {
  async getUserResults(userId: string, page: number = 1, limit: number = 10): Promise<UserResultsResponse> {
    try {
      console.log('🔍 UserResultsService.getUserResults called with:', { userId, page, limit })
      
      const endpoint = `/user/results/${userId}?page=${page}&limit=${limit}`
      console.log('🌐 Making API call to:', endpoint)
      
      const response = await api.get<UserResultsResponse>(endpoint)
      
      console.log('✅ Raw API response received:', response)
      console.log('🔍 Response structure check:', {
        hasResults: 'results' in response,
        hasStats: 'stats' in response,
        hasAchievements: 'achievements' in response,
        hasTotalCount: 'total_count' in response,
        resultCount: response.results?.length || 0,
        totalCount: response.total_count || 0
      })
      
      // Debug: Log first result structure to identify missing fields
      if (response.results && response.results.length > 0) {
        const firstResult = response.results[0]
        console.log('🔍 First result structure:', {
          hasId: 'id' in firstResult,
          hasScorePercentage: 'score_percentage' in firstResult && typeof firstResult.score_percentage,
          hasTimeUsed: 'time_used_seconds' in firstResult && typeof firstResult.time_used_seconds,
          hasTotalQuestions: 'total_questions' in firstResult && typeof firstResult.total_questions,
          hasCorrectAnswers: 'correct_answers' in firstResult && typeof firstResult.correct_answers,
          hasCompletedAt: 'completed_at' in firstResult && typeof firstResult.completed_at,
          hasDifficultyFields: {
            easy_correct: 'easy_correct' in firstResult && typeof firstResult.easy_correct,
            easy_total: 'easy_total' in firstResult && typeof firstResult.easy_total,
            medium_correct: 'medium_correct' in firstResult && typeof firstResult.medium_correct,
            medium_total: 'medium_total' in firstResult && typeof firstResult.medium_total,
            hard_correct: 'hard_correct' in firstResult && typeof firstResult.hard_correct,
            hard_total: 'hard_total' in firstResult && typeof firstResult.hard_total,
          },
          sampleResult: firstResult
        })
      }
      
      return response
      
    } catch (error: any) {
      console.error('❌ UserResultsService.getUserResults failed:', error)
      console.error('❌ Error response data:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      
      // More specific error messages
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login again.')
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view these results.')
      } else if (error.response?.status === 404) {
        throw new Error('No results found for this user.')
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (error.message?.includes('Network Error')) {
        throw new Error('Network connection failed. Please check your internet connection.')
      }
      
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch user results')
    }
  }

  async getUserStatistics(userId: string): Promise<BackendUserStats> {
    try {
      console.log('🔍 UserResultsService.getUserStatistics called with:', { userId })
      
      const response = await api.get<BackendUserStats>(`/user/statistics/${userId}`)
      console.log('✅ Statistics response received:', response)
      
      return response
    } catch (error: any) {
      console.error('❌ UserResultsService.getUserStatistics failed:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login again.')
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view these statistics.')
      } else if (error.response?.status === 404) {
        throw new Error('No statistics found for this user.')
      }
      
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch user statistics')
    }
  }

  async getQuizHistory(userId: string, quizType?: 'mock_test' | 'time_quiz'): Promise<DetailedQuizResult[]> {
    try {
      console.log('🔍 UserResultsService.getQuizHistory called with:', { userId, quizType })
      
      const queryParam = quizType ? `?quiz_type=${quizType}` : ''
      const response = await api.get<UserResultsResponse>(`/user/history/${userId}${queryParam}`)
      
      console.log('✅ Quiz history response received:', response)
      // The /user/history endpoint returns the same format as /user/results, so extract results
      return response.results || []
      
    } catch (error: any) {
      console.error('❌ UserResultsService.getQuizHistory failed:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login again.')
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view this quiz history.')
      } else if (error.response?.status === 404) {
        // For quiz history, 404 might just mean no quiz history exists yet
        console.warn('No quiz history found, returning empty array')
        return []
      }
      
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch quiz history')
    }
  }

  // Convert backend stats to frontend statistics format
  convertBackendStatsToFrontend(backendStats: BackendUserStats, results: DetailedQuizResult[]): UserQuizStatistics {
    // Filter out invalid results and add safety checks
    const validResults = results.filter(r => r && typeof r === 'object')
    
    // Calculate difficulty statistics from results since backend doesn't provide this breakdown
    const easyStats = this.calculateDifficultyStats(validResults, 'easy')
    const mediumStats = this.calculateDifficultyStats(validResults, 'medium')
    const hardStats = this.calculateDifficultyStats(validResults, 'hard')

    // Safely extract scores with fallbacks
    const validScores = validResults
      .map(r => r.score_percentage)
      .filter(score => typeof score === 'number' && !isNaN(score))

    return {
      totalQuizzes: backendStats.total_quizzes_completed,
      mockTestCount: backendStats.mock_test_count,
      timeQuizCount: backendStats.time_quiz_count,
      averageScore: backendStats.average_score,
      bestScore: validScores.length > 0 ? Math.max(...validScores) : 0,
      totalTimeSpent: backendStats.total_time_spent / 60, // Convert seconds to minutes
      questionsAnswered: backendStats.total_questions,
      questionsCorrect: backendStats.total_correct_answers,
      accuracyRate: backendStats.total_questions > 0 ? (backendStats.total_correct_answers / backendStats.total_questions) * 100 : 0,
      easyQuestions: easyStats,
      mediumQuestions: mediumStats,
      hardQuestions: hardStats,
      recentQuizzes: validResults.slice(0, 5),
      weeklyActivity: this.calculateWeeklyActivity(validResults),
      streaks: {
        currentStreak: backendStats.current_streak,
        longestStreak: backendStats.longest_streak
      }
    }
  }

  // Calculate statistics from results (client-side fallback)
  calculateStatistics(results: DetailedQuizResult[]): UserQuizStatistics {
    // Filter out invalid results
    const validResults = results.filter(r => r && typeof r === 'object')
    
    if (validResults.length === 0) {
      return {
        totalQuizzes: 0,
        mockTestCount: 0,
        timeQuizCount: 0,
        averageScore: 0,
        bestScore: 0,
        totalTimeSpent: 0,
        questionsAnswered: 0,
        questionsCorrect: 0,
        accuracyRate: 0,
        easyQuestions: { answered: 0, correct: 0, accuracy: 0 },
        mediumQuestions: { answered: 0, correct: 0, accuracy: 0 },
        hardQuestions: { answered: 0, correct: 0, accuracy: 0 },
        recentQuizzes: [],
        weeklyActivity: [],
        streaks: { currentStreak: 0, longestStreak: 0 }
      }
    }

    const mockTests = validResults.filter(r => r.quiz_type === 'mock_test')
    const timeQuizzes = validResults.filter(r => r.quiz_type === 'time_quiz')
    
    const totalTimeSpent = validResults.reduce((sum, r) => {
      const timeUsed = typeof r.time_used_seconds === 'number' ? r.time_used_seconds : 0
      return sum + (timeUsed / 60)
    }, 0)
    
    const totalQuestions = validResults.reduce((sum, r) => {
      const total = typeof r.total_questions === 'number' ? r.total_questions : 0
      return sum + total
    }, 0)
    
    const totalCorrect = validResults.reduce((sum, r) => {
      const correct = typeof r.correct_answers === 'number' ? r.correct_answers : 0
      return sum + correct
    }, 0)
    
    // Safely extract scores with fallbacks
    const validScores = validResults
      .map(r => r.score_percentage)
      .filter(score => typeof score === 'number' && !isNaN(score))
    
    // Calculate difficulty statistics
    const easyStats = this.calculateDifficultyStats(validResults, 'easy')
    const mediumStats = this.calculateDifficultyStats(validResults, 'medium')
    const hardStats = this.calculateDifficultyStats(validResults, 'hard')

    return {
      totalQuizzes: validResults.length,
      mockTestCount: mockTests.length,
      timeQuizCount: timeQuizzes.length,
      averageScore: validScores.length > 0 ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length : 0,
      bestScore: validScores.length > 0 ? Math.max(...validScores) : 0,
      totalTimeSpent,
      questionsAnswered: totalQuestions,
      questionsCorrect: totalCorrect,
      accuracyRate: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
      easyQuestions: easyStats,
      mediumQuestions: mediumStats,
      hardQuestions: hardStats,
      recentQuizzes: validResults.slice(0, 5),
      weeklyActivity: this.calculateWeeklyActivity(validResults),
      streaks: this.calculateStreaks(validResults)
    }
  }

  private calculateDifficultyStats(results: DetailedQuizResult[], difficulty: 'easy' | 'medium' | 'hard') {
    const answered = results.reduce((sum, r) => {
      if (!r || typeof r !== 'object') return sum
      
      let count = 0
      switch (difficulty) {
        case 'easy': 
          count = typeof r.easy_total === 'number' ? r.easy_total : 0
          break
        case 'medium': 
          count = typeof r.medium_total === 'number' ? r.medium_total : 0
          break
        case 'hard': 
          count = typeof r.hard_total === 'number' ? r.hard_total : 0
          break
      }
      return sum + count
    }, 0)

    const correct = results.reduce((sum, r) => {
      if (!r || typeof r !== 'object') return sum
      
      let count = 0
      switch (difficulty) {
        case 'easy': 
          count = typeof r.easy_correct === 'number' ? r.easy_correct : 0
          break
        case 'medium': 
          count = typeof r.medium_correct === 'number' ? r.medium_correct : 0
          break
        case 'hard': 
          count = typeof r.hard_correct === 'number' ? r.hard_correct : 0
          break
      }
      return sum + count
    }, 0)

    return {
      answered,
      correct,
      accuracy: answered > 0 ? (correct / answered) * 100 : 0
    }
  }

  private calculateWeeklyActivity(results: DetailedQuizResult[]) {
    // Group results by week
    const weeklyData: { [key: string]: { count: number, totalScore: number } } = {}
    
    results.forEach(result => {
      if (!result || typeof result !== 'object') return
      
      // Check if result has required fields
      if (!result.completed_at || typeof result.score_percentage !== 'number') return
      
      try {
        const date = new Date(result.completed_at)
        if (isNaN(date.getTime())) return // Invalid date
        
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { count: 0, totalScore: 0 }
        }
        
        weeklyData[weekKey].count++
        weeklyData[weekKey].totalScore += result.score_percentage
      } catch (error) {
        console.warn('Error processing result for weekly activity:', error, result)
      }
    })

    return Object.entries(weeklyData)
      .map(([week, data]) => ({
        week,
        quizCount: data.count,
        avgScore: data.count > 0 ? data.totalScore / data.count : 0
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
      .slice(-8) // Last 8 weeks
  }

  private calculateStreaks(results: DetailedQuizResult[]) {
    // Filter results with valid completed_at dates
    const validResults = results.filter(r => 
      r && 
      typeof r === 'object' && 
      r.completed_at && 
      !isNaN(new Date(r.completed_at).getTime())
    )
    
    if (validResults.length === 0) {
      return { currentStreak: 0, longestStreak: 0 }
    }
    
    try {
      const sortedResults = validResults
        .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())

      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 0
      
      // Simple streak calculation based on consecutive days with quizzes
      const uniqueDays = [...new Set(validResults.map(r => r.completed_at.split('T')[0]))]
      uniqueDays.sort()

      for (let i = 0; i < uniqueDays.length; i++) {
        if (i === 0) {
          tempStreak = 1
        } else {
          const prevDate = new Date(uniqueDays[i - 1])
          const currDate = new Date(uniqueDays[i])
          const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (dayDiff === 1) {
            tempStreak++
          } else {
            longestStreak = Math.max(longestStreak, tempStreak)
            tempStreak = 1
          }
        }
      }
      
      longestStreak = Math.max(longestStreak, tempStreak)
      
      // Calculate current streak (check if last activity was recent)
      if (uniqueDays.length > 0) {
        const lastActivityDate = new Date(uniqueDays[uniqueDays.length - 1])
        const today = new Date()
        const daysSinceLastActivity = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
        
        currentStreak = daysSinceLastActivity <= 1 ? tempStreak : 0
      }

      return { currentStreak, longestStreak }
    } catch (error) {
      console.warn('Error calculating streaks:', error)
      return { currentStreak: 0, longestStreak: 0 }
    }
  }
}

export const userResultsService = new UserResultsService() 