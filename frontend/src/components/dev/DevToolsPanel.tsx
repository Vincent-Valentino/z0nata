import React, { useState } from 'react'
import { useAuthStore, loginAsAdminDirect, loginAsStudentDirect, loginAsUserDirect, getAdminUser, getStudentUser, handleOAuthLogin } from '@/store/authStore'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

import { 
  ChevronUp, 
  ChevronDown, 
  User, 
  Shield, 
  Settings, 
  TestTube, 
  Activity,
  Monitor,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Globe
} from 'lucide-react'

interface DevPanelTab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export const DevToolsPanel = () => {
  const { user, isAuthenticated, logout } = useAuthStore()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('auth')
  const [apiTestResult, setApiTestResult] = useState<any>(null)
  const [isTestingAPI, setIsTestingAPI] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [authTestResult, setAuthTestResult] = useState<any>(null)
  const [isTestingAuth, setIsTestingAuth] = useState(false)

  const tabs: DevPanelTab[] = [
    { id: 'auth', label: 'Auth', icon: Shield },
    { id: 'api', label: 'API Test', icon: TestTube },
    { id: 'oauth', label: 'OAuth', icon: Globe },
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const apiEndpoints = [
    // Admin endpoints
    { label: 'Questions List', endpoint: '/admin/questions', method: 'GET', category: 'Admin' },
    { label: 'Question Stats', endpoint: '/admin/questions/stats', method: 'GET', category: 'Admin' },
    { label: 'Module Stats', endpoint: '/admin/modules/stats', method: 'GET', category: 'Admin' },
    { label: 'User Stats', endpoint: '/admin/users/stats', method: 'GET', category: 'Admin' },
    { label: 'All Users', endpoint: '/admin/users', method: 'GET', category: 'Admin' },
    
    // User endpoints
    { label: 'User Profile', endpoint: '/user/profile', method: 'GET', category: 'User' },
    { label: 'Change Password', endpoint: '/user/change-password', method: 'POST', category: 'User' },
    
    // Auth endpoints
    { label: 'Refresh Token', endpoint: '/auth/refresh', method: 'POST', category: 'Auth' },
    { label: 'Logout', endpoint: '/auth/logout', method: 'POST', category: 'Auth' },
    { label: 'Google OAuth URL', endpoint: '/auth/oauth/google/url?user_type=mahasiswa', method: 'GET', category: 'Auth' },
    { label: 'X OAuth URL', endpoint: '/auth/oauth/x/url?user_type=mahasiswa', method: 'GET', category: 'Auth' },
    
    // System endpoints
    { label: 'Health Check', endpoint: '/health', method: 'GET', category: 'System' },
    { label: 'API Version', endpoint: '/api/v1', method: 'GET', category: 'System' },
  ]

  const adminUser = getAdminUser()
  const studentUser = getStudentUser()

  const regularUser = {
    id: '507f1f77bcf86cd799439013',
    full_name: 'Johnny Tester',
    email: 'johnny.tester@user.com',
    role: 'user',
    password: 'user123',
    description: 'Regular Account - Basic user access'
  }

  const mockUsers = [
    {
      ...adminUser,
      password: 'admin123',
      description: 'Admin Account - Full access to admin panel'
    },
    {
      ...studentUser,
      password: 'student123',
      description: 'Student Account - Regular user access'
    },
    regularUser
  ]

  const handleQuickLogin = async (userType: 'admin' | 'student' | 'user') => {
    console.log(`🔄 Starting ${userType} login...`)
    try {
      if (userType === 'admin') {
        const success = await loginAsAdminDirect()
        if (success) {
          console.log('✅ Admin login successful')
          // Test API call immediately after login to verify token works
          setTimeout(async () => {
            try {
              const token = useAuthStore.getState().token
              console.log('🧪 Testing API with token:', token ? `${token.slice(0, 20)}...` : 'null')
              
              if (token && token.includes('mock-')) {
                console.warn('⚠️ Using mock token - API calls may fail')
                return
              }
              
              const result = await api.get('/admin/questions/stats')
              console.log('✅ API test successful:', result)
            } catch (error) {
              console.error('❌ API test failed:', error)
            }
          }, 500)
        } else {
          console.warn('⚠️ Admin login failed, using fallback')
        }
      } else if (userType === 'student') {
        const success = await loginAsStudentDirect()
        if (success) {
          console.log('✅ Student login successful')
        } else {
          console.warn('⚠️ Student login failed, using fallback')
        }
      } else {
        const success = await loginAsUserDirect()
        if (success) {
          console.log('✅ User login successful')
        }
      }
    } catch (error) {
      console.error(`❌ ${userType} login error:`, error)
    }
  }

  const testAPIEndpoint = async (endpoint: string, method: string = 'GET') => {
    setIsTestingAPI(true)
    setApiTestResult(null)
    
    try {
      // Check auth state before testing
      const { token, isAuthenticated } = useAuthStore.getState()
      
      if (!isAuthenticated || !token) {
        setApiTestResult({
          success: false,
          error: 'Not authenticated - please login first',
          status: 'error'
        })
        return
      }
      
      if (token.includes('mock-')) {
        setApiTestResult({
          success: false,
          error: 'Using mock token - API calls will fail. Use "Force Fresh Admin Login"',
          status: 'error'
        })
        return
      }
      
      const startTime = Date.now()
      let result
      
      switch (method) {
        case 'GET':
          result = await api.get(endpoint)
          break
        case 'POST':
          result = await api.post(endpoint, {})
          break
        default:
          throw new Error(`Unsupported method: ${method}`)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      setApiTestResult({
        success: true,
        data: result,
        duration,
        status: 'success'
      })
    } catch (error: any) {
      setApiTestResult({
        success: false,
        error: error.message,
        status: 'error'
      })
    } finally {
      setIsTestingAPI(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const testOAuthProvider = async (provider: string, userType: 'mahasiswa' | 'admin' = 'mahasiswa') => {
    setIsTestingAuth(true)
    setAuthTestResult(null)
    
    try {
      const startTime = Date.now()
      await handleOAuthLogin(provider, userType)
      const endTime = Date.now()
      const duration = endTime - startTime
      
      setAuthTestResult({
        success: true,
        provider,
        userType,
        duration,
        message: `Successfully logged in with ${provider} as ${userType}`
      })
    } catch (error: any) {
      setAuthTestResult({
        success: false,
        provider,
        userType,
        error: error.message,
        message: `Failed to login with ${provider}: ${error.message}`
      })
    } finally {
      setIsTestingAuth(false)
    }
  }

  const filteredEndpoints = selectedCategory === 'All' 
    ? apiEndpoints 
    : apiEndpoints.filter(endpoint => endpoint.category === selectedCategory)

  const categories = ['All', ...Array.from(new Set(apiEndpoints.map(e => e.category)))]

  const oauthProviders = [
    { id: 'google', name: 'Google', icon: '🔍' },
    { id: 'facebook', name: 'Facebook', icon: '📘' },
    { id: 'x', name: 'X / Twitter', icon: '🐦' },
    { id: 'github', name: 'GitHub', icon: '🐙' },
  ]

  return (
    <div className={cn(
      "fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50 transition-all duration-300 ease-in-out",
      "w-[calc(100vw-1rem)] sm:w-120 bg-background border border-border rounded-lg shadow-2xl max-w-md sm:max-w-none",
      isExpanded ? "h-[80vh] sm:h-100" : "h-12"
    )}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-2 sm:p-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg touch-manipulation"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs sm:text-sm font-medium">Dev Tools</span>
          <Badge variant="secondary" className="text-xs">
            {process.env.NODE_ENV}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-2 sm:p-3 pt-0 h-[calc(100%-3rem)] overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-5 mb-2 sm:mb-3 h-8 sm:h-10">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-1 text-xs px-1 sm:px-3 touch-manipulation"
                >
                  <tab.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Auth Tab */}
            <TabsContent value="auth" className="space-y-2 sm:space-y-3 h-[calc(100%-2.5rem)] sm:h-60 overflow-y-auto">
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Current User
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  {isAuthenticated && user ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Name:</span>
                        <span className="text-xs font-medium truncate ml-2">{user.full_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Email:</span>
                        <span className="text-xs font-medium truncate ml-2">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Role:</span>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Token:</span>
                        <Badge 
                          variant={useAuthStore.getState().token?.includes('mock-') ? 'destructive' : 'default'} 
                          className="text-xs"
                        >
                          {useAuthStore.getState().token?.includes('mock-') ? 'Mock (Invalid)' : 'Valid'}
                        </Badge>
                      </div>
                      <Button 
                        onClick={logout} 
                        variant="destructive" 
                        size="sm" 
                        className="w-full mt-2 touch-manipulation"
                      >
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <AlertCircle className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Not logged in</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm">Quick Login</CardTitle>
                  <CardDescription className="text-xs">
                    Switch between test accounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  {mockUsers.map((mockUser, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {mockUser.role === 'admin' ? (
                            <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                          ) : (
                            <User className="w-4 h-4 text-green-500 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{mockUser.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{mockUser.description}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleQuickLogin(mockUser.role as 'admin' | 'student' | 'user')}
                          size="sm"
                          variant="outline"
                          className="text-xs touch-manipulation shrink-0"
                        >
                          Login
                        </Button>
                      </div>
                      {index < mockUsers.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Test Tab */}
            <TabsContent value="api" className="space-y-2 sm:space-y-3 h-[calc(100%-2.5rem)] sm:h-60 overflow-y-auto">
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
                    API Testing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  {/* Category Filter */}
                  <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        className="text-xs whitespace-nowrap touch-manipulation"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 max-h-32 sm:max-h-40 overflow-y-auto">
                    {filteredEndpoints.map((endpoint, index) => (
                      <Button
                        key={index}
                        onClick={() => testAPIEndpoint(endpoint.endpoint, endpoint.method)}
                        disabled={isTestingAPI}
                        variant="outline"
                        size="sm"
                        className="justify-start text-xs touch-manipulation"
                      >
                        {isTestingAPI ? (
                          <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                          <Activity className="w-3 h-3 mr-2" />
                        )}
                        <Badge variant="secondary" className="text-xs mr-2">
                          {endpoint.method}
                        </Badge>
                        <span className="truncate">{endpoint.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {apiTestResult && (
                <Card>
                  <CardHeader className="pb-2 px-3 pt-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {apiTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      Test Result
                      {apiTestResult.duration && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          <Clock className="w-3 h-3 mr-1" />
                          {apiTestResult.duration}ms
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="bg-muted rounded-md p-2 text-xs font-mono max-h-24 sm:max-h-32 overflow-y-auto">
                      {apiTestResult.success ? (
                        <pre className="text-green-700 dark:text-green-400 whitespace-pre-wrap break-all">
                          {JSON.stringify(apiTestResult.data, null, 2)}
                        </pre>
                      ) : (
                        <pre className="text-red-700 dark:text-red-400 whitespace-pre-wrap break-all">
                          Error: {apiTestResult.error}
                        </pre>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* OAuth Test Tab */}
            <TabsContent value="oauth" className="space-y-2 sm:space-y-3 h-[calc(100%-2.5rem)] sm:h-60 overflow-y-auto">
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    OAuth Testing
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Test OAuth login with different providers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  <div className="grid grid-cols-1 gap-2">
                    {oauthProviders.map((provider) => (
                      <div key={provider.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium flex items-center gap-2">
                            <span>{provider.icon}</span>
                            <span className="truncate">{provider.name}</span>
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => testOAuthProvider(provider.id, 'mahasiswa')}
                            disabled={isTestingAuth}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs touch-manipulation"
                          >
                            {isTestingAuth ? (
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <User className="w-3 h-3 mr-1" />
                            )}
                            Student
                          </Button>
                          <Button
                            onClick={() => testOAuthProvider(provider.id, 'admin')}
                            disabled={isTestingAuth}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs touch-manipulation"
                          >
                            {isTestingAuth ? (
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Shield className="w-3 h-3 mr-1" />
                            )}
                            Admin
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {authTestResult && (
                <Card>
                  <CardHeader className="pb-2 px-3 pt-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {authTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      OAuth Test Result
                      {authTestResult.duration && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          <Clock className="w-3 h-3 mr-1" />
                          {authTestResult.duration}ms
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="bg-muted rounded-md p-2 text-xs">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline">{authTestResult.provider}</Badge>
                        <Badge variant="outline">{authTestResult.userType}</Badge>
                      </div>
                      <p className={authTestResult.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                        {authTestResult.message}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* System Tab */}
            <TabsContent value="system" className="space-y-2 sm:space-y-3 h-[calc(100%-2.5rem)] sm:h-60 overflow-y-auto">
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    System Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Environment:</span>
                      <Badge variant="outline" className="text-xs">
                        {process.env.NODE_ENV}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">API Base:</span>
                      <span className="font-mono text-xs truncate ml-2">localhost:8080</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Auth Status:</span>
                      <Badge variant={isAuthenticated ? "default" : "secondary"} className="text-xs">
                        {isAuthenticated ? "Authenticated" : "Not Authenticated"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Local Storage:</span>
                      <span className="font-mono text-xs">{localStorage.length} items</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isAuthenticated && user && (
                <Card>
                  <CardHeader className="pb-2 px-3 pt-3">
                    <CardTitle className="text-sm">Auth Token</CardTitle>
                    <CardDescription className="text-xs">
                      Current JWT token (click to copy)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <Button
                      onClick={() => copyToClipboard(user.id)}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs font-mono touch-manipulation"
                    >
                      {copiedToken ? (
                        <Check className="w-3 h-3 mr-2 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 mr-2" />
                      )}
                      <span className="truncate">{user.id.slice(0, 20)}...</span>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-2 sm:space-y-3 h-[calc(100%-2.5rem)] sm:h-60 overflow-y-auto">
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Dev Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  <Button
                    onClick={() => localStorage.clear()}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs touch-manipulation"
                  >
                    Clear Local Storage
                  </Button>
                  <Button
                    onClick={async () => {
                      console.log('🔄 Force Fresh Admin Login...')
                      await logout()
                      localStorage.removeItem('auth-storage')
                      setTimeout(async () => {
                        const success = await loginAsAdminDirect()
                        if (success) {
                          console.log('✅ Fresh admin login successful')
                          // Test API immediately
                          setTimeout(async () => {
                            try {
                              const token = useAuthStore.getState().token
                              if (token && !token.includes('mock-')) {
                                const result = await api.get('/admin/questions/stats')
                                console.log('✅ API validation successful:', result)
                              }
                            } catch (error) {
                              console.error('❌ API validation failed:', error)
                            }
                          }, 500)
                        }
                      }, 100)
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs touch-manipulation"
                  >
                    Force Fresh Admin Login
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs touch-manipulation"
                  >
                    Reload Page
                  </Button>
                  <Button
                    onClick={() => {
                      setApiTestResult(null)
                      setAuthTestResult(null)
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs touch-manipulation"
                  >
                    Clear All Test Results
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('http://localhost:8080/api/v1/auth/oauth/google/url?user_type=mahasiswa')
                        const data = await response.json()
                        console.log('OAuth URL test:', data)
                        alert(`OAuth URL: ${data.auth_url}`)
                      } catch (error) {
                        console.error('OAuth URL test failed:', error)
                        alert('OAuth URL test failed')
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs touch-manipulation"
                  >
                    Test OAuth URL Generation
                  </Button>
                  <Button
                    onClick={() => {
                      const { token, user, isAuthenticated } = useAuthStore.getState()
                      if (token) {
                        console.log('🔍 Auth Debug Info:')
                        console.log('- Is Authenticated:', isAuthenticated)
                        console.log('- User:', user)
                        console.log('- Token (first 30 chars):', token.slice(0, 30) + '...')
                        console.log('- Is Mock Token:', token.includes('mock-'))
                        
                        if (!token.includes('mock-')) {
                          try {
                            const payload = JSON.parse(atob(token.split('.')[1]))
                            console.log('- Token payload:', payload)
                          } catch (e) {
                            console.log('- Token payload: Unable to decode')
                          }
                        }
                      } else {
                        console.log('🔍 Auth Debug: No token available')
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs touch-manipulation"
                  >
                    Debug JWT Token
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
} 