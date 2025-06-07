import { useState, useEffect } from 'react'
import { NavbarButton, Tooltip } from '@/components/ui'

export const Hero = () => {
  const [currentWord, setCurrentWord] = useState(0)
  const blackWords = ["Halo, ", "Coba ", "Coba ", "Bank "]
  const greenWords = ["Sobat Mikro", "Mock Test", "Time Quiz", "Soal Huawei"]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord(prev => (prev + 1) % blackWords.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

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
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="container mx-auto max-w-6xl text-center">
        {/* Main Hero Content */}
        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 hover:bg-white/40 backdrop-blur-sm border border-emerald-200 rounded-full px-4 py-2 mb-8 transition-all duration-200 cursor-pointer">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-emerald-700 hover:text-black transition-colors duration-200">
              Bank Soal Huawei
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-poppins mb-6 leading-tight">
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
          <p className="text-lg md:text-xl text-gray-600 font-inter max-w-3xl mx-auto mb-8 leading-relaxed">
            Belajar dengan cara yang lebih efektif dan efisien dengan Bank Soal Huawei.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <NavbarButton 
              variant="primary" 
              className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Mulai Test
            </NavbarButton>
            
            <NavbarButton 
              variant="secondary" 
              className="px-8 py-4 text-lg font-semibold border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 transform hover:scale-105 transition-all duration-200"
            >
              Baca Dokumentasi
            </NavbarButton>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {features.map((feature, index) => (
              <Tooltip key={index} content={feature.tooltip} position="bottom">
                <div className="flex items-center gap-2 bg-black/90 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                  <span className="text-lg">{feature.icon}</span>
                  <span className="text-sm font-medium text-gray-100">{feature.text}</span>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
        <div className="absolute top-1/3 right-16 w-16 h-16 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-to-r from-emerald-300 to-teal-300 rounded-full opacity-10 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '6s' }}></div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Scroll to explore</span>
            <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 