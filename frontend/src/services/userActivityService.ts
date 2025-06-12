import { api } from '@/lib/api'
import type { 
  QuizResult, 
  UserStats, 
  Achievement, 
  UserResultsResponse, 
  QuizResultRequest, 
  QuizResultsFilter,
  PerformanceSummary 
} from '@/types/userActivity'

export const userActivityService = {
  // Create a new quiz result
  async createQuizResult(data: QuizResultRequest): Promise<{ result: QuizResult; achievements: Achievement[]; message: string; new_achievements?: boolean }> {
    const response = await api.post('/quiz-results', data)
    return response.data
  },

  // Get user's quiz results with filtering
  async getUserResults(filter?: QuizResultsFilter): Promise<UserResultsResponse> {
    const params = new URLSearchParams()
    
    if (filter?.quiz_type) params.append('quiz_type', filter.quiz_type)
    if (filter?.date_from) params.append('date_from', filter.date_from)
    if (filter?.date_to) params.append('date_to', filter.date_to)
    if (filter?.page) params.append('page', filter.page.toString())
    if (filter?.limit) params.append('limit', filter.limit.toString())

    const response = await api.get(`/quiz-results?${params.toString()}`)
    return response.data
  },

  // Get a specific quiz result by ID
  async getQuizResultById(id: string): Promise<QuizResult> {
    const response = await api.get(`/quiz-results/${id}`)
    return response.data
  },

  // Get user statistics
  async getUserStats(): Promise<UserStats> {
    const response = await api.get('/user/stats')
    return response.data
  },

  // Get user achievements
  async getUserAchievements(): Promise<Achievement[]> {
    const response = await api.get('/user/achievements')
    return response.data.achievements
  },

  // Get performance summary
  async getPerformanceSummary(): Promise<PerformanceSummary> {
    const response = await api.get('/user/performance-summary')
    return response.data
  }
} 