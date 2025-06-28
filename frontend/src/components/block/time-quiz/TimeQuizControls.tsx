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
      <CardContent className="p-3 sm:p-4">
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <Button
            onClick={onPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="flex items-center gap-2 transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex items-center gap-2 transition-all duration-200 hover:bg-yellow-50 hover:border-yellow-300"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </Button>
            )}

            {isLastQuestion ? (
              <Button
                onClick={onSubmitQuiz}
                disabled={isSubmitting || feedbackVisible}
                className="flex items-center gap-2 transition-all duration-200 hover:bg-blue-600 disabled:opacity-50"
              >
                <Flag className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Finish Quiz'}
              </Button>
            ) : (
              <Button
                onClick={onNextQuestion}
                disabled={feedbackVisible}
                className="flex items-center gap-2 transition-all duration-200 hover:bg-blue-600 disabled:opacity-50"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden space-y-3">
          {/* Navigation buttons */}
          <div className="flex justify-between gap-2">
            <Button
              onClick={onPreviousQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 flex-1 transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Previous</span>
              <span className="xs:hidden">Prev</span>
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={onSubmitQuiz}
                disabled={isSubmitting || feedbackVisible}
                size="sm"
                className="flex items-center gap-1.5 flex-1 transition-all duration-200 hover:bg-blue-600 disabled:opacity-50"
              >
                <Flag className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Finish'}
              </Button>
            ) : (
              <Button
                onClick={onNextQuestion}
                disabled={feedbackVisible}
                size="sm"
                className="flex items-center gap-1.5 flex-1 transition-all duration-200 hover:bg-blue-600 disabled:opacity-50"
              >
                <span className="hidden xs:inline">Next</span>
                <span className="xs:hidden">Next</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Action buttons */}
          {!isAnswered && !isSkipped && (
            <div className="flex">
              <Button
                onClick={onSkipQuestion}
                disabled={feedbackVisible}
                variant="secondary"
                size="sm"
                className="flex items-center gap-1.5 w-full transition-all duration-200 hover:bg-yellow-50 hover:border-yellow-300"
              >
                <SkipForward className="w-4 h-4" />
                Skip Question
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 