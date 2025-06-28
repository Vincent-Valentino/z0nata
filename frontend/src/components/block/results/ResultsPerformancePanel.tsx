import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Award, Calendar } from 'lucide-react'
import type { UserStats, Achievement } from '@/types/userActivity'

interface ResultsPerformancePanelProps {
  userStats: UserStats | null
  achievements: Achievement[]
}

export const ResultsPerformancePanel: React.FC<ResultsPerformancePanelProps> = ({
  userStats,
  achievements
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 80) return 'text-blue-600 dark:text-blue-400'
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy': 
        return <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
          <span className="text-xs text-white">🏆</span>
        </div>
      case 'Clock': 
        return <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-xs text-white">⏰</span>
        </div>
      case 'Target': 
        return <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <span className="text-xs text-white">🎯</span>
        </div>
      case 'BookOpen': 
        return <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
          <span className="text-xs text-white">📚</span>
        </div>
      case 'Zap': 
        return <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
          <span className="text-xs text-white">⚡</span>
        </div>
      default: 
        return <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Performance by Quiz Type */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            Performance by Quiz Type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 pt-0">
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
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {achievements.length > 0 ? (
            achievements.slice(0, 3).map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                {getAchievementIcon(achievement.icon_name)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{achievement.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{achievement.description}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs sm:text-sm text-gray-500 text-center py-4">
              No achievements yet. Keep taking quizzes to earn achievements!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Study Goals */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            Study Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 pt-0">
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
  )
} 