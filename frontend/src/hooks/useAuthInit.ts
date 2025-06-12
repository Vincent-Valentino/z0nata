import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

export const useAuthInit = () => {
  const { mockLogin, isAuthenticated, hasLoggedOut } = useAuthStore()

  useEffect(() => {
    // Auto-login for development - remove this in production
    // Only auto-login if user hasn't explicitly logged out
    if (!isAuthenticated && !hasLoggedOut) {
      const mockUser = {
        id: '1',
        full_name: 'Vincent Valentino',
        email: 'vincent.valentino@example.com',
        email_verified: true,
        last_login: new Date().toISOString(),
        created_at: '2024-01-15T10:00:00Z',
        updated_at: new Date().toISOString(),
        role: 'student' as const,
        nim: '11419001',
        faculty: 'Teknik Informatika',
        major: 'Sistem Informasi',
        preferences: {
          theme: 'system' as const,
          language: 'id' as const,
          notifications: true
        },
        stats: {
          testsCompleted: 12,
          averageScore: 87.5,
          totalTimeSpent: 14400,
          streak: 5
        }
      }
      
      // Simulate delay and login
      setTimeout(() => {
        mockLogin(mockUser)
      }, 100)
    }
  }, [mockLogin, isAuthenticated, hasLoggedOut])
} 