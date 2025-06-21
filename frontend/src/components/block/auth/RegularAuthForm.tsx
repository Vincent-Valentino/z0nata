import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'
import { OAuthProviders } from './OAuthProviders'
import { handleOAuthLogin } from '@/store/authStore'
import { toast } from 'sonner'

interface RegularAuthFormProps {
  onBack: () => void
  onSubmit: (data: RegularFormData, authType: 'login' | 'register') => void
}

interface RegularFormData {
  email: string
  password: string
  name?: string
  confirmPassword?: string
}

const FloatingElement = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    animate={{
      y: [0, -10, 0],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
  >
    {children}
  </motion.div>
)

export const RegularAuthForm = ({ onBack, onSubmit }: RegularAuthFormProps) => {
  const [authType, setAuthType] = useState<'login' | 'register'>('login')
  const [formData, setFormData] = useState<RegularFormData>({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await onSubmit(formData, authType)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof RegularFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    })
  }

  const handleAuthTypeChange = (type: 'login' | 'register') => {
    setAuthType(type)
    resetForm()
  }

  const handleOAuthClick = async (provider: string) => {
    setIsLoading(true)
    try {
      await handleOAuthLogin(provider, 'user')
      toast.success(`Successfully logged in with ${provider}`)
    } catch (error: any) {
      console.error('OAuth login failed:', error)
      toast.error(error.message || `Failed to login with ${provider}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div 
      className="min-h-screen flex overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Left side - Form */}
      <motion.div 
        className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-12 xl:px-16 bg-white py-8 lg:py-16 min-h-screen lg:min-h-0"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <motion.div 
          className="max-w-md mx-auto w-full lg:max-h-[70vh] lg:overflow-y-auto [&::-webkit-scrollbar]:hidden"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* Internet Explorer 10+ */
          }}
        >
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="mb-4 sm:mb-6 -ml-2 hover:bg-gray-100 transition-colors duration-200 touch-manipulation"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            
            <motion.h1 
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              {authType === 'login' ? 'Masuk Akun' : 'Daftar Akun'}
            </motion.h1>
            <motion.p 
              className="text-gray-600 text-sm sm:text-base leading-relaxed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              {authType === 'login' 
                ? 'Masukkan email dan password Anda'
                : 'Buat akun baru untuk mengakses platform'
              }
            </motion.p>
          </motion.div>

          {/* OAuth Buttons */}
          <motion.div 
            className="space-y-4 mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <OAuthProviders onOAuthLogin={handleOAuthClick} isLoading={isLoading} />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">atau</span>
              </div>
            </div>
          </motion.div>

          {/* Auth Type Toggle */}
          <motion.div 
            className="flex rounded-lg bg-gray-100 p-1 gap-1 mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Button
              type="button"
              variant={authType === 'login' ? "default" : "ghost"}
              onClick={() => handleAuthTypeChange('login')}
              className={`flex-1 h-10 sm:h-11 text-sm font-medium transition-all touch-manipulation ${
                authType === 'login' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'bg-neutral-100 text-gray-600 hover:bg-white hover:text-gray-800'
              }`}
            >
              Masuk
            </Button>
            <Button
              type="button"
              variant={authType === 'register' ? "default" : "ghost"}
              onClick={() => handleAuthTypeChange('register')}
              className={`flex-1 h-10 sm:h-11 text-sm font-medium transition-all touch-manipulation ${
                authType === 'register' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'bg-neutral-100 text-gray-600 hover:bg-white hover:text-gray-800'
              }`}
            >
              Daftar
            </Button>
          </motion.div>

          {/* Form */}
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            key={authType}
          >
            {authType === 'register' && (
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nama Lengkap
                </label>
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    id="name"
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nama lengkap Anda"
                    required
                    className="h-11 transition-all duration-300 focus:shadow-lg"
                  />
                </motion.div>
              </motion.div>
            )}

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: authType === 'register' ? 0.2 : 0.1 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <motion.div
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="h-11 transition-all duration-300 focus:shadow-lg"
                />
              </motion.div>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: authType === 'register' ? 0.3 : 0.2 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <motion.div
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                  minLength={8}
                  className="h-11 transition-all duration-300 focus:shadow-lg"
                />
              </motion.div>
            </motion.div>

            {authType === 'register' && (
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Konfirmasi Password
                </label>
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword || ''}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Ulangi password"
                    required
                    className="h-11 transition-all duration-300 focus:shadow-lg"
                  />
                </motion.div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: authType === 'register' ? 0.5 : 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                  size="lg"
                >
                  {isLoading ? (
                    <motion.div 
                      className="flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div 
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                      {authType === 'login' ? 'Masuk...' : 'Mendaftar...'}
                    </motion.div>
                  ) : (
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      {authType === 'login' ? 'Masuk' : 'Daftar Akun'}
                    </motion.span>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </motion.form>
        </motion.div>
      </motion.div>

      {/* Right side - Info */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-center items-center text-white relative overflow-hidden"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* Animated background elements */}
        <motion.div 
          className="absolute inset-0 bg-white/5"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Floating circles */}
        <motion.div
          className="absolute top-20 left-20 w-20 h-20 bg-white/10 rounded-full"
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-32 right-16 w-16 h-16 bg-white/10 rounded-full"
          animate={{
            y: [0, 15, 0],
            x: [0, -15, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        
        <motion.div 
          className="relative z-10 text-center max-w-md"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          key={authType}
        >
          <FloatingElement delay={0}>
            <motion.div 
              className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg"
              whileHover={{ 
                scale: 1.1,
                rotate: [0, -5, 5, 0],
                transition: { duration: 0.3 }
              }}
            >
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                {authType === 'login' ? (
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                )}
              </svg>
            </motion.div>
          </FloatingElement>
          
          <motion.h2 
            className="text-3xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {authType === 'login' ? 'Selamat Datang Kembali!' : 'Bergabung dengan Platform'}
          </motion.h2>
          <motion.p 
            className="text-blue-100 text-lg mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {authType === 'login' 
              ? 'Masuk ke akun Anda untuk melanjutkan pembelajaran dan mengakses fitur-fitur menarik'
              : 'Daftar akun baru dan ajukan akses untuk menggunakan platform pembelajaran AI terdepan'
            }
          </motion.p>
          
          {/* Features List */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {authType === 'login' ? (
              // Login benefits
              <>
                <div className="flex items-center gap-3 text-blue-100">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Akses semua progress Anda</span>
                </div>
                <div className="flex items-center gap-3 text-blue-100">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Lanjutkan quiz terakhir</span>
                </div>
                <div className="flex items-center gap-3 text-blue-100">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Sinkronisasi lintas perangkat</span>
                </div>
              </>
            ) : (
              // Register benefits
              <>
                <div className="flex items-center gap-3 text-blue-100">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Time Quiz unlimited</span>
                </div>
                <div className="flex items-center gap-3 text-blue-100">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Akses dokumentasi lengkap</span>
                </div>
                <div className="flex items-center gap-3 text-blue-100">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Mock Test (perlu persetujuan)</span>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
} 