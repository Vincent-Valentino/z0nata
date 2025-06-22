import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Flag } from 'lucide-react'
import type { QuestionStats } from './types'

interface MockTestReviewModalProps {
  isOpen: boolean
  questionStats: QuestionStats
  isSubmitting: boolean
  onClose: () => void
  onSubmitQuiz: () => void
}

export const MockTestReviewModal: React.FC<MockTestReviewModalProps> = ({
  isOpen,
  questionStats,
  isSubmitting,
  onClose,
  onSubmitQuiz
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Review Mode</CardTitle>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-96">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{questionStats.answered}</div>
                <div className="text-sm text-gray-600">Answered</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{questionStats.skipped}</div>
                <div className="text-sm text-gray-600">Skipped</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {questionStats.total - questionStats.answered - questionStats.skipped}
                </div>
                <div className="text-sm text-gray-600">Unanswered</div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Review your answers before submitting. You can navigate to any question to make changes.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={onSubmitQuiz}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Flag className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Test Now'}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
              >
                Continue Testing
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 