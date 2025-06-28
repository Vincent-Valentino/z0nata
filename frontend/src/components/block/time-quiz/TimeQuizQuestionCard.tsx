import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, XCircle, SkipForward, FileText } from 'lucide-react'
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
  onEssayAnswerChange?: (answer: string) => void
}

export const TimeQuizQuestionCard: React.FC<TimeQuizQuestionCardProps> = ({
  question,
  selectedAnswer,
  feedbackVisible,
  lastFeedback,
  isAnswered,
  isSkipped,
  isExpired,
  onAnswerSelect,
  onEssayAnswerChange
}) => {
  const isEssayQuestion = question.type === 'essay'

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant={
                question.difficulty === 'easy' ? 'secondary' :
                question.difficulty === 'medium' ? 'default' : 'destructive'
              }
              className="text-xs"
            >
              {question.difficulty} • {question.points} pts
            </Badge>
            <Badge variant="outline" className="text-xs">
              {question.type.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-base sm:text-lg lg:text-xl leading-relaxed font-medium">
          {question.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-0">
        {/* Essay Question Input */}
        {isEssayQuestion ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>Provide your written answer below:</span>
            </div>
            <Textarea
              value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
              onChange={(e) => onEssayAnswerChange?.(e.target.value)}
              disabled={isExpired}
              placeholder="Type your detailed answer here..."
              className="min-h-[140px] sm:min-h-[120px] resize-y text-base leading-relaxed"
              maxLength={2000}
            />
            <div className="text-xs text-gray-500 text-right">
              {typeof selectedAnswer === 'string' ? selectedAnswer.length : 0}/2000 characters
            </div>
            
            {/* Essay Feedback - Only show after quiz submission, not during quiz */}
            {feedbackVisible && lastFeedback && !isExpired && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Answer Saved</span>
                </div>
                <p className="text-sm text-blue-700">
                  Your essay answer has been recorded. You can continue to edit it until moving to the next question.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Choice Question Options */
          <div className="space-y-3">
            {question.options.map((option, index) => {
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
                  className={`w-full text-left justify-start min-h-[40px] py-2 px-3 sm:py-2 sm:px-3 transition-all duration-300 ${
                    showFeedback && isCorrect ? 'bg-green-100 border-green-300 hover:bg-green-100' :
                    showFeedback && isSelected && !isCorrect ? 'bg-red-100 border-red-300 hover:bg-red-100' :
                    !feedbackVisible && !isExpired ? 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-md' :
                    ''
                  } ${
                    feedbackVisible || isExpired ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-shrink-0">
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isSelected ? 'bg-blue-500 border-blue-500 shadow-sm' : 'border-gray-300 hover:border-blue-400'
                      } ${
                        showFeedback && isCorrect ? 'bg-green-500 border-green-500' :
                        showFeedback && isSelected && !isCorrect ? 'bg-red-500 border-red-500' :
                        ''
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full animate-scale-in" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-medium text-gray-500 flex-shrink-0">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="text-sm sm:text-base break-words leading-normal">
                        {option.text}
                      </span>
                    </div>
                    <div className="flex-shrink-0">
                      {showFeedback && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      )}
                      {showFeedback && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </Button>
              )
            })}
            
            {/* Choice Feedback Display */}
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
                      `Correct!${lastFeedback.points_earned ? ` +${lastFeedback.points_earned} points` : ''}` : 
                      'Incorrect answer'
                    }
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>
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