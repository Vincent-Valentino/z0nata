import { useState, useEffect } from 'react'
import { AdminLayout, AdminOverview, AdminUsers, AdminQuestions, AdminDocumentation, AdminSettings } from '@/components/block/admin'
import { useLocation, useNavigate } from 'react-router-dom'

export type AdminSection = 'overview' | 'users' | 'questions' | 'documentation' | 'settings'

export const AdminPage = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview')
  const location = useLocation()
  const navigate = useNavigate()

  // Handle URL-based navigation
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const section = searchParams.get('section') as AdminSection
    if (section && ['overview', 'users', 'questions', 'documentation', 'settings'].includes(section)) {
      setActiveSection(section)
    }
  }, [location.search])

  // Update URL when section changes
  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section)
    const searchParams = new URLSearchParams()
    if (section !== 'overview') {
      searchParams.set('section', section)
    }
    const newUrl = searchParams.toString() ? `?${searchParams.toString()}` : location.pathname
    navigate(newUrl, { replace: true })
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminOverview onSectionChange={handleSectionChange} />
      case 'users':
        return <AdminUsers />
      case 'questions':
        return <AdminQuestions />
      case 'documentation':
        return <AdminDocumentation />
      case 'settings':
        return <AdminSettings />
      default:
        return <AdminOverview onSectionChange={handleSectionChange} />
    }
  }

  return (
    <AdminLayout 
      activeSection={activeSection} 
      onSectionChange={handleSectionChange}
    >
      {renderContent()}
    </AdminLayout>
  )
}
