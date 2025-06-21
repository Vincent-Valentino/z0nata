import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  Clock, 
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Database
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { activityLogService, type ActivityLog } from '@/services/activityLogService'
import { adminService, type ActivityLogItem } from '@/services/adminService'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

interface RecentActivityProps {
  refreshTrigger?: number
}

export const RecentActivity = ({ refreshTrigger }: RecentActivityProps) => {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [usingFallback, setUsingFallback] = useState(false)
  
  // Get authentication state
  const { isAuthenticated, token, user } = useAuthStore()

  // Convert mock ActivityLogItem to ActivityLog format
  const convertMockActivity = (mockActivity: ActivityLogItem): ActivityLog => {
    return {
      id: mockActivity.id,
      type: mockActivity.type,
      action: mockActivity.message,
      entity_type: '',
      entity_id: '',
      entity_name: '',
      performed_by: mockActivity.user,
      performed_by_name: mockActivity.user,
      performed_by_type: mockActivity.userType || 'admin',
      timestamp: mockActivity.timestamp,
      success: true, // Mock activities are assumed successful
    }
  }

  const fetchRecentActivities = async (showToastOnError = true) => {
    // Don't try to fetch if not authenticated
    if (!isAuthenticated || !token) {
      console.log('⚠️ Not authenticated or no token available, skipping activity fetch')
      setError('Authentication required to view activities')
      setLoading(false)
      return
    }

    // Don't try to fetch if user is not admin
    if (!user?.is_admin && user?.role !== 'admin') {
      console.log('⚠️ User is not admin, skipping activity fetch')
      setError('Admin access required to view activities')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setUsingFallback(false)
      
      console.log('🔄 Starting to fetch recent activities...')
      console.log('🔑 Current auth state:', { 
        isAuthenticated, 
        hasToken: !!token, 
        isAdmin: user?.is_admin,
        userRole: user?.role 
      })
      
      // Try the real activity log service first
      try {
        console.log('📡 Calling activityLogService.getRecentActivities(10)...')
      const response = await activityLogService.getRecentActivities(10)
        console.log('📊 Raw activity log service response:', JSON.stringify(response, null, 2))
      
        // Check if we have valid response with activities
        if (response && response.activities && Array.isArray(response.activities)) {
          if (response.activities.length > 0) {
            console.log('✅ SUCCESS: Using real activity data:', response.activities.length, 'activities')
           setActivities(response.activities)
            setRetryCount(0)
            setUsingFallback(false)
            return
         } else {
            console.log('⚠️ Real activity service returned empty array')
           setActivities([])
            setRetryCount(0)
            setUsingFallback(false)
            return
         }
      } else {
          console.log('⚠️ Invalid response format from activity service:', response)
          throw new Error('Invalid response format from activity service')
        }
      } catch (activityError: any) {
        console.log('❌ Activity log service failed:', activityError?.message || activityError)
        console.log('❌ Full error object:', activityError)
        
        // Only try fallback if it's a network/server error, not auth error
        if (activityError?.message?.includes('401') || activityError?.message?.includes('403')) {
          throw activityError // Re-throw auth errors
        }
        
        console.log('🔄 Trying fallback mock data...')
        
        // Try to get mock data from admin stats as fallback
        try {
          const adminStats = await adminService.getAdminStats()
          console.log('📊 Admin stats fallback response:', adminStats)
          
          if (adminStats?.activity?.recentActivity && Array.isArray(adminStats.activity.recentActivity)) {
            const convertedActivities = adminStats.activity.recentActivity.map(convertMockActivity)
            console.log('⚠️ FALLBACK: Using mock data:', convertedActivities.length, 'activities')
            setActivities(convertedActivities)
            setUsingFallback(true)
            setRetryCount(0)
            return
          }
        } catch (fallbackError: any) {
          console.error('❌ Both activity service and fallback failed:', fallbackError)
        }
        
        // If we get here, both real and fallback data failed
        throw activityError // Throw the original activity service error
      }
      
    } catch (error: any) {
      console.error('❌ FINAL ERROR in fetchRecentActivities:', error)
      
      let errorMessage = 'Failed to load recent activities'
      
      // Provide more specific error messages
      if (error?.message?.includes('404')) {
        errorMessage = 'Activity log service not found. Please contact support.'
      } else if (error?.message?.includes('401') || error?.message?.includes('403')) {
        errorMessage = 'Authentication required. Please log in again.'
      } else if (error?.message?.includes('500')) {
        errorMessage = 'Server error occurred. Activity logs may be temporarily unavailable.'
      } else if (error?.message?.includes('NetworkError') || error?.message?.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your connection.'
      } else if (error?.message) {
        errorMessage = `Error: ${error.message}`
      }
      
      setError(errorMessage)
      setActivities([]) // Clear activities on error
      
      if (showToastOnError && retryCount < 2) {
        toast.error(errorMessage)
      }
      
      setRetryCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Add a small delay to ensure auth state is hydrated
    const timer = setTimeout(() => {
    fetchRecentActivities(false) // Don't show toast on initial load
    }, 100)

    return () => clearTimeout(timer)
  }, [refreshTrigger, isAuthenticated, token]) // Re-run when auth state changes

  const handleRetry = () => {
    setRetryCount(0)
    fetchRecentActivities(true)
  }

  const getActivityIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      // Question activities - Question mark icon with different colors
      'question_created': '❓',
      'question_updated': '✏️',
      'question_deleted': '🗑️',
      'question_activated': '✅',
      'question_deactivated': '❌',
      
      // Module/Documentation activities - Document/Folder icons
      'module_created': '📁',
      'module_updated': '📝',
      'module_deleted': '🗂️',
      'module_published': '📢',
      'module_unpublished': '📋',
      'submodule_created': '📄',
      'submodule_updated': '✏️',
      'submodule_deleted': '🗃️',
      'submodule_published': '📃',
      'submodule_unpublished': '📄',
      'doc_updated': '📚',
      
      // User management activities - User/People icons
      'user_access_granted': '🔓',
      'user_access_revoked': '🔒',
      'user_suspended': '⛔',
      'user_activated': '✅',
      'user_role_changed': '🔄',
      'user_registration': '👤',
      'user_login': '🔑',
      'user_logout': '🚪',
      'admin_login': '👑',
      'mahasiswa_login': '🎓',
      'external_login': '🌐',
      
      // System activities
      'system_maintenance': '🔧',
      'bulk_operation': '📦',
      'data_export': '📤',
      'data_import': '📥',
    }
    
    return <span className="text-lg">{iconMap[type] || '📋'}</span>
  }

  const getActivityColor = (type: string, success: boolean) => {
    if (!success) {
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    }

    // Question activities - Blue theme
    if (type.includes('question')) {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    }
    
    // Documentation/Module activities - Purple theme
    if (type.includes('module') || type.includes('submodule') || type.includes('doc')) {
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    }
    
    // User management activities - Orange theme
    if (type.includes('user') || type.includes('login') || type.includes('access')) {
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
    }
    
    // Authentication activities - Green theme
    if (type.includes('login') || type.includes('logout')) {
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    }
    
    // Default - Gray theme
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }

  const getUserTypeBadge = (userType: string) => {
    const colorClasses = {
      'mahasiswa': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
      'external': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', 
      'admin': 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
      'unknown': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
    
    const colorClass = colorClasses[userType as keyof typeof colorClasses] || colorClasses.unknown
    const displayName = userType === 'mahasiswa' ? 'Student' : 
                       userType === 'external' ? 'External' :
                       userType === 'admin' ? 'Admin' : 
                       userType === 'unknown' ? 'System' :
                       userType.charAt(0).toUpperCase() + userType.slice(1)
    
    return (
      <Badge variant="secondary" className={`text-xs font-medium ${colorClass}`}>
        {displayName}
      </Badge>
    )
  }

  const formatActivityMessage = (activity: ActivityLog) => {
    if (activity.error_msg) {
      return `${activity.action} - ${activity.error_msg}`
    }
    
    if (activity.entity_name) {
      // For questions, show a more detailed message
      if (activity.type.includes('question')) {
        return `${activity.action}: "${activity.entity_name}"`
      }
      
      // For modules/docs, show module context
      if (activity.type.includes('module') || activity.type.includes('doc')) {
        return `${activity.action}: ${activity.entity_name}`
      }
      
      // For users, show user context
      if (activity.type.includes('user')) {
        return `${activity.action}: ${activity.entity_name}`
      }
      
      return `${activity.action}: ${activity.entity_name}`
    }
    
    return activity.action
  }

  const getActivityTypeLabel = (type: string): string => {
    if (type.includes('question')) return 'Question'
    if (type.includes('module') || type.includes('submodule') || type.includes('doc')) return 'Documentation'
    if (type.includes('user') || type.includes('access')) return 'User Management'
    if (type.includes('login') || type.includes('logout')) return 'Authentication'
    return 'System'
  }

  const formatRelativeTime = (timestamp: string): string => {
    try {
      const now = new Date()
      const activityTime = new Date(timestamp)
      const diffMs = now.getTime() - activityTime.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMinutes < 1) return 'Just now'
      if (diffMinutes < 60) return `${diffMinutes}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return activityTime.toLocaleDateString()
    } catch {
      return 'Unknown time'
    }
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
            <div className="text-center space-y-2">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading activities...</p>
            </div>
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
            <div className="space-y-3 max-w-sm">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Activity Data Unavailable</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={handleRetry} className="gap-2">
                  <RefreshCw className="h-3 w-3" />
                  Try Again
                </Button>
                {retryCount >= 2 && (
                  <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="gap-2">
                    <Database className="h-3 w-3" />
                    Refresh Page
                  </Button>
                )}
              </div>
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
          {usingFallback && (
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
              Demo Data
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchRecentActivities(true)}
            className="ml-auto h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardTitle>
        <CardDescription>Latest system events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="space-y-2">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-1">
                <h3 className="text-sm font-medium">No Recent Activity</h3>
                <p className="text-xs text-muted-foreground">
                  System activities will appear here once they occur
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className={`p-2.5 rounded-full ${getActivityColor(activity.type, activity.success)} ring-2 ring-white dark:ring-gray-900`}>
                {getActivityIcon(activity.type)}
              </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className={`text-sm font-medium leading-relaxed ${!activity.success ? 'text-red-600' : ''}`}>
                  {formatActivityMessage(activity)}
                  {!activity.success && (
                    <AlertCircle className="h-4 w-4 inline ml-1 text-red-500" />
                  )}
                </p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ml-2 shrink-0 ${
                        activity.type.includes('question') ? 'border-blue-200 text-blue-700 bg-blue-50' :
                        activity.type.includes('module') || activity.type.includes('doc') ? 'border-purple-200 text-purple-700 bg-purple-50' :
                        activity.type.includes('user') ? 'border-orange-200 text-orange-700 bg-orange-50' :
                        'border-gray-200 text-gray-700 bg-gray-50'
                      }`}
                    >
                      {getActivityTypeLabel(activity.type)}
                    </Badge>
                  </div>
                  
                <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground font-medium">{activity.performed_by_name}</p>
                  {getUserTypeBadge(activity.performed_by_type)}
                </div>
                  
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                      {formatRelativeTime(activity.timestamp)}
                  </p>
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Database className="h-3 w-3" />
                        <span>
                          {activity.type.includes('question') && activity.details.difficulty && 
                            `${activity.details.difficulty} • ${activity.details.points}pts`
                          }
                          {activity.type.includes('user') && activity.details.user_type && 
                            activity.details.user_type
                          }
                        </span>
                      </div>
                  )}
                  </div>
                </div>
              </div>
            ))}
            </div>
        )}
        <Button variant="ghost" className="w-full mt-3" onClick={() => window.location.href = '/admin/activity-logs'}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View All Activity
        </Button>
      </CardContent>
    </Card>
  )
} 