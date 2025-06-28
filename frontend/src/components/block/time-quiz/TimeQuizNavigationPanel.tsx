import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2 } from 'lucide-react'
import type { QuestionNavigationItem } from './types'

interface TimeQuizNavigationPanelProps {
  navigationItems: QuestionNavigationItem[]
  onQuestionNavigation: (questionIndex: number) => void
}

export const TimeQuizNavigationPanel: React.FC<TimeQuizNavigationPanelProps> = ({
  navigationItems,
  onQuestionNavigation
}) => {
  return (
    <Card className="lg:order-2 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Questions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {navigationItems.map((item) => (
            <Button
              key={item.index}
              onClick={() => onQuestionNavigation(item.index)}
              variant={item.isCurrent ? "default" : "outline"}
              size="sm"
              className={`relative w-10 h-10 sm:w-12 sm:h-12 p-0 text-sm sm:text-base transition-all ${
                item.isAnswered ? 'bg-green-100 border-green-300 hover:bg-green-200 text-green-800 font-semibold' :
                item.isSkipped ? 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200 text-yellow-800 font-semibold' :
                item.isVisited ? 'bg-blue-100 border-blue-300 hover:bg-blue-200 text-blue-800 font-semibold' :
                item.isCurrent ? 'font-semibold' :
                'font-medium'
              }`}
            >
              {item.index + 1}
              {item.isAnswered && (
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 absolute -top-1 -right-1 text-green-600" />
              )}
              {item.isSkipped && !item.isAnswered && (
                <div className="w-3 h-3 sm:w-4 sm:h-4 absolute -top-1 -right-1 bg-yellow-500 rounded-full" />
              )}
            </Button>
          ))}
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded" />
            <span>Skipped</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded" />
            <span>Visited</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
