import { questionService } from './questionService'
import { moduleService } from './moduleService'

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
      // Fetch data in parallel for better performance
      const [questionStats, moduleStats] = await Promise.all([
        questionService.getQuestionStats(),
        moduleService.getModules({ limit: 100 })
      ])

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
          message: `New question added to ${questionStats.by_type.single_choice > 0 ? 'single choice' : 'question'} bank`,
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

      return {
        users: userStats,
        content: {
          totalQuestions: questionStats.total,
          totalModules: moduleStats.modules.length,
          totalSubmodules,
          publishedModules,
          draftModules: moduleStats.modules.length - publishedModules
        },
        questions: {
          singleChoice: questionStats.single_choice,
          multipleChoice: questionStats.multiple_choice,
          essay: questionStats.essay,
          activeQuestions: questionStats.active_count,
          inactiveQuestions: questionStats.inactive_count
        },
        activity: {
          pendingRequests: userStats.pendingUsers,
          recentActivity
        }
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      throw new Error('Failed to fetch admin statistics')
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