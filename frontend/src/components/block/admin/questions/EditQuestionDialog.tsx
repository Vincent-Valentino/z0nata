import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { QuestionDisplay } from '@/services/questionService'

// Use QuestionDisplay interface for component state (camelCase)
type Question = QuestionDisplay

interface EditQuestionDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingQuestion: Question | null
  setEditingQuestion: (question: Question | null) => void
  submitLoading: boolean
  onSubmit: () => void
  onCancel: () => void
}

export const EditQuestionDialog = ({
  isOpen,
  onOpenChange,
  editingQuestion,
  setEditingQuestion,
  submitLoading,
  onSubmit,
  onCancel
}: EditQuestionDialogProps) => {
  if (!editingQuestion) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Question Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Title *
            </label>
            <textarea
              value={editingQuestion.title}
              onChange={(e) => setEditingQuestion({
                ...editingQuestion,
                title: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter question title..."
            />
          </div>

          {/* Question Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <input
                type="text"
                value={editingQuestion.type.replace('_', ' ')}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 capitalize"
              />
              <p className="text-xs text-gray-500 mt-1">Question type cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty *
              </label>
              <select
                value={editingQuestion.difficulty}
                onChange={(e) => setEditingQuestion({
                  ...editingQuestion,
                  difficulty: e.target.value as 'easy' | 'medium' | 'hard'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points *
              </label>
              <input
                type="number"
                value={editingQuestion.points}
                onChange={(e) => setEditingQuestion({
                  ...editingQuestion,
                  points: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Active Status
              </label>
              <select
                value={editingQuestion.isActive ? 'true' : 'false'}
                onChange={(e) => setEditingQuestion({
                  ...editingQuestion,
                  isActive: e.target.value === 'true'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> Only basic properties can be edited. To modify options, correct answers, or sample answers, 
                  you'll need to delete and recreate the question.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={submitLoading || !editingQuestion.title.trim()}
            >
              {submitLoading ? 'Updating...' : 'Update Question'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 