import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar, 
  BarChart3, 
  Award, 
  Star,
  CheckCircle,
  XCircle,
  FileText,
  BookOpen,
  Loader2,
  Zap
} from 'lucide-react'
import { userActivityService } from '@/services/userActivityService'
import type { QuizResult, UserStats, Achievement, QuizType } from '@/types/userActivity'

export const ResultsPage = () => {
  const { user } = useAuthStore()
  const [selectedQuizType, setSelectedQuizType] = useState<'all' | QuizType>('all')
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user results data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        setError(null)
        
        const filter = selectedQuizType !== 'all' ? { quiz_type: selectedQuizType } : {}
        const data = await userActivityService.getUserResults(filter)
        
        setQuizResults(data.results)
        setUserStats(data.stats)
        setAchievements(data.achievements)
      } catch (err) {
        setError('Failed to load quiz results')
        console.error('Error loading user results:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, selectedQuizType])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to view your results.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 80) return 'text-blue-600 dark:text-blue-400'
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default'
    if (score >= 80) return 'secondary'
    return 'outline'
  }

  const getQuizTypeColor = (quizType: QuizType) => {
    switch (quizType) {
      case 'mock_test': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'time_quiz': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getQuizTypeLabel = (quizType: QuizType) => {
    switch (quizType) {
      case 'mock_test': return 'Mock Test'
      case 'time_quiz': return 'Time Quiz'
      default: return quizType
    }
  }

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy': return Trophy
      case 'Clock': return Clock
      case 'Target': return Target
      case 'BookOpen': return BookOpen
      case 'Zap': return Zap
      default: return Award
    }
  }

  const quizTypes: Array<'all' | QuizType> = ['all', 'mock_test', 'time_quiz']
  const filteredResults = selectedQuizType === 'all' 
    ? quizResults 
    : quizResults.filter(quiz => quiz.quiz_type === selectedQuizType)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading quiz results...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-500" />
                Quiz Results
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track your learning progress and achievements
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStats ? Math.round(userStats.average_score) : 0}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Overall Average</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tests Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats?.total_quizzes_completed || 0}
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats ? Math.round(userStats.average_score) : 0}%
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Study Time</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatTime(userStats?.total_time_spent || 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Accuracy</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats && userStats.total_questions > 0 
                      ? Math.round((userStats.total_correct_answers / userStats.total_questions) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                  <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Results List */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Quiz History
                  </CardTitle>
                  <div className="flex gap-2">
                    {quizTypes.map((type) => (
                      <Button
                        key={type}
                        variant={selectedQuizType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedQuizType(type)}
                        className="capitalize"
                      >
                        {type === 'all' ? 'All' : getQuizTypeLabel(type)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredResults.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{quiz.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(quiz.completed_at)} • {formatTime(quiz.time_spent)}
                              {quiz.is_timed_out && <span className="text-red-500 ml-2">(Timed Out)</span>}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(quiz.score)}`}>
                            {quiz.score}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {quiz.correct_answers}/{quiz.total_questions}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getQuizTypeColor(quiz.quiz_type)}>
                            {getQuizTypeLabel(quiz.quiz_type)}
                          </Badge>
                          {quiz.quiz_type === 'time_quiz' && quiz.time_limit && (
                            <Badge variant="secondary">
                              {formatTime(quiz.time_limit)} limit
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={quiz.score} className="w-20" />
                          <Badge variant={getScoreBadgeVariant(quiz.score)}>
                            {quiz.score >= 80 ? (
                              <Star className="w-3 h-3 mr-1" />
                            ) : quiz.score >= 70 ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {quiz.score >= 80 ? 'Excellent' : quiz.score >= 70 ? 'Good' : 'Needs Work'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <div className="space-y-6">
            {/* Performance by Quiz Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance by Quiz Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userStats && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Mock Tests</span>
                        <span className={getScoreColor(userStats.mock_test_average)}>
                          {Math.round(userStats.mock_test_average)}%
                        </span>
                      </div>
                      <Progress value={userStats.mock_test_average} className="h-2" />
                      <p className="text-xs text-gray-500">{userStats.mock_test_count} completed</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Time Quizzes</span>
                        <span className={getScoreColor(userStats.time_quiz_average)}>
                          {Math.round(userStats.time_quiz_average)}%
                        </span>
                      </div>
                      <Progress value={userStats.time_quiz_average} className="h-2" />
                      <p className="text-xs text-gray-500">
                        {userStats.time_quiz_count} completed • {userStats.timeout_count} timed out
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {achievements.length > 0 ? (
                  achievements.slice(0, 3).map((achievement) => {
                    const IconComponent = getAchievementIcon(achievement.icon_name)
                    return (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                        <IconComponent className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <p className="text-sm font-medium">{achievement.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{achievement.description}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No achievements yet. Keep taking quizzes to earn achievements!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Study Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Study Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userStats && (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Weekly Goal</span>
                        <span>{userStats.weekly_progress}/{userStats.weekly_goal} quizzes</span>
                      </div>
                      <Progress 
                        value={(userStats.weekly_progress / userStats.weekly_goal) * 100} 
                        className="h-2" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Average Score Goal</span>
                        <span>{Math.round(userStats.average_score)}/{userStats.target_average_score}%</span>
                      </div>
                      <Progress 
                        value={(userStats.average_score / userStats.target_average_score) * 100} 
                        className="h-2" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Study Streak</span>
                        <span>{userStats.current_streak} days</span>
                      </div>
                      <Progress 
                        value={Math.min((userStats.current_streak / 7) * 100, 100)} 
                        className="h-2" 
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 