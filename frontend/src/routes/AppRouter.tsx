import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { DocumentationPage } from '@/pages/documentation/DocumentationPage'
import { MockTestPage } from '@/pages/tests/MockTestPage'
import { TimeQuizPage } from '@/pages/tests/TimeQuizPage'
import { AuthPage } from '@/pages/auth/AuthPage'
import { AdminPage } from '@/pages/admin/AdminPage'

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
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
        
        {/* Catch all route */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  )
} 