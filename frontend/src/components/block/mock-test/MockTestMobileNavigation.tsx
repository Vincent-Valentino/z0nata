import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CheckCircle2, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react'
import type { QuestionFilter, FilteredQuestion } from './types'

interface MockTestMobileNavigationProps {
  filteredQuestions: FilteredQuestion[]
  currentQuestionIndex: number
  answeredQuestions: Set<number>
  skippedQuestions: Set<number>
  onQuestionNavigation: (index: number) => void
  searchQuery: string
  questionFilter: QuestionFilter
  onSearchChange: (query: string) => void
  onFilterChange: (filter: QuestionFilter) => void
  onClearFilters: () => void
  totalQuestions: number
}

export const MockTestMobileNavigation: React.FC<MockTestMobileNavigationProps> = ({
  filteredQuestions,
  currentQuestionIndex,
  answeredQuestions,
  skippedQuestions,
  onQuestionNavigation,
  searchQuery,
  questionFilter,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  totalQuestions
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const hasActiveFilters = questionFilter.difficulty !== 'all' || 
                          questionFilter.status !== 'all' || 
                          questionFilter.type !== 'all' || 
                          searchQuery.trim()

  // Calculate scroll position to center current question
  const scrollToCurrentQuestion = () => {
    const element = document.getElementById(`mobile-mock-nav-question-${currentQuestionIndex}`)
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                {answeredQuestions.size} answered
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                {skippedQuestions.size} skipped
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {filteredQuestions.length} shown
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {currentQuestionIndex + 1} of {totalQuestions}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {/* Filter button */}
          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger>
              <Button
                variant="outline"
                size="sm"
                className={`flex-shrink-0 h-8 w-8 p-0 ${hasActiveFilters ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}`}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter Questions
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="grid gap-3">
                  <Select
                    value={questionFilter.difficulty}
                    onValueChange={(value: any) => onFilterChange({...questionFilter, difficulty: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={questionFilter.status}
                    onValueChange={(value: any) => onFilterChange({...questionFilter, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="answered">Answered</SelectItem>
                      <SelectItem value="unanswered">Unanswered</SelectItem>
                      <SelectItem value="skipped">Skipped</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={questionFilter.type}
                    onValueChange={(value: any) => onFilterChange({...questionFilter, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="single_choice">Single Choice</SelectItem>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="essay">Essay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {hasActiveFilters && (
                    <Button onClick={onClearFilters} variant="outline" className="flex-1">
                      Clear Filters
                    </Button>
                  )}
                  <Button onClick={() => setIsFilterOpen(false)} className="flex-1">
                    Apply
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
            {filteredQuestions.map((item) => {
              const isCurrentQuestion = item.index === currentQuestionIndex
              const isAnsweredQuestion = answeredQuestions.has(item.index)
              const isSkippedQuestion = skippedQuestions.has(item.index)
              
              return (
                <Button
                  key={item.index}
                  id={`mobile-mock-nav-question-${item.index}`}
                  onClick={() => onQuestionNavigation(item.index)}
                  variant={isCurrentQuestion ? "default" : "outline"}
                  size="sm"
                  className={`relative flex-shrink-0 w-10 h-10 p-0 text-sm transition-all ${
                    isAnsweredQuestion ? 'bg-green-100 border-green-300 hover:bg-green-200 text-green-800 font-semibold dark:bg-green-900 dark:border-green-700 dark:text-green-300' :
                    isSkippedQuestion ? 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200 text-yellow-800 font-semibold dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-300' :
                    isCurrentQuestion ? 'font-semibold' :
                    'font-medium hover:bg-blue-100 hover:border-blue-300 dark:hover:bg-blue-900 dark:hover:border-blue-700'
                  } ${
                    isCurrentQuestion ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-800' : ''
                  }`}
                >
                  {item.index + 1}
                  {isAnsweredQuestion && (
                    <CheckCircle2 className="w-3 h-3 absolute -top-1 -right-1 text-green-600 dark:text-green-400" />
                  )}
                  {isSkippedQuestion && !isAnsweredQuestion && (
                    <div className="w-3 h-3 absolute -top-1 -right-1 bg-yellow-500 rounded-full" />
                  )}
                </Button>
              )
            })}
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