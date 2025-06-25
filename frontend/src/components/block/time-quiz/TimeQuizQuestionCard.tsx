import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, SkipForward } from 'lucide-react'
import type { SessionQuestion } from '@/types/quiz'
import type { SaveAnswerResponse } from './types'

interface TimeQuizQuestionCardProps {
  question: SessionQuestion
  selectedAnswer: string | string[]
  feedbackVisible: boolean
  lastFeedback: SaveAnswerResponse | null
  isAnswered: boolean
  isSkipped: boolean
  isExpired: boolean
  onAnswerSelect: (optionId: string) => void
}

export const TimeQuizQuestionCard: React.FC<TimeQuizQuestionCardProps> = ({
  question,
  selectedAnswer,
  feedbackVisible,
  lastFeedback,
  isAnswered,
  isSkipped,
  isExpired,
  onAnswerSelect
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge 
            variant={
              question.difficulty === 'easy' ? 'secondary' :
              question.difficulty === 'medium' ? 'default' : 'destructive'
            }
          >
            {question.difficulty} • {question.points} points
          </Badge>
          <Badge variant="outline">
            {question.type.replace('_', ' ')}
          </Badge>
        </div>
        <CardTitle className="text-xl leading-relaxed">
          {question.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Answer Options */}
        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = question.type === 'multiple_choice' 
              ? Array.isArray(selectedAnswer) && selectedAnswer.includes(option.id)
              : selectedAnswer === option.id
            
            const isCorrect = lastFeedback?.correct_answer?.includes(option.id)
            const showFeedback = feedbackVisible && lastFeedback
            
            return (
              <Button
                key={option.id}
                onClick={() => !feedbackVisible && onAnswerSelect(option.id)}
                variant={isSelected ? "default" : "outline"}
                disabled={feedbackVisible || isExpired}
                className={`w-full text-left justify-start h-auto py-3 px-4 transition-all duration-300 ${
                  showFeedback && isCorrect ? 'bg-green-100 border-green-300 hover:bg-green-100' :
                  showFeedback && isSelected && !isCorrect ? 'bg-red-100 border-red-300 hover:bg-red-100' :
                  !feedbackVisible && !isExpired ? 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-md' :
                  ''
                } ${
                  feedbackVisible || isExpired ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    isSelected ? 'bg-blue-500 border-blue-500 shadow-sm' : 'border-gray-300 hover:border-blue-400'
                  } ${
                    showFeedback && isCorrect ? 'bg-green-500 border-green-500' :
                    showFeedback && isSelected && !isCorrect ? 'bg-red-500 border-red-500' :
                    ''
                  }`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full animate-scale-in" />}
                  </div>
                  <span className="flex-1">{option.text}</span>
                  {showFeedback && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {showFeedback && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </Button>
            )
          })}
        </div>

        {/* Feedback Display */}
        {feedbackVisible && lastFeedback && (
          <Alert className={lastFeedback.is_correct ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}>
            <div className="flex items-center gap-2">
              {lastFeedback.is_correct ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className="font-medium">
                {lastFeedback.is_correct ? 
                  `Correct! +${lastFeedback.points_earned} points` : 
                  'Incorrect answer'
                }
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Status Indicators */}
        {isAnswered && !feedbackVisible && (
          <Alert className="border-green-300 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              Answer saved
            </AlertDescription>
          </Alert>
        )}

        {isSkipped && (
          <Alert className="border-yellow-300 bg-yellow-50">
            <SkipForward className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              Question skipped
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 