import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  ArrowRight, 
  SkipForward, 
  Eye, 
  Flag 
} from 'lucide-react'

interface MockTestControlsProps {
  currentQuestionIndex: number
  totalQuestions: number
  isAnswered: boolean
  isSkipped: boolean
  isSubmitting: boolean
  onPreviousQuestion: () => void
  onNextQuestion: () => void
  onSkipQuestion: () => void
  onShowReview: () => void
  onSubmitQuiz: () => void
}

export const MockTestControls: React.FC<MockTestControlsProps> = ({
  currentQuestionIndex,
  totalQuestions,
  isAnswered,
  isSkipped,
  isSubmitting,
  onPreviousQuestion,
  onNextQuestion,
  onSkipQuestion,
  onShowReview,
  onSubmitQuiz
}) => {
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1

  return (
    <Card className="shadow-md">
      <CardContent className="p-3 sm:p-4">
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <Button
            onClick={onPreviousQuestion}
            disabled={isFirstQuestion}
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
                variant="secondary"
                className="flex items-center gap-2"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </Button>
            )}

            <Button
              onClick={onShowReview}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Review
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={onSubmitQuiz}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Flag className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </Button>
            ) : (
              <Button
                onClick={onNextQuestion}
                disabled={isLastQuestion}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden space-y-3">
          {/* Top row - Navigation buttons */}
          <div className="flex justify-between gap-2">
            <Button
              onClick={onPreviousQuestion}
              disabled={isFirstQuestion}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 flex-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Previous</span>
              <span className="xs:hidden">Prev</span>
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={onSubmitQuiz}
                disabled={isSubmitting}
                size="sm"
                className="flex items-center gap-1.5 flex-1"
              >
                <Flag className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            ) : (
              <Button
                onClick={onNextQuestion}
                disabled={isLastQuestion}
                size="sm"
                className="flex items-center gap-1.5 flex-1"
              >
                <span className="hidden xs:inline">Next</span>
                <span className="xs:hidden">Next</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Bottom row - Action buttons */}
          <div className="flex gap-2">
            {!isAnswered && !isSkipped && (
              <Button
                onClick={onSkipQuestion}
                variant="secondary"
                size="sm"
                className="flex items-center gap-1.5 flex-1"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </Button>
            )}

            <Button
              onClick={onShowReview}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 flex-1"
            >
              <Eye className="w-4 h-4" />
              Review
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 