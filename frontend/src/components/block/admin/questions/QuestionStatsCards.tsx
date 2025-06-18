import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Target, TrendingUp, FileText } from 'lucide-react'

interface QuestionStatsCardsProps {
  stats: any
}

export const QuestionStatsCards = ({ stats }: QuestionStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total Questions</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats?.active_count || 0}</p>
              <p className="text-xs text-muted-foreground">Active Questions</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats?.total_points || 0}</p>
              <p className="text-xs text-muted-foreground">Total Points</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats?.average_points?.toFixed(1) || '0.0'}</p>
              <p className="text-xs text-muted-foreground">Avg Points</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 