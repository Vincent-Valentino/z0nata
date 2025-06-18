import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DocModule {
  id: string
  title: string
  description: string
  content: string
  type: 'module' | 'submodule'
  parentId?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  isPublished: boolean
  order: number
}

interface DocumentationStatsCardProps {
  docs: DocModule[]
}

export const DocumentationStatsCard = ({ docs }: DocumentationStatsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium">{docs.filter(d => d.type === 'module').length}</div>
            <div className="text-muted-foreground">Modules</div>
          </div>
          <div>
            <div className="font-medium">{docs.filter(d => d.type === 'submodule').length}</div>
            <div className="text-muted-foreground">Submodules</div>
          </div>
          <div>
            <div className="font-medium">{docs.filter(d => d.isPublished).length}</div>
            <div className="text-muted-foreground">Published</div>
          </div>
          <div>
            <div className="font-medium">{docs.filter(d => !d.isPublished).length}</div>
            <div className="text-muted-foreground">Drafts</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 