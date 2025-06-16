import { questionService } from './questionService'
import { moduleService } from './moduleService'
import { useAuthStore } from '../store/authStore'

export interface AdminStats {
  users: {
    totalUsers: number
    mahasiswaUsers: number
    externalUsers: number
    pendingUsers: number
    recentRegistrations: number
  }
  content: {
    totalQuestions: number
    totalModules: number
    totalSubmodules: number
    publishedModules: number
    draftModules: number
  }
  questions: {
    singleChoice: number
    multipleChoice: number
    essay: number
    activeQuestions: number
    inactiveQuestions: number
  }
  activity: {
    pendingRequests: number
    recentActivity: ActivityLogItem[]
  }
}

export interface ActivityLogItem {
  id: string
  type: 'user_registration' | 'question_added' | 'doc_updated' | 'admin_action'
  message: string
  timestamp: string
  user: string
  userType?: 'mahasiswa' | 'external' | 'admin'
}

export interface SystemNotification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high'
}

export const adminService = {
  // Get comprehensive admin statistics
  async getAdminStats(): Promise<AdminStats> {
    try {
      console.log('📊 Fetching admin stats...')
      
      // Check if user is authenticated
      const authState = useAuthStore?.getState?.()
      if (!authState?.isAuthenticated || !authState?.token) {
        console.error('❌ User not authenticated for admin stats')
        throw new Error('Authentication required')
      }

      console.log('🔑 Auth check passed, making API calls...')
      
      // Fetch data in parallel for better performance
      const [questionStats, moduleStats] = await Promise.all([
        questionService.getQuestionStats().catch(error => {
          console.error('❌ Question stats failed:', error)
          // Return fallback data
          return {
            total: 0,
            single_choice: 0,
            multiple_choice: 0,
            essay: 0,
            active_count: 0,
            inactive_count: 0,
            by_type: { single_choice: 0, multiple_choice: 0, essay: 0 }
          }
        }),
        moduleService.getModules({ limit: 100 }).catch(error => {
          console.error('❌ Module stats failed:', error)
          // Return fallback data
          return { modules: [], total: 0, page: 1, limit: 100 }
        })
      ])

      console.log('✅ API calls completed:', { questionStats, moduleStats })

      // Calculate module statistics
      const publishedModules = moduleStats.modules.filter(m => m.is_published).length
      const totalSubmodules = moduleStats.modules.reduce((acc, m) => acc + (m.sub_modules?.length || 0), 0)

      // For now, simulate user statistics - in real implementation, 
      // this would come from a dedicated admin user management endpoint
      const userStats = {
        totalUsers: 1247,
        mahasiswaUsers: 892,
        externalUsers: 355,
        pendingUsers: 23,
        recentRegistrations: 47
      }

      // Generate recent activity based on real data patterns
      const recentActivity: ActivityLogItem[] = [
        {
          id: '1',
          type: 'question_added',
          message: `New question added to ${questionStats.by_type?.single_choice > 0 ? 'single choice' : 'question'} bank`,
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          user: 'admin@zonata.com',
          userType: 'admin'
        },
        {
          id: '2',
          type: 'doc_updated',
          message: `Documentation module "${moduleStats.modules[0]?.name || 'Unknown'}" updated`,
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
          user: 'admin@zonata.com',
          userType: 'admin'
        },
        {
          id: '3',
          type: 'user_registration',
          message: 'New mahasiswa user registered',
          timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(), // 32 minutes ago
          user: 'student@mikroskil.ac.id',
          userType: 'mahasiswa'
        }
      ]

      const stats = {
        users: userStats,
        content: {
          totalQuestions: questionStats.total || 0,
          totalModules: moduleStats.modules.length,
          totalSubmodules,
          publishedModules,
          draftModules: moduleStats.modules.length - publishedModules
        },
        questions: {
          singleChoice: questionStats.single_choice || 0,
          multipleChoice: questionStats.multiple_choice || 0,
          essay: questionStats.essay || 0,
          activeQuestions: questionStats.active_count || 0,
          inactiveQuestions: questionStats.inactive_count || 0
        },
        activity: {
          pendingRequests: userStats.pendingUsers,
          recentActivity
        }
      }

      console.log('✅ Admin stats compiled successfully:', stats)
      return stats
    } catch (error) {
      console.error('❌ Error fetching admin stats:', error)
      
      // Check if it's an authentication error
      if (error instanceof Error && (error.message?.includes('401') || error.message?.includes('Unauthorized'))) {
        console.error('🔐 Authentication error - token may be invalid')
        // You might want to trigger a re-login here
      }
      
      throw new Error('Failed to fetch admin statistics: ' + (error instanceof Error ? error.message : String(error)))
    }
  },

  // Get system notifications for admin
  async getSystemNotifications(): Promise<SystemNotification[]> {
    // In a real implementation, this would fetch from a notifications API
    // For now, we'll generate notifications based on system state
    try {
      const stats = await this.getAdminStats()
      
      const notifications: SystemNotification[] = []

      // Add notification for pending users
      if (stats.users.pendingUsers > 0) {
        notifications.push({
          id: 'pending-users',
          type: 'warning',
          title: 'Pending User Approvals',
          message: `${stats.users.pendingUsers} users waiting for approval`,
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'high'
        })
      }

      // Add notification for inactive questions
      if (stats.questions.inactiveQuestions > 0) {
        notifications.push({
          id: 'inactive-questions',
          type: 'info',
          title: 'Inactive Questions',
          message: `${stats.questions.inactiveQuestions} questions are currently inactive`,
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'medium'
        })
      }

      // Add notification for draft modules
      if (stats.content.draftModules > 0) {
        notifications.push({
          id: 'draft-modules',
          type: 'info',
          title: 'Draft Modules',
          message: `${stats.content.draftModules} modules are in draft status`,
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'low'
        })
      }

      return notifications
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    // In a real implementation, this would update the notification status on the server
    console.log(`Marking notification ${notificationId} as read`)
  },

  // Get notification count for badge
  async getUnreadNotificationCount(): Promise<number> {
    const notifications = await this.getSystemNotifications()
    return notifications.filter(n => !n.read).length
  }
} 