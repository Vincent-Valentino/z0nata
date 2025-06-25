import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQuiz } from '@/contexts/QuizContext'
import { useAuthStore, loginAsAdminDirect, loginAsStudentDirect } from '@/store/authStore'
import { quizStorage } from '@/lib/quizStorage'
import { debugAuthState, triggerFreshLogin } from '@/lib/api'
import { Clock, Play, Square, SkipForward, Save, RefreshCw, Shield, User, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const QuizDebugPanel: React.FC = () => {
  const { state, startQuiz, resumeQuiz, submitQuiz, resetQuiz, checkForActiveSession } = useQuiz()
  const { isAuthenticated, user, token } = useAuthStore()

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const storageInfo = quizStorage.getStorageInfo()

  const handleTestActions = {
    startMockTest: () => startQuiz('mock_test'),
    startTimeQuiz: () => startQuiz('time_quiz'),
    checkSession: async () => {
      const hasActive = await checkForActiveSession()
      console.log('Has active session:', hasActive)
    }
  }

  const handleQuickLogin = async (loginType: 'admin' | 'student') => {
    try {
      let success = false
      if (loginType === 'admin') {
        success = await loginAsAdminDirect()
      } else {
        success = await loginAsStudentDirect()
      }
      if (success) {
        console.log(`✅ ${loginType} login successful`)
      } else {
        console.log(`❌ ${loginType} login failed`)
      }
    } catch (error) {
      console.error(`❌ ${loginType} login error:`, error)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Quiz Debug Panel
          </CardTitle>
          <CardDescription>
            Monitor and test the quiz state management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Authentication Status */}
          {!isAuthenticated && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>You need to be authenticated to access quiz functionality.</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleQuickLogin('admin')} className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Login as Admin
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleQuickLogin('student')} className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Login as Student
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isAuthenticated && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-green-700">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Authenticated as: {user?.full_name} ({user?.role})</span>
              </div>
              <div className="text-xs text-green-600 mt-1 font-mono">
                Token: {token ? `${token.substring(0, 20)}...` : 'None'}
              </div>
            </div>
          )}
          
          {/* Current Session Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Session Status</h4>
              <Badge variant={state.session ? 'default' : 'secondary'}>
                {state.session ? 'Active' : 'No Session'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Quiz Type</h4>
              <Badge variant="outline">
                {state.session?.quiz_type || 'None'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Time Remaining</h4>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className={`font-mono ${state.timeRemaining <= 300 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatTime(state.timeRemaining)}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Status</h4>
              <Badge variant={state.isExpired ? 'destructive' : state.isLoading ? 'secondary' : 'default'}>
                {state.isExpired ? 'Expired' : state.isLoading ? 'Loading' : 'Ready'}
              </Badge>
            </div>
          </div>

          {/* Progress Information */}
          {state.session && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Progress</h4>
                <div className="text-sm text-gray-600">
                  Question {state.currentQuestionIndex + 1} of {state.totalQuestions}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${state.progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{state.progressPercentage.toFixed(1)}% complete</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Answered</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{state.answeredCount}</Badge>
                  <span className="text-sm text-gray-600">questions</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Skipped</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{state.skippedCount}</Badge>
                  <span className="text-sm text-gray-600">questions</span>
                </div>
              </div>
            </div>
          )}

          {/* Local Storage Information */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm text-gray-700 mb-3">Local Storage Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={storageInfo.hasToken ? 'default' : 'secondary'}>
                  {storageInfo.hasToken ? '✓' : '✗'}
                </Badge>
                <span>Token</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={storageInfo.hasSessionData ? 'default' : 'secondary'}>
                  {storageInfo.hasSessionData ? '✓' : '✗'}
                </Badge>
                <span>Session Data</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={storageInfo.hasAnswers ? 'default' : 'secondary'}>
                  {storageInfo.hasAnswers ? '✓' : '✗'}
                </Badge>
                <span>Answers ({storageInfo.answersCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={storageInfo.isValid ? 'default' : 'destructive'}>
                  {storageInfo.isValid ? '✓' : '✗'}
                </Badge>
                <span>Valid</span>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm text-gray-700 mb-3">Controls</h4>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleTestActions.startMockTest}
                disabled={state.isLoading || !!state.session || !isAuthenticated}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Mock Test
              </Button>
              
              <Button 
                onClick={handleTestActions.startTimeQuiz}
                disabled={state.isLoading || !!state.session || !isAuthenticated}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Start Time Quiz
              </Button>
              
              <Button 
                onClick={resumeQuiz}
                disabled={state.isLoading || !!state.session || !isAuthenticated}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <SkipForward className="w-4 h-4" />
                Resume Quiz
              </Button>
              
              {state.session && (
                <Button 
                  onClick={submitQuiz}
                  disabled={state.isSubmitting}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Submit Quiz
                </Button>
              )}
              
              <Button 
                onClick={resetQuiz}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Reset Quiz
              </Button>
              
              <Button 
                onClick={handleTestActions.checkSession}
                variant="outline"
                size="sm"
              >
                Check Session
              </Button>

              <Button 
                onClick={() => {
                  debugAuthState()
                  // Also check the current auth store state
                  const currentState = useAuthStore.getState()
                  console.log('Current Zustand auth state:', {
                    isAuthenticated: currentState.isAuthenticated,
                    hasUser: !!currentState.user,
                    hasToken: !!currentState.token,
                    userEmail: currentState.user?.email,
                    tokenLength: currentState.token?.length || 0
                  })
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                Debug Auth
              </Button>

              <Button 
                onClick={triggerFreshLogin}
                variant="secondary"
                size="sm"
                className="flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Fresh Login
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {state.error && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm text-red-700 mb-2">Error</h4>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{state.error}</p>
              </div>
            </div>
          )}

          {/* Current Question Preview */}
          {state.session && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm text-gray-700 mb-3">Current Question Preview</h4>
              <div className="bg-gray-50 border rounded-md p-4">
                <div className="text-sm text-gray-600 mb-2">
                  Question {state.currentQuestionIndex + 1}: {state.session.questions[state.currentQuestionIndex]?.difficulty}
                </div>
                <div className="font-medium text-gray-900 mb-2">
                  {state.session.questions[state.currentQuestionIndex]?.title || 'No question loaded'}
                </div>
                <div className="text-xs text-gray-500">
                  Points: {state.session.questions[state.currentQuestionIndex]?.points} | 
                  Type: {state.session.questions[state.currentQuestionIndex]?.type} |
                  Options: {state.session.questions[state.currentQuestionIndex]?.options.length}
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
} 