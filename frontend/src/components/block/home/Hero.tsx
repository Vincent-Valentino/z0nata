import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavbarButton, Tooltip } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'

export const Hero = () => {
  const [currentWord, setCurrentWord] = useState(0)
  const [showTestMenu, setShowTestMenu] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const blackWords = ["Halo, ", "Coba ", "Coba ", "Bank "]
  const greenWords = ["Sobat Mikro", "Mock Test", "Time Quiz", "Soal Huawei"]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord(prev => (prev + 1) % blackWords.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTestMenu(false)
      }
    }

    if (showTestMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTestMenu])

  const handleStartTest = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setShowTestMenu(!showTestMenu)
  }

  const handleDocumentation = () => {
    navigate('/dokumentasi')
  }

  const handleTestSelection = (testType: 'mock' | 'time') => {
    if (testType === 'mock') {
      navigate('/mock-test')
    } else {
      navigate('/time-quiz')
    }
    setShowTestMenu(false)
  }

  const features = [
    { 
      icon: '🎯', 
      text: '3 Tipe Soal',
      tooltip: 'Pilihan berganda, pilihan berganda dengan beberapa jawaban, dan juga Essay'
    },
    { 
      icon: '📊', 
      text: '2 Tipe Tes',
      tooltip: 'Mock Test untuk simulasi ujian dan Time Quiz untuk latihan cepat'
    },
    { 
      icon: '🚀', 
      text: '200+ Soal',
      tooltip: 'Koleksi lengkap soal-soal Huawei yang terus diperbarui'
    },
    { 
      icon: '🔒', 
      text: '100% Gratis',
      tooltip: 'Akses penuh tanpa biaya tersembunyi atau langganan premium'
    }
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
      <div className="container mx-auto max-w-6xl text-center">
        {/* Main Hero Content */}
        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 hover:bg-white/40 backdrop-blur-sm border border-emerald-200 rounded-full px-3 sm:px-4 py-2 mb-6 sm:mb-8 transition-all duration-200 cursor-pointer">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-emerald-700 hover:text-black transition-colors duration-200">
              Bank Soal Huawei
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold font-poppins mb-4 sm:mb-6 leading-tight px-2">
            <span className="text-gray-900">{blackWords[currentWord]}</span>{' '}
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                {greenWords[currentWord]}
              </span>
              <div className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 animate-pulse">
                {greenWords[currentWord]}
              </div>
            </span>
            <br />
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 font-inter max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
            Belajar dengan cara yang lebih efektif dan efisien dengan Bank Soal Huawei.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4 relative">
            <div className="relative" ref={dropdownRef}>
              <NavbarButton 
                onClick={handleStartTest}
                variant="primary" 
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isAuthenticated ? 'Mulai Test' : 'Login untuk Mulai Test'}
              </NavbarButton>
              
              {/* Test Selection Dropdown */}
              {showTestMenu && isAuthenticated && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-2">
                    <button
                      onClick={() => handleTestSelection('mock')}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <div className="font-semibold text-emerald-600">Mock Test</div>
                      <div className="text-sm text-gray-600">60+ soal simulasi ujian</div>
                    </button>
                    <button
                      onClick={() => handleTestSelection('time')}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <div className="font-semibold text-blue-600">Time Quiz</div>
                      <div className="text-sm text-gray-600">20 soal latihan cepat</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <NavbarButton 
              onClick={handleDocumentation}
              variant="secondary" 
              className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-semibold border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 transform hover:scale-105 transition-all duration-200 min-w-0 max-w-xs sm:max-w-none"
            >
              <span className="truncate">Baca Dokumentasi</span>
            </NavbarButton>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-12 sm:mb-16 px-2">
            {features.map((feature, index) => (
              <Tooltip key={index} content={feature.tooltip} position="bottom">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-black/90 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-center">
                  <span className="text-sm sm:text-lg">{feature.icon}</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-100 whitespace-nowrap">{feature.text}</span>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Floating Elements - Reduced on mobile for performance */}
        <div className="hidden sm:block absolute top-1/4 left-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
        <div className="hidden sm:block absolute top-1/3 right-16 w-16 h-16 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="hidden sm:block absolute bottom-1/4 left-1/4 w-12 h-12 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
        <div className="hidden sm:block absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-to-r from-emerald-300 to-teal-300 rounded-full opacity-10 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '6s' }}></div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-500 font-medium">Scroll to explore</span>
            <div className="w-5 sm:w-6 h-8 sm:h-10 border-2 border-gray-300 rounded-full flex justify-center">
              <div className="w-1 h-2 sm:h-3 bg-gray-400 rounded-full mt-1.5 sm:mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 