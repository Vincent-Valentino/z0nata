import { api } from '@/lib/api'
import type {
  QuizType,
  StartQuizRequest,
  StartQuizResponse,
  SaveAnswerRequest,
  SaveAnswerResponse,
  NavigateQuestionRequest,
  SubmitQuizRequest,
  SubmitQuizResponse,
  GetSessionResponse,
  ResumeSessionResponse,
  DetailedQuizResult
} from '@/types/quiz'

class QuizService {
  // Start a new quiz session
  async startQuiz(quizType: QuizType): Promise<StartQuizResponse> {
    const request: StartQuizRequest = { quiz_type: quizType }
    const response = await api.post<StartQuizResponse>('/quiz/start', request)
    return response.data
  }

  // Get current session details
  async getSession(sessionToken: string): Promise<GetSessionResponse> {
    const response = await api.get<GetSessionResponse>(`/quiz/session/${sessionToken}`)
    return response.data
  }

  // Save an answer for a question
  async saveAnswer(
    sessionToken: string, 
    questionIndex: number, 
    answer: string | string[], 
    timeSpent: number
  ): Promise<SaveAnswerResponse> {
    const request: SaveAnswerRequest = {
      question_index: questionIndex,
      answer,
      time_spent: timeSpent
    }
    const response = await api.post<SaveAnswerResponse>(
      `/quiz/session/${sessionToken}/answer`, 
      request
    )
    return response.data
  }

  // Navigate to a specific question
  async navigateToQuestion(sessionToken: string, questionIndex: number): Promise<void> {
    const request: NavigateQuestionRequest = { question_index: questionIndex }
    await api.post(`/quiz/session/${sessionToken}/navigate`, request)
  }

  // Submit the quiz for final scoring
  async submitQuiz(sessionToken: string): Promise<SubmitQuizResponse> {
    const response = await api.post<SubmitQuizResponse>(
      `/quiz/session/${sessionToken}/submit`
    )
    return response.data
  }

  // Check for resumable session
  async checkResumeSession(quizType: QuizType): Promise<ResumeSessionResponse> {
    const response = await api.get<ResumeSessionResponse>(`/quiz/resume/${quizType}`)
    return response.data
  }

  // Get user's quiz results history
  async getUserResults(quizType?: QuizType, limit: number = 10): Promise<DetailedQuizResult[]> {
    const params = new URLSearchParams()
    if (quizType) params.append('quiz_type', quizType)
    params.append('limit', limit.toString())
    
    const response = await api.get<{ results: DetailedQuizResult[]; count: number }>(
      `/quiz/results?${params.toString()}`
    )
    return response.data.results
  }

  // Utility methods for error handling
  isQuizExpiredError(error: any): boolean {
    return error?.response?.data?.details?.includes('expired') || 
           error?.response?.data?.error?.includes('expired')
  }

  isSessionNotFoundError(error: any): boolean {
    return error?.response?.status === 404 ||
           error?.response?.data?.error?.includes('not found')
  }

  isUnauthorizedError(error: any): boolean {
    return error?.response?.status === 401
  }
}

export const quizService = new QuizService()
export default quizService 