import { useState, useEffect } from 'react'
import { HomeNavbar, LiquidBackground, Hero, Demo, Features, Footer } from '@/components/block/home'
import { useAuthInit } from '@/hooks/useAuthInit'

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
    <div className='bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 w-full min-h-screen relative overflow-hidden'>
      <HomeNavbar />
      <LiquidBackground scrollY={scrollY} />
      <Hero />
      <Demo />
      <Features />
      <Footer />
    </div>
  )
} 