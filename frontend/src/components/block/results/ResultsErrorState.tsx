import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ResultsErrorStateProps {
  error: string
  onRetry?: () => void
}

export const ResultsErrorState: React.FC<ResultsErrorStateProps> = ({
  error,
  onRetry
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Error Loading Results
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" className="flex items-center gap-2 mx-auto">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 