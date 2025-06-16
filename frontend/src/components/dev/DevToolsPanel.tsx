import React, { useState } from 'react'
import { useAuthStore, loginAsAdminDirect, loginAsStudentDirect, getAdminUser, getStudentUser, handleOAuthLogin } from '@/store/authStore'
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
    }
  ]

  const handleQuickLogin = async (userType: 'admin' | 'student') => {
    console.log(`🔄 Starting ${userType} login...`)
    try {
      if (userType === 'admin') {
        const success = await loginAsAdminDirect()
        if (success) {
          console.log('✅ Admin login successful')
          // Test API call immediately after login
          setTimeout(async () => {
            try {
              const token = useAuthStore.getState().token
              console.log('🧪 Testing API with token:', token ? `${token.slice(0, 20)}...` : 'null')
              const result = await api.get('/admin/questions/stats')
              console.log('✅ API test successful:', result)
            } catch (error) {
              console.error('❌ API test failed:', error)
            }
          }, 500)
        } else {
          console.warn('⚠️ Admin login failed, using fallback')
        }
      } else {
        const success = await loginAsStudentDirect()
        if (success) {
          console.log('✅ Student login successful')
        } else {
          console.warn('⚠️ Student login failed, using fallback')
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
      "fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out",
      "w-120 bg-background border border-border rounded-lg shadow-2xl",
      isExpanded ? "h-100" : "h-12"
    )}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Dev Tools</span>
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
        <div className="p-3 pt-0 h-80 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-5 mb-3">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-1 text-xs"
                >
                  <tab.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Auth Tab */}
            <TabsContent value="auth" className="space-y-3 h-60 overflow-y-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Current User
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isAuthenticated && user ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Name:</span>
                        <span className="text-xs font-medium">{user.full_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Email:</span>
                        <span className="text-xs font-medium">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Role:</span>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      <Button 
                        onClick={logout} 
                        variant="destructive" 
                        size="sm" 
                        className="w-full mt-2"
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
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Login</CardTitle>
                  <CardDescription className="text-xs">
                    Switch between test accounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mockUsers.map((mockUser, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {mockUser.role === 'admin' ? (
                            <Shield className="w-4 h-4 text-blue-500" />
                          ) : (
                            <User className="w-4 h-4 text-green-500" />
                          )}
                          <div>
                            <p className="text-xs font-medium">{mockUser.full_name}</p>
                            <p className="text-xs text-muted-foreground">{mockUser.description}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleQuickLogin(mockUser.role as 'admin' | 'student')}
                          size="sm"
                          variant="outline"
                          className="text-xs"
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
            <TabsContent value="api" className="space-y-3 h-60 overflow-y-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
                    API Testing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Category Filter */}
                  <div className="flex gap-1 mb-2 overflow-x-auto">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        className="text-xs whitespace-nowrap"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {filteredEndpoints.map((endpoint, index) => (
                      <Button
                        key={index}
                        onClick={() => testAPIEndpoint(endpoint.endpoint, endpoint.method)}
                        disabled={isTestingAPI}
                        variant="outline"
                        size="sm"
                        className="justify-start text-xs"
                      >
                        {isTestingAPI ? (
                          <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                          <Activity className="w-3 h-3 mr-2" />
                        )}
                        <Badge variant="secondary" className="text-xs mr-2">
                          {endpoint.method}
                        </Badge>
                        {endpoint.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {apiTestResult && (
                <Card>
                  <CardHeader className="pb-2">
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
                  <CardContent>
                    <div className="bg-muted rounded-md p-2 text-xs font-mono max-h-32 overflow-y-auto">
                      {apiTestResult.success ? (
                        <pre className="text-green-700 dark:text-green-400">
                          {JSON.stringify(apiTestResult.data, null, 2)}
                        </pre>
                      ) : (
                        <pre className="text-red-700 dark:text-red-400">
                          Error: {apiTestResult.error}
                        </pre>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* OAuth Test Tab */}
            <TabsContent value="oauth" className="space-y-3 h-60 overflow-y-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    OAuth Testing
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Test OAuth login with different providers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    {oauthProviders.map((provider) => (
                      <div key={provider.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium flex items-center gap-2">
                            <span>{provider.icon}</span>
                            {provider.name}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => testOAuthProvider(provider.id, 'mahasiswa')}
                            disabled={isTestingAuth}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
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
                            className="flex-1 text-xs"
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
                  <CardHeader className="pb-2">
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
                  <CardContent>
                    <div className="bg-muted rounded-md p-2 text-xs">
                      <div className="flex items-center gap-2 mb-1">
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
            <TabsContent value="system" className="space-y-3 h-60 overflow-y-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    System Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Environment:</span>
                      <Badge variant="outline" className="ml-2">
                        {process.env.NODE_ENV}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">API Base:</span>
                      <span className="ml-2 font-mono">localhost:8080</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Auth Status:</span>
                      <Badge variant={isAuthenticated ? "default" : "secondary"} className="ml-2">
                        {isAuthenticated ? "Authenticated" : "Not Authenticated"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Local Storage:</span>
                      <span className="ml-2 font-mono">{localStorage.length} items</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isAuthenticated && user && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Auth Token</CardTitle>
                    <CardDescription className="text-xs">
                      Current JWT token (click to copy)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => copyToClipboard(user.id)}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs font-mono"
                    >
                      {copiedToken ? (
                        <Check className="w-3 h-3 mr-2 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 mr-2" />
                      )}
                      {user.id.slice(0, 20)}...
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-3 h-60 overflow-y-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Dev Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => localStorage.clear()}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    Clear Local Storage
                  </Button>
                  <Button
                    onClick={() => {
                      logout()
                      setTimeout(async () => {
                        console.log('🔄 Manual dev login test...')
                        await loginAsAdminDirect()
                      }, 100)
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    Force Fresh Admin Login
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
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
                    className="w-full text-xs"
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
                    className="w-full text-xs"
                  >
                    Test OAuth URL Generation
                  </Button>
                  <Button
                    onClick={() => {
                      const token = useAuthStore.getState().token
                      if (token) {
                        console.log('Current JWT Token:', token)
                        console.log('Token payload:', JSON.parse(atob(token.split('.')[1])))
                      } else {
                        console.log('No token available')
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
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