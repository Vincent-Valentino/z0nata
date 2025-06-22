import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, SkipForward } from 'lucide-react'
import type { SessionQuestion } from './types'

interface MockTestQuestionCardProps {
  question: SessionQuestion
  selectedAnswer: string | string[]
  isAnswered: boolean
  isSkipped: boolean
  isExpired: boolean
  onAnswerSelect: (optionId: string) => void
}

export const MockTestQuestionCard: React.FC<MockTestQuestionCardProps> = ({
  question,
  selectedAnswer,
  isAnswered,
  isSkipped,
  isExpired,
  onAnswerSelect
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
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
            
            return (
              <Button
                key={option.id}
                onClick={() => onAnswerSelect(option.id)}
                variant={isSelected ? "default" : "outline"}
                disabled={isExpired}
                className="w-full text-left justify-start h-auto py-3 px-4"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className="flex-1">{option.text}</span>
                </div>
              </Button>
            )
          })}
        </div>

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