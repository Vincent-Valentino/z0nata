import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  GraduationCap, 
  FileText, 
  BookOpen, 
  Plus, 
  UserPlus, 
  Share2,
  Activity,
  AlertCircle,
  Clock,
  TrendingUp,
  Loader2,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { adminService, type AdminStats } from '@/services/adminService'

interface StatCard {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: {
    value: string
    isPositive: boolean
  }
}

interface AdminOverviewProps {
  onSectionChange?: (section: 'users' | 'questions' | 'documentation' | 'settings') => void
}

export const AdminOverview = ({ onSectionChange }: AdminOverviewProps) => {
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Load admin statistics
  const loadAdminStats = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      const stats = await adminService.getAdminStats()
      setAdminStats(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin statistics')
      console.error('Error loading admin stats:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAdminStats()
  }, [])

  // Generate statistics cards from real data
  const getStatsCards = (): StatCard[] => {
    if (!adminStats) return []

    return [
      {
        title: 'Total Users',
        value: adminStats.users.totalUsers.toLocaleString(),
        description: 'Registered users',
        icon: <Users className="h-4 w-4" />,
        trend: { value: `+${adminStats.users.recentRegistrations}`, isPositive: true }
      },
      {
        title: 'Mahasiswa Mikroskil',
        value: adminStats.users.mahasiswaUsers.toLocaleString(),
        description: 'Verified students',
        icon: <GraduationCap className="h-4 w-4" />,
        trend: { value: '+8%', isPositive: true }
      },
      {
        title: 'External Users',
        value: adminStats.users.externalUsers.toLocaleString(),
        description: 'Non-student users',
        icon: <Users className="h-4 w-4" />,
        trend: { value: '+4%', isPositive: true }
      },
      {
        title: 'Pending Approval',
        value: adminStats.users.pendingUsers,
        description: 'Awaiting review',
        icon: <AlertCircle className="h-4 w-4" />,
        trend: { value: '+15%', isPositive: false }
      }
    ]
  }

  const getQuestionStats = () => {
    if (!adminStats) return []
    
    return [
      { type: 'Single Choice', count: adminStats.questions.singleChoice, color: 'bg-blue-500' },
      { type: 'Multiple Choice', count: adminStats.questions.multipleChoice, color: 'bg-green-500' },
      { type: 'Essays', count: adminStats.questions.essay, color: 'bg-purple-500' }
    ]
  }

  const getDocumentationStats = () => {
    if (!adminStats) return []
    
    return [
      { type: 'Modules', count: adminStats.content.totalModules, color: 'bg-orange-500' },
      { type: 'Submodules', count: adminStats.content.totalSubmodules, color: 'bg-cyan-500' }
    ]
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration': return <UserPlus className="h-4 w-4" />
      case 'question_added': return <FileText className="h-4 w-4" />
      case 'doc_updated': return <BookOpen className="h-4 w-4" />
      case 'admin_action': return <Share2 className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_registration': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'question_added': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'doc_updated': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'admin_action': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getUserTypeBadge = (userType?: string) => {
    if (userType === 'mahasiswa') {
      return <Badge variant="default" className="bg-green-100 text-green-700 text-xs">Student</Badge>
    }
    if (userType === 'external') {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">External</Badge>
    }
    if (userType === 'admin') {
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs">Admin</Badge>
    }
    return null
  }

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`
    return `${Math.floor(diffMins / 1440)} days ago`
  }

  // Handle navigation to specific sections
  const handleQuickAction = (action: string) => {
    if (onSectionChange) {
      switch (action) {
        case 'questions':
          onSectionChange('questions')
          break
        case 'documentation':
          onSectionChange('documentation')
          break
        case 'users':
          onSectionChange('users')
          break
        default:
          console.log(`Navigate to ${action}`)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading admin overview...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Failed to load admin data</p>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
            <Button 
              onClick={() => loadAdminStats()} 
              variant="outline" 
              size="sm"
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!adminStats) return null

  const statsCards = getStatsCards()
  const questionStats = getQuestionStats()
  const docStats = getDocumentationStats()

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Overview</h2>
          <p className="text-muted-foreground">System statistics and recent activity</p>
        </div>
        <Button 
          onClick={() => loadAdminStats(true)} 
          variant="outline" 
          size="sm"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                {stat.trend && (
                  <div className={`flex items-center text-xs ${
                    stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.trend.value}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Frequently used admin functions
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Button 
            className="w-full justify-start gap-2" 
            variant="outline"
            onClick={() => handleQuickAction('questions')}
          >
            <FileText className="h-4 w-4" />
            Add Question
          </Button>
          <Button 
            className="w-full justify-start gap-2" 
            variant="outline"
            onClick={() => handleQuickAction('documentation')}
          >
            <BookOpen className="h-4 w-4" />
            Add Documentation
          </Button>
          <Button 
            className="w-full justify-start gap-2" 
            variant="outline"
            onClick={() => handleQuickAction('users')}
          >
            <Users className="h-4 w-4" />
            Manage Users
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Question Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Questions
            </CardTitle>
            <CardDescription>Question types breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questionStats.map((stat) => (
              <div key={stat.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{stat.type}</span>
                  <span className="text-sm text-muted-foreground">{stat.count}</span>
                </div>
                <Progress 
                  value={(stat.count / Math.max(...questionStats.map(s => s.count))) * 100} 
                  className="h-2"
                />
              </div>
            ))}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between font-medium">
                <span>Total Questions</span>
                <span>{adminStats.content.totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                <span>Active Questions</span>
                <span>{adminStats.questions.activeQuestions}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Documentation
            </CardTitle>
            <CardDescription>Content organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {docStats.map((stat) => (
              <div key={stat.type} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                  <span className="font-medium">{stat.type}</span>
                </div>
                <span className="text-2xl font-bold">{stat.count}</span>
              </div>
            ))}
            <div className="pt-2 border-t text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Published</span>
                <span className="font-medium">{adminStats.content.publishedModules}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Draft</span>
                <span className="font-medium">{adminStats.content.draftModules}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminStats.activity.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{activity.user}</p>
                    {getUserTypeBadge(activity.userType)}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 