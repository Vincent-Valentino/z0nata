import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Check } from 'lucide-react'
import type { QuestionDisplay, Option } from '@/services/questionService'

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
  const [localOptions, setLocalOptions] = useState<Option[]>([])
  const [localCorrectAnswers, setLocalCorrectAnswers] = useState<string[]>([])
  const [sampleAnswer, setSampleAnswer] = useState('')

  // Initialize local state when dialog opens
  React.useEffect(() => {
    if (editingQuestion) {
      setLocalOptions(editingQuestion.options || [])
      setLocalCorrectAnswers(editingQuestion.correctAnswers || [])
      setSampleAnswer(editingQuestion.sampleAnswer || '')
    }
  }, [editingQuestion])

  if (!editingQuestion) return null

  const isChoiceQuestion = editingQuestion.type === 'single_choice' || editingQuestion.type === 'multiple_choice'
  const isEssayQuestion = editingQuestion.type === 'essay'

  const addOption = () => {
    const newOption: Option = {
      id: `temp_${Date.now()}`,
      text: '',
      order: localOptions.length + 1
    }
    setLocalOptions([...localOptions, newOption])
  }

  const removeOption = (index: number) => {
    const updatedOptions = localOptions.filter((_, i) => i !== index)
    setLocalOptions(updatedOptions)
    
    // Remove any correct answers that referenced the removed option
    const removedOptionId = localOptions[index].id
    setLocalCorrectAnswers(prev => prev.filter(id => id !== removedOptionId))
  }

  const updateOption = (index: number, text: string) => {
    const updatedOptions = [...localOptions]
    updatedOptions[index] = { ...updatedOptions[index], text }
    setLocalOptions(updatedOptions)
  }

  const toggleCorrectAnswer = (optionId: string) => {
    if (editingQuestion.type === 'single_choice') {
      // Single choice: only one correct answer
      setLocalCorrectAnswers([optionId])
    } else {
      // Multiple choice: toggle the answer
      setLocalCorrectAnswers(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    }
  }

  const handleSubmit = () => {
    // Update the editing question with local changes
    const updatedQuestion: Question = {
      ...editingQuestion,
      options: isChoiceQuestion ? localOptions : undefined,
      correctAnswers: isChoiceQuestion ? localCorrectAnswers : undefined,
      sampleAnswer: isEssayQuestion ? sampleAnswer : undefined
    }
    
    setEditingQuestion(updatedQuestion)
    onSubmit()
  }

  const isValidForm = () => {
    if (!editingQuestion.title.trim()) return false
    
    if (isChoiceQuestion) {
      // Must have at least 2 options with text
      if (localOptions.length < 2) return false
      if (localOptions.some(opt => !opt.text.trim())) return false
      
      // Must have correct answers
      if (localCorrectAnswers.length === 0) return false
      
      // Single choice must have exactly 1 correct answer
      if (editingQuestion.type === 'single_choice' && localCorrectAnswers.length !== 1) return false
    }
    
    return true
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 capitalize">
                {editingQuestion.type.replace('_', ' ')}
              </div>
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

          {/* Options and Correct Answers (for choice questions) */}
          {isChoiceQuestion && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Options *
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </Button>
              </div>

              <div className="space-y-3">
                {localOptions.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-md">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant={localCorrectAnswers.includes(option.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCorrectAnswer(option.id)}
                      className="flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      {localCorrectAnswers.includes(option.id) ? 'Correct' : 'Mark Correct'}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeOption(index)}
                      disabled={localOptions.length <= 2}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {editingQuestion.type === 'single_choice' && (
                <p className="text-xs text-gray-500 mt-2">
                  Select exactly one correct answer for single choice questions.
                </p>
              )}
              
              {editingQuestion.type === 'multiple_choice' && (
                <p className="text-xs text-gray-500 mt-2">
                  Select one or more correct answers for multiple choice questions.
                </p>
              )}
            </div>
          )}

          {/* Sample Answer (for essay questions) */}
          {isEssayQuestion && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Answer
              </label>
              <textarea
                value={sampleAnswer}
                onChange={(e) => setSampleAnswer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Provide a sample answer or grading criteria..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Provide guidance for manual grading of essay responses.
              </p>
            </div>
          )}

          {/* Validation Messages */}
          {isChoiceQuestion && (
            <div className="space-y-2">
              {localOptions.length < 2 && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  At least 2 options are required.
                </div>
              )}
              {localCorrectAnswers.length === 0 && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  At least one correct answer must be selected.
                </div>
              )}
              {editingQuestion.type === 'single_choice' && localCorrectAnswers.length > 1 && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  Single choice questions can only have one correct answer.
                </div>
              )}
            </div>
          )}

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
              onClick={handleSubmit}
              disabled={submitLoading || !isValidForm()}
            >
              {submitLoading ? 'Updating...' : 'Update Question'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 