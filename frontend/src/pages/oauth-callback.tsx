import { useEffect } from 'react'

export default function OAuthCallback() {
  useEffect(() => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    const state = urlParams.get('state')
    
    // Backend callback parameters (when backend handles OAuth callback)
    const accessToken = urlParams.get('access_token')
    const refreshToken = urlParams.get('refresh_token')
    const userType = urlParams.get('user_type')

    if (error) {
      // Send error to parent window
      window.opener?.postMessage({
        type: 'OAUTH_ERROR',
        error: error,
        error_description: urlParams.get('error_description')
      }, window.location.origin)
    } else if (accessToken && refreshToken) {
      // Backend callback - tokens are already available
      window.opener?.postMessage({
        type: 'OAUTH_BACKEND_SUCCESS',
        access_token: accessToken,
        refresh_token: refreshToken,
        user_type: userType
      }, window.location.origin)
    } else if (code) {
      // Frontend callback - send code to be processed
      window.opener?.postMessage({
        type: 'OAUTH_SUCCESS',
        code: code,
        state: state
      }, window.location.origin)
    } else {
      // No code or error - something went wrong
      window.opener?.postMessage({
        type: 'OAUTH_ERROR',
        error: 'no_code',
        error_description: 'No authorization code received'
      }, window.location.origin)
    }

    // Close the popup
    window.close()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing OAuth callback...</p>
        <p className="text-sm text-gray-500 mt-2">This window will close automatically.</p>
      </div>
    </div>
  )
} 