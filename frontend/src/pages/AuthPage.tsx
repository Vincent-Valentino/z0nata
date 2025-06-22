import { AuthModeSelector, MikroskilAuthForm, RegularAuthForm } from '@/components/block/auth'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { handleMikroskilAuth, handleRegularAuth } from './auth/AuthHandlers'
import type { MikroskilFormData, RegularFormData } from './auth/AuthHandlers'

type AuthMode = 'mikroskil' | 'regular' | null
type AuthStep = 'mode-selection' | 'auth-form'

export const AuthPage = () => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('mode-selection')
  const [selectedMode, setSelectedMode] = useState<AuthMode>(null)
  const { login, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  // Redirect authenticated users to home
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔒 User already authenticated, redirecting to home...')
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleModeSelect = (mode: AuthMode) => {
    setSelectedMode(mode)
    setCurrentStep('auth-form')
  }

  const handleBackToModeSelection = () => {
    setCurrentStep('mode-selection')
    setSelectedMode(null)
  }

  const handleMikroskilSubmit = async (data: MikroskilFormData, authType: 'login' | 'register') => {
    await handleMikroskilAuth(data, authType, { login, navigate })
  }

  const handleRegularSubmit = async (data: RegularFormData, authType: 'login' | 'register') => {
    await handleRegularAuth(data, authType, { login, navigate })
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="min-h-screen">
        <div className="w-full h-full">
          {currentStep === 'mode-selection' && (
            <AuthModeSelector 
              onModeSelect={handleModeSelect} 
              onBack={() => window.history.back()} 
            />
          )}
          
          {currentStep === 'auth-form' && selectedMode === 'mikroskil' && (
            <MikroskilAuthForm 
              onBack={handleBackToModeSelection}
              onSubmit={handleMikroskilSubmit}
            />
          )}
          
          {currentStep === 'auth-form' && selectedMode === 'regular' && (
            <RegularAuthForm
              onBack={handleBackToModeSelection}
              onSubmit={handleRegularSubmit}
            />
          )}
        </div>
      </div>
    </div>
  )
} 