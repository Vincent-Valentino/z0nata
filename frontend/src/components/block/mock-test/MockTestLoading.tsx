import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Timer } from 'lucide-react'

export const MockTestLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Timer className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
            <p className="text-lg font-medium">Loading Mock Test...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 