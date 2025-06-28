import { Trophy } from 'lucide-react'

interface ResultsHeaderProps {
  userName?: string
  overallAverage: number
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  userName,
  overallAverage
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
              Quiz Results
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
              Track your learning progress and achievements
            </p>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(overallAverage)}%
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Overall Average</div>
          </div>
        </div>
      </div>
    </div>
  )
} 