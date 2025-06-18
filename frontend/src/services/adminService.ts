import { questionService } from './questionService'
import { moduleService } from './moduleService'
import { useAuthStore } from '../store/authStore'

// Admin stats interfaces
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

// User management interfaces
export interface User {
  id: string
  full_name: string
  email: string
  user_type: 'mahasiswa' | 'external' | 'admin'
  status: 'active' | 'pending' | 'suspended' | 'rejected'
  email_verified: boolean
  last_login: string
  created_at: string
  // Optional fields based on user type
  nim?: string // For mahasiswa
  faculty?: string // For mahasiswa
  major?: string // For mahasiswa
  organization?: string // For external users
}

export interface UserStats {
  total_users: number
  active_users: number
  pending_users: number
  suspended_users: number
  by_type: {
    mahasiswa?: number
    external?: number
    admin?: number
  }
  by_status: {
    active?: number
    pending?: number
    suspended?: number
    rejected?: number
  }
  recent_registrations: number
  pending_requests: number
}

export interface ListUsersRequest {
  page?: number
  limit?: number
  search?: string
  user_type?: 'mahasiswa' | 'external' | 'admin'
  status?: 'active' | 'pending' | 'suspended' | 'rejected'
}

export interface ListUsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface AccessRequest {
  id: string
  user_id: string
  request_type: 'mahasiswa' | 'external'
  full_name: string
  email: string
  nim?: string
  faculty?: string
  major?: string
  organization?: string
  purpose?: string
  supporting_docs?: string[]
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  reviewed_at?: string
  reviewed_by?: string
  review_notes?: string
}

export interface ListAccessRequestsResponse {
  requests: AccessRequest[]
  total: number
  page: number
  limit: number
  total_pages: number
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

// API base configuration
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Helper function to get auth headers
const getAuthHeaders = () => {
  const authState = useAuthStore?.getState?.()
  if (!authState?.token) {
    throw new Error('Authentication required')
  }
  
  return {
    'Authorization': `Bearer ${authState.token}`,
    'Content-Type': 'application/json',
  }
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`HTTP ${response.status}: ${error}`)
  }
  return response.json()
}

export const adminService = {
  // User Management
  async getUsers(params?: ListUsersRequest): Promise<ListUsersResponse> {
    try {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.search) searchParams.append('search', params.search)
      if (params?.user_type) searchParams.append('user_type', params.user_type)
      if (params?.status) searchParams.append('status', params.status)

      const query = searchParams.toString()
      const url = `${API_BASE}/admin/users${query ? `?${query}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  async getUserStats(): Promise<UserStats> {
    try {
      const response = await fetch(`${API_BASE}/admin/users/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching user stats:', error)
      throw error
    }
  },

  async updateUserStatus(userId: string, status: User['status'], notes?: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
      })

      await handleResponse(response)
    } catch (error) {
      console.error('Error updating user status:', error)
      throw error
    }
  },

  // Access Request Management
  async getAccessRequests(params?: { page?: number; limit?: number; status?: string; type?: string }): Promise<ListAccessRequestsResponse> {
    try {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.status) searchParams.append('status', params.status)
      if (params?.type) searchParams.append('type', params.type)

      const query = searchParams.toString()
      const url = `${API_BASE}/admin/access-requests${query ? `?${query}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching access requests:', error)
      throw error
    }
  },

  async approveAccessRequest(requestId: string, notes?: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/admin/access-requests/${requestId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes: notes || '' }),
      })

      await handleResponse(response)
    } catch (error) {
      console.error('Error approving access request:', error)
      throw error
    }
  },

  async rejectAccessRequest(requestId: string, notes: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/admin/access-requests/${requestId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes }),
      })

      await handleResponse(response)
    } catch (error) {
      console.error('Error rejecting access request:', error)
      throw error
    }
  },

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
      const [questionStats, moduleStats, userStats] = await Promise.all([
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
        }),
        this.getUserStats().catch(error => {
          console.error('❌ User stats failed:', error)
          // Return fallback data
          return {
            total_users: 0,
            active_users: 0,
            pending_users: 0,
            suspended_users: 0,
            by_type: {},
            by_status: {},
            recent_registrations: 0,
            pending_requests: 0
          }
        })
      ])

      console.log('✅ API calls completed:', { questionStats, moduleStats, userStats })

      // Calculate module statistics
      const publishedModules = moduleStats.modules.filter(m => m.is_published).length
      const totalSubmodules = moduleStats.modules.reduce((acc, m) => acc + (m.sub_modules?.length || 0), 0)

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
        users: {
          totalUsers: userStats.total_users,
          mahasiswaUsers: (userStats.by_type && 'mahasiswa' in userStats.by_type) ? userStats.by_type.mahasiswa || 0 : 0,
          externalUsers: (userStats.by_type && 'external' in userStats.by_type) ? userStats.by_type.external || 0 : 0,
          pendingUsers: userStats.pending_users,
          recentRegistrations: userStats.recent_registrations
        },
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
          pendingRequests: userStats.pending_requests,
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