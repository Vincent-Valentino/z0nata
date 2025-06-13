import { api } from '@/lib/api'

export const userActivityService = {
  // Create a new quiz result
  async createQuizResult(data: any): Promise<any> {
    const response: any = await api.post('/quiz-results', data)
    return response.data
  },

  // Get user's quiz results with filtering
  async getUserResults(filter?: any): Promise<any> {
    const params = filter ? new URLSearchParams(filter).toString() : ''
    const response: any = await api.get(`/user/results${params ? '?' + params : ''}`)
    return response.data
  },

  // Get a specific quiz result by ID
  async getQuizResultById(id: string): Promise<any> {
    const response: any = await api.get(`/quiz-results/${id}`)
    return response.data
  },

  // Get user statistics
  async getUserStats(): Promise<any> {
    const response: any = await api.get('/user/stats')
    return response.data
  },

  // Get user achievements
  async getUserAchievements(): Promise<any> {
    const response: any = await api.get('/user/achievements')
    return response.data.achievements
  },

  // Get user performance summary
  async getPerformanceSummary(): Promise<any> {
    const response: any = await api.get('/user/performance-summary')
    return response.data
  },

  async getQuizHistory(quizType?: string): Promise<any> {
    const params = quizType ? `?quiz_type=${quizType}` : ''
    const response: any = await api.get(`/user/quiz-history${params}`)
    return response.data
  },

  async getDetailedResult(resultId: string): Promise<any> {
    const response: any = await api.get(`/user/results/${resultId}`)
    return response.data
  },

  async getLeaderboard(quizType?: string): Promise<any> {
    const params = quizType ? `?quiz_type=${quizType}` : ''
    const response: any = await api.get(`/user/leaderboard${params}`)
    return response.data
  }
} 