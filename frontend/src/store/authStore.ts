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
  user_type?: 'mahasiswa' | 'user' | 'admin' // Backend user type distinction
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
  logout: () => Promise<void>
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

      logout: async () => {
        const { token } = get()
        
        try {
          // Call backend logout endpoint if token exists
          if (token) {
            await fetch('http://localhost:8080/api/v1/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })
          }
        } catch (error) {
          console.error('Logout API call failed:', error)
          // Continue with local logout even if API call fails
        }

        // Clear auth state
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
        })

        // Clear localStorage/sessionStorage
        localStorage.removeItem('auth-storage')
        sessionStorage.clear()
        
        // Clear any other app-specific storage
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('auth-') || key.startsWith('user-') || key.startsWith('quiz-'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))

        console.log('✅ Logout completed - all storage cleared')
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
  return async () => {
    return await loginAsAdminDirect()
  }
}

export const useLoginAsStudent = () => {
  return async () => {
    return await loginAsStudentDirect()
  }
}

// Direct login functions that don't use hooks (safe to call anywhere)
export const loginAsAdminDirect = async () => {
  const { login, logout } = useAuthStore.getState()
  
  try {
    console.log('🔗 Making request to development admin login endpoint...')
    
    // Clear any existing auth state first
    await logout()
    
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
      
      // Validate the response has required fields
      if (!data.access_token || !data.user) {
        throw new Error('Invalid response from dev login endpoint')
      }
      
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
      
      // Validate token immediately
      setTimeout(async () => {
        try {
          const testResponse = await fetch('http://localhost:8080/api/v1/admin/questions/stats', {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
              'Content-Type': 'application/json'
            }
          })
          if (testResponse.ok) {
            console.log('✅ Token validation successful')
          } else {
            console.warn('⚠️ Token validation failed:', testResponse.status)
          }
        } catch (error) {
          console.warn('⚠️ Token validation error:', error)
        }
      }, 500)
      
      return true
    } else {
      const errorText = await loginResponse.text()
      console.error('❌ Development admin login failed:', loginResponse.status, errorText)
      
      // Don't fallback to mock - let user know they need to fix the backend
      console.error('⚠️ Backend dev login failed - mock tokens won\'t work with API')
      return false
    }
  } catch (error) {
    console.error('❌ Admin login error:', error)
    console.error('⚠️ Cannot login - mock tokens won\'t work with API')
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

export const loginAsUserDirect = async () => {
  const { login } = useAuthStore.getState()

  try {
    const loginResponse = await fetch('http://localhost:8080/api/v1/dev/login-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (loginResponse.ok) {
      const data = await loginResponse.json()
      console.log('✅ Development user login response:', data)

      const user: User = {
        id: data.user.id || data.user._id,
        full_name: data.user.full_name,
        email: data.user.email,
        email_verified: data.user.email_verified,
        profile_picture: data.user.profile_picture || 'https://ui-avatars.io/api/?name=Johnny+Tester&background=3b82f6&color=fff',
        last_login: data.user.last_login || new Date().toISOString(),
        created_at: data.user.created_at || new Date().toISOString(),
        updated_at: data.user.updated_at || new Date().toISOString(),
        role: 'student',
        user_type: 'user',
        is_admin: false,
        permissions: ['read'],
      }

      login(user, data.access_token, data.refresh_token)
      return true
    }

    const errorText = await loginResponse.text()
    console.error('Development user login failed:', errorText)
    return false
  } catch (error) {
    console.error('User login error:', error)
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

// OAuth login functions
export const handleOAuthLogin = async (provider: string, userType: 'mahasiswa' | 'admin' | 'user' = 'user') => {
  const { login } = useAuthStore.getState()
  
  try {
    console.log(`🔗 Starting OAuth login with ${provider} as ${userType}...`)
    
    // Get OAuth URL from backend
    const urlResponse = await fetch(`http://localhost:8080/api/v1/auth/oauth/${provider}/url?user_type=${userType}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!urlResponse.ok) {
      throw new Error(`Failed to get OAuth URL: ${urlResponse.statusText}`)
    }
    
    const urlData = await urlResponse.json()
    console.log('✅ OAuth URL received:', urlData.auth_url)
    
    // Open OAuth popup
    const popup = window.open(
      urlData.auth_url,
      'oauth-login',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    )
    
    if (!popup) {
      throw new Error('Failed to open OAuth popup. Please allow popups for this site.')
    }
    
    // Listen for OAuth callback
    return new Promise<boolean>((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          reject(new Error('OAuth popup was closed by user'))
        }
      }, 1000)
      
      // Listen for message from popup
      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'OAUTH_BACKEND_SUCCESS') {
          // Backend callback - tokens are already available
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          popup.close()
          
          try {
            console.log('✅ OAuth backend callback successful', event.data)
            
            // Get user profile from backend using the access token
            const profileResponse = await fetch('http://localhost:8080/api/v1/user/profile', {
              headers: {
                'Authorization': `Bearer ${event.data.access_token}`,
                'Content-Type': 'application/json'
              }
            })

            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              console.log('✅ User profile fetched:', profileData)
              
              // Map backend user data to frontend User interface
              const user: User = {
                id: profileData.id || profileData._id,
                full_name: profileData.full_name,
                email: profileData.email,
                email_verified: profileData.email_verified,
                profile_picture: profileData.profile_picture,
                last_login: profileData.last_login || new Date().toISOString(),
                created_at: profileData.created_at || new Date().toISOString(),
                updated_at: profileData.updated_at || new Date().toISOString(),
                role: event.data.user_type === 'admin' ? 'admin' : 'student',
                user_type: event.data.user_type,
                nim: profileData.mahasiswa_id || profileData.nim,
                faculty: profileData.faculty,
                major: profileData.major,
                is_admin: profileData.is_admin || event.data.user_type === 'admin',
                permissions: profileData.permissions || (event.data.user_type === 'admin' ? ['read', 'write', 'delete', 'admin'] : ['read']),
                preferences: {
                  theme: 'light',
                  language: 'en',
                  notifications: true,
                },
                stats: {
                  testsCompleted: 0,
                  averageScore: 0,
                  totalTimeSpent: 0,
                  streak: 0,
                },
              }

              login(user, event.data.access_token, event.data.refresh_token)
              console.log('✅ OAuth backend login completed successfully')
              resolve(true)
            } else {
              // Fallback to basic user data from OAuth callback
              const user: User = {
                id: 'oauth-user-' + Date.now(),
                full_name: 'OAuth User',
                email: 'oauth@example.com',
                email_verified: true,
                profile_picture: '',
                last_login: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                role: event.data.user_type === 'admin' ? 'admin' : 'student',
                user_type: event.data.user_type,
                is_admin: event.data.user_type === 'admin',
                permissions: event.data.user_type === 'admin' ? ['read', 'write', 'delete', 'admin'] : ['read'],
                preferences: {
                  theme: 'light',
                  language: 'en',
                  notifications: true,
                },
                stats: {
                  testsCompleted: 0,
                  averageScore: 0,
                  totalTimeSpent: 0,
                  streak: 0,
                },
              }

              login(user, event.data.access_token, event.data.refresh_token)
              console.log('✅ OAuth backend login completed with fallback user data')
              resolve(true)
            }
          } catch (error) {
            console.error('❌ OAuth backend callback error:', error)
            reject(error)
          }
        } else if (event.data.type === 'OAUTH_SUCCESS') {
          // Frontend callback - process code
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          popup.close()
          
          try {
            // Send OAuth data to backend
            const loginResponse = await fetch('http://localhost:8080/api/v1/auth/oauth/callback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                provider: provider,
                code: event.data.code,
                user_type: userType,
              }),
            })
            
            if (loginResponse.ok) {
              const data = await loginResponse.json()
              console.log('✅ OAuth frontend callback successful:', data)
              
              // Map backend user data to frontend User interface
              const user: User = {
                id: data.user.id || data.user._id,
                full_name: data.user.full_name,
                email: data.user.email,
                email_verified: data.user.email_verified,
                profile_picture: data.user.profile_picture,
                last_login: data.user.last_login || new Date().toISOString(),
                created_at: data.user.created_at || new Date().toISOString(),
                updated_at: data.user.updated_at || new Date().toISOString(),
                role: userType === 'admin' ? 'admin' : 'student',
                user_type: userType,
                is_admin: data.user.is_admin || userType === 'admin',
                permissions: data.user.permissions || (userType === 'admin' ? ['read', 'write', 'delete', 'admin'] : ['read']),
                nim: data.user.nim || data.user.mahasiswa_id,
                faculty: data.user.faculty,
                major: data.user.major,
                preferences: {
                  theme: 'light',
                  language: 'en',
                  notifications: true,
                },
                stats: {
                  testsCompleted: 0,
                  averageScore: 0,
                  totalTimeSpent: 0,
                  streak: 0,
                },
              }

              login(user, data.access_token, data.refresh_token)
              console.log('✅ OAuth frontend login completed successfully')
              resolve(true)
            } else {
              const errorText = await loginResponse.text()
              console.error('❌ OAuth frontend login failed:', errorText)
              reject(new Error(`OAuth login failed: ${errorText}`))
            }
          } catch (error) {
            console.error('❌ OAuth frontend callback error:', error)
            reject(error)
          }
        } else if (event.data.type === 'OAUTH_ERROR') {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          popup.close()
          reject(new Error(event.data.error || 'OAuth login failed'))
        }
      }
      
      window.addEventListener('message', messageListener)
    })
  } catch (error) {
    console.error('❌ OAuth login error:', error)
    throw error
  }
}

// Make debug function available globally in development
if (process.env.NODE_ENV === 'development') {
  ;(window as any).debugAuth = debugAuth
  ;(window as any).handleOAuthLogin = handleOAuthLogin
} 
