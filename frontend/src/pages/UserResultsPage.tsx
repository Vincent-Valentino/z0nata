import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Trophy, 
  Clock, 
  Target, 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Award,
  Flame,
  Eye,
  Home,
  User,
  BookOpen,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { QuestionDetailModal } from '@/components/block/results'
import { userResultsService, type UserQuizStatistics } from '@/services/userResultsService'
import { useAuthStore } from '@/store/authStore'
import type { DetailedQuizResult, QuestionResult } from '@/types/quiz'

const UserResultsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  
  const [results, setResults] = useState<DetailedQuizResult[]>([])
  const [statistics, setStatistics] = useState<UserQuizStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionResult | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Check authentication and authorization
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Users can only view their own results (or admin can view any)
    if (userId && user?.id !== userId && user?.role !== 'admin') {
      navigate('/')
      return
    }
  }, [isAuthenticated, userId, user, navigate])

  // Fetch user results and statistics
  useEffect(() => {
    const fetchData = async () => {
      if (!userId && !user?.id) return

      const targetUserId = userId || user?.id
      if (!targetUserId) return

      try {
        setLoading(true)
        setError(null)

        console.log('🔍 Fetching results for user:', targetUserId)
        console.log('🔍 Current user:', user)
        console.log('🔍 URL userId:', userId)

        // Fetch user results with pagination
        const resultsResponse = await userResultsService.getUserResults(targetUserId, currentPage)
        console.log('✅ Results response:', resultsResponse)
        
        if (!resultsResponse) {
          throw new Error('No response received from server')
        }

        // The backend response structure is: { results: [], stats: {}, achievements: [], total_count: number }
        if (currentPage === 1) {
          setResults(resultsResponse.results || [])
        } else {
          setResults(prev => [...prev, ...(resultsResponse.results || [])])
        }

        // Calculate pagination info from total_count
        const totalResults = resultsResponse.total_count || 0
        const totalPages = Math.ceil(totalResults / 10) // 10 items per page
        setHasMore(currentPage < totalPages)

        // Convert backend stats to frontend format with error handling
        try {
          if (resultsResponse.stats) {
            const frontendStats = userResultsService.convertBackendStatsToFrontend(
              resultsResponse.stats, 
              resultsResponse.results || []
            )
            setStatistics(frontendStats)
          } else {
            // Fallback: calculate stats from results if backend stats not available
            const fallbackStats = userResultsService.calculateStatistics(resultsResponse.results || [])
            setStatistics(fallbackStats)
          }
        } catch (statsError: any) {
          console.error('❌ Error processing statistics:', statsError)
          // Set basic statistics to prevent crashes
          setStatistics({
            totalQuizzes: (resultsResponse.results || []).length,
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
          })
        }

      } catch (err: any) {
        console.error('❌ Failed to fetch user results:', err)
        console.error('❌ Error details:', {
          message: err.message,
          response: err.response,
          status: err.response?.status,
          data: err.response?.data
        })
        
        let errorMessage = 'Failed to load results'
        
        if (err.response?.status === 401) {
          errorMessage = 'Authentication required. Please login again.'
        } else if (err.response?.status === 403) {
          errorMessage = 'You do not have permission to view these results.'
        } else if (err.response?.status === 404) {
          errorMessage = 'No results found for this user.'
        } else if (err.message) {
          errorMessage = err.message
        }
        
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId, user?.id, currentPage])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default'
    if (score >= 80) return 'secondary'
    if (score >= 70) return 'outline'
    return 'destructive'
  }

  const loadMore = () => {
    setCurrentPage(prev => prev + 1)
  }

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Results</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/')} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show "no results" state when successfully loaded but no results found
  if (!loading && statistics && results.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Quiz Results & Statistics
              </h1>
              <p className="text-gray-600 mt-1">
                {userId && user?.id !== userId ? `User ID: ${userId}` : 'Your performance overview'}
              </p>
            </div>
            <Button onClick={() => navigate('/')} variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>

          {/* No Results State */}
          <div className="flex items-center justify-center py-16">
            <Card className="max-w-lg w-full">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                  <Trophy className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No Quiz Results Yet</h3>
                <p className="text-gray-600 mb-6">
                  You haven't completed any quizzes yet. Start your learning journey by taking a quiz!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => navigate('/mock-test')}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Take Mock Test
                  </Button>
                  <Button 
                    onClick={() => navigate('/time-quiz')}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Start Time Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Quiz Results & Statistics
            </h1>
            <p className="text-gray-600 mt-1">
              {userId && user?.id !== userId ? `User ID: ${userId}` : 'Your performance overview'}
            </p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {statistics && (
          <>
            {/* Overall Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                    <Trophy className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{statistics.totalQuizzes}</div>
                  <div className="text-sm text-gray-600">Total Quizzes</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{statistics.averageScore.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{Math.round(statistics.totalTimeSpent)}m</div>
                  <div className="text-sm text-gray-600">Time Spent</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
                    <Flame className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{statistics.streaks.currentStreak}</div>
                  <div className="text-sm text-gray-600">Current Streak</div>
                </CardContent>
              </Card>
            </div>

            {/* Performance by Quiz Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Quiz Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Mock Tests</div>
                        <div className="text-sm text-gray-600">Comprehensive exams</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{statistics.mockTestCount}</div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Time Quizzes</div>
                        <div className="text-sm text-gray-600">Quick practice</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{statistics.timeQuizCount}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Accuracy by Difficulty
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-green-600">Easy</span>
                        <span className="text-sm text-gray-600">
                          {statistics.easyQuestions.correct}/{statistics.easyQuestions.answered}
                        </span>
                      </div>
                      <Progress value={statistics.easyQuestions.accuracy} className="h-2" />
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {statistics.easyQuestions.accuracy.toFixed(1)}%
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-orange-600">Medium</span>
                        <span className="text-sm text-gray-600">
                          {statistics.mediumQuestions.correct}/{statistics.mediumQuestions.answered}
                        </span>
                      </div>
                      <Progress value={statistics.mediumQuestions.accuracy} className="h-2" />
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {statistics.mediumQuestions.accuracy.toFixed(1)}%
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-red-600">Hard</span>
                        <span className="text-sm text-gray-600">
                          {statistics.hardQuestions.correct}/{statistics.hardQuestions.answered}
                        </span>
                      </div>
                      <Progress value={statistics.hardQuestions.accuracy} className="h-2" />
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {statistics.hardQuestions.accuracy.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-700">{statistics.bestScore.toFixed(1)}%</div>
                    <div className="text-sm text-yellow-600">Best Score</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
                    <Flame className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-700">{statistics.streaks.longestStreak}</div>
                    <div className="text-sm text-red-600">Longest Streak</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-700">{statistics.accuracyRate.toFixed(1)}%</div>
                    <div className="text-sm text-blue-600">Overall Accuracy</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Quiz History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Quiz History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes taken yet</h3>
                <p className="text-gray-600 mb-4">Start taking quizzes to see your results here!</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate('/mock-test')}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Mock Test
                  </Button>
                  <Button onClick={() => navigate('/time-quiz')} variant="outline">
                    <Zap className="w-4 h-4 mr-2" />
                    Time Quiz
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result) => (
                  <div key={result.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={result.quiz_type === 'mock_test' ? 'default' : 'secondary'}>
                            {result.quiz_type === 'mock_test' ? 'Mock Test' : 'Time Quiz'}
                          </Badge>
                          <Badge variant={getScoreBadgeVariant(result.score_percentage || 0)}>
                            {(result.score_percentage || 0).toFixed(1)}%
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {result.completed_at ? formatDate(result.completed_at) : 'Date unknown'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Score:</span>
                            <span className={`ml-1 font-medium ${getScoreColor(result.score_percentage || 0)}`}>
                              {result.earned_points || 0}/{result.total_points || 0} pts
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Correct:</span>
                            <span className="ml-1 font-medium text-green-600">
                              {result.correct_answers || 0}/{result.total_questions || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Time:</span>
                            <span className="ml-1 font-medium text-purple-600">
                              {formatTime(result.time_used_seconds || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <span className={`ml-1 font-medium ${
                              result.completion_status === 'completed' ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {result.completion_status || 'unknown'}
                            </span>
                          </div>
                        </div>

                        {(result.skipped_questions || 0) > 0 && (
                          <div className="mt-2">
                            <span className="text-sm text-yellow-600">
                              {result.skipped_questions} question(s) skipped
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate('/results', { state: { result } })}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="text-center pt-4">
                    <Button onClick={loadMore} variant="outline" disabled={loading}>
                      {loading ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate('/mock-test')} className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Take Mock Test
          </Button>
          
          <Button onClick={() => navigate('/time-quiz')} variant="outline" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Take Time Quiz
          </Button>
          
          <Button onClick={() => navigate('/')} variant="outline" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <QuestionDetailModal
          isOpen={!!selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          questionResult={selectedQuestion}
          questionNumber={1} // This would need to be calculated properly
        />
      )}
    </div>
  )
}

export default UserResultsPage 