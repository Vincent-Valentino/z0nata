import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Timer } from 'lucide-react'

export const TimeQuizLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Timer className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="text-lg font-medium">Loading Quiz...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 