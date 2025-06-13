import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LayoutDashboard, 
  Users, 
  HelpCircle, 
  BookOpen, 
  Settings, 
  Menu,
  X,
  Bell,
  Search,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  BellRing
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdminSection } from '@/pages/admin/AdminPage'
import { useAuthStore } from '@/store/authStore'
import { adminService, type SystemNotification } from '@/services/adminService'

interface AdminLayoutProps {
  children: React.ReactNode
  activeSection: AdminSection
  onSectionChange: (section: AdminSection) => void
}

interface SidebarItem {
  id: AdminSection
  title: string
  icon: React.ReactNode
  badge?: number
  description: string
}

export const AdminLayout = ({ children, activeSection, onSectionChange }: AdminLayoutProps) => {
  const { user } = useAuthStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<SystemNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [notificationData, count] = await Promise.all([
          adminService.getSystemNotifications(),
          adminService.getUnreadNotificationCount()
        ])
        setNotifications(notificationData)
        setUnreadCount(count)
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }

    loadNotifications()
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Get dynamic badge counts based on real data
  const getSidebarBadges = async () => {
    try {
      const stats = await adminService.getAdminStats()
      return {
        users: stats.users.pendingUsers,
        questions: stats.questions.inactiveQuestions,
        documentation: stats.content.draftModules
      }
    } catch (error) {
      return { users: 0, questions: 0, documentation: 0 }
    }
  }

  const [badgeCounts, setBadgeCounts] = useState({ users: 0, questions: 0, documentation: 0 })

  useEffect(() => {
    getSidebarBadges().then(setBadgeCounts)
  }, [activeSection])

  const sidebarItems: SidebarItem[] = [
    {
      id: 'overview',
      title: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
      description: 'Dashboard & Analytics'
    },
    {
      id: 'users',
      title: 'Users',
      icon: <Users className="w-5 h-5" />,
      badge: badgeCounts.users,
      description: 'Manage Users & Access'
    },
    {
      id: 'questions',
      title: 'Questions',
      icon: <HelpCircle className="w-5 h-5" />,
      badge: badgeCounts.questions,
      description: 'Question Bank'
    },
    {
      id: 'documentation',
      title: 'Documentation',
      icon: <BookOpen className="w-5 h-5" />,
      badge: badgeCounts.documentation,
      description: 'Modules & Guides'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      description: 'System Configuration'
    }
  ]

  const getNotificationIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getNotificationColor = (type: SystemNotification['type']) => {
    switch (type) {
      case 'error': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
      case 'success': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
      default: return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
    }
  }

  const formatNotificationTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  const handleNotificationClick = async (notification: SystemNotification) => {
    if (!notification.read) {
      await adminService.markNotificationAsRead(notification.id)
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    
    // Navigate to relevant section based on notification type
    if (notification.id === 'pending-users') {
      onSectionChange('users')
    } else if (notification.id === 'inactive-questions') {
      onSectionChange('questions')
    } else if (notification.id === 'draft-modules') {
      onSectionChange('documentation')
    }
    
    setShowNotifications(false)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "relative border-r bg-card transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">Z</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold">Zonata</h1>
                <p className="text-xs text-muted-foreground">Admin Portal</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8"
          >
            {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-auto p-3",
                sidebarCollapsed && "justify-center p-2"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              {item.icon}
              {!sidebarCollapsed && (
                <div className="flex flex-1 items-center justify-between">
                  <div className="text-left">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              )}
              {/* Show badges even when collapsed */}
              {sidebarCollapsed && item.badge && item.badge > 0 && (
                <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </Button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t p-4">
          <div className={cn(
            "flex items-center gap-3",
            sidebarCollapsed && "justify-center"
          )}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profile_picture} />
              <AvatarFallback>
                {user?.full_name?.split(' ').map(n => n[0]).join('') || 'AD'}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <div className="text-sm font-medium">{user?.full_name || 'Admin User'}</div>
                <div className="text-xs text-muted-foreground">{user?.email || 'admin@zonata.com'}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div>
            <h1 className="text-xl font-semibold capitalize">
              {sidebarItems.find(item => item.id === activeSection)?.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {sidebarItems.find(item => item.id === activeSection)?.description}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </Button>
            
            {/* Enhanced Notification Bell */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                {unreadCount > 0 ? (
                  <BellRing className="h-4 w-4" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 z-50 w-80 max-h-96 overflow-y-auto">
                  <Card className="shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <Badge variant="secondary">{unreadCount} new</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 p-0">
                      {notifications.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              "p-3 cursor-pointer hover:bg-muted/50 transition-colors border-l-4",
                              getNotificationColor(notification.type),
                              !notification.read && "bg-muted/30"
                            )}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-3">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">{notification.title}</p>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{notification.message}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatNotificationTime(notification.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
            
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profile_picture} />
              <AvatarFallback>
                {user?.full_name?.split(' ').map(n => n[0]).join('') || 'AD'}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      {/* Click outside overlay for notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  )
} 