export const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'Mulai Belajar',
      links: [
        { name: 'Dokumentasi', href: '#dokumentasi' },
        { name: 'Mock Test', href: '#mock-test' },
        { name: 'Time Quiz', href: '#time-quiz' }
      ]
    },
    {
      title: 'FAQ',
      links: [
        { name: 'Cara menggunakan platform', href: '#faq-cara' },
        { name: 'Syarat dan ketentuan', href: '#faq-syarat' },
        { name: 'Sistem penilaian', href: '#faq-scoring' },
        { name: 'Akses untuk non-Mikroskil', href: '#faq-akses' }
      ]
    }
  ]

  const teamMembers = [
    'William Zonata',
    'Vincent Valentino', 
    'Alvin Liandy',
    'Aleshi Agung Wicaksono'
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Brand Section */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 sm:w-11 h-10 sm:h-11 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800 rounded-2xl flex items-center justify-center shadow-lg border border-gray-600/50">
                  <span className="text-white font-bold text-lg sm:text-xl font-roboto-condensed tracking-tight">Z</span>
                </div>
                <span className="text-lg sm:text-xl font-bold font-roboto-condensed tracking-wide">Zonata</span>
              </div>
              
              <p className="text-gray-400 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
                Platform pembelajaran terlengkap untuk persiapan sertifikasi Huawei AI. 
                Belajar dengan efektif menggunakan 200+ soal berkualitas tinggi.
              </p>

              {/* Project By Section - Highlighted */}
              <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-4 sm:p-6 mb-6">
                <h3 className="text-base sm:text-lg font-bold text-emerald-400 mb-3 sm:mb-4 flex items-center gap-2">
                  <span>👥</span> Project By
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></div>
                      <span className="text-white font-medium text-sm sm:text-base">{member}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Links */}
            {footerSections.map((section, index) => (
              <div key={index} className="sm:col-span-1 lg:col-span-1">
                <div className="mb-4 sm:mb-6">
                  <h3 className="font-semibold text-base sm:text-lg text-white mb-2">
                    {section.title}
                  </h3>
                  <div className={`w-12 h-0.5 ${
                    section.title === 'Mulai Belajar' 
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-400' 
                      : 'bg-gradient-to-r from-cyan-400 to-blue-400'
                  }`}></div>
                </div>
                <ul className="space-y-3 sm:space-y-4">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href={link.href}
                        className="text-gray-400 hover:text-emerald-400 transition-all duration-200 flex items-center gap-3 group text-sm sm:text-base"
                      >
                        <div className={`w-1 h-1 rounded-full transition-all duration-200 flex-shrink-0 ${
                          section.title === 'Mulai Belajar'
                            ? 'bg-emerald-400 group-hover:bg-emerald-300 group-hover:w-2 group-hover:h-2'
                            : 'bg-cyan-400 group-hover:bg-cyan-300 group-hover:w-2 group-hover:h-2'
                        }`}></div>
                        <span className="group-hover:translate-x-1 transition-transform duration-200 leading-relaxed">
                          {link.name}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-xs sm:text-sm text-center sm:text-left leading-relaxed">
              © {currentYear} Zonata - Bank Soal Huawei. Dikembangkan oleh Mahasiswa Universitas Mikroskil.
            </div>
            
            <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
              <a href="#privacy" className="text-gray-400 hover:text-emerald-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#terms" className="text-gray-400 hover:text-emerald-400 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 