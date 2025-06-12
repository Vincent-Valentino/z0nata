import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  full_name: string
  email: string
  email_verified: boolean
  profile_picture?: string
  last_login: string
  created_at: string
  updated_at: string
  
  // Extended fields for frontend
  role?: 'student' | 'admin'
  nim?: string // for mahasiswa
  faculty?: string
  major?: string
  is_admin?: boolean
  permissions?: string[]
  preferences?: {
    theme?: 'light' | 'dark' | 'system'
    language?: 'id' | 'en'
    notifications?: boolean
  }
  stats?: {
    testsCompleted: number
    averageScore: number
    totalTimeSpent: number
    streak: number
  }
}

interface AuthState {
  // Authentication state
  isAuthenticated: boolean
  user: User | null
  token: string | null
  refreshToken: string | null

  // Actions
  login: (user: User, token: string, refreshToken?: string) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,

      login: (user, token, refreshToken) => {
        set({
          isAuthenticated: true,
          user,
          token,
          refreshToken,
        })
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
        })
      },

      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates }
          })
        }
      },

      setToken: (token) => {
        set({ token })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

// Mock users for development
export const getAdminUser = (): User => ({
  id: '507f1f77bcf86cd799439011',
  full_name: 'William Zonata',
  email: 'william.zonata@admin.com',
  email_verified: true,
  profile_picture: 'https://ui-avatars.io/api/?name=William+Zonata&background=ef4444&color=fff',
  last_login: new Date().toISOString(),
  created_at: '2024-01-01T00:00:00Z',
  updated_at: new Date().toISOString(),
  role: 'admin',
  is_admin: true,
  permissions: ['read', 'write', 'delete', 'admin'],
  preferences: {
    theme: 'dark',
    language: 'en',
    notifications: true,
  },
  stats: {
    testsCompleted: 150,
    averageScore: 95.5,
    totalTimeSpent: 12000,
    streak: 45,
  },
})

export const getStudentUser = (): User => ({
  id: '507f1f77bcf86cd799439012',
  full_name: 'Vincent Valentino',
  email: 'vincent.valentino@student.com',
  email_verified: true,
  profile_picture: 'https://ui-avatars.io/api/?name=Vincent+Valentino&background=22c55e&color=fff',
  last_login: new Date().toISOString(),
  created_at: '2024-01-15T00:00:00Z',
  updated_at: new Date().toISOString(),
  role: 'student',
  nim: '2021001234',
  faculty: 'Fakultas Teknik',
  major: 'Teknik Informatika',
  is_admin: false,
  permissions: ['read'],
  preferences: {
    theme: 'light',
    language: 'id',
    notifications: true,
  },
  stats: {
    testsCompleted: 25,
    averageScore: 78.3,
    totalTimeSpent: 4500,
    streak: 12,
  },
})

// Development login functions that create real JWT tokens
export const useLoginAsAdmin = () => {
  const { login } = useAuthStore()
  
  return async () => {
    return await loginAsAdminDirect()
  }
}

export const useLoginAsStudent = () => {
  const { login } = useAuthStore()
  
  return async () => {
    return await loginAsStudentDirect()
  }
}

// Direct login functions that don't use hooks (safe to call anywhere)
export const loginAsAdminDirect = async () => {
  const { login } = useAuthStore.getState()
  
  try {
    console.log('🔗 Making request to development admin login endpoint...')
    // Use the development admin login endpoint that generates real JWT tokens
    const loginResponse = await fetch('http://localhost:8080/api/v1/dev/login-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log('📡 Response received:', loginResponse.status, loginResponse.statusText)

    if (loginResponse.ok) {
      const data = await loginResponse.json()
      console.log('✅ Development admin login response:', data)
      
      // Map backend user data to frontend User interface
      const user: User = {
        id: data.user.id || data.user._id,
        full_name: data.user.full_name,
        email: data.user.email,
        email_verified: data.user.email_verified,
        profile_picture: data.user.profile_picture || 'https://ui-avatars.io/api/?name=William+Zonata&background=ef4444&color=fff',
        last_login: data.user.last_login || new Date().toISOString(),
        created_at: data.user.created_at || '2024-01-01T00:00:00Z',
        updated_at: data.user.updated_at || new Date().toISOString(),
        role: 'admin',
        is_admin: data.user.is_admin || true,
        permissions: data.user.permissions || ['read', 'write', 'delete', 'admin'],
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: true,
        },
        stats: {
          testsCompleted: 150,
          averageScore: 95.5,
          totalTimeSpent: 12000,
          streak: 45,
        },
      }

      login(user, data.access_token, data.refresh_token)
      console.log('✅ Admin login successful with real JWT token from dev endpoint')
      return true
    } else {
      const errorText = await loginResponse.text()
      console.error('❌ Development admin login failed:', loginResponse.status, errorText)
      // Fallback to mock user with fake token
      console.warn('⚠️  Backend dev login failed, using mock admin user')
      const mockUser = getAdminUser()
      login(mockUser, 'mock-admin-token-' + Date.now())
      return false
    }
  } catch (error) {
    console.error('Admin login error:', error)
    // Fallback to mock user
    const mockUser = getAdminUser()
    login(mockUser, 'mock-admin-token-' + Date.now())
    return false
  }
}

export const loginAsStudentDirect = async () => {
  const { login } = useAuthStore.getState()
  
  try {
    // Use the development student login endpoint that generates real JWT tokens
    const loginResponse = await fetch('http://localhost:8080/api/v1/dev/login-student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (loginResponse.ok) {
      const data = await loginResponse.json()
      console.log('✅ Development student login response:', data)
      
      // Map backend user data to frontend User interface
      const user: User = {
        id: data.user.id || data.user._id,
        full_name: data.user.full_name,
        email: data.user.email,
        email_verified: data.user.email_verified,
        profile_picture: data.user.profile_picture || 'https://ui-avatars.io/api/?name=Vincent+Valentino&background=22c55e&color=fff',
        last_login: data.user.last_login || new Date().toISOString(),
        created_at: data.user.created_at || '2024-01-15T00:00:00Z',
        updated_at: data.user.updated_at || new Date().toISOString(),
        role: 'student',
        nim: data.user.nim || data.user.mahasiswa_id || '2021001234',
        faculty: data.user.faculty || 'Fakultas Teknik',
        major: data.user.major || 'Teknik Informatika',
        is_admin: false,
        permissions: ['read'],
        preferences: {
          theme: 'light',
          language: 'id',
          notifications: true,
        },
        stats: {
          testsCompleted: 25,
          averageScore: 78.3,
          totalTimeSpent: 4500,
          streak: 12,
        },
      }

      login(user, data.access_token, data.refresh_token)
      console.log('✅ Student login successful with real JWT token from dev endpoint')
      return true
    } else {
      const errorText = await loginResponse.text()
      console.error('Development student login failed:', errorText)
      // Fallback to mock user with fake token
      console.warn('Backend dev login failed, using mock student user')
      const mockUser = getStudentUser()
      login(mockUser, 'mock-student-token-' + Date.now())
      return false
    }
  } catch (error) {
    console.error('Student login error:', error)
    // Fallback to mock user
    const mockUser = getStudentUser()
    login(mockUser, 'mock-student-token-' + Date.now())
    return false
  }
}

// Auto-login as admin on app start for development
if (process.env.NODE_ENV === 'development') {
  const currentState = useAuthStore.getState()
  console.log('🔍 Current auth state:', { 
    isAuthenticated: currentState.isAuthenticated, 
    user: currentState.user?.full_name,
    token: currentState.token ? 'Present' : 'Missing'
  })
  
  if (!currentState.isAuthenticated) {
    // Auto login as admin using the development endpoint with real JWT token
    console.log('🚀 Starting development auto-login...')
    setTimeout(async () => {
      try {
        console.log('🔄 Attempting auto-login as admin...')
        const success = await loginAsAdminDirect()
        if (success) {
          console.log('✅ Development auto-login as admin successful with real JWT token')
        } else {
          console.warn('⚠️  Development auto-login failed, but fallback user was set')
        }
      } catch (error) {
        console.error('❌ Auto-login failed:', error)
      }
    }, 500)
  } else {
    console.log('ℹ️  User already authenticated, skipping auto-login')
  }
} 

// Debug function for manual testing (available in browser console)
export const debugAuth = {
  async freshAdminLogin() {
    console.log('🧪 Debug: Starting fresh admin login...')
    const { logout } = useAuthStore.getState()
    logout()
    localStorage.removeItem('auth-storage')
    console.log('🧹 Cleared all auth data')
    
    setTimeout(async () => {
      const success = await loginAsAdminDirect()
      console.log('🧪 Debug: Fresh login result:', success)
      
      // Test API call
      setTimeout(async () => {
        try {
          const response = await fetch('http://localhost:8080/api/v1/admin/questions/stats', {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().token}`,
              'Content-Type': 'application/json'
            }
          })
          console.log('🧪 Debug: API test result:', response.status, await response.json())
        } catch (error) {
          console.error('🧪 Debug: API test failed:', error)
        }
      }, 1000)
    }, 100)
  },
  
  getCurrentState() {
    const state = useAuthStore.getState()
    console.log('🧪 Debug: Current auth state:', {
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      token: state.token ? `${state.token.slice(0, 20)}...` : 'null'
    })
    return state
  },
  
  async testAPICall() {
    const token = useAuthStore.getState().token
    if (!token) {
      console.error('🧪 Debug: No token available')
      return
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/v1/admin/questions/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      console.log('🧪 Debug: API test result:', response.status, await response.json())
    } catch (error) {
      console.error('🧪 Debug: API test failed:', error)
    }
  }
}

// Make debug function available globally in development
if (process.env.NODE_ENV === 'development') {
  ;(window as any).debugAuth = debugAuth
} 
