import { api } from '@/lib/api'

// TypeScript interfaces that match the backend API responses

export interface Option {
  id: string
  text: string
  order: number
}

export interface Question {
  id: string
  title: string
  type: 'single_choice' | 'multiple_choice' | 'essay'
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  is_active: boolean
  options?: Option[]
  correct_answers?: string[]
  sample_answer?: string
  created_by: string
  created_at: string
  updated_at: string
}

// Request interfaces for creating/updating questions
export interface CreateQuestionRequest {
  title: string
  type: 'single_choice' | 'multiple_choice' | 'essay'
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  options?: CreateOption[]
  correct_answers?: string[]
  sample_answer?: string
}

export interface CreateOption {
  text: string
}

export interface UpdateQuestionRequest {
  title?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  points?: number
  is_active?: boolean
  options?: CreateOption[]
  correct_answers?: string[]
  sample_answer?: string
}

export interface ListQuestionsRequest {
  page?: number
  limit?: number
  search?: string
  type?: 'single_choice' | 'multiple_choice' | 'essay'
  difficulty?: 'easy' | 'medium' | 'hard'
  is_active?: boolean
}

export interface ListQuestionsResponse {
  questions: Question[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface QuestionStats {
  total: number
  by_type: Record<string, number>
  by_difficulty: Record<string, number>
  active_count: number
  inactive_count: number
  single_choice: number
  multiple_choice: number
  essay: number
  total_points: number
  average_points: number
}

// Frontend display interfaces (with camelCase for components)
export interface QuestionDisplay {
  id: string
  title: string
  type: 'single_choice' | 'multiple_choice' | 'essay'
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  isActive: boolean
  options?: Option[]
  correctAnswers?: string[]
  sampleAnswer?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// Utility functions to convert between API and display formats
export const convertQuestionToDisplay = (question: Question): QuestionDisplay => ({
  id: question.id,
  title: question.title,
  type: question.type,
  difficulty: question.difficulty,
  points: question.points,
  isActive: question.is_active,
  options: question.options,
  correctAnswers: question.correct_answers,
  sampleAnswer: question.sample_answer,
  createdBy: question.created_by,
  createdAt: question.created_at,
  updatedAt: question.updated_at
})

export const convertDisplayToRequest = (question: Partial<QuestionDisplay>): CreateQuestionRequest => ({
  title: question.title || '',
  type: question.type || 'single_choice',
  difficulty: question.difficulty || 'medium',
  points: question.points || 10,
  options: question.options?.map(opt => ({ text: opt.text })),
  correct_answers: question.correctAnswers,
  sample_answer: question.sampleAnswer
})

export const convertDisplayToUpdateRequest = (question: Partial<QuestionDisplay>): UpdateQuestionRequest => ({
  title: question.title,
  difficulty: question.difficulty,
  points: question.points,
  is_active: question.isActive,
  options: question.options?.map(opt => ({ text: opt.text })),
  correct_answers: question.correctAnswers,
  sample_answer: question.sampleAnswer
})

// Question Service
export const questionService = {
  // Get all questions with filtering and pagination
  async getQuestions(params?: ListQuestionsRequest): Promise<ListQuestionsResponse> {
    try {
      const searchParams = new URLSearchParams()
      
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.search) searchParams.append('search', params.search)
      if (params?.type) searchParams.append('type', params.type)
      if (params?.difficulty) searchParams.append('difficulty', params.difficulty)
      if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString())

      const query = searchParams.toString()
      const response = await api.get<ListQuestionsResponse>(`/admin/questions${query ? `?${query}` : ''}`)
      
      // Ensure we always return a valid structure
      return {
        questions: response?.questions || [],
        total: response?.total || 0,
        page: response?.page || 1,
        limit: response?.limit || 20,
        total_pages: response?.total_pages || 1
      }
    } catch (error: any) {
      // Re-throw with more context for the component to handle
      if (error.response?.status === 404) {
        // Return empty result for 404 instead of throwing
        return {
          questions: [],
          total: 0,
          page: 1,
          limit: 20,
          total_pages: 1
        }
      }
      throw error
    }
  },

  // Get question by ID
  async getQuestion(id: string): Promise<Question> {
    const response = await api.get<Question>(`/admin/questions/${id}`)
    return response
  },

  // Create new question (Admin only)
  async createQuestion(data: CreateQuestionRequest): Promise<Question> {
    const response = await api.post<Question>('/admin/questions', data)
    return response
  },

  // Update question (Admin only)
  async updateQuestion(id: string, data: UpdateQuestionRequest): Promise<Question> {
    const response = await api.put<Question>(`/admin/questions/${id}`, data)
    return response
  },

  // Delete question (Admin only)
  async deleteQuestion(id: string): Promise<void> {
    await api.delete<void>(`/admin/questions/${id}`)
  },

  // Get question statistics (Admin only)
  async getQuestionStats(): Promise<QuestionStats> {
    const response = await api.get<QuestionStats>('/admin/questions/stats')
    return response
  },

  // Toggle question active status (Admin only)
  async toggleQuestionStatus(id: string, isActive: boolean): Promise<Question> {
    const response = await api.put<Question>(`/admin/questions/${id}`, { is_active: isActive })
    return response
  }
}

// Hook for easier use in React components (optional - using React Query would be better)
export const useQuestions = () => {
  // This would be better implemented with React Query or SWR for caching
  // For now, this is just a structure suggestion
  return {
    questions: [],
    loading: false,
    error: null,
    refetch: () => Promise.resolve()
  }
} 