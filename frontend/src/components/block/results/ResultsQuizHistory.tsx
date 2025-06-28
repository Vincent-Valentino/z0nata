import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BarChart3, BookOpen, Star, CheckCircle, XCircle } from 'lucide-react'
import type { QuizResult, QuizType } from '@/types/userActivity'

interface ResultsQuizHistoryProps {
  filteredResults: QuizResult[]
  selectedQuizType: 'all' | QuizType
  onQuizTypeChange: (type: 'all' | QuizType) => void
}

export const ResultsQuizHistory: React.FC<ResultsQuizHistoryProps> = ({
  filteredResults,
  selectedQuizType,
  onQuizTypeChange
}) => {
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

  const quizTypes: Array<'all' | QuizType> = ['all', 'mock_test', 'time_quiz']

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            Quiz History
          </CardTitle>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {quizTypes.map((type) => (
              <Button
                key={type}
                variant={selectedQuizType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => onQuizTypeChange(type)}
                className="capitalize text-xs sm:text-sm touch-manipulation"
              >
                {type === 'all' ? 'All' : getQuizTypeLabel(type)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 sm:space-y-4">
          {filteredResults.map((quiz) => (
            <div
              key={quiz.id}
              className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg shrink-0">
                    <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                      {quiz.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(quiz.completed_at)} • {formatTime(quiz.time_spent)}
                      {quiz.is_timed_out && (
                        <span className="text-red-500 ml-2 sm:ml-1 block sm:inline">
                          (Timed Out)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <div className={`text-xl sm:text-2xl font-bold ${getScoreColor(quiz.score)}`}>
                    {quiz.score}%
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {quiz.correct_answers}/{quiz.total_questions}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`${getQuizTypeColor(quiz.quiz_type)} text-xs`}>
                    {getQuizTypeLabel(quiz.quiz_type)}
                  </Badge>
                  {quiz.quiz_type === 'time_quiz' && quiz.time_limit && (
                    <Badge variant="secondary" className="text-xs">
                      {formatTime(quiz.time_limit)} limit
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={quiz.score} className="w-16 sm:w-20" />
                  <Badge variant={getScoreBadgeVariant(quiz.score)} className="text-xs">
                    {quiz.score >= 80 ? (
                      <Star className="w-3 h-3 mr-1" />
                    ) : quiz.score >= 70 ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    <span className="hidden sm:inline">
                      {quiz.score >= 80 ? 'Excellent' : quiz.score >= 70 ? 'Good' : 'Needs Work'}
                    </span>
                    <span className="sm:hidden">
                      {quiz.score >= 80 ? 'Exc' : quiz.score >= 70 ? 'Good' : 'Poor'}
                    </span>
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 