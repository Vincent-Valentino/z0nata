import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, BookOpen, Users } from 'lucide-react'

interface QuickActionsProps {
  onQuickAction: (action: string) => void
}

export const QuickActions = ({ onQuickAction }: QuickActionsProps) => {
  const quickActions = [
    {
      id: 'questions',
      label: 'Add Question',
      icon: <FileText className="h-4 w-4" />,
      description: 'Create new quiz questions'
    },
    {
      id: 'documentation',
      label: 'Add Documentation',
      icon: <BookOpen className="h-4 w-4" />,
      description: 'Create learning modules'
    },
    {
      id: 'users',
      label: 'Manage Users',
      icon: <Users className="h-4 w-4" />,
      description: 'User administration'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Frequently used admin functions
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {quickActions.map((action) => (
          <Button 
            key={action.id}
            className="w-full justify-start gap-2" 
            variant="outline"
            onClick={() => onQuickAction(action.id)}
            title={action.description}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
} 