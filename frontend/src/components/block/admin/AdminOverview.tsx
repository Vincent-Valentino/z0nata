import { useState, useEffect } from 'react'
import { adminService, type AdminStats } from '@/services/adminService'
import {
  StatsCards,
  QuickActions,
  QuestionStats,
  DocumentationStats,
  RecentActivity,
  LoadingState,
  OverviewHeader
} from './overview'

interface AdminOverviewProps {
  onSectionChange?: (section: 'users' | 'questions' | 'documentation' | 'settings') => void
}

export const AdminOverview = ({ onSectionChange }: AdminOverviewProps) => {
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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
      
      // Trigger refresh for activity logs
      setRefreshTrigger(prev => prev + 1)
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

  // Show loading or error states
  if (loading || error) {
    return (
      <LoadingState 
        loading={loading}
        error={error}
        onRetry={() => loadAdminStats()}
      />
    )
  }

  if (!adminStats) return null

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <OverviewHeader 
        onRefresh={() => loadAdminStats(true)}
        refreshing={refreshing}
      />

      {/* Stats Grid */}
      <StatsCards adminStats={adminStats} />

      {/* Quick Actions */}
      <QuickActions onQuickAction={handleQuickAction} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Question Statistics */}
        <QuestionStats adminStats={adminStats} />

        {/* Documentation Statistics */}
        <DocumentationStats adminStats={adminStats} />

        {/* Recent Activity */}
        <RecentActivity refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
} 