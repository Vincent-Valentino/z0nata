import { HomeNavbar } from '@/components/block/home'
import { useState, useEffect } from 'react'

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: string
}

export const TimeQuizPage = () => {
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isQuizStarted, setIsQuizStarted] = useState(false)
  const [answers, setAnswers] = useState<string[]>([])

  const questions: QuizQuestion[] = [
    {
      id: 1,
      question: 'Algoritma pembelajaran yang menggunakan data berlabel adalah?',
      options: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Transfer Learning'],
      correctAnswer: 'Supervised Learning'
    },
    {
      id: 2,
      question: 'Activation function yang paling umum digunakan dalam deep learning adalah?',
      options: ['Sigmoid', 'Tanh', 'ReLU', 'Softmax'],
      correctAnswer: 'ReLU'
    },
    {
      id: 3,
      question: 'Teknik untuk mencegah overfitting dalam neural network adalah?',
      options: ['Dropout', 'Batch Normalization', 'Data Augmentation', 'Semua benar'],
      correctAnswer: 'Semua benar'
    },
    {
      id: 4,
      question: 'Framework AI yang dikembangkan oleh Huawei adalah?',
      options: ['TensorFlow', 'PyTorch', 'MindSpore', 'Keras'],
      correctAnswer: 'MindSpore'
    },
    {
      id: 5,
      question: 'CNN (Convolutional Neural Network) paling cocok untuk?',
      options: ['Image Recognition', 'Text Analysis', 'Time Series', 'Clustering'],
      correctAnswer: 'Image Recognition'
    },
    {
      id: 6,
      question: 'Loss function untuk klasifikasi multi-class adalah?',
      options: ['Mean Squared Error', 'Cross Entropy', 'Hinge Loss', 'Huber Loss'],
      correctAnswer: 'Cross Entropy'
    },
    {
      id: 7,
      question: 'Optimizer yang menggunakan momentum adalah?',
      options: ['SGD', 'Adam', 'RMSprop', 'Semua benar'],
      correctAnswer: 'Semua benar'
    },
    {
      id: 8,
      question: 'Hyperparameter yang mengontrol kecepatan pembelajaran adalah?',
      options: ['Learning Rate', 'Batch Size', 'Epochs', 'Dropout Rate'],
      correctAnswer: 'Learning Rate'
    }
  ]

  // Timer effect
  useEffect(() => {
    if (isQuizStarted && timeLeft > 0 && !showResult) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setShowResult(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isQuizStarted, timeLeft, showResult])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer)
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)
    
    if (answer === questions[currentQuestion].correctAnswer) {
      setScore(prev => prev + 1)
    }

    // Auto advance after 1 second
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1)
        setSelectedAnswer('')
      } else {
        setShowResult(true)
      }
    }, 1000)
  }

  const startQuiz = () => {
    setIsQuizStarted(true)
    setTimeLeft(300)
    setCurrentQuestion(0)
    setScore(0)
    setAnswers([])
    setShowResult(false)
  }

  const resetQuiz = () => {
    setIsQuizStarted(false)
    setTimeLeft(300)
    setCurrentQuestion(0)
    setScore(0)
    setSelectedAnswer('')
    setAnswers([])
    setShowResult(false)
  }

  if (!isQuizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <HomeNavbar />
        <div className="pt-24 pb-16">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
              <div className="mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Time 
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"> Quiz</span>
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Uji kecepatan dan ketepatan Anda dalam menjawab soal AI
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">5:00</div>
                  <div className="text-gray-600">Waktu Total</div>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{questions.length}</div>
                  <div className="text-gray-600">Total Soal</div>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-2">⚡</div>
                  <div className="text-gray-600">Quick Fire</div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                <p className="text-yellow-800 font-medium">
                  <span className="font-semibold">Petunjuk:</span> Jawab secepat mungkin! 
                  Setelah memilih jawaban, soal akan otomatis berlanjut ke soal berikutnya.
                </p>
              </div>

              <button
                onClick={startQuiz}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xl font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Mulai Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100)
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <HomeNavbar />
        <div className="pt-24 pb-16">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
              <div className="mb-8">
                <div className={`text-6xl font-bold mb-4 ${percentage >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {percentage}%
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Quiz Selesai!
                </h2>
                <p className="text-gray-600">
                  {percentage >= 70 
                    ? 'Excellent! Kecepatan dan ketepatan Anda sangat baik!'
                    : 'Terus berlatih untuk meningkatkan kecepatan dan akurasi!'
                  }
                </p>
              </div>
              
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-600">{score}</div>
                  <div className="text-sm text-gray-600">Benar</div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{questions.length - score}</div>
                  <div className="text-sm text-gray-600">Salah</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{formatTime(300 - timeLeft)}</div>
                  <div className="text-sm text-gray-600">Waktu Terpakai</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{Math.round((300 - timeLeft) / questions.length)}</div>
                  <div className="text-sm text-gray-600">Detik/Soal</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={resetQuiz}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Ulangi Quiz
                </button>
                <button
                  onClick={() => window.location.href = '/mock-test'}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Coba Mock Test
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
      
      {/* Timer and Progress */}
      <div className="pt-24 pb-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className={`text-3xl font-bold ${timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-gray-600">
                Soal {currentQuestion + 1}/{questions.length}
              </div>
            </div>
            <div className="text-emerald-600 font-semibold text-lg">
              Score: {score}/{currentQuestion}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="bg-white rounded-full p-1 shadow-sm border border-gray-200">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="container mx-auto max-w-4xl px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 leading-relaxed">
              {question.question}
            </h2>
          </div>

          <div className="grid gap-4">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={selectedAnswer !== ''}
                className={`p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  selectedAnswer === option
                    ? option === question.correctAnswer
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-red-500 bg-red-50 text-red-800'
                    : selectedAnswer !== '' && option === question.correctAnswer
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                } ${selectedAnswer !== '' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {selectedAnswer !== '' && option === question.correctAnswer && (
                    <span className="text-emerald-600">✓</span>
                  )}
                  {selectedAnswer === option && option !== question.correctAnswer && (
                    <span className="text-red-600">✗</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 