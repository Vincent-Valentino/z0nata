import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
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
  Plus
} from 'lucide-react'
import type { QuestionDisplay } from '@/services/questionService'

// Use QuestionDisplay interface for component state (camelCase)
type Question = QuestionDisplay

interface QuestionsListProps {
  loading: boolean
  error: string | null
  isEmpty: boolean
  hasQuestions: boolean
  questions: Question[]
  searchTerm: string
  typeFilter: 'all' | 'single_choice' | 'multiple_choice' | 'essay'
  difficultyFilter: 'all' | 'easy' | 'medium' | 'hard'
  currentPage: number
  totalPages: number
  setCurrentPage: (page: number) => void
  setSearchTerm: (value: string) => void
  setTypeFilter: (value: 'all' | 'single_choice' | 'multiple_choice' | 'essay') => void
  setDifficultyFilter: (value: 'all' | 'easy' | 'medium' | 'hard') => void
  setIsAddDialogOpen: (open: boolean) => void
  onLoadQuestions: () => void
  onViewQuestion: (question: Question) => void
  onEditQuestion: (question: Question) => void
  onDeleteQuestion: (questionId: string) => void
}

export const QuestionsList = ({
  loading,
  error,
  isEmpty,
  hasQuestions,
  questions,
  searchTerm,
  typeFilter,
  difficultyFilter,
  currentPage,
  totalPages,
  setCurrentPage,
  setSearchTerm,
  setTypeFilter,
  setDifficultyFilter,
  setIsAddDialogOpen,
  onLoadQuestions,
  onViewQuestion,
  onEditQuestion,
  onDeleteQuestion
}: QuestionsListProps) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Questions ({questions.length})</CardTitle>
        <CardDescription>Manage your question bank</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Questions</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={onLoadQuestions}>Try Again</Button>
          </div>
        )}
        
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Loading Questions</h3>
            <p className="text-muted-foreground">Please wait while we fetch your questions...</p>
          </div>
        )}
        
        {isEmpty && (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm || typeFilter !== 'all' || difficultyFilter !== 'all' 
                ? 'No Questions Found' 
                : 'No Questions Yet'
              }
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm || typeFilter !== 'all' || difficultyFilter !== 'all' 
                ? 'No questions match your current search criteria. Try adjusting your filters or search terms.'
                : 'Welcome! Your question bank is empty. Create your first question to get started with building quizzes and assessments.'
              }
            </p>
            {(!searchTerm && typeFilter === 'all' && difficultyFilter === 'all') && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Question
              </Button>
            )}
            {(searchTerm || typeFilter !== 'all' || difficultyFilter !== 'all') && (
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setTypeFilter('all')
                    setDifficultyFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
              </div>
            )}
          </div>
        )}
        
        {!loading && !error && hasQuestions && (
          <div className="space-y-4">
            {questions.map((question) => (
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
                    
                    {question.type === 'essay' && question.sampleAnswer && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Sample Answer:</p>
                        <div className="text-sm bg-muted p-4 rounded border-l-4 border-blue-500">
                          {question.sampleAnswer.length > 200 
                            ? `${question.sampleAnswer.substring(0, 200)}...`
                            : question.sampleAnswer
                          }
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title="View Details & Correct Answers"
                      onClick={() => onViewQuestion(question)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title="Edit Question"
                      onClick={() => onEditQuestion(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onDeleteQuestion(question.id)}
                      title="Delete Question"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
  )
} 