import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'

interface MikroskilAuthFormProps {
  onBack: () => void
  onSubmit: (data: MikroskilFormData) => void
}

interface MikroskilFormData {
  nim: string
  name: string
  email: string
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
  const [formData, setFormData] = useState<MikroskilFormData>({
    nim: '',
    name: '',
    email: ''
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await onSubmit(formData)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof MikroskilFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <FloatingElement delay={0}>
            <motion.div 
              className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8"
              whileHover={{ 
                scale: 1.1,
                rotate: [0, -5, 5, 0],
                transition: { duration: 0.3 }
              }}
            >
              <img src="https://akupintar.id/documents/20143/0/1623140380992-header_kampus-sekolah_tinggi_manajemen_informatika_dan_komputer_mikroskil.jpg/61378704-09c6-18b0-efbc-deb06399fafc?version=1.0&t=1623140381118&imageThumbnail=1" alt="Mikroskil Logo" className="w-20 h-20 object-contain rounded-2xl" />
            </motion.div>
          </FloatingElement>
          
          <motion.h2 
            className="text-3xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Selamat Datang!
          </motion.h2>
          <motion.p 
            className="text-emerald-100 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Verifikasi identitas Anda sebagai mahasiswa Mikroskil untuk mendapatkan akses penuh platform
          </motion.p>
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
              Login Mahasiswa Mikroskil
            </motion.h1>
            <motion.p 
              className="text-gray-600"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              Masukkan data mahasiswa untuk verifikasi
            </motion.p>
          </motion.div>

          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
              whileHover={{ x: 5 }}
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
                  onChange={(e) => handleInputChange('nim', e.target.value)}
                  placeholder="Contoh: 11.2021.1.00001"
                  required
                  className="h-12 transition-all duration-300 focus:shadow-lg"
                />
              </motion.div>
              <p className="text-xs text-gray-500">
                Masukkan NIM sesuai format Universitas Mikroskil
              </p>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 }}
              whileHover={{ x: 5 }}
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
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nama sesuai data mahasiswa"
                  required
                  className="h-12 transition-all duration-300 focus:shadow-lg"
                />
              </motion.div>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
              whileHover={{ x: 5 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 transition-all duration-300"
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
                      Memverifikasi...
                    </motion.div>
                  ) : (
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      Login dengan NIM
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