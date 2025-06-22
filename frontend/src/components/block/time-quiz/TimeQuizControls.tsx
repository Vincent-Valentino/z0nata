import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, SkipForward, Flag } from 'lucide-react'

interface TimeQuizControlsProps {
  currentQuestionIndex: number
  totalQuestions: number
  isAnswered: boolean
  isSkipped: boolean
  feedbackVisible: boolean
  isSubmitting: boolean
  onPreviousQuestion: () => void
  onNextQuestion: () => void
  onSkipQuestion: () => void
  onSubmitQuiz: () => void
}

export const TimeQuizControls: React.FC<TimeQuizControlsProps> = ({
  currentQuestionIndex,
  totalQuestions,
  isAnswered,
  isSkipped,
  feedbackVisible,
  isSubmitting,
  onPreviousQuestion,
  onNextQuestion,
  onSkipQuestion,
  onSubmitQuiz
}) => {
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1

  return (
    <Card className="shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Button
            onClick={onPreviousQuestion}
            disabled={currentQuestionIndex === 0 || feedbackVisible}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {!isAnswered && !isSkipped && (
              <Button
                onClick={onSkipQuestion}
                disabled={feedbackVisible}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </Button>
            )}

            {isLastQuestion ? (
              <Button
                onClick={onSubmitQuiz}
                disabled={isSubmitting || feedbackVisible}
                className="flex items-center gap-2"
              >
                <Flag className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Finish Quiz'}
              </Button>
            ) : (
              <Button
                onClick={onNextQuestion}
                disabled={feedbackVisible}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 