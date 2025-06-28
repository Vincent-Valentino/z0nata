import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Trophy, 
  Clock, 
  Target, 
  CheckCircle, 
  XCircle, 
  Award,
  Star,
  RotateCcw,
  Home,
  BarChart3,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { QuestionDetailModal } from './QuestionDetailModal'
import type { DetailedQuizResult, QuestionResult } from '@/types/quiz'

interface QuizResultsDisplayProps {
  result: DetailedQuizResult
}

export const QuizResultsDisplay: React.FC<QuizResultsDisplayProps> = ({
  result
}) => {
  const navigate = useNavigate()
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionResult | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Pagination settings based on quiz type
  const itemsPerPage = result.quiz_type === 'mock_test' ? 10 : result.total_questions
  const showPagination = result.quiz_type === 'mock_test' && result.question_results && result.question_results.length > itemsPerPage
  
  // Calculate paginated questions
  const paginatedQuestions = useMemo(() => {
    if (!result.question_results) return []
    
    if (!showPagination) {
      return result.question_results
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return result.question_results.slice(startIndex, endIndex)
  }, [result.question_results, currentPage, itemsPerPage, showPagination])
  
  const totalPages = Math.ceil((result.question_results?.length || 0) / itemsPerPage)

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 80) return 'text-blue-600 dark:text-blue-400'
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, text: 'Excellent', icon: Trophy }
    if (score >= 80) return { variant: 'secondary' as const, text: 'Great', icon: Star }
    if (score >= 70) return { variant: 'outline' as const, text: 'Good', icon: CheckCircle }
    return { variant: 'destructive' as const, text: 'Needs Work', icon: XCircle }
  }

  const scoreBadge = getScoreBadge(result.score)
  const ScoreIcon = scoreBadge.icon

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="text-center">
            <div className="mb-4">
              <ScoreIcon className="w-16 h-16 mx-auto text-current" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Quiz Complete!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              {result.quiz_type === 'mock_test' ? 'Mock Test' : 'Time Quiz'} Results
            </p>
            <div className={`text-5xl sm:text-6xl font-bold mb-2 ${getScoreColor(result.score)}`}>
              {result.score}%
            </div>
            <Badge variant={scoreBadge.variant} className="text-lg px-4 py-2">
              {scoreBadge.text}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                    {result.score}%
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Correct</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.correct_answers}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Incorrect</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {result.total_questions - result.correct_answers}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Time</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatTime(result.time_used_seconds)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Performance</span>
                  <span className={getScoreColor(result.score)}>{result.score}%</span>
                </div>
                <Progress value={result.score} className="h-3" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Accuracy Rate</span>
                    <span>{Math.round((result.correct_answers / result.total_questions) * 100)}%</span>
                  </div>
                  <Progress value={(result.correct_answers / result.total_questions) * 100} className="h-2" />
                </div>
                
                {result.quiz_type === 'time_quiz' && result.time_limit_minutes && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Time Efficiency</span>
                      <span>{Math.round((result.time_used_seconds / (result.time_limit_minutes * 60)) * 100)}%</span>
                    </div>
                    <Progress value={(result.time_used_seconds / (result.time_limit_minutes * 60)) * 100} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Breakdown */}
        {result.question_results && result.question_results.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Question Breakdown
                  <Badge variant="outline" className="ml-2">
                    {result.quiz_type === 'mock_test' ? 'Mock Test' : 'Time Quiz'}
                  </Badge>
                </CardTitle>
                {showPagination && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>
                      Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, result.question_results.length)} of {result.question_results.length} questions
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paginatedQuestions.map((questionResult, index) => {
                  const actualIndex = showPagination ? ((currentPage - 1) * itemsPerPage) + index : index
                  return (
                    <div key={questionResult.question_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[3rem]">
                          Q{actualIndex + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm truncate max-w-md lg:max-w-lg">{questionResult.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                questionResult.difficulty === 'easy' ? 'text-green-600' :
                                questionResult.difficulty === 'medium' ? 'text-orange-600' :
                                'text-red-600'
                              }`}
                            >
                              {questionResult.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {questionResult.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => setSelectedQuestion(questionResult)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900"
                          title="View question details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          {questionResult.is_correct ? (
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : questionResult.is_skipped ? (
                            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">S</span>
                            </div>
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                          )}
                          <span className="text-sm font-medium min-w-[3rem] text-right">
                            {questionResult.points_earned}/{questionResult.points}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination Controls for Mock Test */}
              {showPagination && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate('/results')} variant="outline" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            View All Results
          </Button>
          
          <Button onClick={() => navigate('/')} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
          
          <Button 
            onClick={() => {
              const quizPath = result.quiz_type === 'mock_test' ? '/mock-test' : '/time-quiz'
              navigate(quizPath)
            }} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Take Another Quiz
          </Button>
        </div>
      </div>

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <QuestionDetailModal
          isOpen={!!selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          questionResult={selectedQuestion}
          questionNumber={result.question_results?.findIndex(q => q.question_id === selectedQuestion.question_id) + 1 || 1}
        />
      )}
    </div>
  )
} 