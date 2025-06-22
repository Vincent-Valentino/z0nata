import { Toaster } from '@/components/ui'
import { AppRouter } from '@/routes/AppRouter'
import { DevToolsPanel } from '@/components/dev/DevToolsPanel'
import { ThemeProvider } from '@/components/ThemeProvider'
import { QuizProvider } from '@/contexts/QuizContext'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="quizapp-ui-theme">
      <QuizProvider>
        <AppRouter />
        <Toaster />
        {/* Development Tools Panel - only show in development */}
        <DevToolsPanel />
      </QuizProvider>
    </ThemeProvider>
  )
}

export default App
