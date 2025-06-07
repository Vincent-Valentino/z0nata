import { AuthModeSelector, MikroskilAuthForm, RegularAuthForm } from '@/components/block/auth'
import { useState } from 'react'

type AuthMode = 'mikroskil' | 'regular' | null
type AuthStep = 'mode-selection' | 'auth-form'

interface MikroskilFormData {
  nim: string
  name: string
  email: string
}

interface RegularFormData {
  email: string
  password: string
  name?: string
  confirmPassword?: string
}

export const AuthPage = () => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('mode-selection')
  const [selectedMode, setSelectedMode] = useState<AuthMode>(null)

  const handleModeSelect = (mode: AuthMode) => {
    setSelectedMode(mode)
    setCurrentStep('auth-form')
  }

  const handleBackToModeSelection = () => {
    setCurrentStep('mode-selection')
    setSelectedMode(null)
  }

  const handleMikroskilSubmit = async (data: MikroskilFormData) => {
    console.log('Mikroskil authentication:', data)
    // Handle Mikroskil authentication
    // TODO: Implement API call
  }

  const handleRegularSubmit = async (data: RegularFormData, authType: 'login' | 'register') => {
    console.log(`Regular ${authType}:`, data)
    // Handle regular authentication
    // TODO: Implement API call
  }

  const handleOAuthLogin = (provider: string) => {
    console.log(`OAuth login with ${provider}`)
    // Handle OAuth authentication
    // TODO: Implement OAuth flow
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              onOAuthLogin={handleOAuthLogin}
            />
          )}
        </div>
      </div>
    </div>
  )
} 