import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  LayoutDashboard, 
  Users, 
  HelpCircle, 
  BookOpen, 
  Settings, 
  Menu,
  X,
  Bell,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdminSection } from '@/pages/admin/AdminPage'

interface AdminLayoutProps {
  children: React.ReactNode
  activeSection: AdminSection
  onSectionChange: (section: AdminSection) => void
}

interface SidebarItem {
  id: AdminSection
  title: string
  icon: React.ReactNode
  badge?: number
  description: string
}

export const AdminLayout = ({ children, activeSection, onSectionChange }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const sidebarItems: SidebarItem[] = [
    {
      id: 'overview',
      title: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
      description: 'Dashboard & Analytics'
    },
    {
      id: 'users',
      title: 'Users',
      icon: <Users className="w-5 h-5" />,
      badge: 3,
      description: 'Manage Users & Access'
    },
    {
      id: 'questions',
      title: 'Questions',
      icon: <HelpCircle className="w-5 h-5" />,
      badge: 12,
      description: 'Question Bank'
    },
    {
      id: 'documentation',
      title: 'Documentation',
      icon: <BookOpen className="w-5 h-5" />,
      description: 'Modules & Guides'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      description: 'System Configuration'
    }
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "relative border-r bg-card transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">Z</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold">Zonata</h1>
                <p className="text-xs text-muted-foreground">Admin Portal</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8"
          >
            {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-auto p-3",
                sidebarCollapsed && "justify-center p-2"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              {item.icon}
              {!sidebarCollapsed && (
                <div className="flex flex-1 items-center justify-between">
                  <div className="text-left">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              )}
            </Button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t p-4">
          <div className={cn(
            "flex items-center gap-3",
            sidebarCollapsed && "justify-center"
          )}>
            <Avatar className="h-8 w-8">
              <AvatarImage src="/admin-avatar.png" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <div className="text-sm font-medium">Admin User</div>
                <div className="text-xs text-muted-foreground">admin@zonata.com</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div>
            <h1 className="text-xl font-semibold capitalize">
              {sidebarItems.find(item => item.id === activeSection)?.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {sidebarItems.find(item => item.id === activeSection)?.description}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src="/admin-avatar.png" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 