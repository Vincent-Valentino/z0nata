import { Toaster } from '@/components/ui'
import { AppRouter } from '@/routes/AppRouter'
import { DevToolsPanel } from '@/components/dev/DevToolsPanel'
import { ThemeProvider } from '@/components/ThemeProvider'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="quizapp-ui-theme">
      <AppRouter />
      <Toaster />
      {/* Development Tools Panel - only show in development */}
      {process.env.NODE_ENV === 'development' && <DevToolsPanel />}
    </ThemeProvider>
  )
}

export default App
