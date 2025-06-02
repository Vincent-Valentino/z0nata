import { Toaster } from '@/components/ui'
import { HomeNavbar, LiquidBackground } from '@/components/block/home'
import { useState, useEffect } from 'react'

function App() {
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
    <div className='bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 w-full min-h-[200vh] relative overflow-hidden'>
      <HomeNavbar />

      <LiquidBackground scrollY={scrollY} />
      
      <Toaster />
    </div>
  )
}

export default App
