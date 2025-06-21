import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, GraduationCap, AlertCircle, TrendingUp } from 'lucide-react'
import type { AdminStats } from '@/services/adminService'

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

interface StatsCardsProps {
  adminStats: AdminStats
}

export const StatsCards = ({ adminStats }: StatsCardsProps) => {
  const getStatsCards = (): StatCard[] => {
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

  const statsCards = getStatsCards()

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">{stat.title}</CardTitle>
            <div className="flex-shrink-0">
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground flex-1 truncate">{stat.description}</p>
              {stat.trend && (
                <div className={`flex items-center text-xs flex-shrink-0 ${
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
  )
} 