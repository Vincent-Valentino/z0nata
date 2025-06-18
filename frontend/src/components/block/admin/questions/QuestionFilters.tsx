import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus } from 'lucide-react'

interface QuestionFiltersProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  typeFilter: 'all' | 'single_choice' | 'multiple_choice' | 'essay'
  setTypeFilter: (value: 'all' | 'single_choice' | 'multiple_choice' | 'essay') => void
  difficultyFilter: 'all' | 'easy' | 'medium' | 'hard'
  setDifficultyFilter: (value: 'all' | 'easy' | 'medium' | 'hard') => void
  onAddQuestion: () => void
}

export const QuestionFilters = ({
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  difficultyFilter,
  setDifficultyFilter,
  onAddQuestion
}: QuestionFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-2 flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
        
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="all">All Types</option>
          <option value="single_choice">Single Choice</option>
          <option value="multiple_choice">Multiple Choice</option>
          <option value="essay">Essay</option>
        </select>
        
        <select 
          value={difficultyFilter} 
          onChange={(e) => setDifficultyFilter(e.target.value as any)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      
      <Button onClick={onAddQuestion} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Question
      </Button>
    </div>
  )
} 