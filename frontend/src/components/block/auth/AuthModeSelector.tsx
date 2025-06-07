import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Waves } from 'lucide-react'

type AuthMode = 'mikroskil' | 'regular'

interface AuthModeSelectorProps {
  onModeSelect: (mode: AuthMode) => void
  onBack?: () => void
}

const EnhancedWaveAnimation = ({ color = "emerald" }: { color?: "emerald" | "blue" }) => (
  <div className="absolute inset-0 overflow-hidden">
    <motion.div
      className="absolute inset-0"
      animate={{
        x: [0, -30, 20, -10, 0],
        y: [0, -15, 10, -5, 0],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg className="w-full h-full opacity-8" viewBox="0 0 1200 1000" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`wave-gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.5"/>
            <stop offset="30%" stopColor="white" stopOpacity="0.3"/>
            <stop offset="70%" stopColor="white" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="white" stopOpacity="0.1"/>
          </linearGradient>
          <linearGradient id={`wave-gradient-2-${color}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
            <stop offset="50%" stopColor="white" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="white" stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        
        {/* First Wave Layer */}
        <motion.path
          d="M0,400 Q300,280 600,400 T1200,400 L1200,1000 L0,1000 Z"
          fill={`url(#wave-gradient-${color})`}
          animate={{
            d: [
              "M0,400 Q300,280 600,400 T1200,400 L1200,1000 L0,1000 Z",
              "M0,450 Q300,330 600,450 T1200,450 L1200,1000 L0,1000 Z",
              "M0,380 Q300,260 600,380 T1200,380 L1200,1000 L0,1000 Z",
              "M0,420 Q300,300 600,420 T1200,420 L1200,1000 L0,1000 Z",
              "M0,400 Q300,280 600,400 T1200,400 L1200,1000 L0,1000 Z"
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Second Wave Layer */}
        <motion.path
          d="M0,500 Q400,380 800,500 T1600,500 L1600,1000 L0,1000 Z"
          fill={`url(#wave-gradient-2-${color})`}
          animate={{
            d: [
              "M0,500 Q400,380 800,500 T1600,500 L1600,1000 L0,1000 Z",
              "M0,550 Q400,430 800,550 T1600,550 L1600,1000 L0,1000 Z",
              "M0,480 Q400,360 800,480 T1600,480 L1600,1000 L0,1000 Z",
              "M0,520 Q400,400 800,520 T1600,520 L1600,1000 L0,1000 Z",
              "M0,500 Q400,380 800,500 T1600,500 L1600,1000 L0,1000 Z"
            ]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
        />
        
        {/* Third Wave Layer */}
        <motion.path
          d="M0,600 Q250,480 500,600 T1000,600 L1000,1000 L0,1000 Z"
          fill={`url(#wave-gradient-${color})`}
          animate={{
            d: [
              "M0,600 Q250,480 500,600 T1000,600 L1000,1000 L0,1000 Z",
              "M0,630 Q250,510 500,630 T1000,630 L1000,1000 L0,1000 Z",
              "M0,580 Q250,460 500,580 T1000,580 L1000,1000 L0,1000 Z",
              "M0,610 Q250,490 500,610 T1000,610 L1000,1000 L0,1000 Z",
              "M0,600 Q250,480 500,600 T1000,600 L1000,1000 L0,1000 Z"
            ]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        />
        
        {/* Fourth Wave Layer */}
        <motion.path
          d="M0,700 Q200,580 400,700 T800,700 L800,1000 L0,1000 Z"
          fill={`url(#wave-gradient-2-${color})`}
          animate={{
            d: [
              "M0,700 Q200,580 400,700 T800,700 L800,1000 L0,1000 Z",
              "M0,720 Q200,600 400,720 T800,720 L800,1000 L0,1000 Z",
              "M0,680 Q200,560 400,680 T800,680 L800,1000 L0,1000 Z",
              "M0,705 Q200,585 400,705 T800,705 L800,1000 L0,1000 Z",
              "M0,700 Q200,580 400,700 T800,700 L800,1000 L0,1000 Z"
            ]
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4.5
          }}
        />
      </svg>
    </motion.div>
  </div>
)

const FloatingParticles = ({ color = "emerald" }: { color?: "emerald" | "blue" }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className={`absolute w-2 h-2 ${color === "emerald" ? "bg-emerald-300" : "bg-blue-300"} rounded-full opacity-30`}
        style={{
          left: `${20 + i * 15}%`,
          top: `${30 + i * 8}%`,
        }}
        animate={{
          y: [0, -20, 0],
          x: [0, 10, -5, 0],
          scale: [1, 1.2, 0.8, 1],
          opacity: [0.3, 0.6, 0.2, 0.3]
        }}
        transition={{
          duration: 4 + i * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.8
        }}
      />
    ))}
  </div>
)

export const AuthModeSelector = ({ onModeSelect, onBack }: AuthModeSelectorProps) => {
  return (
    <div className="min-h-screen relative">
      {/* Back Button */}
      {onBack && (
        <motion.div
          className="absolute top-6 left-6 z-50"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </motion.div>
      )}

      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Left Side - Mahasiswa Mikroskil */}
        <div 
          className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-12 flex flex-col justify-center items-center text-white cursor-pointer group transition-all duration-500 hover:from-emerald-700 hover:via-emerald-800 hover:to-teal-900"
          onClick={() => onModeSelect('mikroskil')}
        >
          {/* Enhanced Moving Waves */}
          <EnhancedWaveAnimation color="emerald" />
          <FloatingParticles color="emerald" />
          
          <div className="relative z-10 text-center max-w-md">
            {/* Mikroskil Logo */}
            <div 
              className="w-28 h-28 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 overflow-hidden shadow-2xl"
            >
              <img 
                src="https://akupintar.id/documents/20143/0/1623140380992-header_kampus-sekolah_tinggi_manajemen_informatika_dan_komputer_mikroskil.jpg/61378704-09c6-18b0-efbc-deb06399fafc?version=1.0&t=1623140381118&imageThumbnail=1"
                alt="Mikroskil Logo" 
                className="w-24 h-24 object-contain rounded-xl"
                onError={(e) => {
                  // Fallback if image fails to load
                  const img = e.currentTarget as HTMLImageElement;
                  const fallback = img.nextElementSibling as HTMLElement;
                  img.style.display = 'none';
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="w-full h-full bg-white/30 rounded-xl flex items-center justify-center text-xs font-bold text-white" style={{ display: 'none' }}>
                MIKROSKIL
              </div>
            </div>

            {/* Content */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-4">
                Mahasiswa Mikroskil
              </h2>
              <p className="text-emerald-100 text-lg mb-6">
                Akses penuh gratis untuk semua fitur platform
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-4 mb-8">
              {[
                'Masukkan NIM & Email Mikroskil',
                'Verifikasi identitas mahasiswa', 
                'Nikmati akses penuh platform'
              ].map((step, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 text-emerald-100 group-hover:translate-x-2 transition-transform duration-300"
                >
                  <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg">
                    {index + 1}
                  </div>
                  <span className="font-medium">{step}</span>
                </div>
              ))}
            </div>

            <Button 
              size="lg"
              className="w-full bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 py-3 text-lg"
              onClick={() => onModeSelect('mikroskil')}
            >
              Login dengan NIM
            </Button>
          </div>
        </div>

        {/* Right Side - Regular Users */}
        <div 
          className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex flex-col justify-center items-center text-white cursor-pointer group transition-all duration-500 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-900"
          onClick={() => onModeSelect('regular')}
        >
          {/* Enhanced Wave Animation for Regular Users */}
          <EnhancedWaveAnimation color="blue" />
          <FloatingParticles color="blue" />
          
          <div className="relative z-10 text-center max-w-md">
            {/* Icon */}
            <div 
              className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-2xl"
            >
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Content */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-4">
                Pengguna Reguler
              </h2>
              <p className="text-blue-100 text-lg mb-6">
                Daftar akun dan ajukan akses ke admin platform
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {[
                { text: 'Time Quiz unlimited', color: 'green' },
                { text: 'Akses dokumentasi lengkap', color: 'green' },
                { text: 'Mock Test (perlu persetujuan)', color: 'yellow' }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 text-blue-100 group-hover:translate-x-2 transition-transform duration-300"
                >
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
                      feature.color === 'green' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}
                  >
                    <svg 
                      className={`w-3 h-3 ${
                        feature.color === 'green' ? 'text-green-600' : 'text-yellow-600'
                      }`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      {feature.color === 'green' ? (
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      )}
                    </svg>
                  </div>
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            <Button 
              size="lg"
              className="w-full bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 py-3 text-lg"
              onClick={() => onModeSelect('regular')}
            >
              Daftar Akun
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 