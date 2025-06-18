import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'

interface MikroskilAuthFormProps {
  onBack: () => void
  onSubmit: (data: MikroskilFormData, authType: 'login' | 'register') => void
}

interface MikroskilFormData {
  nim: string
  email: string
  password: string
  name?: string
  confirmPassword?: string
  faculty?: string
  major?: string
}

// Faculty and Major options for Mikroskil
const FACULTIES = [
  'Fakultas Teknologi Informasi',
  'Fakultas Ekonomi dan Bisnis',
  'Fakultas Bahasa dan Sastra',
  'Fakultas Teknik',
  'Fakultas Ilmu Sosial dan Politik',
]

const MAJOR_BY_FACULTY: Record<string, string[]> = {
  'Fakultas Teknologi Informasi': [
    'Sistem Informasi',
    'Teknik Informatika',
    'Sistem Komputer',
    'Teknologi Informasi',
    'Manajemen Informatika',
  ],
  'Fakultas Ekonomi dan Bisnis': [
    'Manajemen',
    'Akuntansi',
    'Administrasi Bisnis',
    'Ekonomi Pembangunan',
    'Perpajakan',
  ],
  'Fakultas Bahasa dan Sastra': [
    'Sastra Inggris',
    'Sastra Mandarin',
    'Bahasa dan Sastra Indonesia',
    'Linguistik Terapan',
  ],
  'Fakultas Teknik': [
    'Teknik Sipil',
    'Teknik Mesin',
    'Teknik Elektro',
    'Arsitektur',
    'Teknik Industri',
  ],
  'Fakultas Ilmu Sosial dan Politik': [
    'Ilmu Komunikasi',
    'Hubungan Internasional',
    'Administrasi Publik',
    'Sosiologi',
  ],
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

export const MikroskilAuthForm = ({ onBack, onSubmit }: MikroskilAuthFormProps) => {
  const [authType, setAuthType] = useState<'login' | 'register'>('login')
  const [formData, setFormData] = useState<MikroskilFormData>({
    nim: '',
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    faculty: '',
    major: ''
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

  const handleInputChange = (field: keyof MikroskilFormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Reset major when faculty changes
      if (field === 'faculty') {
        newData.major = ''
      }
      
      return newData
    })
  }

  const resetForm = () => {
    setFormData({
      nim: '',
      email: '',
      password: '',
      name: '',
      confirmPassword: '',
      faculty: '',
      major: ''
    })
  }

  const handleAuthTypeChange = (type: 'login' | 'register') => {
    setAuthType(type)
    resetForm()
  }

  // Validate NIM format (9 digits, first 2 are year)
  const validateNIM = (nim: string) => {
    const nimPattern = /^\d{9}$/
    if (!nimPattern.test(nim)) return false
    
    const year = parseInt(nim.substring(0, 2))
    const currentYear = new Date().getFullYear()
    const shortCurrentYear = currentYear % 100
    const shortStartYear = (currentYear - 10) % 100 // Allow 10 years back
    
    return year >= shortStartYear && year <= shortCurrentYear
  }

  // Get available majors based on selected faculty
  const getAvailableMajors = () => {
    if (!formData.faculty) return []
    return MAJOR_BY_FACULTY[formData.faculty] || []
  }

  return (
    <motion.div 
      className="min-h-screen flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Left side - Info */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-700 p-12 flex-col justify-center items-center text-white relative overflow-hidden"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
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
              className="w-28 h-28 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 overflow-hidden shadow-2xl"
              whileHover={{ 
                scale: 1.1,
                rotate: [0, -5, 5, 0],
                transition: { duration: 0.3 }
              }}
            >
              <img 
                src="https://akupintar.id/documents/20143/0/1623140380992-header_kampus-sekolah_tinggi_manajemen_informatika_dan_komputer_mikroskil.jpg/61378704-09c6-18b0-efbc-deb06399fafc?version=1.0&t=1623140381118&imageThumbnail=1"
                alt="Mikroskil Logo" 
                className="w-24 h-24 object-contain rounded-xl"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  const fallback = img.nextElementSibling as HTMLElement;
                  img.style.display = 'none';
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="w-full h-full bg-white/30 rounded-xl flex items-center justify-center text-xs font-bold text-white" style={{ display: 'none' as const }}>
                MIKROSKIL
              </div>
            </motion.div>
          </FloatingElement>
          
          <motion.h2 
            className="text-3xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {authType === 'login' ? 'Selamat Datang Kembali!' : 'Selamat Datang!'}
          </motion.h2>
          <motion.p 
            className="text-emerald-100 text-lg mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {authType === 'login' 
              ? 'Masuk dengan NIM dan password Anda untuk mengakses platform pembelajaran eksklusif mahasiswa Mikroskil'
              : 'Daftarkan akun mahasiswa Mikroskil dengan NIM dan email institusi untuk mendapatkan akses penuh platform pembelajaran AI'
            }
          </motion.p>
          
          {/* Features List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {authType === 'login' ? (
              // Login benefits for Mikroskil students
              <>
                <div className="flex items-center gap-3 text-emerald-100">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Akses khusus mahasiswa Mikroskil</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-100">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Progress tersimpan otomatis</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-100">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Sertifikat digital resmi</span>
                </div>
              </>
            ) : (
              // Register benefits for new Mikroskil students
              <>
                <div className="flex items-center gap-3 text-emerald-100">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Akses eksklusif mahasiswa</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-100">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Materi pembelajaran lengkap</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-100">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Verifikasi data mahasiswa</span>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Right side - Form */}
      <motion.div 
        className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 bg-white lg:py-16"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <motion.div 
          className="max-w-md mx-auto w-full lg:max-h-[70vh] lg:overflow-y-auto [&::-webkit-scrollbar]:hidden"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
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
              className="mb-6 -ml-2 hover:bg-gray-100 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            
            <motion.h1 
              className="text-3xl font-bold text-gray-900 mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              {authType === 'login' ? 'Masuk Mahasiswa' : 'Daftar Mahasiswa'}
            </motion.h1>
            <motion.p 
              className="text-gray-600"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              {authType === 'login' 
                ? 'Masukkan NIM dan password untuk masuk ke akun Anda'
                : 'Daftarkan akun baru dengan data mahasiswa Mikroskil'
              }
            </motion.p>
          </motion.div>

          {/* Auth Type Toggle */}
          <motion.div 
            className="flex rounded-lg bg-gray-100 p-1 gap-1 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Button
              type="button"
              variant={authType === 'login' ? "default" : "ghost"}
              onClick={() => handleAuthTypeChange('login')}
              className={`flex-1 h-10 text-sm font-medium transition-all ${
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
              className={`flex-1 h-10 text-sm font-medium transition-all ${
                authType === 'register' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'bg-neutral-100 text-gray-600 hover:bg-white hover:text-gray-800'
              }`}
            >
              Daftar
            </Button>
          </motion.div>

          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            key={authType}
          >
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label htmlFor="nim" className="block text-sm font-medium text-gray-700">
                Nomor Induk Mahasiswa (NIM)
              </label>
              <motion.div
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  id="nim"
                  type="text"
                  value={formData.nim}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                    handleInputChange('nim', value)
                  }}
                  placeholder="231111923"
                  required
                  className={`h-12 transition-all duration-300 focus:shadow-lg ${
                    formData.nim && !validateNIM(formData.nim) ? 'border-red-500' : ''
                  }`}
                />
              </motion.div>
              <p className="text-xs text-gray-500">
                Format: 9 digit dimulai dengan tahun masuk (contoh: 231111923)
              </p>
              {formData.nim && !validateNIM(formData.nim) && (
                <motion.p 
                  className="text-xs text-red-500"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  NIM harus 9 digit dengan 2 digit pertama adalah tahun masuk
                </motion.p>
              )}
            </motion.div>

            {authType === 'register' && (
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: 0.2, duration: 0.3 }}
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
                    placeholder="Nama sesuai data mahasiswa"
                    required
                    className="h-12 transition-all duration-300 focus:shadow-lg"
                  />
                </motion.div>
              </motion.div>
            )}

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: authType === 'register' ? 0.3 : 0.2 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Mikroskil
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
                  placeholder="nama@students.mikroskil.ac.id"
                  required
                  className="h-12 transition-all duration-300 focus:shadow-lg"
                />
              </motion.div>
              <p className="text-xs text-gray-500">
                Harus menggunakan email resmi Universitas Mikroskil
              </p>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: authType === 'register' ? 0.4 : 0.3 }}
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
                  className="h-12 transition-all duration-300 focus:shadow-lg"
                />
              </motion.div>
            </motion.div>

            {authType === 'register' && (
              <>
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
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
                      className="h-12 transition-all duration-300 focus:shadow-lg"
                    />
                  </motion.div>
                </motion.div>

                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <label htmlFor="faculty" className="block text-sm font-medium text-gray-700">
                    Fakultas
                  </label>
                  <motion.div
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Select
                      value={formData.faculty || ''}
                      onValueChange={(value: string) => handleInputChange('faculty', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih fakultas" />
                      </SelectTrigger>
                      <SelectContent>
                        {FACULTIES.map((faculty) => (
                          <SelectItem key={faculty} value={faculty}>
                            {faculty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                </motion.div>

                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                >
                  <label htmlFor="major" className="block text-sm font-medium text-gray-700">
                    Program Studi
                  </label>
                  <motion.div
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Select
                      value={formData.major || ''}
                      onValueChange={(value: string) => handleInputChange('major', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih program studi" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableMajors().map((major) => (
                          <SelectItem key={major} value={major}>
                            {major}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                </motion.div>
              </>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: authType === 'register' ? 0.8 : 0.4 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading || (formData.nim.length > 0 && !validateNIM(formData.nim))}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 transition-all duration-300 shadow-lg hover:shadow-xl"
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
                      {authType === 'login' ? 'Memverifikasi...' : 'Mendaftar...'}
                    </motion.div>
                  ) : (
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      {authType === 'login' ? 'Masuk dengan NIM' : 'Daftar Akun Mahasiswa'}
                    </motion.span>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </motion.form>
        </motion.div>
      </motion.div>
    </motion.div>
  )
} 