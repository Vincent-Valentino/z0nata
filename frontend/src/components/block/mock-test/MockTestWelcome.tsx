import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BookOpen, 
  Clock, 
  Target, 
  Trophy, 
  Award, 
  Play, 
  XCircle 
} from 'lucide-react'

interface MockTestWelcomeProps {
  onStartQuiz: () => void
  isLoading: boolean
  error?: string | null
}

export const MockTestWelcome: React.FC<MockTestWelcomeProps> = ({
  onStartQuiz,
  isLoading,
  error
}) => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="max-w-4xl mx-auto pt-16">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              HCIA-AI Mock Test
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Comprehensive simulation exam with ~125 questions
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <Clock className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="font-semibold text-emerald-900">120 Minutes</div>
                <div className="text-sm text-emerald-700">Time Limit</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-blue-900">~125 Questions</div>
                <div className="text-sm text-blue-700">Mixed Difficulty</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Trophy className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="font-semibold text-purple-900">1000 Points</div>
                <div className="text-sm text-purple-700">Maximum Score</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Award className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <div className="font-semibold text-orange-900">70% Pass</div>
                <div className="text-sm text-orange-700">Certification Standard</div>
              </div>
            </div>

            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertDescription>
                <strong>Mock Test Features:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Realistic exam simulation with actual HCIA-AI question patterns</li>
                  <li>• Advanced question navigation and filtering system</li>
                  <li>• Review mode to check answers before submission</li>
                  <li>• Detailed performance analytics and score breakdown</li>
                  <li>• Section-wise progress tracking</li>
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
                Start Mock Test
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
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