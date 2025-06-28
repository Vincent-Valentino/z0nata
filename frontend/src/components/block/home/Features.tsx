import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export const Features = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const learningFeatures = [
    {
      icon: '📚',
      title: 'Dokumentasi Lengkap',
      description: 'Belajar mandiri dengan dokumentasi komprehensif sebelum memulai test',
      features: [
        'Materi pembelajaran terstruktur',
        'Panduan step-by-step',
        'Contoh soal dan pembahasan',
        'Tips dan strategi ujian'
      ],
      color: 'blue',
      highlight: true
    },
    {
      icon: '🎯',
      title: 'Mock Test Berkualitas',
      description: 'Simulasi ujian yang menyerupai kondisi ujian sertifikasi sebenarnya',
      features: [
        'Format soal sesuai standar Huawei',
        'Waktu ujian realistis (90 menit)',
        '60 soal per test session',
        'Sistem scoring otomatis'
      ],
      color: 'emerald'
    },
    {
      icon: '⚡',
      title: 'Time Quiz Praktis',
      description: 'Latihan cepat untuk mengasah kemampuan dan mengukur pemahaman',
      features: [
        'Sesi latihan 10 menit',
        '10 soal fokus per topik',
        'Feedback langsung',
        'Progress tracking harian'
      ],
      color: 'purple'
    }
  ]

  const accessTypes = [
    {
      title: 'Mahasiswa Mikroskil',
      subtitle: 'Akses Penuh Gratis',
      icon: '🎓',
      benefits: [
        'Mock Test unlimited',
        'Time Quiz unlimited', 
        'Akses semua dokumentasi',
        'Progress tracking',
      ],
      action: 'Login dengan NIM',
      color: 'emerald',
      featured: true
    },
    {
      title: 'Bukan Mahasiswa Mikroskil',
      subtitle: 'Akses Terbatas + Request',
      icon: '👤',
      benefits: [
        'Request akses Mock Test',
        'Time Quiz unlimited',
        'Akses semua dokumentasi',
        'Progress tracking',
      ],
      action: 'Ajukan akses ke admin',
      color: 'blue'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      emerald: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-600',
        icon: 'bg-emerald-100',
        button: 'bg-emerald-600 hover:bg-emerald-700'
      },
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200', 
        text: 'text-blue-600',
        icon: 'bg-blue-100',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600',
        icon: 'bg-purple-100',
        button: 'bg-purple-600 hover:bg-purple-700'
      }
    }
    return colors[color as keyof typeof colors] || colors.emerald
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-4 py-2 mb-6">
            <span className="text-blue-600 font-medium">🚀 Fitur Unggulan</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-poppins mb-6 text-gray-900">
            Belajar Mandiri dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Dokumentasi Lengkap</span>
          </h2>
          <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
            Mulai perjalanan belajar Anda dengan membaca dokumentasi terstruktur sebelum mengerjakan test. 
            Persiapan yang matang adalah kunci sukses sertifikasi Huawei AI.
          </p>
        </div>

        {/* Learning Features */}
        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20 px-4 sm:px-0">
          {learningFeatures.map((feature, index) => {
            const colorClasses = getColorClasses(feature.color)
            return (
              <div 
                key={index}
                className={`${colorClasses.bg} ${colorClasses.border} ${feature.highlight ? 'border-4 shadow-lg' : 'border-2'} rounded-2xl p-6 sm:p-8 hover:shadow-xl transition-all duration-300 group relative`}
              >
                {feature.highlight && (
                  <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium">
                      ⭐ Fitur Utama
                    </div>
                  </div>
                )}
                
                <div className={`${colorClasses.icon} w-12 sm:w-16 h-12 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-xl sm:text-2xl">{feature.icon}</span>
                </div>
                
                <h3 className={`text-lg sm:text-xl font-bold ${colorClasses.text} mb-3`}>
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                <ul className="space-y-2 mb-6">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-1.5 h-1.5 rounded-full ${colorClasses.text.replace('text', 'bg')}`}></div>
                      {item}
                    </li>
                  ))}
                </ul>

                {feature.highlight && (
                  <button 
                    onClick={() => navigate('/dokumentasi')}
                    className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 ${colorClasses.button} text-white rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base min-h-[44px] touch-manipulation`}
                  >
                    <span className="truncate">Mulai Belajar →</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Access Types Section */}
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-bold font-poppins mb-4 text-gray-900">
            Sistem Akses Platform
          </h3>
          <p className="text-gray-600 font-inter">
            Terdapat dua jenis akses dengan privilese yang berbeda sesuai status mahasiswa
          </p>
        </div>

        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16 px-4 sm:px-0">
          {accessTypes.map((access, index) => {
            const colorClasses = getColorClasses(access.color)
            return (
              <div 
                key={index}
                className={`${access.featured ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 border-2 shadow-lg' : 'bg-white border-gray-200 border'} rounded-2xl p-6 sm:p-8 hover:shadow-xl transition-all duration-300 relative`}
              >
                {access.featured && (
                  <div className="absolute -top-2 sm:-top-3 right-3 sm:right-4">
                    <div className="bg-emerald-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      🌟 Recommended
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className={`${colorClasses.icon} w-12 sm:w-14 h-12 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <span className="text-xl sm:text-2xl">{access.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900">{access.title}</h4>
                    <p className={`text-sm font-medium ${colorClasses.text}`}>{access.subtitle}</p>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {access.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center gap-3 text-gray-700">
                      <div className={`w-5 h-5 rounded-full ${colorClasses.text.replace('text', 'bg')} flex items-center justify-center`}>
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                  access.featured 
                    ? colorClasses.button + ' text-white' 
                    : 'border-2 ' + colorClasses.border + ' ' + colorClasses.text + ' hover:bg-gray-50'
                }`}
                onClick={() => {
                  if (access.featured) {
                    // Mahasiswa Mikroskil - direct to login
                    navigate('/login')
                  } else {
                    // Non-Mikroskil - contact admin (you can implement this later)
                    alert('Fitur request akses akan segera tersedia. Silakan hubungi admin untuk sementara.')
                  }
                }}
                >
                  {access.action}
                </button>
              </div>
            )
          })}
        </div>

        {/* Process Flow */}
        <div className="bg-gray-100 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-center mb-8 text-gray-900">
            Alur Pembelajaran yang Disarankan
          </h3>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Baca Dokumentasi', description: 'Pelajari materi dengan seksama'},
              { step: '2', title: 'Latihan Time Quiz', description: 'Uji pemahaman per topik'},
              { step: '3', title: 'Mock Test', description: 'Simulasi ujian lengkap'},
              { step: '4', title: 'Analisis & Review', description: 'Evaluasi hasil dan perbaikan'}
            ].map((process, index) => (
              <div key={index} className="text-center">
                <div className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  {process.step}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{process.title}</h4>
                <p className="text-sm text-gray-600">{process.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 sm:p-8 text-white">
          <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Siap Memulai Tes?
          </h3>
          <p className="text-emerald-100 mb-4 sm:mb-6 max-w-2xl mx-auto text-sm sm:text-base">
            Daftarkan diri Anda untuk mengakses platform kami dan mulai tes sekarang juga!
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <button className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base min-h-[44px] touch-manipulation">
              Daftar
            </button>
            <button 
              onClick={() => navigate('/dokumentasi')}
              className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-all duration-200 text-sm sm:text-base min-h-[44px] touch-manipulation"
            >
              <span className="truncate">Baca Dokumentasi</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
} 