import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  Clock, 
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { activityLogService, type ActivityLog } from '@/services/activityLogService'
import { toast } from 'sonner'

interface RecentActivityProps {
  refreshTrigger?: number
}

export const RecentActivity = ({ refreshTrigger }: RecentActivityProps) => {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecentActivities = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await activityLogService.getRecentActivities(10)
      setActivities(response.activities)
    } catch (error) {
      console.error('Error fetching recent activities:', error)
      setError('Failed to load recent activities')
      toast.error('Failed to load recent activities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentActivities()
  }, [refreshTrigger])

  const getActivityIcon = (type: string) => {
    return <span className="text-lg">{activityLogService.getActivityIcon(type)}</span>
  }

  const getActivityColor = (type: string, success: boolean) => {
    if (!success) {
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    }

    if (type.includes('login')) {
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    }
    if (type.includes('question')) {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    }
    if (type.includes('module') || type.includes('submodule')) {
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    }
    if (type.includes('user')) {
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }

  const getUserTypeBadge = (userType: string) => {
    const colorClass = activityLogService.getUserTypeColor(userType)
    const displayName = userType === 'mahasiswa' ? 'Student' : 
                       userType === 'external' ? 'External' :
                       userType === 'admin' ? 'Admin' : 
                       userType.charAt(0).toUpperCase() + userType.slice(1)
    
    return (
      <Badge variant="secondary" className={`text-xs ${colorClass}`}>
        {displayName}
      </Badge>
    )
  }

  const formatActivityMessage = (activity: ActivityLog) => {
    if (activity.error_msg) {
      return `${activity.action} - ${activity.error_msg}`
    }
    
    if (activity.entity_name) {
      return `${activity.action}: ${activity.entity_name}`
    }
    
    return activity.action
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-center">
            <div className="space-y-2">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchRecentActivities}>
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest system events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${getActivityColor(activity.type, activity.success)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 space-y-1">
                <p className={`text-sm font-medium ${!activity.success ? 'text-red-600' : ''}`}>
                  {formatActivityMessage(activity)}
                  {!activity.success && (
                    <AlertCircle className="h-4 w-4 inline ml-1 text-red-500" />
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{activity.performed_by_name}</p>
                  {getUserTypeBadge(activity.performed_by_type)}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {activityLogService.formatRelativeTime(activity.timestamp)}
                  </p>
                  {activity.entity_type && (
                    <Badge variant="outline" className="text-xs">
                      {activity.entity_type}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <Button variant="ghost" className="w-full" onClick={() => window.location.href = '/admin/activity-logs'}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View All Activity
        </Button>
      </CardContent>
    </Card>
  )
} 