import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Trophy, 
  Clock, 
  Target, 
  Star,
  CheckCircle2, 
  XCircle, 
  SkipForward,
  Award,
  TrendingUp,
  RotateCcw,
  Home,
  Share2,
  Download
} from 'lucide-react'
import type { DetailedQuizResult, QuestionResult } from '@/types/quiz'

interface QuizResultsDisplayProps {
  result: DetailedQuizResult
  onRetry?: () => void
  onHome?: () => void
}

export const QuizResultsDisplay: React.FC<QuizResultsDisplayProps> = ({
  result,
  onRetry,
  onHome
}) => {
  const navigate = useNavigate()

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (percentage: number): "default" | "secondary" | "destructive" | "outline" => {
    if (percentage >= 90) return 'default'
    if (percentage >= 70) return 'secondary'
    return 'destructive'
  }

  const getPerformanceMessage = (): { title: string; description: string; icon: React.ReactNode } => {
    const percentage = result.score_percentage
    
    if (percentage >= 90) {
      return {
        title: 'Outstanding Performance!',
        description: 'Excellent work! You have mastered this topic.',
        icon: <Trophy className="w-6 h-6 text-yellow-500" />
      }
    } else if (percentage >= 80) {
      return {
        title: 'Great Job!',
        description: 'You have a strong understanding of the material.',
        icon: <Award className="w-6 h-6 text-blue-500" />
      }
    } else if (percentage >= 70) {
      return {
        title: 'Good Effort!',
        description: 'You\'re on the right track. Keep practicing!',
        icon: <Star className="w-6 h-6 text-yellow-500" />
      }
    } else {
      return {
        title: 'Keep Learning!',
        description: 'Review the material and try again to improve your score.',
        icon: <TrendingUp className="w-6 h-6 text-orange-500" />
      }
    }
  }

  const performance = getPerformanceMessage()
  const wrongAnswers = result.question_results.filter(q => !q.is_correct && !q.is_skipped)
  const skippedQuestions = result.question_results.filter(q => q.is_skipped)

  const difficultyStats = [
    {
      level: 'Easy',
      correct: result.easy_correct,
      total: result.easy_total,
      percentage: result.easy_total > 0 ? Math.round((result.easy_correct / result.easy_total) * 100) : 0,
      color: 'bg-green-100 text-green-800'
    },
    {
      level: 'Medium',
      correct: result.medium_correct,
      total: result.medium_total,
      percentage: result.medium_total > 0 ? Math.round((result.medium_correct / result.medium_total) * 100) : 0,
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      level: 'Hard',
      correct: result.hard_correct,
      total: result.hard_total,
      percentage: result.hard_total > 0 ? Math.round((result.hard_correct / result.hard_total) * 100) : 0,
      color: 'bg-red-100 text-red-800'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4 pb-4">
            <div className="flex justify-center">
              {performance.icon}
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-gray-900">
                {performance.title}
              </CardTitle>
              <CardDescription className="text-lg">
                {performance.description}
              </CardDescription>
            </div>
            
            {/* Main Score Display */}
            <div className="flex items-center justify-center space-x-8 py-4">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(result.score_percentage)}`}>
                  {Math.round(result.score_percentage)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Final Score</div>
              </div>
              
              {result.quiz_type === 'time_quiz' && result.time_bonus > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    +{result.time_bonus}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Time Bonus</div>
                </div>
              )}
            </div>

            <Badge 
              variant={getScoreBadgeVariant(result.score_percentage)}
              className="text-sm px-4 py-1"
            >
              {result.correct_answers}/{result.total_questions} Correct
            </Badge>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Statistics Column */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Overview Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="font-bold text-green-700">{result.correct_answers}</div>
                    <div className="text-xs text-green-600">Correct</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="font-bold text-red-700">{result.wrong_answers}</div>
                    <div className="text-xs text-red-600">Wrong</div>
                  </div>
                </div>
                
                {result.skipped_questions > 0 && (
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="font-bold text-yellow-700">{result.skipped_questions}</div>
                    <div className="text-xs text-yellow-600">Skipped</div>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Points Earned:</span>
                    <span className="font-semibold">{result.earned_points}/{result.total_points}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Time Used:</span>
                    <span className="font-mono">{formatTime(result.time_used_seconds)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quiz Type:</span>
                    <Badge variant="outline" className="text-xs">
                      {result.quiz_type === 'time_quiz' ? 'Time Quiz' : 'Mock Test'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance by Difficulty */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  By Difficulty
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {difficultyStats.map((stat) => (
                  <div key={stat.level} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className={stat.color}>
                        {stat.level}
                      </Badge>
                      <span className="text-sm font-medium">
                        {stat.correct}/{stat.total} ({stat.percentage}%)
                      </span>
                    </div>
                    <Progress value={stat.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Time Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Timing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Started:</span>
                  <span className="text-right text-xs">{formatDate(result.started_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Completed:</span>
                  <span className="text-right text-xs">{formatDate(result.completed_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Time Limit:</span>
                  <span className="font-mono">{formatTime(result.time_limit_minutes * 60)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Time Used:</span>
                  <span className="font-mono">{formatTime(result.time_used_seconds)}</span>
                </div>
                {result.time_left_seconds > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Time Saved:</span>
                    <span className="font-mono text-green-600">{formatTime(result.time_left_seconds)}</span>
                  </div>
                )}
                {result.is_timed_out && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-sm">
                      Quiz was automatically submitted due to time limit.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Question Review Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Wrong Answers */}
            {wrongAnswers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    Review Incorrect Answers ({wrongAnswers.length})
                  </CardTitle>
                  <CardDescription>
                    Focus on these questions to improve your understanding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {wrongAnswers.map((question, index) => (
                    <div key={question.question_id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-start gap-3 mb-3">
                        <Badge variant="destructive" className="mt-1">
                          {question.difficulty}
                        </Badge>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">{question.title}</h4>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="text-red-700 font-medium">Your answer: </span>
                              <span className="text-red-600">
                                {Array.isArray(question.user_answer) 
                                  ? question.user_answer.join(', ') 
                                  : question.user_answer}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-green-700 font-medium">Correct answer: </span>
                              <span className="text-green-600">
                                {Array.isArray(question.correct_answer) 
                                  ? question.correct_answer.join(', ') 
                                  : question.correct_answer}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {question.points} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Skipped Questions */}
            {skippedQuestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <SkipForward className="w-5 h-5 text-yellow-500" />
                    Skipped Questions ({skippedQuestions.length})
                  </CardTitle>
                  <CardDescription>
                    Questions you skipped during the quiz
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skippedQuestions.map((question, index) => (
                    <div key={question.question_id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                      <div className="flex items-start gap-3">
                        <Badge variant="secondary" className="mt-1">
                          {question.difficulty}
                        </Badge>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">{question.title}</h4>
                          <div className="text-sm">
                            <span className="text-green-700 font-medium">Correct answer: </span>
                            <span className="text-green-600">
                              {Array.isArray(question.correct_answer) 
                                ? question.correct_answer.join(', ') 
                                : question.correct_answer}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {question.points} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Correct Answers Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Correct Answers ({result.correct_answers})
                </CardTitle>
                <CardDescription>
                  Well done on these questions!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.question_results
                    .filter(q => q.is_correct)
                    .map((question, index) => (
                      <div key={question.question_id} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">{question.difficulty}</span>
                        <span className="text-sm text-gray-600">+{question.points_earned} pts</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-3 justify-center">
              <Button 
                onClick={() => onRetry?.() || navigate(`/${result.quiz_type === 'time_quiz' ? 'time-quiz' : 'mock-test'}`)}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </Button>
              
              <Button 
                onClick={() => onHome?.() || navigate('/')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
              
              <Button 
                onClick={() => navigate('/results')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                View All Results
              </Button>
              
              <Button 
                onClick={() => {
                  const text = `I just scored ${Math.round(result.score_percentage)}% on a ${result.quiz_type === 'time_quiz' ? 'Time Quiz' : 'Mock Test'}! 🎯`
                  navigator.share?.({ title: 'Quiz Results', text }) || 
                  navigator.clipboard?.writeText(text)
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 