import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  CheckSquare, 
  Square,
  MessageSquare,
  Eye,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react'
import { questionService, convertQuestionToDisplay, convertDisplayToRequest } from '@/services/questionService'
import type { QuestionDisplay } from '@/services/questionService'

// Use QuestionDisplay interface for component state (camelCase)
type Question = QuestionDisplay

// Form validation interface
interface FormErrors {
  title?: string
  options?: string[]
  correctAnswers?: string
  sampleAnswer?: string
  maxPoints?: string
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
    options: { text: string; points: number }[];
    correctAnswers: string[];
    sampleAnswer: string;
    maxPoints: number;
  }>({
    title: '',
    type: 'single_choice',
    difficulty: 'medium',
    points: 10,
    options: [
      { text: '', points: 0 },
      { text: '', points: 0 },
      { text: '', points: 0 },
      { text: '', points: 0 }
    ],
    correctAnswers: [],
    sampleAnswer: '',
    maxPoints: 10
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

      if (newQuestion.maxPoints > 0 && newQuestion.maxPoints < newQuestion.points) {
        errors.maxPoints = 'Maximum points cannot be less than base points'
      } else if (newQuestion.maxPoints > 10000) {
        errors.maxPoints = 'Maximum points cannot exceed 10000'
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
        setError('Question database not found. This might be the first time setting up questions.')
      } else if (err.message.includes('401') || err.message.includes('403')) {
        setError('You do not have permission to view questions. Please check your authentication.')
      } else {
        setError('Failed to load questions. Please try again.')
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

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'single_choice': return <CheckSquare className="h-4 w-4" />
      case 'multiple_choice': return <Square className="h-4 w-4" />
      case 'essay': return <MessageSquare className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case 'single_choice':
        return <Badge variant="default" className="bg-blue-100 text-blue-700">Single Choice</Badge>
      case 'multiple_choice':
        return <Badge variant="default" className="bg-green-100 text-green-700">Multiple Choice</Badge>
      case 'essay':
        return <Badge variant="default" className="bg-purple-100 text-purple-700">Essay</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Easy</Badge>
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Medium</Badge>
      case 'hard':
        return <Badge variant="secondary" className="bg-red-100 text-red-700">Hard</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const resetForm = () => {
    setNewQuestion({
      title: '',
      type: 'single_choice',
      difficulty: 'medium',
      points: 10,
      options: [
        { text: '', points: 0 },
        { text: '', points: 0 },
        { text: '', points: 0 },
        { text: '', points: 0 }
      ],
      correctAnswers: [],
      sampleAnswer: '',
      maxPoints: 10
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

      // Convert options to proper format with IDs
      const formattedOptions = processedOptions.map((option, index) => ({
        id: generateOptionId(index),
        text: option.text.trim(),
        order: index + 1,
        points: option.points
      }))

      // Convert to API request format
      const requestData = convertDisplayToRequest({
        ...newQuestion,
        title: newQuestion.title.trim(),
        options: newQuestion.type !== 'essay' ? formattedOptions : undefined,
        id: '', // Will be generated by backend
        createdBy: '', // Will be set by backend
        createdAt: '', // Will be set by backend
        updatedAt: '', // Will be set by backend
        isActive: true
      })

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

  const handleOptionChange = (index: number, field: 'text' | 'points', value: string | number) => {
    const updatedOptions = [...newQuestion.options]
    if (field === 'text') {
      updatedOptions[index] = { ...updatedOptions[index], text: value as string }
    } else {
      updatedOptions[index] = { ...updatedOptions[index], points: value as number }
    }
    setNewQuestion({ ...newQuestion, options: updatedOptions })
    
    // Clear option errors when user starts typing
    if (formErrors.options) {
      setFormErrors({ ...formErrors, options: undefined })
    }
  }

  const handleCorrectAnswerToggle = (optionId: string) => {
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
        options: [...newQuestion.options, { text: '', points: 0 }]
      })
    }
  }

  const removeOption = (index: number) => {
    if (newQuestion.options.length > 2) {
      const updatedOptions = newQuestion.options.filter((_, i) => i !== index)
      // Also remove from correct answers if it was selected
      const optionId = generateOptionId(index)
      const updatedCorrectAnswers = newQuestion.correctAnswers.filter(id => id !== optionId)
      
      setNewQuestion({
        ...newQuestion,
        options: updatedOptions,
        correctAnswers: updatedCorrectAnswers
      })
    }
  }

  const generateOptionId = (index: number) => `opt${index + 1}`

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats?.active_count || 0}</p>
                <p className="text-xs text-muted-foreground">Active Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats?.total_points || 0}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats?.average_points?.toFixed(1) || '0.0'}</p>
                <p className="text-xs text-muted-foreground">Avg Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="single_choice">Single Choice</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="essay">Essay</option>
          </select>
          
          <select 
            value={difficultyFilter} 
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Question</DialogTitle>
              <DialogDescription>
                Create a new question for the question bank. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Question Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Question Title *</label>
                <Textarea
                  placeholder="Enter your question..."
                  value={newQuestion.title}
                  onChange={(e) => {
                    setNewQuestion({ ...newQuestion, title: e.target.value })
                    if (formErrors.title) {
                      setFormErrors({ ...formErrors, title: undefined })
                    }
                  }}
                  className={formErrors.title ? 'border-red-500' : ''}
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.title}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {newQuestion.title.length}/500 characters
                </p>
              </div>
              
              {/* Question Configuration */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type *</label>
                  <select 
                    value={newQuestion.type} 
                    onChange={(e) => {
                      const newType = e.target.value as 'single_choice' | 'multiple_choice' | 'essay'
                      setNewQuestion({ 
                        ...newQuestion, 
                        type: newType,
                        correctAnswers: [], // Reset correct answers when type changes
                        options: newType === 'essay' ? [] : newQuestion.options
                      })
                      setFormErrors({}) // Clear all errors when type changes
                    }}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="single_choice">Single Choice</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty *</label>
                  <select 
                    value={newQuestion.difficulty} 
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Points *</label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={newQuestion.points}
                    onChange={(e) => {
                      const points = parseInt(e.target.value) || 1
                      setNewQuestion({ ...newQuestion, points })
                      if (formErrors.points) {
                        setFormErrors({ ...formErrors, points: undefined })
                      }
                    }}
                    className={formErrors.points ? 'border-red-500' : ''}
                  />
                  {formErrors.points && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.points}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Options for Choice Questions */}
              {(newQuestion.type === 'single_choice' || newQuestion.type === 'multiple_choice') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Answer Options *</label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addOption}
                        disabled={newQuestion.options.length >= 10}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {newQuestion.options.map((option, index) => {
                      const optionId = generateOptionId(index)
                      return (
                        <div key={index} className="space-y-2 p-3 border rounded-md">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCorrectAnswerToggle(optionId)}
                              className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                                newQuestion.correctAnswers.includes(optionId) 
                                  ? 'bg-primary border-primary text-white' 
                                  : 'border-muted-foreground hover:border-primary'
                              }`}
                            >
                              {newQuestion.correctAnswers.includes(optionId) && (
                                <span className="text-xs font-bold">✓</span>
                              )}
                            </button>
                            <Input
                              placeholder={`Option ${index + 1}`}
                              value={option.text}
                              onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                              className="flex-1"
                              maxLength={200}
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">Points:</span>
                              <Input
                                type="number"
                                min="0"
                                max="1000"
                                value={option.points}
                                onChange={(e) => handleOptionChange(index, 'points', parseInt(e.target.value) || 0)}
                                className="w-20"
                              />
                            </div>
                            {newQuestion.options.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {option.text.length}/200 characters
                          </p>
                        </div>
                      )
                    })}
                  </div>
                  
                  {formErrors.options && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside">
                          {formErrors.options.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {formErrors.correctAnswers && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{formErrors.correctAnswers}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-700">
                      <strong>Instructions:</strong>
                    </p>
                    <ul className="text-xs text-blue-600 mt-1 space-y-1">
                      <li>• Click the checkboxes to mark correct answers</li>
                      <li>• {newQuestion.type === 'single_choice' ? 'Select exactly one correct answer' : 'Select one or more correct answers'}</li>
                      <li>• Set points for each option (typically 0 for wrong answers)</li>
                      <li>• You can add up to 10 options</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Essay Question Fields */}
              {newQuestion.type === 'essay' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sample Answer</label>
                    <Textarea
                      placeholder="Provide a sample answer or key points that should be covered..."
                      value={newQuestion.sampleAnswer}
                      onChange={(e) => {
                        setNewQuestion({ ...newQuestion, sampleAnswer: e.target.value })
                        if (formErrors.sampleAnswer) {
                          setFormErrors({ ...formErrors, sampleAnswer: undefined })
                        }
                      }}
                      className={`h-32 ${formErrors.sampleAnswer ? 'border-red-500' : ''}`}
                      maxLength={2000}
                    />
                    {formErrors.sampleAnswer && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.sampleAnswer}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {newQuestion.sampleAnswer.length}/2000 characters. This will help graders understand what to look for in student responses.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Maximum Points</label>
                    <Input
                      type="number"
                      min="1"
                      max="10000"
                      value={newQuestion.maxPoints}
                      onChange={(e) => {
                        const maxPoints = parseInt(e.target.value) || newQuestion.points
                        setNewQuestion({ ...newQuestion, maxPoints })
                        if (formErrors.maxPoints) {
                          setFormErrors({ ...formErrors, maxPoints: undefined })
                        }
                      }}
                      className={formErrors.maxPoints ? 'border-red-500' : ''}
                    />
                    {formErrors.maxPoints && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.maxPoints}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Maximum points possible for this essay question (can be higher than base points for bonus credit).
                    </p>
                  </div>
                </div>
              )}
              
              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setIsAddDialogOpen(false)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button onClick={handleAddQuestion} disabled={submitLoading}>
                  {submitLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Add Question'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
          <CardDescription>Manage your question bank</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Unable to Load Questions</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadQuestions}>Try Again</Button>
            </div>
          )}
          
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Loading Questions</h3>
              <p className="text-muted-foreground">Please wait while we fetch your questions...</p>
            </div>
          )}
          
          {/* Empty State */}
          {isEmpty && (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No Questions Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm || typeFilter !== 'all' || difficultyFilter !== 'all' 
                  ? 'No questions match your current filters. Try adjusting your search criteria.'
                  : 'Your question bank is empty. Create your first question to get started with quizzes and assessments.'
                }
              </p>
              {(!searchTerm && typeFilter === 'all' && difficultyFilter === 'all') && (
                <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Question
                </Button>
              )}
            </div>
          )}
          
          {/* Questions List */}
          {!loading && !error && hasQuestions && (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
              <div key={question.id} className="border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      {getQuestionTypeIcon(question.type)}
                      <div className="flex-1">
                        <h3 className="font-medium text-lg leading-tight">{question.title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          {getQuestionTypeBadge(question.type)}
                          {getDifficultyBadge(question.difficulty)}
                          <Badge variant="outline" className="text-xs">
                            {question.points} pts
                          </Badge>
                          {!question.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {question.createdBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(question.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Options Display */}
                    {question.options && question.options.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Options:</p>
                        <div className="grid gap-2">
                          {question.options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm p-2 rounded border-l-2 border-l-transparent hover:border-l-primary hover:bg-muted/50">
                              <span className={`w-6 h-6 rounded border flex items-center justify-center text-xs font-medium ${
                                question.correctAnswers?.includes(option.id) 
                                  ? 'bg-green-100 border-green-300 text-green-700' 
                                  : 'border-gray-300 text-gray-500'
                              }`}>
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span className="flex-1">{option.text}</span>
                              {option.points > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {option.points} pts
                                </Badge>
                              )}
                              {question.correctAnswers?.includes(option.id) && (
                                <Badge variant="default" className="bg-green-100 text-green-700 text-xs">
                                  Correct
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Essay Sample Answer */}
                    {question.type === 'essay' && question.sampleAnswer && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Sample Answer:</p>
                        <div className="text-sm bg-muted p-4 rounded border-l-4 border-blue-500">
                          {question.sampleAnswer.length > 200 
                            ? `${question.sampleAnswer.substring(0, 200)}...`
                            : question.sampleAnswer
                          }
                        </div>
                        {question.maxPoints && question.maxPoints !== question.points && (
                          <p className="text-xs text-muted-foreground">
                            Maximum points: {question.maxPoints}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 ml-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title="View Details & Correct Answers"
                      onClick={() => handleViewQuestion(question)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title="Edit Question"
                      onClick={() => handleEditQuestion(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteQuestion(question.id)}
                      title="Delete Question"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Question Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
          </DialogHeader>
          
          {selectedQuestion && (
            <div className="space-y-6">
              {/* Question Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Question ID</label>
                  <p className="text-sm text-gray-600 font-mono">{selectedQuestion.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm capitalize">{selectedQuestion.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Difficulty</label>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    selectedQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedQuestion.difficulty.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Points</label>
                  <p className="text-sm">{selectedQuestion.points}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Active</label>
                  <p className="text-sm">{selectedQuestion.isActive ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Max Points</label>
                  <p className="text-sm">{selectedQuestion.maxPoints || 'N/A'}</p>
                </div>
              </div>

              {/* Question Title */}
              <div>
                <label className="text-sm font-medium text-gray-700">Question Title</label>
                <div className="mt-1 p-3 border rounded-md bg-gray-50">
                  <p className="text-sm">{selectedQuestion.title}</p>
                </div>
              </div>

              {/* Options and Correct Answers */}
              {selectedQuestion.type !== 'essay' && selectedQuestion.options && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Options & Correct Answers</label>
                  <div className="mt-2 space-y-2">
                    {selectedQuestion.options.map((option, index) => {
                      const isCorrect = selectedQuestion.correctAnswers?.includes(option.id)
                      return (
                        <div
                          key={option.id}
                          className={`p-3 border rounded-md ${
                            isCorrect 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{option.text}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-mono">ID: {option.id}</span>
                              {isCorrect && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                  ✓ Correct Answer
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sample Answer for Essay */}
              {selectedQuestion.type === 'essay' && selectedQuestion.sampleAnswer && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Sample Answer</label>
                  <div className="mt-1 p-3 border rounded-md bg-gray-50">
                    <p className="text-sm whitespace-pre-wrap">{selectedQuestion.sampleAnswer}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <label className="font-medium">Created At</label>
                  <p>{new Date(selectedQuestion.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="font-medium">Updated At</label>
                  <p>{new Date(selectedQuestion.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          
          {editingQuestion && (
            <div className="space-y-6">
              {/* Question Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Title *
                </label>
                <textarea
                  value={editingQuestion.title}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    title: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter question title..."
                />
              </div>

              {/* Question Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.type.replace('_', ' ')}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 capitalize"
                  />
                  <p className="text-xs text-gray-500 mt-1">Question type cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty *
                  </label>
                  <select
                    value={editingQuestion.difficulty}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      difficulty: e.target.value as 'easy' | 'medium' | 'hard'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points *
                  </label>
                  <input
                    type="number"
                    value={editingQuestion.points}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      points: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Active Status
                  </label>
                  <select
                    value={editingQuestion.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      isActive: e.target.value === 'true'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Note:</strong> Only basic properties can be edited. To modify options, correct answers, or sample answers, 
                      you'll need to delete and recreate the question.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingQuestion(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleUpdateQuestion}
                  disabled={submitLoading || !editingQuestion.title.trim()}
                >
                  {submitLoading ? 'Updating...' : 'Update Question'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 