import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  Timer, 
  Flag, 
  Trophy, 
  AlertTriangle, 
  Play,
  XCircle
} from 'lucide-react'

interface TimeQuizWelcomeProps {
  onStartQuiz: () => Promise<void>
  onNavigateHome: () => void
  isLoading: boolean
  error?: string
}

export const TimeQuizWelcome: React.FC<TimeQuizWelcomeProps> = ({
  onStartQuiz,
  onNavigateHome,
  isLoading,
  error
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-16">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Timer className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Time Quiz Challenge
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Quick 5-minute assessment with instant feedback
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-blue-900">5 Minutes</div>
                <div className="text-sm text-blue-700">Time Limit</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Flag className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-green-900">20 Questions</div>
                <div className="text-sm text-green-700">Mixed Difficulty</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Trophy className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="font-semibold text-purple-900">250 Points</div>
                <div className="text-sm text-purple-700">Max Score + Bonus</div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Time Quiz Features:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Instant feedback after each answer</li>
                  <li>• Time bonus for quick completion</li>
                  <li>• Auto-advance after answering</li>
                  <li>• Cannot pause or restart</li>
                </ul>
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 justify-center">
              <Button 
                onClick={onStartQuiz}
                size="lg"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Time Quiz
              </Button>
              
              <Button 
                onClick={onNavigateHome}
                variant="outline"
                size="lg"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 