import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, Target, FileText } from 'lucide-react'
import type { QuestionResult } from '@/types/quiz'

interface QuestionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  questionResult: QuestionResult
  questionNumber: number
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  isOpen,
  onClose,
  questionResult,
  questionNumber
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isUserAnswerCorrect = (optionId: string) => {
    const userAnswers = Array.isArray(questionResult.user_answer) 
      ? questionResult.user_answer 
      : [questionResult.user_answer]
    const correctAnswers = Array.isArray(questionResult.correct_answer)
      ? questionResult.correct_answer
      : [questionResult.correct_answer]
    
    return userAnswers.includes(optionId) && correctAnswers.includes(optionId)
  }

  const isUserAnswerWrong = (optionId: string) => {
    const userAnswers = Array.isArray(questionResult.user_answer) 
      ? questionResult.user_answer 
      : [questionResult.user_answer]
    const correctAnswers = Array.isArray(questionResult.correct_answer)
      ? questionResult.correct_answer
      : [questionResult.correct_answer]
    
    return userAnswers.includes(optionId) && !correctAnswers.includes(optionId)
  }

  const isCorrectAnswer = (optionId: string) => {
    const correctAnswers = Array.isArray(questionResult.correct_answer)
      ? questionResult.correct_answer
      : [questionResult.correct_answer]
    
    return correctAnswers.includes(optionId)
  }

  const isUserSelected = (optionId: string) => {
    const userAnswers = Array.isArray(questionResult.user_answer) 
      ? questionResult.user_answer 
      : [questionResult.user_answer]
    
    return userAnswers.includes(optionId)
  }

  const getOptionStatus = (optionId: string) => {
    if (isUserAnswerCorrect(optionId)) return 'correct-selected'
    if (isUserAnswerWrong(optionId)) return 'wrong-selected'
    if (isCorrectAnswer(optionId)) return 'correct-unselected'
    if (isUserSelected(optionId)) return 'wrong-selected'
    return 'unselected'
  }

  const getOptionStyles = (status: string) => {
    switch (status) {
      case 'correct-selected':
        return 'bg-green-50 border-green-300 text-green-900'
      case 'wrong-selected':
        return 'bg-red-50 border-red-300 text-red-900'
      case 'correct-unselected':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <FileText className="w-6 h-6" />
            Question {questionNumber} - Detailed Review
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge className={getDifficultyColor(questionResult.difficulty)}>
                    {questionResult.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    {questionResult.type.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline">
                    {questionResult.points} points
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {formatTime(questionResult.time_spent)}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4" />
                    <span className={questionResult.is_correct ? 'text-green-600' : 'text-red-600'}>
                      {questionResult.points_earned}/{questionResult.points}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Question</h3>
                  <p className="text-gray-700 leading-relaxed">{questionResult.title}</p>
                </div>

                {questionResult.is_skipped && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800 text-sm font-medium">This question was skipped</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Answer Options */}
          {questionResult.type !== 'essay' && questionResult.options && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Answer Options</h3>
                <div className="space-y-3">
                  {questionResult.options.map((option, index) => {
                    const status = getOptionStatus(option.id)
                    const styles = getOptionStyles(status)
                    
                    return (
                      <div
                        key={option.id}
                        className={`p-4 border-2 rounded-lg transition-all ${styles}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-full">
                              {String.fromCharCode(65 + index)}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base break-words leading-relaxed">
                              {option.text}
                            </p>
                          </div>

                          <div className="flex-shrink-0 flex items-center gap-2">
                            {isUserSelected(option.id) && (
                              <Badge variant="outline" className="text-xs">
                                Your Answer
                              </Badge>
                            )}
                            
                            {isCorrectAnswer(option.id) && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <Badge variant="default" className="text-xs bg-green-600">
                                  Correct
                                </Badge>
                              </div>
                            )}
                            
                            {isUserAnswerWrong(option.id) && (
                              <div className="flex items-center gap-1">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <Badge variant="destructive" className="text-xs">
                                  Wrong
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Essay Answer */}
          {questionResult.type === 'essay' && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Your Answer</h3>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {questionResult.user_answer || 'No answer provided'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Correct Answer for Essay */}
              {questionResult.correct_answer && questionResult.correct_answer !== '0' && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Correct Answer</h3>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 whitespace-pre-wrap">
                        {Array.isArray(questionResult.correct_answer) 
                          ? questionResult.correct_answer.join('\n') 
                          : questionResult.correct_answer}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Result Summary */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Result Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                    questionResult.is_correct ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {questionResult.is_correct ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {questionResult.is_correct ? 'Correct' : 'Incorrect'}
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {questionResult.points_earned}
                  </div>
                  <p className="text-sm text-gray-600">Points Earned</p>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {formatTime(questionResult.time_spent)}
                  </div>
                  <p className="text-sm text-gray-600">Time Spent</p>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {questionResult.difficulty}
                  </div>
                  <p className="text-sm text-gray-600">Difficulty</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 