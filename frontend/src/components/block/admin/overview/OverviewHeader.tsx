import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface OverviewHeaderProps {
  onRefresh: () => void
  refreshing: boolean
}

export const OverviewHeader = ({ onRefresh, refreshing }: OverviewHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">Admin Overview</h2>
        <p className="text-muted-foreground">System statistics and recent activity</p>
      </div>
      <Button 
        onClick={onRefresh} 
        variant="outline" 
        size="sm"
        disabled={refreshing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  )
} 