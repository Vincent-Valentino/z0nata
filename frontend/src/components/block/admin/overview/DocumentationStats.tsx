import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'
import type { AdminStats } from '@/services/adminService'

interface DocumentationStatsProps {
  adminStats: AdminStats
}

export const DocumentationStats = ({ adminStats }: DocumentationStatsProps) => {
  const getDocumentationStats = () => {
    return [
      { type: 'Modules', count: adminStats.content.totalModules, color: 'bg-orange-500' },
      { type: 'Submodules', count: adminStats.content.totalSubmodules, color: 'bg-cyan-500' }
    ]
  }

  const docStats = getDocumentationStats()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Documentation
        </CardTitle>
        <CardDescription>Content organization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {docStats.map((stat) => (
          <div key={stat.type} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${stat.color}`} />
              <span className="font-medium">{stat.type}</span>
            </div>
            <span className="text-2xl font-bold">{stat.count}</span>
          </div>
        ))}
        <div className="pt-2 border-t text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Published</span>
            <span className="font-medium">{adminStats.content.publishedModules}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Draft</span>
            <span className="font-medium">{adminStats.content.draftModules}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 