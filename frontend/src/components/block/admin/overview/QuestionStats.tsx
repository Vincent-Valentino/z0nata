import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FileText } from 'lucide-react'
import type { AdminStats } from '@/services/adminService'

interface QuestionStatsProps {
  adminStats: AdminStats
}

export const QuestionStats = ({ adminStats }: QuestionStatsProps) => {
  const getQuestionStats = () => {
    return [
      { type: 'Single Choice', count: adminStats.questions.singleChoice, color: 'bg-blue-500' },
      { type: 'Multiple Choice', count: adminStats.questions.multipleChoice, color: 'bg-green-500' },
      { type: 'Essays', count: adminStats.questions.essay, color: 'bg-purple-500' }
    ]
  }

  const questionStats = getQuestionStats()
  const maxCount = Math.max(...questionStats.map(s => s.count))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Questions
        </CardTitle>
        <CardDescription>Question types breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {questionStats.map((stat) => (
          <div key={stat.type} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{stat.type}</span>
              <span className="text-sm text-muted-foreground">{stat.count}</span>
            </div>
            <Progress 
              value={maxCount > 0 ? (stat.count / maxCount) * 100 : 0} 
              className="h-2"
            />
          </div>
        ))}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between font-medium">
            <span>Total Questions</span>
            <span>{adminStats.content.totalQuestions}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
            <span>Active Questions</span>
            <span>{adminStats.questions.activeQuestions}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 