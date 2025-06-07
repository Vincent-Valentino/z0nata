import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  systemTheme: 'dark' | 'light'
}

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export const ThemeProvider = ({ 
  children, 
  defaultTheme = 'system',
  storageKey = 'ui-theme'
}: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    // Get system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [])

  useEffect(() => {
    // Load saved theme from localStorage
    try {
      const savedTheme = localStorage.getItem(storageKey) as Theme
      if (savedTheme && ['dark', 'light', 'system'].includes(savedTheme)) {
        setTheme(savedTheme)
      }
    } catch (error) {
      console.error('Error loading theme from localStorage:', error)
    }
  }, [storageKey])

  useEffect(() => {
    // Save to localStorage but don't apply to document root
    try {
      localStorage.setItem(storageKey, theme)
    } catch (error) {
      console.error('Error saving theme to localStorage:', error)
    }
  }, [theme, storageKey])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  const value = {
    theme,
    setTheme: handleSetTheme,
    systemTheme
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  const { theme, setTheme, systemTheme } = context
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  return {
    theme,
    setTheme,
    systemTheme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    toggleTheme: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }
} 