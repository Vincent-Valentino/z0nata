import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { QuestionDisplay } from '@/services/questionService'

// Use QuestionDisplay interface for component state (camelCase)
type Question = QuestionDisplay

interface ViewQuestionDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedQuestion: Question | null
}

export const ViewQuestionDialog = ({
  isOpen,
  onOpenChange,
  selectedQuestion
}: ViewQuestionDialogProps) => {
  if (!selectedQuestion) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Question Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Question Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Question ID</label>
              <p className="text-sm text-gray-600 font-mono">{selectedQuestion.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Type</label>
              <p className="text-sm capitalize">{selectedQuestion.type.replace('_', ' ')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Difficulty</label>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                selectedQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                selectedQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedQuestion.difficulty.toUpperCase()}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Points</label>
              <p className="text-sm">{selectedQuestion.points}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Active</label>
              <p className="text-sm">{selectedQuestion.isActive ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Question Title */}
          <div>
            <label className="text-sm font-medium text-gray-700">Question Title</label>
            <div className="mt-1 p-3 border rounded-md bg-gray-50">
              <p className="text-sm">{selectedQuestion.title}</p>
            </div>
          </div>

          {/* Options and Correct Answers */}
          {selectedQuestion.type !== 'essay' && selectedQuestion.options && (
            <div>
              <label className="text-sm font-medium text-gray-700">Options & Correct Answers</label>
              <div className="mt-2 space-y-2">
                {selectedQuestion.options.map((option) => {
                  const isCorrect = selectedQuestion.correctAnswers?.includes(option.id)
                  return (
                    <div
                      key={option.id}
                      className={`p-3 border rounded-md ${
                        isCorrect 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{option.text}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-mono">ID: {option.id}</span>
                          {isCorrect && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              ✓ Correct Answer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sample Answer for Essay */}
          {selectedQuestion.type === 'essay' && selectedQuestion.sampleAnswer && (
            <div>
              <label className="text-sm font-medium text-gray-700">Sample Answer</label>
              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                <p className="text-sm whitespace-pre-wrap">{selectedQuestion.sampleAnswer}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <label className="font-medium">Created At</label>
              <p>{new Date(selectedQuestion.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="font-medium">Updated At</label>
              <p>{new Date(selectedQuestion.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 