import { useState, useEffect } from 'react'
import { HomeNavbar, LiquidBackground, Hero, Demo, Features, Footer } from '@/components/block/home'

export const HomePage = () => {
  const [scrollY, setScrollY] = useState(0)
  const [activeBlob, setActiveBlob] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    
    // Blob rotation effect
    const interval = setInterval(() => {
      setActiveBlob(prev => (prev + 1) % 4)
    }, 3000)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearInterval(interval)
    }
  }, [])

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