import { useState } from 'react'
import { AdminLayout, AdminOverview, AdminUsers, AdminQuestions, AdminDocumentation, AdminSettings } from '@/components/block/admin'

export type AdminSection = 'overview' | 'users' | 'questions' | 'documentation' | 'settings'

export const AdminPage = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview')

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminOverview />
      case 'users':
        return <AdminUsers />
      case 'questions':
        return <AdminQuestions />
      case 'documentation':
        return <AdminDocumentation />
      case 'settings':
        return <AdminSettings />
      default:
        return <AdminOverview />
    }
  }

  return (
    <AdminLayout 
      activeSection={activeSection} 
      onSectionChange={setActiveSection}
    >
      {renderContent()}
    </AdminLayout>
  )
}
