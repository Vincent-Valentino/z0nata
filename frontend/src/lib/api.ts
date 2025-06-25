const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

// Types for API responses
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  details?: string
}

// JWT token inspection utility
const inspectJWT = (token: string) => {
  try {
    // JWT has 3 parts separated by dots: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid JWT format' }
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]))
    const now = Math.floor(Date.now() / 1000)
    
    return {
      valid: true,
      payload,
      isExpired: payload.exp ? payload.exp < now : false,
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Unknown',
      issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'Unknown',
      subject: payload.sub || 'Unknown',
      issuer: payload.iss || 'Unknown'
    }
  } catch (error) {
    return { valid: false, error: `Failed to decode JWT: ${error}` }
  }
}

// Utility function to refresh token if available
const refreshTokenIfAvailable = async (): Promise<boolean> => {
  try {
    // Try to get refresh token from storage
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      console.log('No refresh token available')
      return false
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    })

    if (response.ok) {
      const data = await response.json()
      
      // Update the stored tokens
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage)
          if (parsed.state) {
            parsed.state.token = data.access_token
            localStorage.setItem('auth-storage', JSON.stringify(parsed))
          }
        } catch (error) {
          console.warn('Failed to update auth storage after refresh:', error)
        }
      }
      
      // Also update direct storage as fallback
      localStorage.setItem('access_token', data.access_token)
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token)
      }
      
      console.log('✅ Token refreshed successfully')
      return true
    } else {
      console.warn('Failed to refresh token:', response.status)
      return false
    }
  } catch (error) {
    console.error('Error refreshing token:', error)
    return false
  }
}

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  // Try to get token from Zustand persisted auth store
  const authStorage = localStorage.getItem('auth-storage')
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage)
      // Zustand persist stores data under 'state' key
      if (parsed.state?.token) {
        return parsed.state.token
      }
    } catch (error) {
      console.warn('Failed to parse auth-storage:', error)
    }
  }
  
  // Fallback: try to get from direct localStorage access_token key
  const directToken = localStorage.getItem('access_token')
  if (directToken) {
    return directToken
  }
  
  return null
}

// Debug function to help diagnose auth issues
export const debugAuthState = () => {
  const authStorage = localStorage.getItem('auth-storage')
  const directToken = localStorage.getItem('access_token')
  const refreshToken = localStorage.getItem('refresh_token')
  
  console.group('🔍 Authentication Debug Info')
  console.log('Auth storage exists:', !!authStorage)
  console.log('Direct token exists:', !!directToken)
  console.log('Refresh token exists:', !!refreshToken)
  
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage)
      console.log('Raw auth storage:', parsed)
      console.log('Auth storage structure:', {
        hasState: !!parsed.state,
        hasToken: !!parsed.state?.token,
        isAuthenticated: parsed.state?.isAuthenticated,
        userEmail: parsed.state?.user?.email
      })
    } catch (error) {
      console.error('Failed to parse auth storage:', error)
    }
  }
  
  const currentToken = getAuthToken()
  console.log('Current token retrieved:', !!currentToken)
  if (currentToken) {
    console.log('Token preview:', currentToken.substring(0, 20) + '...')
    
    // Inspect the JWT token
    const tokenInfo = inspectJWT(currentToken)
    console.log('JWT inspection:', tokenInfo)
    
    if (tokenInfo.valid && tokenInfo.isExpired) {
      console.warn('⚠️ Token is EXPIRED!')
      console.log('Token expired at:', tokenInfo.expiresAt)
    } else if (tokenInfo.valid) {
      console.log('✅ Token appears valid and not expired')
      console.log('Token expires at:', tokenInfo.expiresAt)
    }
  }
  console.groupEnd()
  
  return {
    authStorage: !!authStorage,
    directToken: !!directToken,
    currentToken: !!currentToken,
    refreshToken: !!refreshToken,
    tokenInfo: currentToken ? inspectJWT(currentToken) : null
  }
}

// Base fetch wrapper
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  let token = getAuthToken()
  
  // Check if token is about to expire (within 10 minutes) and try to refresh
  if (token) {
    const tokenInfo = inspectJWT(token)
    if (tokenInfo.valid && tokenInfo.payload.exp) {
      const expiresAt = new Date(tokenInfo.payload.exp * 1000)
      const now = new Date()
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()
      const tenMinutesInMs = 10 * 60 * 1000
      
      // If token expires within 10 minutes, try to refresh it
      if (timeUntilExpiry > 0 && timeUntilExpiry < tenMinutesInMs) {
        console.log('🔄 Token expires soon, attempting refresh...')
        try {
          await refreshTokenIfAvailable()
          token = getAuthToken() // Get the new token after refresh
        } catch (error) {
          console.warn('Failed to refresh token:', error)
          // Continue with existing token - might still work
        }
      }
    }
  }
  
  // Debug log for development
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 API Call: ${options.method || 'GET'} ${endpoint}`, {
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'None'
    })
    
    // Check token expiration before making the call
    if (token) {
      const tokenInfo = inspectJWT(token)
      if (tokenInfo.valid && tokenInfo.isExpired) {
        console.error('🚨 Making API call with expired token!', {
          expiredAt: tokenInfo.expiresAt,
          currentTime: new Date().toISOString()
        })
      }
    }
  }
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }))
    
    // Provide more specific error messages for common issues
    if (response.status === 401) {
      console.error('🔒 Authentication failed. Token may be invalid or expired.')
      const debugInfo = debugAuthState()
      console.error('🔍 Debug info:', debugInfo)
      
      // Check if token is expired
      if (debugInfo.tokenInfo?.valid && debugInfo.tokenInfo.isExpired) {
        console.error('💀 Token is definitely expired! Need fresh login.')
        throw new Error('Token has expired. Please log in again to continue.')
      }
      
      if (!token) {
        throw new Error('Authentication required. Please log in to continue.')
      } else {
        throw new Error('Invalid or expired token. Please log in again.')
      }
    }
    
    if (response.status === 403) {
      throw new Error('Access denied. You do not have permission to perform this action.')
    }
    
      throw new Error(errorData.error || `Request failed with status ${response.status}`)
    }

    return response.json()
  } catch (error: any) {
    // Handle network errors or other fetch failures
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('🌐 Network error - backend may be down')
      throw new Error('Unable to connect to the server. Please check your internet connection and try again.')
    }
    
    // Re-throw API errors
    throw error
  }
}

// API methods
export const api = {
  // GET request
  get: <T>(endpoint: string): Promise<T> =>
    apiCall<T>(endpoint, { method: 'GET' }),

  // POST request
  post: <T>(endpoint: string, data?: any): Promise<T> =>
    apiCall<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  // PUT request
  put: <T>(endpoint: string, data?: any): Promise<T> =>
    apiCall<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  // PATCH request
  patch: <T>(endpoint: string, data?: any): Promise<T> =>
    apiCall<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  // DELETE request
  delete: <T>(endpoint: string): Promise<T> =>
    apiCall<T>(endpoint, { method: 'DELETE' }),
}

// Utility function to trigger a fresh login
export const triggerFreshLogin = async () => {
  console.log('🔄 Triggering fresh login due to expired token...')
  
  // Clear all auth data
  localStorage.removeItem('auth-storage')
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  
  // Clear quiz data too
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('quiz-')) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
  
  console.log('🧹 Cleared all stored data')
  
  // Reload the page to reset app state
  window.location.reload()
}

// Make debug functions available globally in development
if (process.env.NODE_ENV === 'development') {
  ;(window as any).debugAuthState = debugAuthState
  ;(window as any).inspectJWT = inspectJWT
  ;(window as any).triggerFreshLogin = triggerFreshLogin
} 