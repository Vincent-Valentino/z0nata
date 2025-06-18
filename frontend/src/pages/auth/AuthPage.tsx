import { AuthModeSelector, MikroskilAuthForm, RegularAuthForm } from '@/components/block/auth'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

type AuthMode = 'mikroskil' | 'regular' | null
type AuthStep = 'mode-selection' | 'auth-form'

interface MikroskilFormData {
  nim: string
  email: string
  password: string
  name?: string
  confirmPassword?: string
  faculty?: string
  major?: string
}

interface RegularFormData {
  email: string
  password: string
  name?: string
  confirmPassword?: string
}

// Add type definitions for API responses
interface AuthUser {
  id: string
  _id?: string
  full_name: string
  email: string
  email_verified: boolean
  profile_picture?: string
  last_login?: string
  created_at?: string
  updated_at?: string
  mahasiswa_id?: string
  nim?: string
  faculty?: string
  major?: string
  is_admin?: boolean
  permissions?: string[]
}

interface AuthResponse {
  user: AuthUser
  access_token: string
  refresh_token?: string
  expires_in?: number
}

export const AuthPage = () => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('mode-selection')
  const [selectedMode, setSelectedMode] = useState<AuthMode>(null)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleModeSelect = (mode: AuthMode) => {
    setSelectedMode(mode)
    setCurrentStep('auth-form')
  }

  const handleBackToModeSelection = () => {
    setCurrentStep('mode-selection')
    setSelectedMode(null)
  }

  const handleMikroskilSubmit = async (data: MikroskilFormData, authType: 'login' | 'register') => {
    try {
      if (authType === 'register') {
        // Validate passwords match
        if (data.password !== data.confirmPassword) {
          toast.error('Password dan konfirmasi password tidak cocok')
          return
        }

        // Prepare registration data for backend
        const registerData = {
          full_name: data.name || '',
          email: data.email,
          password: data.password,
          user_type: 'mahasiswa', // This maps to UserTypeMahasiswa in backend
          nim: data.nim,
          faculty: data.faculty || '',
          major: data.major || ''
        }

        const response = await api.post<AuthResponse>('/auth/register', registerData)
        
        // Map backend response to frontend user format
        const user = {
          id: response.user.id || response.user._id || '',
          full_name: response.user.full_name,
          email: response.user.email,
          email_verified: response.user.email_verified || false,
          profile_picture: response.user.profile_picture,
          last_login: response.user.last_login || new Date().toISOString(),
          created_at: response.user.created_at || new Date().toISOString(),
          updated_at: response.user.updated_at || new Date().toISOString(),
          role: 'student' as const, // Frontend role for mahasiswa
          user_type: 'mahasiswa' as const, // Backend user type
          nim: response.user.mahasiswa_id || response.user.nim,
          faculty: response.user.faculty,
          major: response.user.major,
          is_admin: false,
          permissions: ['read'],
          preferences: {
            theme: 'light' as const,
            language: 'id' as const,
            notifications: true,
          },
          stats: {
            testsCompleted: 0,
            averageScore: 0,
            totalTimeSpent: 0,
            streak: 0,
          },
        }

        login(user, response.access_token, response.refresh_token)
        toast.success('Registrasi berhasil! Selamat datang!')
        navigate('/home') // Redirect to home instead of profile
        
      } else {
        // Login
        const loginData = {
          email: data.email,
          password: data.password,
          remember_me: false
        }

        const response = await api.post<AuthResponse>('/auth/login', loginData)
        
        // Map backend response to frontend user format
        const user = {
          id: response.user.id || response.user._id || '',
          full_name: response.user.full_name,
          email: response.user.email,
          email_verified: response.user.email_verified || false,
          profile_picture: response.user.profile_picture,
          last_login: response.user.last_login || new Date().toISOString(),
          created_at: response.user.created_at || new Date().toISOString(),
          updated_at: response.user.updated_at || new Date().toISOString(),
          role: 'student' as const, // Frontend role for mahasiswa
          user_type: 'mahasiswa' as const, // Backend user type
          nim: response.user.mahasiswa_id || response.user.nim,
          faculty: response.user.faculty,
          major: response.user.major,
          is_admin: false,
          permissions: ['read'],
          preferences: {
            theme: 'light' as const,
            language: 'id' as const,
            notifications: true,
          },
          stats: {
            testsCompleted: 0,
            averageScore: 0,
            totalTimeSpent: 0,
            streak: 0,
          },
        }

        login(user, response.access_token, response.refresh_token)
        toast.success('Login berhasil! Selamat datang kembali!')
        navigate('/home') // Redirect to home instead of profile
      }
    } catch (error: any) {
      console.error(`Mikroskil ${authType} error:`, error)
      toast.error(error.message || `${authType === 'register' ? 'Registrasi' : 'Login'} gagal`)
    }
  }

  const handleRegularSubmit = async (data: RegularFormData, authType: 'login' | 'register') => {
    try {
      if (authType === 'register') {
        // Validate passwords match
        if (data.password !== data.confirmPassword) {
          toast.error('Password dan konfirmasi password tidak cocok')
          return
        }

        // Prepare registration data for backend
        const registerData = {
          full_name: data.name || '',
          email: data.email,
          password: data.password,
          user_type: 'user' // This maps to UserTypeExternal in backend
        }

        const response = await api.post<AuthResponse>('/auth/register', registerData)
        
        // Map backend response to frontend user format
        const user = {
          id: response.user.id || response.user._id || '',
          full_name: response.user.full_name,
          email: response.user.email,
          email_verified: response.user.email_verified || false,
          profile_picture: response.user.profile_picture,
          last_login: response.user.last_login || new Date().toISOString(),
          created_at: response.user.created_at || new Date().toISOString(),
          updated_at: response.user.updated_at || new Date().toISOString(),
          role: 'student' as const, // Frontend role for external users
          user_type: 'user' as const, // Backend user type (external)
          is_admin: false,
          permissions: ['read'],
          preferences: {
            theme: 'light' as const,
            language: 'id' as const,
            notifications: true,
          },
          stats: {
            testsCompleted: 0,
            averageScore: 0,
            totalTimeSpent: 0,
            streak: 0,
          },
        }

        login(user, response.access_token, response.refresh_token)
        toast.success('Registrasi berhasil! Selamat datang!')
        navigate('/home') // Redirect to home instead of profile
        
      } else {
        // Login
        const loginData = {
          email: data.email,
          password: data.password,
          remember_me: false
        }

        const response = await api.post<AuthResponse>('/auth/login', loginData)
        
        // Map backend response to frontend user format
        const user = {
          id: response.user.id || response.user._id || '',
          full_name: response.user.full_name,
          email: response.user.email,
          email_verified: response.user.email_verified || false,
          profile_picture: response.user.profile_picture,
          last_login: response.user.last_login || new Date().toISOString(),
          created_at: response.user.created_at || new Date().toISOString(),
          updated_at: response.user.updated_at || new Date().toISOString(),
          role: 'student' as const, // Frontend role for external users
          user_type: 'user' as const, // Backend user type (external)
          is_admin: false,
          permissions: ['read'],
          preferences: {
            theme: 'light' as const,
            language: 'id' as const,
            notifications: true,
          },
          stats: {
            testsCompleted: 0,
            averageScore: 0,
            totalTimeSpent: 0,
            streak: 0,
          },
        }

        login(user, response.access_token, response.refresh_token)
        toast.success('Login berhasil! Selamat datang kembali!')
        navigate('/home') // Redirect to home instead of profile
      }
    } catch (error: any) {
      console.error(`Regular ${authType} error:`, error)
      toast.error(error.message || `${authType === 'register' ? 'Registrasi' : 'Login'} gagal`)
    }
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
            />
          )}
        </div>
      </div>
    </div>
  )
} 