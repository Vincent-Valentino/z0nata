import { useState, useEffect } from 'react'
import { questionService, convertQuestionToDisplay } from '@/services/questionService'
import type { QuestionDisplay, CreateQuestionRequest } from '@/services/questionService'

// Import microfrontend components
import { 
  QuestionStatsCards,
  QuestionFilters,
  AddQuestionDialog,
  QuestionsList,
  ViewQuestionDialog,
  EditQuestionDialog
} from './questions'

// Use QuestionDisplay interface for component state (camelCase)
type Question = QuestionDisplay

// Form validation interface
interface FormErrors {
  title?: string
  options?: string[]
  correctAnswers?: string
  sampleAnswer?: string
  points?: string
}

export const AdminQuestions = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'single_choice' | 'multiple_choice' | 'essay'>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [newQuestion, setNewQuestion] = useState<{
    title: string;
    type: 'single_choice' | 'multiple_choice' | 'essay';
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    options: { text: string; id?: string }[];
    correctAnswers: string[];
    sampleAnswer: string;
  }>({
    title: '',
    type: 'single_choice',
    difficulty: 'medium',
    points: 10,
    options: [
      { text: '' },
      { text: '' },
      { text: '' },
      { text: '' }
    ],
    correctAnswers: [],
    sampleAnswer: ''
  })
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  // Load questions and stats from API
  useEffect(() => {
    loadQuestions()
    loadStats()
  }, [currentPage, typeFilter, difficultyFilter, searchTerm])

  // Validation logic
  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    
    // Validate title
    if (!newQuestion.title.trim()) {
      errors.title = 'Question title is required'
    } else if (newQuestion.title.trim().length < 5) {
      errors.title = 'Question title must be at least 5 characters'
    } else if (newQuestion.title.trim().length > 500) {
      errors.title = 'Question title must not exceed 500 characters'
    }

    // Validate points
    if (newQuestion.points < 1) {
      errors.points = 'Points must be at least 1'
    } else if (newQuestion.points > 1000) {
      errors.points = 'Points cannot exceed 1000'
    }

    // Validate based on question type
    if (newQuestion.type === 'single_choice' || newQuestion.type === 'multiple_choice') {
      // Validate options
      const optionErrors: string[] = []
      const validOptions = newQuestion.options.filter(opt => opt.text.trim())
      
      if (validOptions.length < 2) {
        optionErrors.push('At least 2 options are required')
      }

      newQuestion.options.forEach((option, index) => {
        if (option.text.trim() && option.text.trim().length > 200) {
          optionErrors.push(`Option ${index + 1} must not exceed 200 characters`)
        }
      })

      // Check for duplicate options
      const optionTexts = newQuestion.options.map(opt => opt.text.trim().toLowerCase()).filter(text => text)
      const uniqueTexts = new Set(optionTexts)
      if (optionTexts.length !== uniqueTexts.size) {
        optionErrors.push('Options must be unique')
      }

      if (optionErrors.length > 0) {
        errors.options = optionErrors
      }

      // Validate correct answers
      if (newQuestion.correctAnswers.length === 0) {
        errors.correctAnswers = 'At least one correct answer must be selected'
      } else if (newQuestion.type === 'single_choice' && newQuestion.correctAnswers.length > 1) {
        errors.correctAnswers = 'Single choice questions can only have one correct answer'
      } else if (newQuestion.type === 'multiple_choice' && newQuestion.correctAnswers.length >= validOptions.length) {
        errors.correctAnswers = 'Multiple choice questions cannot have all options as correct'
      }
    } else if (newQuestion.type === 'essay') {
      // Validate essay fields
      if (newQuestion.sampleAnswer.trim().length > 2000) {
        errors.sampleAnswer = 'Sample answer must not exceed 2000 characters'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const loadQuestions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {
        page: currentPage,
        limit: 20,
      }
      
      if (searchTerm) params.search = searchTerm
      if (typeFilter !== 'all') params.type = typeFilter
      if (difficultyFilter !== 'all') params.difficulty = difficultyFilter
      
      const response = await questionService.getQuestions(params)
      
      // Convert API response to display format
      const displayQuestions = response.questions.map(convertQuestionToDisplay)
      setQuestions(displayQuestions)
      setTotalPages(Math.ceil(response.total / 20))
    } catch (err: any) {
      console.error('Error loading questions:', err)
      if (err.message.includes('404')) {
        // 404 means no questions found, not an error
        setQuestions([])
        setTotalPages(1)
        setError(null)
      } else if (err.message.includes('401') || err.message.includes('403')) {
        setError('You do not have permission to view questions. Please check your authentication.')
      } else if (err.message.includes('500')) {
        setError('Server error occurred. Please try again later.')
      } else if (err.message.includes('Network Error') || err.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsResponse = await questionService.getQuestionStats()
      setStats(statsResponse)
    } catch (err: any) {
      console.error('Error loading stats:', err)
      // Don't show error for stats as it's not critical
    }
  }

  // Computed values
  const filteredQuestions = questions
  const hasQuestions = questions.length > 0
  const isEmpty = !loading && !error && questions.length === 0

  const resetForm = () => {
    setNewQuestion({
      title: '',
      type: 'single_choice',
      difficulty: 'medium',
      points: 10,
      options: [
        { text: '' },
        { text: '' },
        { text: '' },
        { text: '' }
      ],
      correctAnswers: [],
      sampleAnswer: ''
    })
    setFormErrors({})
  }

  const handleAddQuestion = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return
    }

    try {
      setSubmitLoading(true)
      
      // Filter out empty options for choice questions
      let processedOptions = newQuestion.options
      if (newQuestion.type !== 'essay') {
        processedOptions = newQuestion.options.filter(opt => opt.text.trim())
      }

      // For new questions, we need to map the temporary correct answers to actual option indices
      let correctAnswers: string[] = []
      if (newQuestion.type !== 'essay') {
        newQuestion.correctAnswers.forEach(tempId => {
          const index = parseInt(tempId.replace('temp_', ''))
          if (index >= 0 && index < processedOptions.length) {
            // We'll send the index and let the backend generate proper IDs
            correctAnswers.push(index.toString())
          }
        })
      }

      // Convert to API request format
      const requestData: CreateQuestionRequest = {
        title: newQuestion.title.trim(),
        type: newQuestion.type,
        difficulty: newQuestion.difficulty,
        points: newQuestion.points,
        options: newQuestion.type !== 'essay' ? processedOptions.map(opt => ({ text: opt.text })) : undefined,
        correct_answers: correctAnswers.length > 0 ? correctAnswers : undefined,
        sample_answer: newQuestion.type === 'essay' ? newQuestion.sampleAnswer : undefined
      }

      await questionService.createQuestion(requestData)
      
      // Reset form and close dialog
      resetForm()
      setIsAddDialogOpen(false)
      
      // Reload questions and stats
      await loadQuestions()
      await loadStats()
      
      // Show success message
      alert('Question created successfully!')
    } catch (err: any) {
      console.error('Error creating question:', err)
      if (err.message.includes('400')) {
        alert('Invalid question data. Please check your inputs and try again.')
      } else if (err.message.includes('401') || err.message.includes('403')) {
        alert('You do not have permission to create questions.')
      } else {
        alert('Failed to create question. Please try again.')
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) return
    
    try {
      await questionService.deleteQuestion(questionId)
      
      // Reload questions and stats
      await loadQuestions()
      await loadStats()
      
      alert('Question deleted successfully!')
    } catch (err: any) {
      console.error('Error deleting question:', err)
      if (err.message.includes('404')) {
        alert('Question not found. It may have already been deleted.')
      } else if (err.message.includes('401') || err.message.includes('403')) {
        alert('You do not have permission to delete questions.')
      } else {
        alert('Failed to delete question. Please try again.')
      }
    }
  }

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question)
    setIsViewDialogOpen(true)
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setIsEditDialogOpen(true)
  }

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return

    try {
      setSubmitLoading(true)
      
      const updateData = {
        title: editingQuestion.title,
        difficulty: editingQuestion.difficulty,
        points: editingQuestion.points,
        is_active: editingQuestion.isActive
      }

      await questionService.updateQuestion(editingQuestion.id, updateData)
      
      // Close dialog and reload
      setIsEditDialogOpen(false)
      setEditingQuestion(null)
      await loadQuestions()
      await loadStats()
      
      alert('Question updated successfully!')
    } catch (err: any) {
      console.error('Error updating question:', err)
      alert('Failed to update question. Please try again.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...newQuestion.options]
    updatedOptions[index] = { ...updatedOptions[index], text: value }
    setNewQuestion({ ...newQuestion, options: updatedOptions })
    
    // Clear option errors when user starts typing
    if (formErrors.options) {
      setFormErrors({ ...formErrors, options: undefined })
    }
  }

  const handleCorrectAnswerToggle = (optionIndex: number) => {
    // Use the index-based approach for new questions since we don't have database IDs yet
    const optionId = `temp_${optionIndex}` // Temporary ID for form handling
    let updatedCorrectAnswers = [...newQuestion.correctAnswers]
    
    if (newQuestion.type === 'single_choice') {
      updatedCorrectAnswers = [optionId]
    } else {
      if (updatedCorrectAnswers.includes(optionId)) {
        updatedCorrectAnswers = updatedCorrectAnswers.filter(id => id !== optionId)
      } else {
        updatedCorrectAnswers.push(optionId)
      }
    }
    
    setNewQuestion({ ...newQuestion, correctAnswers: updatedCorrectAnswers })
    
    // Clear correct answer errors when user makes selection
    if (formErrors.correctAnswers) {
      setFormErrors({ ...formErrors, correctAnswers: undefined })
    }
  }

  const addOption = () => {
    if (newQuestion.options.length < 10) {
      setNewQuestion({
        ...newQuestion,
        options: [...newQuestion.options, { text: '' }]
      })
    }
  }

  const removeOption = (index: number) => {
    if (newQuestion.options.length > 2) {
      const updatedOptions = newQuestion.options.filter((_, i) => i !== index)
      // Also remove from correct answers if it was selected
      const optionId = `temp_${index}`
      const updatedCorrectAnswers = newQuestion.correctAnswers.filter(id => id !== optionId)
      
      setNewQuestion({
        ...newQuestion,
        options: updatedOptions,
        correctAnswers: updatedCorrectAnswers
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <QuestionStatsCards stats={stats} />

      {/* Filters and Controls */}
      <QuestionFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        difficultyFilter={difficultyFilter}
        setDifficultyFilter={setDifficultyFilter}
        onAddQuestion={() => {
          resetForm()
          setIsAddDialogOpen(true)
        }}
      />

      {/* Add Question Dialog */}
      <AddQuestionDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        newQuestion={newQuestion}
        setNewQuestion={setNewQuestion}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        submitLoading={submitLoading}
        onSubmit={handleAddQuestion}
        onCancel={() => {
          setIsAddDialogOpen(false)
          resetForm()
        }}
        onOptionChange={handleOptionChange}
        onCorrectAnswerToggle={handleCorrectAnswerToggle}
        onAddOption={addOption}
        onRemoveOption={removeOption}
      />

      {/* Questions List */}
      <QuestionsList
        loading={loading}
        error={error}
        isEmpty={isEmpty}
        hasQuestions={hasQuestions}
        questions={filteredQuestions}
        searchTerm={searchTerm}
        typeFilter={typeFilter}
        difficultyFilter={difficultyFilter}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        setSearchTerm={setSearchTerm}
        setTypeFilter={setTypeFilter}
        setDifficultyFilter={setDifficultyFilter}
        setIsAddDialogOpen={setIsAddDialogOpen}
        onLoadQuestions={loadQuestions}
        onViewQuestion={handleViewQuestion}
        onEditQuestion={handleEditQuestion}
        onDeleteQuestion={handleDeleteQuestion}
      />

      {/* View Question Dialog */}
      <ViewQuestionDialog
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        selectedQuestion={selectedQuestion}
      />

      {/* Edit Question Dialog */}
      <EditQuestionDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingQuestion={editingQuestion}
        setEditingQuestion={setEditingQuestion}
        submitLoading={submitLoading}
        onSubmit={handleUpdateQuestion}
        onCancel={() => {
          setIsEditDialogOpen(false)
          setEditingQuestion(null)
        }}
      />
    </div>
  )
} 