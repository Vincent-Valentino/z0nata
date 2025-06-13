import { HomeNavbar } from '@/components/block/home'
import { useState } from 'react'

interface Question {
  id: number
  type: 'single' | 'multiple' | 'essay'
  question: string
  options?: string[]
  correctAnswer?: string | string[]
}

export const MockTestPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, any>>({})
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [essayAnswer, setEssayAnswer] = useState('')
  const [showResults, setShowResults] = useState(false)

  const questions: Question[] = [
    {
      id: 1,
      type: 'single',
      question: 'Apa yang dimaksud dengan Artificial Intelligence?',
      options: [
        'Simulasi kecerdasan manusia dalam mesin',
        'Program komputer biasa',
        'Sistem operasi canggih',
        'Database yang kompleks'
      ],
      correctAnswer: 'Simulasi kecerdasan manusia dalam mesin'
    },
    {
      id: 2,
      type: 'multiple',
      question: 'Manakah yang termasuk dalam kategori Machine Learning? (Pilih lebih dari satu)',
      options: [
        'Supervised Learning',
        'Unsupervised Learning',
        'HTML Programming',
        'Reinforcement Learning',
        'CSS Styling'
      ],
      correctAnswer: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning']
    },
    {
      id: 3,
      type: 'essay',
      question: 'Jelaskan perbedaan antara Machine Learning dan Deep Learning dalam konteks AI!',
      correctAnswer: ''
    }
  ]

  const handleSingleChoice = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: answer }))
  }

  const handleMultipleChoice = (option: string) => {
    const newSelection = selectedAnswers.includes(option)
      ? selectedAnswers.filter(a => a !== option)
      : [...selectedAnswers, option]
    
    setSelectedAnswers(newSelection)
    setAnswers(prev => ({ ...prev, [currentQuestion]: newSelection }))
  }

  const handleEssayChange = (value: string) => {
    setEssayAnswer(value)
    setAnswers(prev => ({ ...prev, [currentQuestion]: value }))
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      setSelectedAnswers([])
      setEssayAnswer('')
    } else {
      setShowResults(true)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
      const prevAnswer = answers[currentQuestion - 1]
      if (Array.isArray(prevAnswer)) {
        setSelectedAnswers(prevAnswer)
      } else if (typeof prevAnswer === 'string') {
        setEssayAnswer(prevAnswer)
      }
    }
  }

  const calculateScore = () => {
    let correct = 0
    questions.forEach((q, index) => {
      const userAnswer = answers[index]
      if (q.type === 'single' && userAnswer === q.correctAnswer) {
        correct++
      } else if (q.type === 'multiple' && Array.isArray(userAnswer) && Array.isArray(q.correctAnswer)) {
        if (userAnswer.length === q.correctAnswer.length && 
            userAnswer.every(a => q.correctAnswer?.includes(a))) {
          correct++
        }
      }
    })
    return Math.round((correct / questions.filter(q => q.type !== 'essay').length) * 100)
  }

  if (showResults) {
    const score = calculateScore()
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <HomeNavbar />
        <div className="pt-24 pb-16">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
              <div className="mb-8">
                <div className={`text-6xl font-bold mb-4 ${score >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {score}%
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {score >= 70 ? 'Selamat!' : 'Perlu Belajar Lagi'}
                </h2>
                <p className="text-gray-600">
                  {score >= 70 
                    ? 'Anda berhasil menyelesaikan mock test dengan baik!'
                    : 'Jangan menyerah, terus belajar untuk hasil yang lebih baik!'
                  }
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-600">{questions.length}</div>
                  <div className="text-sm text-gray-600">Total Soal</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((score / 100) * questions.filter(q => q.type !== 'essay').length)}
                  </div>
                  <div className="text-sm text-gray-600">Benar</div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <div className="text-2xl font-bold text-red-600">
                    {questions.filter(q => q.type !== 'essay').length - Math.round((score / 100) * questions.filter(q => q.type !== 'essay').length)}
                  </div>
                  <div className="text-sm text-gray-600">Salah</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setCurrentQuestion(0)
                    setAnswers({})
                    setSelectedAnswers([])
                    setEssayAnswer('')
                    setShowResults(false)
                  }}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Ulangi Test
                </button>
                <button
                  onClick={() => window.location.href = '/dokumentasi'}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Pelajari Materi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <HomeNavbar />
      
      {/* Header */}
      <div className="pt-24 pb-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Mock 
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"> Test</span>
            </h1>
            <p className="text-lg text-gray-600">
              Simulasi ujian HCIA-AI untuk mengukur pemahaman Anda
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="container mx-auto max-w-4xl px-4 mb-8">
        <div className="bg-white rounded-full p-1 shadow-sm border border-gray-200">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Soal {currentQuestion + 1} dari {questions.length}</span>
          <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}% selesai</span>
        </div>
      </div>

      {/* Question Content */}
      <div className="container mx-auto max-w-4xl px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                {question.type === 'single' ? 'Pilihan Tunggal' : 
                 question.type === 'multiple' ? 'Pilihan Berganda' : 'Essay'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 leading-relaxed">
              {question.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-4 mb-8">
            {question.type === 'single' && question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSingleChoice(option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  answers[currentQuestion] === option
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    answers[currentQuestion] === option
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-gray-300'
                  }`}>
                    {answers[currentQuestion] === option && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <span className="text-gray-800">{option}</span>
                </div>
              </button>
            ))}

            {question.type === 'multiple' && question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleMultipleChoice(option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedAnswers.includes(option)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded border-2 ${
                    selectedAnswers.includes(option)
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswers.includes(option) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-800">{option}</span>
                </div>
              </button>
            ))}

            {question.type === 'essay' && (
              <textarea
                value={essayAnswer}
                onChange={(e) => handleEssayChange(e.target.value)}
                placeholder="Tulis jawaban Anda di sini..."
                className="w-full h-40 p-4 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sebelumnya
            </button>
            <button
              onClick={nextQuestion}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {currentQuestion === questions.length - 1 ? 'Selesai' : 'Selanjutnya'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 