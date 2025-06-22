import React, { useState, useEffect } from 'react'
import { useAuthStore, loginAsAdminDirect, loginAsStudentDirect, loginAsUserDirect, getAdminUser, getStudentUser, handleOAuthLogin } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, User, Copy, Check, RefreshCw, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'

interface MockUser {
  id: string
  full_name: string
  email: string
  role: string
  password: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export const DevToolsAuth: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [authTestResult, setAuthTestResult] = useState<any>(null)
  const [isTestingAuth, setIsTestingAuth] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)
  const [showTokenDetails, setShowTokenDetails] = useState(false)
  const [devUsers, setDevUsers] = useState<MockUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  // Helper function to create MockUser from backend user data
  const createMockUser = (userData: any, overrides: Partial<MockUser> = {}): MockUser => {
    const role = userData.role || userData.user_type || 'user'
    return {
      id: userData.id,
      full_name: userData.full_name,
      email: userData.email,
      role: role,
      password: userData.password || 'dev123',
      description: userData.description || `${role} account`,
      icon: role === 'admin' ? Shield : User,
      color: role === 'admin' ? 'text-blue-600' : 
             role === 'student' ? 'text-green-600' : 'text-purple-600',
      ...overrides
    }
  }

  // Fetch dev users from backend on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const response = await fetch('http://localhost:8080/api/v1/dev/users')
        if (response.ok) {
          const data = await response.json()
          const users = data.users.map((u: any) => createMockUser(u))
          setDevUsers(users)
        } else {
          // Fallback to local data if backend not available
          const adminUser = getAdminUser()
          const studentUser = getStudentUser()
          setDevUsers([
            createMockUser(adminUser, {
              role: 'admin',
              password: 'admin123',
              description: 'Admin Account - Full system access'
            }),
            createMockUser(studentUser, {
              role: 'student',
              password: 'student123',
              description: 'Student Account - Standard user access'
            }),
            createMockUser({
              id: '507f1f77bcf86cd799439013',
              full_name: 'Johnny Tester',
              email: 'johnny.tester@user.com',
              role: 'user'
            }, {
              password: 'user123',
              description: 'Regular User - Basic access'
            })
          ])
        }
      } catch (error) {
        console.error('Failed to fetch dev users:', error)
        // Fallback to local data
        const adminUser = getAdminUser()
        const studentUser = getStudentUser()
        setDevUsers([
          createMockUser(adminUser, {
            role: 'admin',
            password: 'admin123',
            description: 'Admin Account - Full system access'
          }),
          createMockUser(studentUser, {
            role: 'student',
            password: 'student123',
            description: 'Student Account - Standard user access'
          }),
          createMockUser({
            id: '507f1f77bcf86cd799439013',
            full_name: 'Johnny Tester',
            email: 'johnny.tester@user.com',
            role: 'user'
          }, {
            password: 'user123',
            description: 'Regular User - Basic access'
          })
        ])
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [])

  const handleQuickLogin = async (userType: 'admin' | 'student' | 'user') => {
    console.log(`🔄 Starting ${userType} login...`)
    try {
      let success = false
      
      if (userType === 'admin') {
        success = await loginAsAdminDirect()
      } else if (userType === 'student') {
        success = await loginAsStudentDirect()
      } else {
        success = await loginAsUserDirect()
      }

      if (success) {
        console.log(`✅ ${userType} login successful`)
      } else {
        console.log(`❌ ${userType} login failed`)
      }
    } catch (error) {
      console.error(`❌ ${userType} login error:`, error)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const testOAuthProvider = async (provider: string, userType: 'mahasiswa' | 'admin' = 'mahasiswa') => {
    setIsTestingAuth(true)
    setAuthTestResult(null)
    
    try {
      const result = await handleOAuthLogin(provider, userType)
      setAuthTestResult({
        success: true,
        provider,
        userType,
        result
      })
    } catch (error: any) {
      setAuthTestResult({
        success: false,
        provider,
        userType,
        error: error.message
      })
    } finally {
      setIsTestingAuth(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current User Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated && user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Logged in as:</span>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <div><strong>Name:</strong> {user.full_name}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>ID:</strong> {user.id}</div>
              </div>
              
              {/* Token Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Access Token:</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowTokenDetails(!showTokenDetails)}
                  >
                    {showTokenDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                {showTokenDetails && (
                  <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                    {localStorage.getItem('access_token') || 'No token found'}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-2"
                      onClick={() => copyToClipboard(localStorage.getItem('access_token') || '')}
                    >
                      {copiedToken ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                )}
              </div>
              <Button onClick={logout} variant="destructive" size="sm">
                Logout
              </Button>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Not authenticated</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Login */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Login</CardTitle>
          <CardDescription>
            {isLoadingUsers ? 'Loading users from database...' : 'Login with test accounts from database'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center p-4">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Fetching users...</span>
            </div>
          ) : devUsers.length > 0 ? (
            <div className="grid gap-3">
              {devUsers.map((mockUser) => {
                const IconComponent = mockUser.icon
                return (
                  <div key={mockUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`h-5 w-5 ${mockUser.color}`} />
                      <div>
                        <div className="font-medium">{mockUser.full_name}</div>
                        <div className="text-sm text-muted-foreground">{mockUser.description}</div>
                        <div className="text-xs text-muted-foreground">{mockUser.email}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleQuickLogin(mockUser.role as 'admin' | 'student' | 'user')}
                      disabled={isAuthenticated && user?.email === mockUser.email}
                    >
                      {isAuthenticated && user?.email === mockUser.email ? 'Current' : 'Login'}
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No test users found. Please ensure users are seeded in the database.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* OAuth Testing */}
      <Card>
        <CardHeader>
          <CardTitle>OAuth Testing</CardTitle>
          <CardDescription>Test OAuth provider integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => testOAuthProvider('google', 'mahasiswa')}
              disabled={isTestingAuth}
              variant="outline"
              size="sm"
            >
              {isTestingAuth ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Google (Student)
            </Button>
            <Button
              onClick={() => testOAuthProvider('google', 'admin')}
              disabled={isTestingAuth}
              variant="outline"
              size="sm"
            >
              {isTestingAuth ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Google (Admin)
            </Button>
          </div>

          {authTestResult && (
            <Alert variant={authTestResult.success ? 'default' : 'destructive'}>
              {authTestResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>
                {authTestResult.success 
                  ? `OAuth ${authTestResult.provider} (${authTestResult.userType}) test successful`
                  : `OAuth test failed: ${authTestResult.error}`
                }
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 