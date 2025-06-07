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
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react'

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

interface ActivityLog {
  id: string
  type: 'user_registration' | 'question_added' | 'doc_updated' | 'admin_action'
  message: string
  timestamp: string
  user: string
  userType?: 'mahasiswa_mikroskiul' | 'not_mahasiswa'
}

export const AdminOverview = () => {
  // Mock data - replace with real API calls
  const stats: StatCard[] = [
    {
      title: 'Total Users',
      value: 1247,
      description: 'Registered users',
      icon: <Users className="h-4 w-4" />,
      trend: { value: '+12%', isPositive: true }
    },
    {
      title: 'Mahasiswa Mikroskiul',
      value: 892,
      description: 'Verified students',
      icon: <GraduationCap className="h-4 w-4" />,
      trend: { value: '+8%', isPositive: true }
    },
    {
      title: 'Non-Mahasiswa',
      value: 355,
      description: 'External users',
      icon: <Users className="h-4 w-4" />,
      trend: { value: '+4%', isPositive: true }
    },
    {
      title: 'Pending Access',
      value: 23,
      description: 'Awaiting approval',
      icon: <AlertCircle className="h-4 w-4" />,
      trend: { value: '+15%', isPositive: false }
    }
  ]

  const questionStats = [
    { type: 'Single Choice', count: 456, color: 'bg-blue-500' },
    { type: 'Multiple Choice', count: 234, color: 'bg-green-500' },
    { type: 'Essays', count: 127, color: 'bg-purple-500' }
  ]

  const docStats = [
    { type: 'Modules', count: 24, color: 'bg-orange-500' },
    { type: 'Submodules', count: 156, color: 'bg-cyan-500' }
  ]

  const recentActivity: ActivityLog[] = [
    {
      id: '1',
      type: 'user_registration',
      message: 'New user registered',
      timestamp: '2 minutes ago',
      user: 'john.doe@student.ac.id',
      userType: 'mahasiswa_mikroskiul'
    },
    {
      id: '2',
      type: 'question_added',
      message: 'New multiple choice question added',
      timestamp: '15 minutes ago',
      user: 'admin@zonata.com'
    },
    {
      id: '3',
      type: 'user_registration',
      message: 'Access request submitted',
      timestamp: '32 minutes ago',
      user: 'external.user@gmail.com',
      userType: 'not_mahasiswa'
    },
    {
      id: '4',
      type: 'doc_updated',
      message: 'Documentation module updated',
      timestamp: '1 hour ago',
      user: 'admin@zonata.com'
    }
  ]

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
      case 'user_registration': return 'bg-green-100 text-green-700'
      case 'question_added': return 'bg-blue-100 text-blue-700'
      case 'doc_updated': return 'bg-purple-100 text-purple-700'
      case 'admin_action': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getUserTypeBadge = (userType?: string) => {
    if (userType === 'mahasiswa_mikroskiul') {
      return <Badge variant="default" className="bg-green-100 text-green-700 text-xs">Student</Badge>
    }
    if (userType === 'not_mahasiswa') {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">External</Badge>
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
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
          <Button className="w-full justify-start gap-2" variant="outline">
            <FileText className="h-4 w-4" />
            Add Question
          </Button>
          <Button className="w-full justify-start gap-2" variant="outline">
            <BookOpen className="h-4 w-4" />
            Add Documentation
          </Button>
          <Button className="w-full justify-start gap-2" variant="outline">
            <Share2 className="h-4 w-4" />
            Admin Information
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
                <span>{questionStats.reduce((sum, stat) => sum + stat.count, 0)}</span>
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
            {recentActivity.map((activity) => (
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
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full">
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 