import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, BarChart3, Eye, EyeOff } from 'lucide-react'
import type { QuestionStats } from './types'

interface MockTestHeaderProps {
  timeRemaining: number
  currentQuestionIndex: number
  totalQuestions: number
  progressPercentage: number
  questionStats: QuestionStats
  showStats: boolean
  showQuestionPanel: boolean
  onToggleStats: () => void
  onToggleQuestionPanel: () => void
}

export const MockTestHeader: React.FC<MockTestHeaderProps> = ({
  timeRemaining,
  currentQuestionIndex,
  totalQuestions,
  progressPercentage,
  questionStats,
  showStats,
  showQuestionPanel,
  onToggleStats,
  onToggleQuestionPanel
}) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTimerColor = (): string => {
    const minutes = Math.floor(timeRemaining / 60)
    if (minutes <= 5) return 'text-red-500'
    if (minutes <= 15) return 'text-orange-500'
    if (minutes <= 30) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              HCIA-AI Mock Test
            </Badge>
            <div className={`flex items-center gap-2 font-mono text-lg font-bold ${getTimerColor()}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeRemaining)}
            </div>
            <Button
              onClick={onToggleStats}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Stats
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </div>
              <div className="text-sm text-gray-500">
                {questionStats.answered} answered • {questionStats.skipped} skipped
              </div>
            </div>
            <Button
              onClick={onToggleQuestionPanel}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {showQuestionPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showQuestionPanel ? 'Hide' : 'Show'} Panel
            </Button>
          </div>
        </div>
        
        <Progress 
          value={progressPercentage} 
          className="h-2 mb-4"
        />

        {/* Statistics Panel */}
        {showStats && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-600">{questionStats.answered}</div>
                <div className="text-xs text-gray-600">Answered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{questionStats.skipped}</div>
                <div className="text-xs text-gray-600">Skipped</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{questionStats.easyAnswered}/{questionStats.easy}</div>
                <div className="text-xs text-gray-600">Easy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{questionStats.mediumAnswered}/{questionStats.medium}</div>
                <div className="text-xs text-gray-600">Medium</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{questionStats.hardAnswered}/{questionStats.hard}</div>
                <div className="text-xs text-gray-600">Hard</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 