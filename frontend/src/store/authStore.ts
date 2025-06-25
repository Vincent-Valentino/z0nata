import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'

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
export const loginAsAdminDirect = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:8080/api/v1/dev/login-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
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

      useAuthStore.getState().login(user, data.access_token, data.refresh_token)
      
      // Verify the token was stored correctly
      const storedToken = useAuthStore.getState().token
      console.log('✅ Admin token stored successfully:', !!storedToken)
      console.log('Admin token preview:', storedToken ? storedToken.substring(0, 20) + '...' : 'None')
      
      return true
    } else {
      const errorText = await response.text()
      console.error('❌ Development admin login failed:', response.status, errorText)
      return false
    }
  } catch (error) {
    console.error('❌ Admin login error:', error)
    return false
  }
}

export const loginAsStudentDirect = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:8080/api/v1/dev/login-student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
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

      useAuthStore.getState().login(user, data.access_token, data.refresh_token)
      
      // Verify the token was stored correctly
      const storedToken = useAuthStore.getState().token
      console.log('✅ Student token stored successfully:', !!storedToken)
      console.log('Student token preview:', storedToken ? storedToken.substring(0, 20) + '...' : 'None')
      
      return true
    } else {
      const errorText = await response.text()
      console.error('Development student login failed:', errorText)
      return false
    }
  } catch (error) {
    console.error('Student login error:', error)
    return false
  }
}

export const loginAsUserDirect = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:8080/api/v1/dev/login-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
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

      useAuthStore.getState().login(user, data.access_token, data.refresh_token)
      
      // Verify the token was stored correctly
      const storedToken = useAuthStore.getState().token
      console.log('✅ User token stored successfully:', !!storedToken)
      console.log('User token preview:', storedToken ? storedToken.substring(0, 20) + '...' : 'None')
      
      return true
    }

    const errorText = await response.text()
    console.error('Development user login failed:', errorText)
    return false
  } catch (error) {
    console.error('User login error:', error)
    return false
  }
}

// OAuth login handler
export const handleOAuthLogin = async (provider: string, userType: 'mahasiswa' | 'admin' | 'user' = 'user') => {
  try {
    console.log(`🔄 Starting ${provider} OAuth for ${userType}...`)
    
    // Get OAuth URL from backend
    const response = await fetch(`http://localhost:8080/api/v1/auth/oauth/${provider}/url?user_type=${userType}`)
    if (!response.ok) {
      throw new Error(`Failed to get OAuth URL: ${response.statusText}`)
    }
    
    const { url } = await response.json()
    console.log(`🔗 OAuth URL obtained: ${url}`)
    
    // Open OAuth popup
    const popup = window.open(
      url,
      'oauth-login',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    )
    
    if (!popup) {
      throw new Error('Failed to open OAuth popup. Please allow popups for this site.')
    }
    
    // Listen for OAuth completion
    return new Promise((resolve, reject) => {
      const messageListener = async (event: MessageEvent) => {
        // Verify origin for security
        if (event.origin !== window.location.origin) {
          return
        }
        
        if (event.data.type === 'OAUTH_SUCCESS') {
          console.log('✅ OAuth success received:', event.data)
          
          try {
            // Map the OAuth user data to our User interface
            const oauthUser = event.data.user
            const user: User = {
              id: oauthUser.id || oauthUser._id,
              full_name: oauthUser.full_name || oauthUser.name,
              email: oauthUser.email,
              email_verified: oauthUser.email_verified || true,
              profile_picture: oauthUser.profile_picture || oauthUser.picture,
              last_login: new Date().toISOString(),
              created_at: oauthUser.created_at || new Date().toISOString(),
              updated_at: oauthUser.updated_at || new Date().toISOString(),
              role: userType === 'admin' ? 'admin' : 'student',
              user_type: userType,
              is_admin: userType === 'admin',
              permissions: userType === 'admin' ? ['read', 'write', 'delete', 'admin'] : ['read'],
            }
            
            // Store tokens and user data
            useAuthStore.getState().login(
              user, 
              event.data.access_token, 
              event.data.refresh_token
            )
            
            // Store tokens in localStorage for API calls
            localStorage.setItem('access_token', event.data.access_token)
            if (event.data.refresh_token) {
              localStorage.setItem('refresh_token', event.data.refresh_token)
            }
            
            popup.close()
            window.removeEventListener('message', messageListener)
            resolve(event.data)
          } catch (error) {
            console.error('❌ Error processing OAuth success:', error)
            popup.close()
            window.removeEventListener('message', messageListener)
            reject(error)
          }
        } else if (event.data.type === 'OAUTH_ERROR') {
          console.error('❌ OAuth error received:', event.data.error)
          popup.close()
          window.removeEventListener('message', messageListener)
          reject(new Error(event.data.error))
        }
      }
      
      window.addEventListener('message', messageListener)
      
      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          reject(new Error('OAuth popup was closed'))
        }
      }, 1000)
    })
  } catch (error) {
    console.error(`❌ ${provider} OAuth failed:`, error)
    throw error
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
    console.log('Current auth state:', state)
    return state
  },

  async testAPICall() {
    const { token } = useAuthStore.getState()
    if (!token) {
      console.log('No token available')
      return
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/v1/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      console.log('API Test Result:', { status: response.status, data })
    } catch (error) {
      console.error('API Test Failed:', error)
    }
  }
}

// Make debug function available globally in development
if (process.env.NODE_ENV === 'development') {
  ;(window as any).debugAuth = debugAuth
  ;(window as any).handleOAuthLogin = handleOAuthLogin
}
 