import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  FileText, 
  CheckSquare, 
  Square,
  MessageSquare,
  Eye,
  Calendar,
  User
} from 'lucide-react'

interface Question {
  id: string
  title: string
  type: 'single_choice' | 'multiple_choice' | 'essay'
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  createdBy: string
  createdAt: string
  options?: string[]
  correctAnswers?: number[]
  sampleAnswer?: string
  isActive: boolean
}

export const AdminQuestions = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'single_choice' | 'multiple_choice' | 'essay'>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newQuestion, setNewQuestion] = useState<{
    title: string;
    type: 'single_choice' | 'multiple_choice' | 'essay';
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    options: string[];
    correctAnswers: number[];
    sampleAnswer: string;
  }>({
    title: '',
    type: 'single_choice',
    category: '',
    difficulty: 'medium',
    options: ['', '', '', ''],
    correctAnswers: [],
    sampleAnswer: ''
  })

  // Mock data - replace with real API calls
  const questions: Question[] = [
    {
      id: '1',
      title: 'What is the capital of Indonesia?',
      type: 'single_choice',
      category: 'Geography',
      difficulty: 'easy',
      createdBy: 'admin@zonata.com',
      createdAt: '2024-03-15',
      options: ['Jakarta', 'Surabaya', 'Bandung', 'Medan'],
      correctAnswers: [0],
      isActive: true
    },
    {
      id: '2',
      title: 'Which of the following are programming languages?',
      type: 'multiple_choice',
      category: 'Technology',
      difficulty: 'medium',
      createdBy: 'admin@zonata.com',
      createdAt: '2024-03-14',
      options: ['JavaScript', 'HTML', 'Python', 'CSS'],
      correctAnswers: [0, 2],
      isActive: true
    },
    {
      id: '3',
      title: 'Explain the concept of machine learning and its applications.',
      type: 'essay',
      category: 'Technology',
      difficulty: 'hard',
      createdBy: 'admin@zonata.com',
      createdAt: '2024-03-13',
      sampleAnswer: 'Machine learning is a subset of artificial intelligence (AI) that enables computers to learn and improve from experience without being explicitly programmed. Applications include: 1) Predictive analytics in business, 2) Image and speech recognition, 3) Recommendation systems, 4) Autonomous vehicles, 5) Medical diagnosis and drug discovery.',
      isActive: true
    }
  ]

  const categories = ['Geography', 'Technology', 'Science', 'History', 'Mathematics']

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || question.type === typeFilter
    const matchesDifficulty = difficultyFilter === 'all' || question.difficulty === difficultyFilter
    
    return matchesSearch && matchesType && matchesDifficulty
  })

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

  const handleAddQuestion = () => {
    console.log('Adding question:', newQuestion)
    // Implement add question logic
    setIsAddDialogOpen(false)
    setNewQuestion({
      title: '',
      type: 'single_choice',
      category: '',
      difficulty: 'medium',
      options: ['', '', '', ''],
      correctAnswers: [],
      sampleAnswer: ''
    })
  }

  const handleDeleteQuestion = (questionId: string) => {
    console.log('Deleting question:', questionId)
    // Implement delete logic
  }

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...newQuestion.options]
    updatedOptions[index] = value
    setNewQuestion({ ...newQuestion, options: updatedOptions })
  }

  const handleCorrectAnswerToggle = (index: number) => {
    let updatedCorrectAnswers = [...newQuestion.correctAnswers]
    
    if (newQuestion.type === 'single_choice') {
      updatedCorrectAnswers = [index]
    } else {
      if (updatedCorrectAnswers.includes(index)) {
        updatedCorrectAnswers = updatedCorrectAnswers.filter(i => i !== index)
      } else {
        updatedCorrectAnswers.push(index)
      }
    }
    
    setNewQuestion({ ...newQuestion, correctAnswers: updatedCorrectAnswers })
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">817</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Single Choice</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">456</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Multiple Choice</CardTitle>
            <Square className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">234</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Essays</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('all')}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            All Types
          </Button>
          <Button
            variant={typeFilter === 'single_choice' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('single_choice')}
            className="gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            Single
          </Button>
          <Button
            variant={typeFilter === 'multiple_choice' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('multiple_choice')}
            className="gap-2"
          >
            <Square className="h-4 w-4" />
            Multiple
          </Button>
          <Button
            variant={typeFilter === 'essay' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('essay')}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Essay
          </Button>
          
          <Button
            variant={difficultyFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setDifficultyFilter('all')}
          >
            All Levels
          </Button>
          <Button
            variant={difficultyFilter === 'easy' ? 'default' : 'outline'}
            onClick={() => setDifficultyFilter('easy')}
          >
            Easy
          </Button>
          <Button
            variant={difficultyFilter === 'medium' ? 'default' : 'outline'}
            onClick={() => setDifficultyFilter('medium')}
          >
            Medium
          </Button>
          <Button
            variant={difficultyFilter === 'hard' ? 'default' : 'outline'}
            onClick={() => setDifficultyFilter('hard')}
          >
            Hard
          </Button>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Question</DialogTitle>
              <DialogDescription>
                Create a new question for the question bank
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Question Title</label>
                <Textarea
                  placeholder="Enter your question..."
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select 
                    value={newQuestion.type} 
                    onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as 'single_choice' | 'multiple_choice' | 'essay' })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="single_choice">Single Choice</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select 
                    value={newQuestion.category} 
                    onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select category...</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
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
              </div>
              
              {(newQuestion.type === 'single_choice' || newQuestion.type === 'multiple_choice') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Answer Options</label>
                  <div className="space-y-2">
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCorrectAnswerToggle(index)}
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            newQuestion.correctAnswers.includes(index) 
                              ? 'bg-primary border-primary' 
                              : 'border-muted-foreground'
                          }`}
                        >
                          {newQuestion.correctAnswers.includes(index) && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </button>
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click the circles to mark correct answers
                    {newQuestion.type === 'single_choice' && ' (select one)'}
                    {newQuestion.type === 'multiple_choice' && ' (select multiple)'}
                  </p>
                </div>
              )}
              
              {newQuestion.type === 'essay' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sample Answer</label>
                  <Textarea
                    placeholder="Provide a sample answer or key points that should be covered..."
                    value={newQuestion.sampleAnswer}
                    onChange={(e) => setNewQuestion({ ...newQuestion, sampleAnswer: e.target.value })}
                    className="h-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will help graders understand what to look for in student responses.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddQuestion}>
                  Add Question
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
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getQuestionTypeIcon(question.type)}
                      <h3 className="font-medium">{question.title}</h3>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {getQuestionTypeBadge(question.type)}
                      {getDifficultyBadge(question.difficulty)}
                      <Badge variant="outline">{question.category}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {question.createdBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {question.createdAt}
                      </span>
                    </div>
                    
                    {question.options && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Options:</p>
                        {question.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                              question.correctAnswers?.includes(index) 
                                ? 'bg-green-100 border-green-300 text-green-700' 
                                : 'border-gray-300'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span>{option}</span>
                            {question.correctAnswers?.includes(index) && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                Correct
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'essay' && question.sampleAnswer && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Sample Answer:</p>
                        <div className="text-sm bg-muted p-3 rounded border-l-4 border-blue-500">
                          {question.sampleAnswer}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredQuestions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No questions found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 