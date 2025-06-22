import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface TimeQuizExpiredProps {
  onSubmitQuiz: () => Promise<void>
  onResetAndHome: () => void
  isSubmitting: boolean
}

export const TimeQuizExpired: React.FC<TimeQuizExpiredProps> = ({
  onSubmitQuiz,
  onResetAndHome,
  isSubmitting
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-red-700">Time's Up!</CardTitle>
          <CardDescription>
            Your quiz session has expired
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            The quiz will be automatically submitted with your current answers.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onSubmitQuiz} disabled={isSubmitting}>
              View Results
            </Button>
            <Button 
              onClick={onResetAndHome}
              variant="outline"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 