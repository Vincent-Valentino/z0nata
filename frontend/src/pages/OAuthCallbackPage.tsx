import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore, type User } from '@/store/authStore'
import { toast } from 'sonner'

export const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuthStore()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get parameters from URL
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token') 
        const userType = searchParams.get('user_type')
        const error = searchParams.get('error')

        console.log('🔄 OAuth callback processing:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          userType,
          error
        })

        // Handle OAuth error
        if (error) {
          console.error('❌ OAuth error:', error)
          toast.error(`OAuth login failed: ${decodeURIComponent(error)}`)
          
          // If this is a popup, send error message to parent
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_ERROR',
              error: decodeURIComponent(error)
            }, window.location.origin)
            window.close()
            return
          }
          
          // If not a popup, redirect to login
          navigate('/login')
          return
        }

        // Validate required parameters
        if (!accessToken || !refreshToken || !userType) {
          const missingParams = []
          if (!accessToken) missingParams.push('access_token')
          if (!refreshToken) missingParams.push('refresh_token')
          if (!userType) missingParams.push('user_type')
          
          const errorMsg = `Missing required parameters: ${missingParams.join(', ')}`
          console.error('❌ OAuth callback missing parameters:', errorMsg)
          toast.error(errorMsg)
          
          // If this is a popup, send error message to parent
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_ERROR', 
              error: errorMsg
            }, window.location.origin)
            window.close()
            return
          }
          
          // If not a popup, redirect to login
          navigate('/login')
          return
        }

        // Get user profile from backend
        console.log('🔄 Fetching user profile with access token...')
        const profileResponse = await fetch('http://localhost:8080/api/v1/user/profile', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        let user: User
        
        if (profileResponse.ok) {
          const profileResponse_data = await profileResponse.json()
          console.log('✅ User profile fetched:', profileResponse_data)
          
          // Extract user data from the wrapped response
          const profileData = profileResponse_data.user || profileResponse_data
          
          // Map backend user data to frontend User interface
          user = {
            id: profileData.id || profileData._id,
            full_name: profileData.full_name || 'OAuth User',
            email: profileData.email || 'oauth@example.com',
            email_verified: profileData.email_verified || true,
            profile_picture: profileData.profile_picture || '',
            last_login: profileData.last_login || new Date().toISOString(),
            created_at: profileData.created_at || new Date().toISOString(),
            updated_at: profileData.updated_at || new Date().toISOString(),
            role: userType === 'admin' ? 'admin' : 'student',
            user_type: userType as 'user' | 'admin' | 'mahasiswa',
            nim: profileData.mahasiswa_id || profileData.nim,
            faculty: profileData.faculty,
            major: profileData.major,
            is_admin: profileData.is_admin || userType === 'admin',
            permissions: profileData.permissions || (userType === 'admin' ? ['read', 'write', 'delete', 'admin'] : ['read']),
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
        } else {
          const errorText = await profileResponse.text()
          console.warn('⚠️ Profile fetch failed:', profileResponse.status, errorText)
          console.warn('⚠️ Using fallback user data')
          // Fallback to basic user data from OAuth callback
          user = {
            id: 'oauth-user-' + Date.now(),
            full_name: 'OAuth User',
            email: 'oauth@example.com',
            email_verified: true,
            profile_picture: '',
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: userType === 'admin' ? 'admin' : 'student',
            user_type: userType as 'user' | 'admin' | 'mahasiswa',
            is_admin: userType === 'admin',
            permissions: userType === 'admin' ? ['read', 'write', 'delete', 'admin'] : ['read'],
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
        }

        // Login user
        login(user, accessToken, refreshToken)
        console.log('✅ OAuth login completed successfully')
        toast.success('Successfully logged in!')

        // If this is a popup, send success message to parent
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_BACKEND_SUCCESS',
            access_token: accessToken,
            refresh_token: refreshToken,
            user_type: userType
          }, window.location.origin)
          window.close()
          return
        }

        // If not a popup, redirect to home  
        navigate('/', { replace: true })

      } catch (error: any) {
        console.error('❌ OAuth callback error:', error)
        toast.error(error.message || 'OAuth login failed')
        
        // If this is a popup, send error message to parent
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_ERROR',
            error: error.message || 'OAuth login failed'
          }, window.location.origin)
          window.close()
          return
        }
        
        // If not a popup, redirect to login
        navigate('/login')
      }
    }

    handleOAuthCallback()
  }, [searchParams, navigate, login])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Processing OAuth Login...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  )
} 