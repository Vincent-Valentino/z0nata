import { useState, useEffect, useMemo } from 'react'
import { ThemeProvider, useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'
import { 
  MarkdownRenderer, 
  SearchDialog
} from '@/components/block/docs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Menu, 
  X, 
  Search,
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  Users,
  GraduationCap,
  Home,
  Settings,
  HelpCircle
} from 'lucide-react'
import { moduleService, type Module } from '@/services/moduleService'

// Use the existing interfaces from DocumentSidebar
interface DocSection {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  items?: DocItem[]
  progress?: number
  isCompleted?: boolean
}

interface DocItem {
  id: string
  title: string
  level: number
  isCompleted?: boolean
  duration?: string
}

const DocumentationContent = () => {
  const { resolvedTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('')
  const [activeItem, setActiveItem] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [modules, setModules] = useState<Module[]>([])
  const [sections, setSections] = useState<DocSection[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch published modules on component mount
  useEffect(() => {
    fetchPublishedModules()
  }, [])

  // Initialize from URL when modules are loaded
  useEffect(() => {
    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return
    }
    
    const url = new URL(window.location.href)
    const sectionParam = url.searchParams.get('section')
    if (sectionParam && modules.some(m => 
      m.id === sectionParam || 
      (m.sub_modules && Array.isArray(m.sub_modules) && m.sub_modules.some(sub => sub.id === sectionParam))
    )) {
      setActiveSection(sectionParam)
    }
  }, [modules])

  const fetchPublishedModules = async () => {
    try {
      setIsLoading(true)
      const response = await moduleService.getModules({ published: true, limit: 100 })
      setModules(response.modules || [])
      
      // Convert modules to sections format with enhanced UI data
      const docSections: DocSection[] = (response.modules || []).map((module, index) => ({
        id: module.id,
        title: module.name,
        description: module.description,
        icon: <BookOpen className="w-5 h-5" />,
        progress: Math.random() * 100, // Mock progress - replace with actual data
        isCompleted: Math.random() > 0.7, // Mock completion - replace with actual data
        items: (module.sub_modules || [])
          .filter(sub => sub.is_published)
          .map((subModule, subIndex) => ({
            id: subModule.id,
            title: subModule.name,
            level: 1,
            isCompleted: Math.random() > 0.5, // Mock completion
            duration: `${Math.floor(Math.random() * 20 + 5)} min` // Mock duration
          }))
      }))
      
      setSections(docSections)
      
      // Set first module as active if none selected
      if (!activeSection && docSections.length > 0) {
        setActiveSection(docSections[0].id)
      }
    } catch (err) {
      console.error('Error fetching documentation:', err)
      setModules([])
      setSections([])
    } finally {
      setIsLoading(false)
    }
  }

  // Get current content
  const currentContent = useMemo(() => {
    if (!modules || !Array.isArray(modules)) {
      return '# Content not found\n\nThe requested content could not be loaded.'
    }
    
    const activeModule = modules.find(m => m.id === activeSection)
    if (activeModule) {
      return activeModule.content || '# No content available\n\nThis module does not have content yet.'
    }
    
    // Check if it's a submodule
    for (const module of modules) {
      if (module.sub_modules && Array.isArray(module.sub_modules)) {
        const subModule = module.sub_modules.find(sub => sub.id === activeSection)
        if (subModule) {
          return subModule.content || '# No content available\n\nThis submodule does not have content yet.'
        }
      }
    }
    
    return '# Content not found\n\nThe requested content could not be loaded.'
  }, [activeSection, modules])

  // Handle section change
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId)
    setActiveItem(undefined)
    setIsSidebarOpen(false)
    
    const url = new URL(window.location.href)
    url.searchParams.set('section', sectionId)
    window.history.replaceState({}, '', url.toString())
  }

  // Handle item click
  const handleItemClick = (itemId: string) => {
    let isSubModule = false
    for (const module of modules || []) {
      if (module.sub_modules && Array.isArray(module.sub_modules)) {
        const subModule = module.sub_modules.find(sub => sub.id === itemId)
        if (subModule) {
          isSubModule = true
          break
        }
      }
    }
    
    if (isSubModule) {
      setActiveSection(itemId)
      setActiveItem(undefined)
      setIsSidebarOpen(false)
      
      const url = new URL(window.location.href)
      url.searchParams.set('section', itemId)
      window.history.replaceState({}, '', url.toString())
    } else {
      setActiveItem(itemId)
      setIsSidebarOpen(false)
      
      setTimeout(() => {
        const element = document.getElementById(itemId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  // Filter sections based on search
  const filteredSections = sections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (section.items || []).some(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  // Create ordered navigation
  const orderedNavigation = useMemo(() => {
    const navItems: Array<{
      id: string
      title: string
      type: 'module' | 'submodule'
      moduleId?: string
    }> = []

    sections.forEach(section => {
      navItems.push({
        id: section.id,
        title: section.title,
        type: 'module'
      })

      if (section.items && section.items.length > 0) {
        section.items.forEach(item => {
          navItems.push({
            id: item.id,
            title: item.title,
            type: 'submodule',
            moduleId: section.id
          })
        })
      }
    })

    return navItems
  }, [sections])

  const currentNavIndex = orderedNavigation.findIndex(item => item.id === activeSection)
  const previousNav = currentNavIndex > 0 ? orderedNavigation[currentNavIndex - 1] : null
  const nextNav = currentNavIndex < orderedNavigation.length - 1 ? orderedNavigation[currentNavIndex + 1] : null

  // Enhanced Sidebar Component
  const EnhancedSidebar = ({ className = "" }: { className?: string }) => (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Documentation</h2>
            <p className="text-xs text-muted-foreground">Learn and explore</p>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>
      </div>

      {/* Progress Overview */}
      <div className="p-4 border-b border-border bg-muted/20">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">
              {Math.round(sections.reduce((acc, s) => acc + (s.progress || 0), 0) / sections.length || 0)}%
            </span>
          </div>
          <Progress 
            value={sections.reduce((acc, s) => acc + (s.progress || 0), 0) / sections.length || 0} 
            className="h-2"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{sections.filter(s => s.isCompleted).length} completed</span>
            <span>{sections.length} total modules</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filteredSections.map((section, index) => (
            <div key={section.id} className="space-y-1">
              {/* Module */}
              <Button
                variant={activeSection === section.id ? "secondary" : "ghost"}
                onClick={() => handleSectionChange(section.id)}
                className={cn(
                  "w-full justify-start text-left h-auto p-3 relative group",
                  activeSection === section.id && "bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800"
                )}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={cn(
                    "p-1.5 rounded-md shrink-0 transition-colors",
                    activeSection === section.id 
                      ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground group-hover:bg-emerald-100 group-hover:text-emerald-600"
                  )}>
                    {section.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate">
                        {index + 1}. {section.title}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {section.isCompleted && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {section.progress}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 text-left">
                      {section.description}
                    </p>
                    {section.progress !== undefined && (
                      <Progress value={section.progress} className="h-1 mt-2" />
                    )}
                  </div>
                </div>
              </Button>

              {/* Submodules */}
              {section.items && section.items.length > 0 && (
                <div className="ml-4 space-y-1">
                  {section.items.map((item, itemIndex) => (
                    <Button
                      key={item.id}
                      variant={activeSection === item.id ? "secondary" : "ghost"}
                      onClick={() => handleItemClick(item.id)}
                      className={cn(
                        "w-full justify-start text-left h-auto p-2 group",
                        activeSection === item.id && "bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800"
                      )}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          item.isCompleted 
                            ? "bg-emerald-500" 
                            : activeSection === item.id
                            ? "bg-emerald-400"
                            : "bg-muted-foreground"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm truncate">
                              {index + 1}.{itemIndex + 1} {item.title}
                            </span>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              {item.isCompleted && (
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              )}
                              {item.duration && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {item.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Quick Actions</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Home className="w-3 h-3 mr-1" />
            Home
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <HelpCircle className="w-3 h-3 mr-1" />
            Help
          </Button>
        </div>
      </div>
    </div>
  )

  // Enhanced Mobile Navbar
  const EnhancedMobileNavbar = () => (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
            className="shrink-0"
          >
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-md flex items-center justify-center">
              <GraduationCap className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm">Docs</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsSearchOpen(true)}>
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Current section indicator */}
      <div className="px-4 pb-3">
        <div className="text-xs text-muted-foreground">
          {(() => {
            const section = sections.find(s => s.id === activeSection)
            if (section) {
              const moduleIndex = sections.findIndex(s => s.id === activeSection)
              return `Module ${moduleIndex + 1}: ${section.title}`
            }
            
            for (let i = 0; i < modules.length; i++) {
              const module = modules[i]
              if (module.sub_modules && Array.isArray(module.sub_modules)) {
                const subModuleIndex = module.sub_modules.findIndex(sub => sub.id === activeSection)
                if (subModuleIndex !== -1) {
                  const subModule = module.sub_modules[subModuleIndex]
                  return `${i + 1}.${subModuleIndex + 1}: ${subModule.name}`
                }
              }
            }
            
            return 'Documentation'
          })()}
        </div>
        <Progress 
          value={sections.find(s => s.id === activeSection)?.progress || 0} 
          className="h-1 mt-1"
        />
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors duration-200",
        resolvedTheme === 'dark' ? 'dark' : '',
        "bg-background"
      )}>
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading documentation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-200 overflow-x-hidden",
      resolvedTheme === 'dark' ? 'dark' : '',
      "bg-background"
    )}>
      {/* Enhanced Mobile Navbar */}
      <EnhancedMobileNavbar />
      
      {/* Main Layout */}
      <div className="pt-24 lg:pt-0 flex relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-80 h-screen sticky top-0 border-r border-border">
          <EnhancedSidebar />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
            
            <div className="relative flex flex-col w-80 h-full bg-background shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold">Navigation</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(false)}
                  className="touch-manipulation"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <EnhancedSidebar className="flex-1" />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {/* Content Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                    <div className="text-white">
                      {(() => {
                        const section = sections.find(s => s.id === activeSection)
                        if (section) return <BookOpen className="w-6 h-6" />
                        
                        for (const module of modules || []) {
                          if (module.sub_modules && Array.isArray(module.sub_modules)) {
                            const subModule = module.sub_modules.find(sub => sub.id === activeSection)
                            if (subModule) return <FileText className="w-6 h-6" />
                          }
                        }
                        
                        return <BookOpen className="w-6 h-6" />
                      })()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 leading-tight">
                      {(() => {
                        const section = sections.find(s => s.id === activeSection)
                        if (section) {
                          const moduleIndex = sections.findIndex(s => s.id === activeSection)
                          return `${moduleIndex + 1}. ${section.title}`
                        }
                        
                        for (let i = 0; i < (modules || []).length; i++) {
                          const module = modules[i]
                          if (module.sub_modules && Array.isArray(module.sub_modules)) {
                            const subModuleIndex = module.sub_modules.findIndex(sub => sub.id === activeSection)
                            if (subModuleIndex !== -1) {
                              const subModule = module.sub_modules[subModuleIndex]
                              return `${i + 1}.${subModuleIndex + 1} ${subModule.name}`
                            }
                          }
                        }
                        
                        return 'Content not found'
                      })()}
                    </h1>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {(() => {
                        const section = sections.find(s => s.id === activeSection)
                        if (section) return section.description
                        
                        for (const module of modules || []) {
                          if (module.sub_modules && Array.isArray(module.sub_modules)) {
                            const subModule = module.sub_modules.find(sub => sub.id === activeSection)
                            if (subModule) {
                              return `${subModule.description} • Part of ${module.name}`
                            }
                          }
                        }
                        
                        return 'Description not available'
                      })()}
                    </p>
                    
                    {/* Tags and Meta Info */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {currentNavIndex !== -1 ? `${currentNavIndex + 1} of ${orderedNavigation.length}` : '1 of 1'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        15 min read
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Beginner
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-base prose-neutral max-w-none dark:prose-invert">
              <MarkdownRenderer 
                content={currentContent}
                className="transition-all duration-200"
              />
            </div>

            {/* Enhanced Footer Navigation */}
            <div className="mt-16 pt-8 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {previousNav && (
                  <Button
                    variant="outline"
                    onClick={() => handleSectionChange(previousNav.id)}
                    className="group justify-start h-auto p-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <ChevronLeft className="w-5 h-5 mt-0.5 transition-transform group-hover:-translate-x-1" />
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Previous {previousNav.type === 'submodule' ? 'Submodule' : 'Module'}
                        </div>
                        <div className="font-medium">
                          {previousNav.type === 'module' 
                            ? `${sections.findIndex(s => s.id === previousNav.id) + 1}. ${previousNav.title}`
                            : previousNav.title
                          }
                        </div>
                      </div>
                    </div>
                  </Button>
                )}
                
                {nextNav && (
                  <Button
                    variant="outline"
                    onClick={() => handleSectionChange(nextNav.id)}
                    className="group justify-end h-auto p-4 text-right sm:col-start-2"
                  >
                    <div className="flex items-start gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Next {nextNav.type === 'submodule' ? 'Submodule' : 'Module'}
                        </div>
                        <div className="font-medium">
                          {nextNav.type === 'module' 
                            ? `${sections.findIndex(s => s.id === nextNav.id) + 1}. ${nextNav.title}`
                            : nextNav.title
                          }
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 mt-0.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Search Dialog */}
      <SearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        sections={sections}
        onNavigate={() => {}}
        recentSearches={[]}
        onRecentSearch={() => {}}
      />
    </div>
  )
}

export const DocumentationPage = () => {
  return (
    <ThemeProvider>
      <DocumentationContent />
    </ThemeProvider>
  )
} 