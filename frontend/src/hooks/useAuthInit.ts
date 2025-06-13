import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

export const useAuthInit = () => {
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Authentication initialization logic can go here
    // For now, we'll just ensure the store is properly initialized
    console.log('Auth initialized, authenticated:', isAuthenticated)
  }, [isAuthenticated])
} 