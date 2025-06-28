import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, SkipForward, FileText } from 'lucide-react'
import type { SessionQuestion } from './types'

interface MockTestQuestionCardProps {
  question: SessionQuestion
  selectedAnswer: string | string[]
  isAnswered: boolean
  isSkipped: boolean
  isExpired: boolean
  onAnswerSelect: (optionId: string) => void
  onEssayAnswerChange?: (answer: string) => void
}

export const MockTestQuestionCard: React.FC<MockTestQuestionCardProps> = ({
  question,
  selectedAnswer,
  isAnswered,
  isSkipped,
  isExpired,
  onAnswerSelect,
  onEssayAnswerChange
}) => {
  const isEssayQuestion = question.type === 'essay'

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between mb-3">
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
      
      <CardContent className="space-y-4 pt-0">
        {/* Essay Question Input */}
        {isEssayQuestion ? (
          <div className="space-y-3">
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
            
            {/* Essay Guidance */}
            {isAnswered && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Answer Saved</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Your answer has been saved. You can continue editing until you submit the quiz.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Choice Question Options */
          <div className="space-y-2">
            {question.options.map((option, index) => {
              const isSelected = question.type === 'multiple_choice' 
                ? Array.isArray(selectedAnswer) && selectedAnswer.includes(option.id)
                : selectedAnswer === option.id
              
              return (
                <Button
                  key={option.id}
                  onClick={() => onAnswerSelect(option.id)}
                  variant={isSelected ? "default" : "outline"}
                  disabled={isExpired}
                  className="w-full text-left justify-start min-h-[36px] py-1.5 px-2.5 sm:py-2 sm:px-3 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-shrink-0">
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
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
                  </div>
                </Button>
              )
            })}
          </div>
        )}

        {/* Status Indicators */}
        {isAnswered && (
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