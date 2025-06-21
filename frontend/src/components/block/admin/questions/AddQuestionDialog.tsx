import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'

// Form validation interface
interface FormErrors {
  title?: string
  options?: string[]
  correctAnswers?: string
  sampleAnswer?: string
  points?: string
}

interface NewQuestion {
  title: string;
  type: 'single_choice' | 'multiple_choice' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  options: { text: string; id?: string }[];
  correctAnswers: string[];
  sampleAnswer: string;
}

interface AddQuestionDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  newQuestion: NewQuestion
  setNewQuestion: (question: NewQuestion) => void
  formErrors: FormErrors
  setFormErrors: (errors: FormErrors) => void
  submitLoading: boolean
  onSubmit: () => void
  onCancel: () => void
  onOptionChange: (index: number, value: string) => void
  onCorrectAnswerToggle: (optionIndex: number) => void
  onAddOption: () => void
  onRemoveOption: (index: number) => void
}

export const AddQuestionDialog = ({
  isOpen,
  onOpenChange,
  newQuestion,
  setNewQuestion,
  formErrors,
  setFormErrors,
  submitLoading,
  onSubmit,
  onCancel,
  onOptionChange,
  onCorrectAnswerToggle,
  onAddOption,
  onRemoveOption
}: AddQuestionDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Question</DialogTitle>
          <DialogDescription>
            Create a new question for the question bank. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Question Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Question Title *</label>
            <Textarea
              placeholder="Enter your question..."
              value={newQuestion.title}
              onChange={(e) => {
                setNewQuestion({ ...newQuestion, title: e.target.value })
                if (formErrors.title) {
                  setFormErrors({ ...formErrors, title: undefined })
                }
              }}
              className={formErrors.title ? 'border-red-500' : ''}
            />
            {formErrors.title && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {formErrors.title}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {newQuestion.title.length}/500 characters
            </p>
          </div>
          
          {/* Question Configuration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type *</label>
              <select 
                value={newQuestion.type} 
                onChange={(e) => {
                  const newType = e.target.value as 'single_choice' | 'multiple_choice' | 'essay'
                  setNewQuestion({ 
                    ...newQuestion, 
                    type: newType,
                    correctAnswers: [], // Reset correct answers when type changes
                    options: newType === 'essay' ? [] : newQuestion.options
                  })
                  setFormErrors({}) // Clear all errors when type changes
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="single_choice">Single Choice</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="essay">Essay</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty *</label>
              <select 
                value={newQuestion.difficulty} 
                onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                className="w-full p-2 border rounded-md"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Points *</label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={newQuestion.points}
                onChange={(e) => {
                  const points = parseInt(e.target.value) || 1
                  setNewQuestion({ ...newQuestion, points })
                  if (formErrors.points) {
                    setFormErrors({ ...formErrors, points: undefined })
                  }
                }}
                className={formErrors.points ? 'border-red-500' : ''}
              />
              {formErrors.points && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.points}
                </p>
              )}
            </div>
          </div>
          
          {/* Options for Choice Questions */}
          {(newQuestion.type === 'single_choice' || newQuestion.type === 'multiple_choice') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Answer Options *</label>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={onAddOption}
                    disabled={newQuestion.options.length >= 10}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Option
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                {newQuestion.options.map((option, index) => {
                  const optionId = `temp_${index}`
                  return (
                    <div key={index} className="space-y-2 p-3 border rounded-md">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onCorrectAnswerToggle(index)}
                          className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                            newQuestion.correctAnswers.includes(optionId) 
                              ? 'bg-primary border-primary text-white' 
                              : 'border-muted-foreground hover:border-primary'
                          }`}
                        >
                          {newQuestion.correctAnswers.includes(optionId) && (
                            <span className="text-xs font-bold">✓</span>
                          )}
                        </button>
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option.text}
                          onChange={(e) => onOptionChange(index, e.target.value)}
                          className="flex-1"
                          maxLength={200}
                        />
                        {newQuestion.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveOption(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {option.text.length}/200 characters
                      </p>
                    </div>
                  )
                })}
              </div>
              
              {formErrors.options && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {formErrors.options.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {formErrors.correctAnswers && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formErrors.correctAnswers}</AlertDescription>
                </Alert>
              )}
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Instructions:</strong>
                </p>
                <ul className="text-xs text-blue-600 mt-1 space-y-1">
                  <li>• Click the checkboxes to mark correct answers</li>
                  <li>• {newQuestion.type === 'single_choice' ? 'Select exactly one correct answer' : 'Select one or more correct answers'}</li>
                  <li>• Set points for each option (typically 0 for wrong answers)</li>
                  <li>• You can add up to 10 options</li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Essay Question Fields */}
          {newQuestion.type === 'essay' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sample Answer</label>
                <Textarea
                  placeholder="Provide a sample answer or key points that should be covered..."
                  value={newQuestion.sampleAnswer}
                  onChange={(e) => {
                    setNewQuestion({ ...newQuestion, sampleAnswer: e.target.value })
                    if (formErrors.sampleAnswer) {
                      setFormErrors({ ...formErrors, sampleAnswer: undefined })
                    }
                  }}
                  className={`h-32 ${formErrors.sampleAnswer ? 'border-red-500' : ''}`}
                  maxLength={2000}
                />
                {formErrors.sampleAnswer && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.sampleAnswer}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {newQuestion.sampleAnswer.length}/2000 characters. This will help graders understand what to look for in student responses.
                </p>
              </div>
            </div>
          )}
          
          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={submitLoading}>
              {submitLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Add Question'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 