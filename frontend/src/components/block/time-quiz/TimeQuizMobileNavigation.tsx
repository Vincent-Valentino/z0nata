import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { QuestionNavigationItem } from './types'

interface TimeQuizMobileNavigationProps {
  navigationItems: QuestionNavigationItem[]
  onQuestionNavigation: (questionIndex: number) => void
  currentQuestionIndex: number
  totalQuestions: number
}

export const TimeQuizMobileNavigation: React.FC<TimeQuizMobileNavigationProps> = ({
  navigationItems,
  onQuestionNavigation,
  currentQuestionIndex,
  totalQuestions
}) => {
  // Calculate scroll position to center current question
  const scrollToCurrentQuestion = () => {
    const element = document.getElementById(`mobile-nav-question-${currentQuestionIndex}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }
  }

  React.useEffect(() => {
    scrollToCurrentQuestion()
  }, [currentQuestionIndex])

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden">
      {/* Stats Bar */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                {navigationItems.filter(item => item.isAnswered).length} answered
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                {navigationItems.filter(item => item.isSkipped).length} skipped
              </span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {currentQuestionIndex + 1} of {totalQuestions}
          </Badge>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {/* Previous button */}
          <Button
            onClick={() => onQuestionNavigation(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Question buttons */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-1">
            {navigationItems.map((item) => (
              <Button
                key={item.index}
                id={`mobile-nav-question-${item.index}`}
                onClick={() => onQuestionNavigation(item.index)}
                variant={item.isCurrent ? "default" : "outline"}
                size="sm"
                className={`relative flex-shrink-0 w-10 h-10 p-0 text-sm transition-all ${
                  item.isAnswered ? 'bg-green-100 border-green-300 hover:bg-green-200 text-green-800 font-semibold dark:bg-green-900 dark:border-green-700 dark:text-green-300' :
                  item.isSkipped ? 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200 text-yellow-800 font-semibold dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-300' :
                  item.isVisited ? 'bg-blue-100 border-blue-300 hover:bg-blue-200 text-blue-800 font-semibold dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300' :
                  item.isCurrent ? 'font-semibold' :
                  'font-medium'
                } ${
                  item.isCurrent ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : ''
                }`}
              >
                {item.index + 1}
                {item.isAnswered && (
                  <CheckCircle2 className="w-3 h-3 absolute -top-1 -right-1 text-green-600 dark:text-green-400" />
                )}
                {item.isSkipped && !item.isAnswered && (
                  <div className="w-3 h-3 absolute -top-1 -right-1 bg-yellow-500 rounded-full" />
                )}
              </Button>
            ))}
          </div>

          {/* Next button */}
          <Button
            onClick={() => onQuestionNavigation(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === totalQuestions - 1}
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 