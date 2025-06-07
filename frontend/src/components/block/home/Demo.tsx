import { useState } from 'react'

export const Demo = () => {
  const [activeTab, setActiveTab] = useState('mocktest')

  const tabs = [
    { id: 'mocktest', label: 'Mock Test', icon: '🎯' },
    { id: 'timequiz', label: 'Time Quiz', icon: '⏱️' },
    { id: 'results', label: 'Hasil Test', icon: '📊' }
  ]

  return (
    <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-100 rounded-full px-4 py-2 mb-6">
            <span className="text-emerald-600 font-medium">🎮 Demo Platform</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-poppins mb-6 text-gray-900">
            Lihat Bagaimana <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Platform Bekerja</span>
          </h2>
          <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
            Jelajahi fitur-fitur lengkap Bank Soal Huawei dengan demo interaktif yang menunjukkan pengalaman pengguna sebenarnya.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Browser Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-md px-3 py-1 text-sm text-gray-600 border">
                  🔒 z0nata.vercel.app/demo
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 min-h-[500px]">
            {activeTab === 'mocktest' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">HCIA-AI V3.0 Mock Test</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>⏱️ 90 menit</span>
                    <span>📝 60 soal</span>
                    <span>🎯 600 poin</span>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-600">Soal 1 dari 60</span>
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full w-2"></div>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-semibold mb-4 text-gray-900">
                    Apa yang dimaksud dengan Machine Learning dalam konteks Artificial Intelligence?
                  </h4>
                  
                  <div className="space-y-3">
                    {[
                      'Sistem yang dapat belajar dari data tanpa pemrograman eksplisit',
                      'Program komputer yang dapat bermain game',
                      'Teknologi untuk mengontrol robot',
                      'Aplikasi untuk menganalisis big data'
                    ].map((option, index) => (
                      <label key={index} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-white cursor-pointer transition-colors">
                        <input type="radio" name="question1" className="text-emerald-600" />
                        <span className="font-medium text-gray-700">{String.fromCharCode(65 + index)}.</span>
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    ← Sebelumnya
                  </button>
                  <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    Selanjutnya →
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'timequiz' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Quick Quiz - AI Fundamentals</h3>
                  <div className="flex items-center gap-2 bg-red-100 px-3 py-1 rounded-full">
                    <span className="text-red-600 font-bold text-lg">05:32</span>
                    <span className="text-red-600 text-sm">tersisa</span>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-600">Soal 3 dari 10</span>
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full w-16"></div>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-semibold mb-4 text-gray-900">
                    Manakah dari berikut ini yang termasuk dalam supervised learning? (Pilih semua yang benar)
                  </h4>
                  
                  <div className="space-y-3">
                    {[
                      'Linear Regression',
                      'K-Means Clustering', 
                      'Decision Tree',
                      'Random Forest'
                    ].map((option, index) => (
                      <label key={index} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-white cursor-pointer transition-colors">
                        <input type="checkbox" className="text-blue-600" />
                        <span className="font-medium text-gray-700">{String.fromCharCode(65 + index)}.</span>
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    ← Skip
                  </button>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Submit →
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'results' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Hasil Mock Test</h3>
                  <p className="text-gray-600">HCIA-AI V3.0 - Completed</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">720</div>
                    <div className="text-sm text-green-700 font-medium">Total Skor</div>
                    <div className="text-xs text-green-600 mt-1">Pass (≥600)</div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">48/60</div>
                    <div className="text-sm text-blue-700 font-medium">Jawaban Benar</div>
                    <div className="text-xs text-blue-600 mt-1">80% Akurasi</div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">72</div>
                    <div className="text-sm text-purple-700 font-medium">Menit</div>
                    <div className="text-xs text-purple-600 mt-1">dari 90 menit</div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6">
                  <h4 className="font-semibold mb-4 text-gray-900">Analisis per Kategori</h4>
                  <div className="space-y-4">
                    {[
                      { category: 'AI Fundamentals', correct: 12, total: 15, percentage: 80 },
                      { category: 'Machine Learning', correct: 18, total: 20, percentage: 90 },
                      { category: 'Deep Learning', correct: 10, total: 15, percentage: 67 },
                      { category: 'AI Applications', correct: 8, total: 10, percentage: 80 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">{item.category}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">{item.correct}/{item.total}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full" 
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 w-8">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-center gap-4">
                  <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    Review Jawaban
                  </button>
                  <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
} 