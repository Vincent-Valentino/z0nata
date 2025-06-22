import React, { useState, useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TestTube, RefreshCw, AlertCircle, CheckCircle2, Lock, Globe, Shield } from 'lucide-react'

interface APIEndpoint {
  label: string
  endpoint: string
  method: string
  category: string
  description: string
  requiresAuth: boolean
  adminOnly: boolean
}

export const DevToolsAPI: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore()
  const [apiTestResult, setApiTestResult] = useState<any>(null)
  const [isTestingAPI, setIsTestingAPI] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [apiFilter, setApiFilter] = useState('')

  const apiEndpoints: APIEndpoint[] = [
    // Auth endpoints
    { label: 'Login', endpoint: '/auth/login', method: 'POST', category: 'Auth', description: 'User login', requiresAuth: false, adminOnly: false },
    { label: 'Register', endpoint: '/auth/register', method: 'POST', category: 'Auth', description: 'User registration', requiresAuth: false, adminOnly: false },
    { label: 'Refresh Token', endpoint: '/auth/refresh', method: 'POST', category: 'Auth', description: 'Refresh JWT token', requiresAuth: true, adminOnly: false },
    { label: 'Logout', endpoint: '/auth/logout', method: 'POST', category: 'Auth', description: 'User logout', requiresAuth: true, adminOnly: false },
    { label: 'Google OAuth URL', endpoint: '/auth/oauth/google/url?user_type=mahasiswa', method: 'GET', category: 'Auth', description: 'Get Google OAuth URL', requiresAuth: false, adminOnly: false },
    
    // User endpoints
    { label: 'User Profile', endpoint: '/user/profile', method: 'GET', category: 'User', description: 'Get current user profile', requiresAuth: true, adminOnly: false },
    { label: 'Change Password', endpoint: '/user/change-password', method: 'POST', category: 'User', description: 'Change user password', requiresAuth: true, adminOnly: false },
    
    // Quiz endpoints
    { label: 'Start Quiz', endpoint: '/quiz/start', method: 'POST', category: 'Quiz', description: 'Start new quiz session', requiresAuth: true, adminOnly: false },
    { label: 'Quiz Results', endpoint: '/quiz/results', method: 'GET', category: 'Quiz', description: 'Get user quiz results', requiresAuth: true, adminOnly: false },
    { label: 'Resume TimeQuiz', endpoint: '/quiz/resume/time_quiz', method: 'GET', category: 'Quiz', description: 'Check for resumable TimeQuiz', requiresAuth: true, adminOnly: false },
    { label: 'Resume MockTest', endpoint: '/quiz/resume/mock_test', method: 'GET', category: 'Quiz', description: 'Check for resumable MockTest', requiresAuth: true, adminOnly: false },
    
    // Admin endpoints
    { label: 'All Users', endpoint: '/admin/users', method: 'GET', category: 'Admin', description: 'Get all users', requiresAuth: true, adminOnly: true },
    { label: 'User Stats', endpoint: '/admin/users/stats', method: 'GET', category: 'Admin', description: 'Get user statistics', requiresAuth: true, adminOnly: true },
    { label: 'Questions List', endpoint: '/admin/questions', method: 'GET', category: 'Admin', description: 'Get all questions', requiresAuth: true, adminOnly: true },
    { label: 'Question Stats', endpoint: '/admin/questions/stats', method: 'GET', category: 'Admin', description: 'Get question statistics', requiresAuth: true, adminOnly: true },
    { label: 'Module Stats', endpoint: '/admin/modules/stats', method: 'GET', category: 'Admin', description: 'Get module statistics', requiresAuth: true, adminOnly: true },
    { label: 'Activity Logs', endpoint: '/admin/activity-logs', method: 'GET', category: 'Admin', description: 'Get activity logs', requiresAuth: true, adminOnly: true },
    
    // System endpoints
    { label: 'Health Check', endpoint: '/health', method: 'GET', category: 'System', description: 'Backend health status', requiresAuth: false, adminOnly: false },
    { label: 'API Docs', endpoint: '/docs', method: 'GET', category: 'System', description: 'API documentation', requiresAuth: false, adminOnly: false },
  ]

  const filteredEndpoints = useMemo(() => {
    return apiEndpoints.filter(endpoint => {
      const matchesCategory = selectedCategory === 'All' || endpoint.category === selectedCategory
      const matchesFilter = apiFilter === '' || 
        endpoint.label.toLowerCase().includes(apiFilter.toLowerCase()) ||
        endpoint.endpoint.toLowerCase().includes(apiFilter.toLowerCase()) ||
        endpoint.description.toLowerCase().includes(apiFilter.toLowerCase())
      return matchesCategory && matchesFilter
    })
  }, [selectedCategory, apiFilter])

  const categories = ['All', ...Array.from(new Set(apiEndpoints.map(ep => ep.category)))]

  const testAPIEndpoint = async (endpoint: APIEndpoint) => {
    setIsTestingAPI(true)
    setApiTestResult(null)
    
    try {
      let response
      const url = `http://localhost:8080${endpoint.endpoint}`
      
      if (endpoint.method === 'GET') {
        response = await api.get(endpoint.endpoint)
      } else if (endpoint.method === 'POST') {
        // Use minimal test data for POST requests
        const testData = endpoint.endpoint.includes('login') 
          ? { email: 'test@example.com', password: 'test123' }
          : endpoint.endpoint.includes('register')
          ? { full_name: 'Test User', email: 'test@example.com', password: 'test123' }
          : {}
        response = await api.post(endpoint.endpoint, testData)
      }
      
      setApiTestResult({
        success: true,
        endpoint: endpoint.endpoint,
        method: endpoint.method,
        status: (response as any)?.status || 200,
        data: typeof response === 'object' ? JSON.stringify(response, null, 2) : String(response),
        timestamp: new Date().toISOString()
      })
    } catch (error: any) {
      setApiTestResult({
        success: false,
        endpoint: endpoint.endpoint,
        method: endpoint.method,
        error: error.message,
        status: error.status || 'Unknown',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsTestingAPI(false)
    }
  }

  const canAccessEndpoint = (endpoint: APIEndpoint) => {
    if (endpoint.adminOnly && user?.role !== 'admin') return false
    if (endpoint.requiresAuth && !isAuthenticated) return false
    return true
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            API Endpoint Testing
          </CardTitle>
          <CardDescription>Test backend API endpoints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Filter endpoints..."
                value={apiFilter}
                onChange={(e) => setApiFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Endpoints ({filteredEndpoints.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredEndpoints.map((endpoint, index) => {
              const canAccess = canAccessEndpoint(endpoint)
              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={
                        endpoint.method === 'GET' ? 'secondary' : 
                        endpoint.method === 'POST' ? 'default' : 'outline'
                      }>
                        {endpoint.method}
                      </Badge>
                      <span className="font-medium">{endpoint.label}</span>
                      {endpoint.requiresAuth && <Lock className="h-3 w-3 text-yellow-500" />}
                      {endpoint.adminOnly && <Shield className="h-3 w-3 text-red-500" />}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>{endpoint.endpoint}</div>
                      <div>{endpoint.description}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => testAPIEndpoint(endpoint)}
                    disabled={isTestingAPI || !canAccess}
                    variant={canAccess ? "outline" : "secondary"}
                  >
                    {isTestingAPI ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {apiTestResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {apiTestResult.success ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
              API Test Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={apiTestResult.method === 'GET' ? 'secondary' : 'default'}>
                  {apiTestResult.method}
                </Badge>
                <code className="text-xs bg-muted px-2 py-1 rounded">{apiTestResult.endpoint}</code>
                <Badge variant={apiTestResult.success ? 'secondary' : 'destructive'}>
                  {apiTestResult.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {apiTestResult.timestamp}
              </div>
              {apiTestResult.success ? (
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
                  {apiTestResult.data}
                </pre>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error: {apiTestResult.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 