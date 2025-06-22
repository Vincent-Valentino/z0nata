import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock } from 'lucide-react'
import type { TimeQuizStats } from './types'

interface TimeQuizHeaderProps {
  timeRemaining: number
  currentQuestionIndex: number
  totalQuestions: number
  progressPercentage: number
  stats: TimeQuizStats
}

export const TimeQuizHeader: React.FC<TimeQuizHeaderProps> = ({
  timeRemaining,
  currentQuestionIndex,
  totalQuestions,
  progressPercentage,
  stats
}) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTimerColor = (): string => {
    if (timeRemaining <= 30) return 'text-red-500'
    if (timeRemaining <= 60) return 'text-orange-500'
    if (timeRemaining <= 120) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              Time Quiz
            </Badge>
            <div className={`flex items-center gap-2 font-mono text-lg font-bold ${getTimerColor()}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeRemaining)}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>
            <div className="text-sm text-gray-500">
              {stats.answeredCount} answered • {stats.skippedCount} skipped
            </div>
          </div>
        </div>
        
        <Progress 
          value={progressPercentage} 
          className="h-2"
        />
      </CardContent>
    </Card>
  )
} 