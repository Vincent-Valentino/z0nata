import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  List, 
  Grid3X3, 
  CheckCircle2, 
  SkipForward 
} from 'lucide-react'
import type { QuestionFilter, FilteredQuestion } from './types'

interface MockTestNavigationPanelProps {
  viewMode: 'grid' | 'list'
  searchQuery: string
  questionFilter: QuestionFilter
  filteredQuestions: FilteredQuestion[]
  currentQuestionIndex: number
  answeredQuestions: Set<number>
  skippedQuestions: Set<number>
  onViewModeChange: (mode: 'grid' | 'list') => void
  onSearchChange: (query: string) => void
  onFilterChange: (filter: QuestionFilter) => void
  onClearFilters: () => void
  onQuestionNavigation: (index: number) => void
}

export const MockTestNavigationPanel: React.FC<MockTestNavigationPanelProps> = ({
  viewMode,
  searchQuery,
  questionFilter,
  filteredQuestions,
  currentQuestionIndex,
  answeredQuestions,
  skippedQuestions,
  onViewModeChange,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  onQuestionNavigation
}) => {
  const hasActiveFilters = questionFilter.difficulty !== 'all' || 
                          questionFilter.status !== 'all' || 
                          questionFilter.type !== 'all' || 
                          searchQuery.trim()

  return (
    <Card className="lg:order-2 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Navigation</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
              variant="outline"
              size="sm"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Select
              value={questionFilter.difficulty}
              onValueChange={(value: any) => onFilterChange({...questionFilter, difficulty: value})}
            >
              <SelectTrigger className="text-xs">
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
              <SelectTrigger className="text-xs">
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
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="single_choice">Single Choice</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              onClick={onClearFilters}
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              Clear Filters ({filteredQuestions.length} shown)
            </Button>
          )}
        </div>

        <Separator />

        {/* Question Grid/List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
              {filteredQuestions.map((item) => {
                const isCurrentQuestion = item.index === currentQuestionIndex
                const isAnsweredQuestion = answeredQuestions.has(item.index)
                const isSkippedQuestion = skippedQuestions.has(item.index)
                
                return (
                  <Button
                    key={item.index}
                    onClick={() => onQuestionNavigation(item.index)}
                    variant={isCurrentQuestion ? "default" : "outline"}
                    size="sm"
                    className={`relative w-10 h-10 p-0 ${
                      isAnsweredQuestion ? 'bg-green-100 border-green-300 hover:bg-green-200' :
                      isSkippedQuestion ? 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200' :
                      'hover:bg-blue-100 hover:border-blue-300'
                    }`}
                  >
                    {item.index + 1}
                    {isAnsweredQuestion && (
                      <CheckCircle2 className="w-3 h-3 absolute -top-1 -right-1 text-green-600" />
                    )}
                  </Button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredQuestions.map((item) => {
                const isCurrentQuestion = item.index === currentQuestionIndex
                const isAnsweredQuestion = answeredQuestions.has(item.index)
                const isSkippedQuestion = skippedQuestions.has(item.index)
                
                return (
                  <Button
                    key={item.index}
                    onClick={() => onQuestionNavigation(item.index)}
                    variant={isCurrentQuestion ? "default" : "outline"}
                    className={`w-full text-left justify-start h-auto py-2 px-3 ${
                      isAnsweredQuestion ? 'bg-green-50 border-green-300' :
                      isSkippedQuestion ? 'bg-yellow-50 border-yellow-300' :
                      ''
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-sm">Q{item.index + 1}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          item.question.difficulty === 'easy' ? 'text-green-600' :
                          item.question.difficulty === 'medium' ? 'text-orange-600' :
                          'text-red-600'
                        }`}
                      >
                        {item.question.difficulty}
                      </Badge>
                      <div className="flex gap-1 ml-auto">
                        {isAnsweredQuestion && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                        {isSkippedQuestion && <SkipForward className="w-3 h-3 text-yellow-600" />}
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Legend */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded" />
            <span>Skipped</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 