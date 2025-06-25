import { useState, useEffect } from 'react'
import { HomeNavbar, LiquidBackground, Hero, Demo, Features, Footer } from '@/components/block/home'
import { useAuthInit } from '@/hooks/useAuthInit'
import { QuizDebugPanel } from '@/components/quiz/QuizDebugPanel'

export const HomePage = () => {
  const [scrollY, setScrollY] = useState(0)

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
        <Demo />
        <Features />
        
        {/* Debug Panel - Only in development */}
        {import.meta.env.DEV && (
          <div className="bg-white/95 backdrop-blur-sm">
            <QuizDebugPanel />
          </div>
        )}
        
        <Footer />
      </main>
    </div>
  )
} 