import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target, 
  Trophy, 
  BarChart3,
  BookOpen,
  Zap,
  Award,
  Flame
} from 'lucide-react'

interface DemoQuestion {
  id: string
  title: string
  options: Array<{
    id: string
    text: string
    isCorrect: boolean
  }>
  correctAnswer: string
  explanation: string
  type: 'single_choice' | 'multiple_choice'
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
}

const demoQuestions: DemoQuestion[] = [
  {
    id: 'q1',
    title: 'Apa yang dimaksud dengan Machine Learning dalam konteks Artificial Intelligence?',
    options: [
      { id: 'a', text: 'Sistem yang dapat belajar dari data tanpa pemrograman eksplisit', isCorrect: true },
      { id: 'b', text: 'Program komputer yang dapat bermain game', isCorrect: false },
      { id: 'c', text: 'Teknologi untuk mengontrol robot', isCorrect: false },
      { id: 'd', text: 'Aplikasi untuk menganalisis big data', isCorrect: false }
    ],
    correctAnswer: 'a',
    explanation: 'Machine Learning adalah subset dari AI yang memungkinkan sistem belajar dan meningkatkan kinerja dari pengalaman tanpa pemrograman eksplisit.',
    type: 'single_choice',
    difficulty: 'easy',
    points: 10
  },
  {
    id: 'q2',
    title: 'Manakah dari berikut ini yang termasuk dalam supervised learning? (Pilih semua yang benar)',
    options: [
      { id: 'a', text: 'Linear Regression', isCorrect: true },
      { id: 'b', text: 'K-Means Clustering', isCorrect: false },
      { id: 'c', text: 'Decision Tree', isCorrect: true },
      { id: 'd', text: 'Random Forest', isCorrect: true }
    ],
    correctAnswer: 'a,c,d',
    explanation: 'Supervised learning menggunakan data berlabel. Linear Regression, Decision Tree, dan Random Forest adalah algoritma supervised learning, sedangkan K-Means adalah unsupervised learning.',
    type: 'multiple_choice',
    difficulty: 'medium',
    points: 15
  }
]

export const Demo = () => {
  const [activeTab, setActiveTab] = useState('mocktest')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: string[]}>({})
  const [showFeedback, setShowFeedback] = useState<{[key: string]: boolean}>({})
  const [timeRemaining, setTimeRemaining] = useState(332) // 5:32 in seconds

  const tabs = [
    { id: 'mocktest', label: 'Mock Test', icon: '🎯' },
    { id: 'timequiz', label: 'Time Quiz', icon: '⏱️' },
    { id: 'results', label: 'Hasil Test', icon: '📊' }
  ]

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setShowFeedback({})
  }

  const currentQuestion = demoQuestions[currentQuestionIndex]
  const questionKey = `${activeTab}-${currentQuestion?.id}`

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    const question = demoQuestions.find(q => q.id === questionId)
    if (!question) return

    const key = `${activeTab}-${questionId}`
    const currentAnswers = selectedAnswers[key] || []

    let newAnswers: string[]
    if (question.type === 'multiple_choice') {
      if (currentAnswers.includes(optionId)) {
        newAnswers = currentAnswers.filter(id => id !== optionId)
      } else {
        newAnswers = [...currentAnswers, optionId]
      }
    } else {
      newAnswers = [optionId]
    }

    setSelectedAnswers(prev => ({ ...prev, [key]: newAnswers }))

    // Show feedback after 500ms delay
    setTimeout(() => {
      setShowFeedback(prev => ({ ...prev, [key]: true }))
    }, 500)
  }

  const isAnswerCorrect = (questionId: string) => {
    const question = demoQuestions.find(q => q.id === questionId)
    if (!question) return false

    const key = `${activeTab}-${questionId}`
    const userAnswers = selectedAnswers[key] || []
    const correctAnswers = question.correctAnswer.split(',')

    return userAnswers.length === correctAnswers.length && 
           userAnswers.every(answer => correctAnswers.includes(answer))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getOptionClass = (questionId: string, optionId: string, isCorrectOption: boolean) => {
    const key = `${activeTab}-${questionId}`
    const userAnswers = selectedAnswers[key] || []
    const isSelected = userAnswers.includes(optionId)
    const showingFeedback = showFeedback[key]

    if (!showingFeedback) {
      return isSelected 
        ? 'bg-blue-100 border-blue-300 hover:bg-blue-200' 
        : 'hover:bg-gray-50 border-gray-200'
    }

    if (isCorrectOption) {
      return 'bg-green-100 border-green-300 text-green-800'
    }

    if (isSelected && !isCorrectOption) {
      return 'bg-red-100 border-red-300 text-red-800'
    }

    return 'border-gray-200 text-gray-600'
  }

  return (
    <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-100 rounded-full px-4 py-2 mb-6">
            <span className="text-emerald-600 font-medium">🎮 Demo Platform</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-poppins mb-6 text-gray-900">
            Lihat Bagaimana <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Platform Bekerja</span>
          </h2>
          <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
            Jelajahi fitur-fitur lengkap Bank Soal Huawei dengan demo interaktif yang menunjukkan pengalaman pengguna sebenarnya.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8 overflow-x-auto px-4">
          <div className="flex bg-gray-100 rounded-xl p-1 min-w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                <span className="text-sm sm:text-base">{tab.icon}</span>
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mx-4 sm:mx-0">
          {/* Browser Header */}
          <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 sm:gap-2">
                <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-red-400"></div>
                <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-yellow-400"></div>
                <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 mx-2 sm:mx-4">
                <div className="bg-white rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 border truncate">
                  🔒 z0nata.vercel.app/demo
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-8 min-h-[400px] sm:min-h-[500px]">
            {activeTab === 'mocktest' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-xl font-bold text-gray-900">HCIA-AI V3.0 Mock Test</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <Badge variant="outline" className="gap-1">
                      <Clock className="w-3 h-3" />
                      90 menit
                    </Badge>
                    <Badge variant="outline">📝 60 soal</Badge>
                    <Badge variant="outline">🎯 600 poin</Badge>
                  </div>
                </div>
                
                {/* Question Card */}
                <Card className="shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary">
                        Soal {currentQuestionIndex + 1} dari {demoQuestions.length}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Badge variant={currentQuestion?.difficulty === 'easy' ? 'secondary' : 'default'}>
                          {currentQuestion?.difficulty} • {currentQuestion?.points} pts
                        </Badge>
                      </div>
                    </div>
                    <Progress value={((currentQuestionIndex + 1) / demoQuestions.length) * 100} className="h-2" />
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <CardTitle className="text-lg leading-relaxed font-medium">
                      {currentQuestion?.title}
                    </CardTitle>
                    
                    <div className="space-y-3">
                      {currentQuestion?.options.map((option, index) => (
                        <Button
                          key={option.id}
                          variant="outline"
                          onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                          className={`w-full text-left justify-start min-h-[48px] py-3 px-4 transition-all duration-300 ${
                            getOptionClass(currentQuestion.id, option.id, option.isCorrect)
                          }`}
                        >
                          <div className="flex items-start gap-3 w-full">
                            <div className="flex items-center gap-2">
                              {currentQuestion.type === 'multiple_choice' ? (
                                <input 
                                  type="checkbox" 
                                  checked={(selectedAnswers[questionKey] || []).includes(option.id)}
                                  readOnly
                                  className="rounded"
                                />
                              ) : (
                                <input 
                                  type="radio" 
                                  checked={(selectedAnswers[questionKey] || []).includes(option.id)}
                                  readOnly
                                  className="rounded-full"
                                />
                              )}
                              <span className="font-semibold text-gray-700">
                                {String.fromCharCode(65 + index)}.
                              </span>
                            </div>
                            <span className="text-sm leading-relaxed text-left">{option.text}</span>
                            {showFeedback[questionKey] && option.isCorrect && (
                              <CheckCircle className="w-4 h-4 text-green-600 ml-auto flex-shrink-0" />
                            )}
                            {showFeedback[questionKey] && (selectedAnswers[questionKey] || []).includes(option.id) && !option.isCorrect && (
                              <XCircle className="w-4 h-4 text-red-600 ml-auto flex-shrink-0" />
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>

                    {/* Feedback */}
                    {showFeedback[questionKey] && (
                      <Alert className={isAnswerCorrect(currentQuestion.id) ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
                        <div className="flex items-start gap-2">
                          {isAnswerCorrect(currentQuestion.id) ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <AlertDescription className="font-medium mb-2">
                              {isAnswerCorrect(currentQuestion.id) ? 
                                `Benar! +${currentQuestion.points} poin` : 
                                'Jawaban kurang tepat'
                              }
                            </AlertDescription>
                            <AlertDescription className="text-sm">
                              <strong>Penjelasan:</strong> {currentQuestion.explanation}
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                
                {/* Navigation */}
                <div className="flex justify-between gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-6"
                  >
                    ← Sebelumnya
                  </Button>
                  <Button 
                    onClick={() => {
                      if (currentQuestionIndex === demoQuestions.length - 1) {
                        handleTabChange('results')
                      } else {
                        setCurrentQuestionIndex(Math.min(demoQuestions.length - 1, currentQuestionIndex + 1))
                      }
                    }}
                    className="px-6 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {currentQuestionIndex === demoQuestions.length - 1 ? 'Lihat Hasil →' : 'Selanjutnya →'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'timequiz' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">Quick Quiz - AI Fundamentals</h3>
                  </div>
                  <div className="flex items-center gap-2 bg-red-100 px-4 py-2 rounded-full">
                    <Clock className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 font-bold text-lg">{formatTime(timeRemaining)}</span>
                    <span className="text-red-600 text-sm">tersisa</span>
                  </div>
                </div>
                
                {/* Question Card */}
                <Card className="shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary">
                        Soal {currentQuestionIndex + 1} dari {demoQuestions.length}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Badge variant={currentQuestion?.difficulty === 'medium' ? 'default' : 'secondary'}>
                          {currentQuestion?.difficulty} • {currentQuestion?.points} pts
                        </Badge>
                        <Badge variant="outline" className="text-blue-600">
                          {currentQuestion?.type === 'multiple_choice' ? 'Multi Choice' : 'Single Choice'}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={((currentQuestionIndex + 1) / demoQuestions.length) * 100} className="h-2" />
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <CardTitle className="text-lg leading-relaxed font-medium">
                      {currentQuestion?.title}
                    </CardTitle>
                    
                    <div className="space-y-3">
                      {currentQuestion?.options.map((option, index) => (
                        <Button
                          key={option.id}
                          variant="outline"
                          onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                          className={`w-full text-left justify-start min-h-[48px] py-3 px-4 transition-all duration-300 ${
                            getOptionClass(currentQuestion.id, option.id, option.isCorrect)
                          }`}
                        >
                          <div className="flex items-start gap-3 w-full">
                            <div className="flex items-center gap-2">
                              {currentQuestion.type === 'multiple_choice' ? (
                                <input 
                                  type="checkbox" 
                                  checked={(selectedAnswers[questionKey] || []).includes(option.id)}
                                  readOnly
                                  className="rounded text-blue-600"
                                />
                              ) : (
                                <input 
                                  type="radio" 
                                  checked={(selectedAnswers[questionKey] || []).includes(option.id)}
                                  readOnly
                                  className="rounded-full text-blue-600"
                                />
                              )}
                              <span className="font-semibold text-gray-700">
                                {String.fromCharCode(65 + index)}.
                              </span>
                            </div>
                            <span className="text-sm leading-relaxed text-left">{option.text}</span>
                            {showFeedback[questionKey] && option.isCorrect && (
                              <CheckCircle className="w-4 h-4 text-green-600 ml-auto flex-shrink-0" />
                            )}
                            {showFeedback[questionKey] && (selectedAnswers[questionKey] || []).includes(option.id) && !option.isCorrect && (
                              <XCircle className="w-4 h-4 text-red-600 ml-auto flex-shrink-0" />
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>

                    {/* Instant Feedback for Time Quiz */}
                    {showFeedback[questionKey] && (
                      <Alert className={isAnswerCorrect(currentQuestion.id) ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
                        <div className="flex items-start gap-2">
                          {isAnswerCorrect(currentQuestion.id) ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <AlertDescription className="font-medium mb-2">
                              {isAnswerCorrect(currentQuestion.id) ? 
                                `Benar! +${currentQuestion.points} poin` : 
                                'Jawaban kurang tepat'
                              }
                            </AlertDescription>
                            <AlertDescription className="text-sm">
                              <strong>Penjelasan:</strong> {currentQuestion.explanation}
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                
                {/* Navigation */}
                <div className="flex justify-between gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCurrentQuestionIndex(Math.min(demoQuestions.length - 1, currentQuestionIndex + 1))
                      setShowFeedback(prev => ({ ...prev, [questionKey]: false }))
                    }}
                    className="px-6"
                  >
                    ← Skip
                  </Button>
                                     <Button 
                     onClick={() => {
                       if (showFeedback[questionKey]) {
                         if (currentQuestionIndex === demoQuestions.length - 1) {
                           handleTabChange('results')
                         } else {
                           setCurrentQuestionIndex(Math.min(demoQuestions.length - 1, currentQuestionIndex + 1))
                           setShowFeedback(prev => ({ ...prev, [questionKey]: false }))
                         }
                       } else {
                         setShowFeedback(prev => ({ ...prev, [questionKey]: true }))
                       }
                     }}
                     className="px-6 bg-blue-600 hover:bg-blue-700"
                   >
                     {showFeedback[questionKey] ? 
                       (currentQuestionIndex === demoQuestions.length - 1 ? 'Lihat Hasil →' : 'Lanjut →') : 
                       'Submit →'
                     }
                   </Button>
                </div>
              </div>
            )}

            {activeTab === 'results' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <BarChart3 className="w-8 h-8 text-emerald-600" />
                    <h3 className="text-2xl font-bold text-gray-900">Hasil Quiz & Statistik</h3>
                  </div>
                  <p className="text-gray-600">HCIA-AI V3.0 - Mock Test Completed</p>
                </div>

                {/* Overall Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                        <Trophy className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">720</div>
                      <div className="text-sm text-gray-600">Total Skor</div>
                      <Badge variant="default" className="mt-2 bg-green-100 text-green-800">
                        Pass (≥600)
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                        <Target className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">48/60</div>
                      <div className="text-sm text-gray-600">Jawaban Benar</div>
                      <div className="text-xs text-blue-600 mt-1">80% Akurasi</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                        <Clock className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">72m</div>
                      <div className="text-sm text-gray-600">Waktu Pengerjaan</div>
                      <div className="text-xs text-purple-600 mt-1">dari 90 menit</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
                        <Flame className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">7</div>
                      <div className="text-sm text-gray-600">Streak Harian</div>
                      <div className="text-xs text-orange-600 mt-1">Hari berturut-turut</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance by Category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Analisis per Kategori
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { category: 'AI Fundamentals', correct: 12, total: 15, percentage: 80, color: 'bg-green-500' },
                      { category: 'Machine Learning', correct: 18, total: 20, percentage: 90, color: 'bg-blue-500' },
                      { category: 'Deep Learning', correct: 10, total: 15, percentage: 67, color: 'bg-yellow-500' },
                      { category: 'AI Applications', correct: 8, total: 10, percentage: 80, color: 'bg-purple-500' }
                    ].map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">{item.category}</span>
                          <span className="text-sm text-gray-600">
                            {item.correct}/{item.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${item.color}`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-xs text-gray-500 mt-1">
                          {item.percentage}%
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Pencapaian
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                        <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-yellow-700">720</div>
                        <div className="text-sm text-yellow-600">Skor Tertinggi</div>
                      </div>

                      <div className="text-center p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
                        <Flame className="w-8 h-8 text-red-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-red-700">15</div>
                        <div className="text-sm text-red-600">Streak Terpanjang</div>
                      </div>

                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-700">82.5%</div>
                        <div className="text-sm text-blue-600">Akurasi Keseluruhan</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button variant="outline" className="px-6">
                    Review Jawaban
                  </Button>
                  <Button className="px-6 bg-emerald-600 hover:bg-emerald-700">
                    Coba Lagi
                  </Button>
                  <Button variant="outline" className="px-6">
                    Lihat Semua Hasil
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
} 