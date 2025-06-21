import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { DocumentationPage } from '@/pages/DocumentationPage'
import { MockTestPage } from '@/pages/MockTestPage'
import { TimeQuizPage } from '@/pages/TimeQuizPage'
import { AuthPage } from '@/pages/AuthPage'
import { AdminPage } from '@/pages/AdminPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ResultsPage } from '@/pages/ResultsPage'

export const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Home Route */}
        <Route path="/" element={<HomePage />} />
        
        {/* Documentation Routes */}
        <Route path="/dokumentasi" element={<DocumentationPage />} />
        
        {/* Test Routes */}
        <Route path="/mock-test" element={<MockTestPage />} />
        <Route path="/time-quiz" element={<TimeQuizPage />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<AuthPage />} />
        
        {/* User Routes */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/results" element={<ResultsPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
        
        {/* Catch all route */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  )
} 