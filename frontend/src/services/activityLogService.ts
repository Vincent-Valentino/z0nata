import { api } from '../lib/api';

export interface ActivityLog {
  id: string;
  type: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  performed_by: string;
  performed_by_name: string;
  performed_by_type: string;
  details?: Record<string, any>;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  success: boolean;
  error_msg?: string;
}

export interface ActivityStats {
  total_activities: number;
  today_activities: number;
  successful_actions: number;
  failed_actions: number;
  by_type: Record<string, number>;
  by_entity_type: Record<string, number>;
  recent_activities: ActivityLog[];
  top_performers: UserActivitySummary[];
}

export interface UserActivitySummary {
  user_id: string;
  user_name: string;
  user_type: string;
  action_count: number;
}

export interface GetActivityLogsRequest {
  page?: number;
  limit?: number;
  type?: string;
  entity_type?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  success?: boolean;
}

export interface GetActivityLogsResponse {
  activities: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ActivityType {
  value: string;
  label: string;
}

export interface CleanupRequest {
  retention_days: number;
}

export interface CleanupResponse {
  deleted_count: number;
  retention_days: number;
  message: string;
}

class ActivityLogService {
  private baseUrl = '/api/v1/admin/activity-logs';

  async getActivityLogs(params: GetActivityLogsRequest = {}): Promise<GetActivityLogsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.type) queryParams.append('type', params.type);
      if (params.entity_type) queryParams.append('entity_type', params.entity_type);
      if (params.user_id) queryParams.append('user_id', params.user_id);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.success !== undefined) queryParams.append('success', params.success.toString());

      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl;
      
      console.log('Fetching activity logs from:', url);
      const response = await api.get<GetActivityLogsResponse>(url);
      console.log('Activity logs response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  }

  async getActivityStats(): Promise<ActivityStats> {
    try {
      console.log('Fetching activity stats...');
      const response = await api.get<ActivityStats>(`${this.baseUrl}/stats`);
      console.log('Activity stats response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      throw error;
    }
  }

  async getRecentActivities(limit: number = 10): Promise<{ activities: ActivityLog[]; count: number }> {
    try {
      console.log(`Fetching recent activities (limit: ${limit})...`);
      const response = await api.get<{ activities: ActivityLog[]; count: number }>(`${this.baseUrl}/recent?limit=${limit}`);
      console.log('Recent activities response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  async getActivityTypes(): Promise<{ activity_types: ActivityType[] }> {
    try {
      console.log('Fetching activity types...');
      const response = await api.get<{ activity_types: ActivityType[] }>(`${this.baseUrl}/types`);
      console.log('Activity types response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching activity types:', error);
      throw error;
    }
  }

  async getActivityById(id: string): Promise<ActivityLog> {
    try {
      console.log(`Fetching activity by ID: ${id}`);
      const response = await api.get<ActivityLog>(`${this.baseUrl}/${id}`);
      console.log('Activity by ID response:', response);
      return response;
    } catch (error) {
      console.error(`Error fetching activity ${id}:`, error);
      throw error;
    }
  }

  async cleanupOldActivities(retentionDays: number): Promise<CleanupResponse> {
    try {
      console.log(`Cleaning up activities older than ${retentionDays} days...`);
      const response = await api.post<CleanupResponse>(`${this.baseUrl}/cleanup`, {
        retention_days: retentionDays,
      });
      console.log('Cleanup response:', response);
      return response;
    } catch (error) {
      console.error('Error cleaning up old activities:', error);
      throw error;
    }
  }

  // Utility methods for formatting and filtering
  formatActivityType(type: string): string {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getActivityIcon(type: string): string {
    const iconMap: Record<string, string> = {
      // Module activities
      'module_created': '📁',
      'module_updated': '✏️',
      'module_deleted': '🗑️',
      'module_published': '📢',
      'module_unpublished': '📝',
      
      // SubModule activities
      'submodule_created': '📄',
      'submodule_updated': '✏️',
      'submodule_deleted': '🗑️',
      'submodule_published': '📢',
      'submodule_unpublished': '📝',
      
      // Question activities
      'question_created': '❓',
      'question_updated': '✏️',
      'question_deleted': '🗑️',
      'question_activated': '✅',
      'question_deactivated': '❌',
      
      // User management activities
      'user_access_granted': '🔓',
      'user_access_revoked': '🔒',
      'user_suspended': '⛔',
      'user_activated': '✅',
      'user_role_changed': '🔄',
      
      // Authentication activities
      'user_login': '🔑',
      'user_logout': '🚪',
      'user_login_failed': '❌',
      'admin_login': '👑',
      'mahasiswa_login': '🎓',
      'external_login': '🌐',
      
      // System activities
      'system_maintenance': '🔧',
      'bulk_operation': '📦',
      'data_export': '📤',
      'data_import': '📥',
    };
    
    return iconMap[type] || '📋';
  }

  getUserTypeColor(userType: string): string {
    const colorMap: Record<string, string> = {
      'admin': 'bg-red-100 text-red-800',
      'mahasiswa': 'bg-blue-100 text-blue-800',
      'external': 'bg-green-100 text-green-800',
      'user': 'bg-gray-100 text-gray-800',
      'unknown': 'bg-gray-100 text-gray-800',
    };
    
    return colorMap[userType] || 'bg-gray-100 text-gray-800';
  }

  getSuccessColor(success: boolean): string {
    return success ? 'text-green-600' : 'text-red-600';
  }

  formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

export const activityLogService = new ActivityLogService(); 