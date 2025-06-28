import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface ResultsLoadingStateProps {
  message?: string
}

export const ResultsLoadingState: React.FC<ResultsLoadingStateProps> = ({
  message = "Loading quiz results..."
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">{message}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 