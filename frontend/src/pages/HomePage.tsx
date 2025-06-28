import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HomeNavbar, LiquidBackground, Hero, Demo, Features, Footer } from '@/components/block/home'
import { useAuthInit } from '@/hooks/useAuthInit'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Zap, BarChart3, Trophy, User } from 'lucide-react'

export const HomePage = () => {
  const [scrollY, setScrollY] = useState(0)
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Initialize auth store with mock data for development
  useAuthInit()

  return (
    <div className='bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 w-full min-h-screen relative overflow-x-hidden'>
      <HomeNavbar />
      {/* Reduce background complexity on mobile for performance */}
      <div className="hidden sm:block">
        <LiquidBackground scrollY={scrollY} />
      </div>
      {/* Simple gradient background for mobile */}
      <div className="sm:hidden fixed inset-0 bg-gradient-to-br from-emerald-100/30 via-teal-100/30 to-cyan-100/30 -z-10"></div>
      
      <main className="relative z-10">
        <Hero />
        
        {/* Quick Actions Section - Only show for authenticated users */}
        {isAuthenticated && (
          <section className="py-8 sm:py-12 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                  Welcome back, {user?.full_name || 'User'}!
                </h2>
                <p className="text-gray-600 text-base sm:text-lg">
                  Ready to test your knowledge? Choose your quiz adventure below.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Mock Test */}
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 bg-emerald-100 rounded-full mb-3 sm:mb-4 group-hover:bg-emerald-200 transition-colors">
                      <BookOpen className="w-6 sm:w-8 h-6 sm:h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Mock Test</h3>
                    <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm">
                      Comprehensive 60+ question exam simulation
                    </p>
                    <Button 
                      onClick={() => navigate('/mock-test')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base min-h-[44px] touch-manipulation"
                    >
                      Start Mock Test
                    </Button>
                  </CardContent>
                </Card>

                {/* Time Quiz */}
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 bg-blue-100 rounded-full mb-3 sm:mb-4 group-hover:bg-blue-200 transition-colors">
                      <Zap className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Time Quiz</h3>
                    <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm">
                      Quick 20-question practice with instant feedback
                    </p>
                    <Button 
                      onClick={() => navigate('/time-quiz')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base min-h-[44px] touch-manipulation"
                    >
                      Start Time Quiz
                    </Button>
                  </CardContent>
                </Card>

                {/* View Results */}
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 bg-purple-100 rounded-full mb-3 sm:mb-4 group-hover:bg-purple-200 transition-colors">
                      <BarChart3 className="w-6 sm:w-8 h-6 sm:h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">My Results</h3>
                    <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm">
                      View detailed statistics and quiz history
                    </p>
                    <Button 
                      onClick={() => {
                        if (user?.id) {
                          navigate(`/results/${user.id}`)
                        } else {
                          // Fallback to profile if user ID is not available
                          navigate('/profile')
                        }
                      }}
                      variant="outline"
                      className="w-full border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white text-sm sm:text-base min-h-[44px] touch-manipulation"
                    >
                      View Results
                    </Button>
                  </CardContent>
                </Card>

                {/* Profile */}
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 bg-orange-100 rounded-full mb-3 sm:mb-4 group-hover:bg-orange-200 transition-colors">
                      <User className="w-6 sm:w-8 h-6 sm:h-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Profile</h3>
                    <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm">
                      Manage your account and preferences
                    </p>
                    <Button 
                      onClick={() => navigate('/profile')}
                      variant="outline"
                      className="w-full border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white text-sm sm:text-base min-h-[44px] touch-manipulation"
                    >
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Achievement Banner (Optional) */}
              <div className="mt-6 sm:mt-8 text-center">
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                      <Trophy className="w-5 sm:w-6 h-5 sm:h-6 text-yellow-600 flex-shrink-0" />
                      <p className="text-gray-700 font-medium text-sm sm:text-base text-center sm:text-left">
                        Ready to improve your score? Take another quiz and track your progress!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        <Demo />
        <Features />
        <Footer />
      </main>
    </div>
  )
} 