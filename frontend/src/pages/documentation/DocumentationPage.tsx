import { useState, useEffect, useMemo } from 'react'
import { ThemeProvider, useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'
import { 
  MarkdownRenderer, 
  DocumentSidebar, 
  DocumentNavbar, 
  SearchDialog
} from '@/components/block/docs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { moduleService, type Module } from '@/services/moduleService'

// Use the existing interfaces from DocumentSidebar
interface DocSection {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  items?: DocItem[]
}

interface DocItem {
  id: string
  title: string
  level: number
}

const DocumentationContent = () => {
  const { resolvedTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('')
  const [activeItem, setActiveItem] = useState<string>()
  const [searchValue, setSearchValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [sections, setSections] = useState<DocSection[]>([])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('doc-recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse recent searches:', e)
      }
    }
  }, [])

  // Fetch published modules on component mount
  useEffect(() => {
    fetchPublishedModules()
  }, [])

  const fetchPublishedModules = async () => {
    try {
      setIsLoading(true)
      const response = await moduleService.getModules({ published: true, limit: 100 })
      setModules(response.modules || [])
      
      // Convert modules to sections format
      const docSections: DocSection[] = (response.modules || []).map(module => ({
        id: module.id,
        title: module.name,
        description: module.description,
        icon: <div>📚</div>, // You can customize icons based on module content
        items: (module.sub_modules || []).filter(sub => sub.is_published).map(subModule => ({
          id: subModule.id,
          title: subModule.name,
          level: 1 // All submodules are level 1 for now
        }))
      }))
      
      setSections(docSections)
      
      // Set first module as active if none selected
      if (!activeSection && docSections.length > 0) {
        setActiveSection(docSections[0].id)
      }
    } catch (err) {
      console.error('Error fetching documentation:', err)
      setModules([]) // Ensure modules is always an array, never null
      setSections([]) // Clear sections on error
    } finally {
      setIsLoading(false)
    }
  }

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

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
    
    // Update URL without navigation
    const url = new URL(window.location.href)
    url.searchParams.set('section', sectionId)
    window.history.replaceState({}, '', url.toString())
  }

  // Handle item click (scroll to section)
  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId)
    
    // Try to scroll to the element
    setTimeout(() => {
      const element = document.getElementById(itemId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // Handle search navigation
  const handleSearchNavigate = (sectionId: string, itemId?: string) => {
    handleSectionChange(sectionId)
    if (itemId) {
      // Small delay to ensure content is loaded before scrolling
      setTimeout(() => {
        handleItemClick(itemId)
      }, 200)
    }
  }

  // Handle recent search
  const handleRecentSearch = (query: string) => {
    const updatedSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10)
    setRecentSearches(updatedSearches)
    localStorage.setItem('doc-recent-searches', JSON.stringify(updatedSearches))
  }

  // Initialize from URL
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

  // Get navigation info
  const currentSectionIndex = sections.findIndex(s => s.id === activeSection)
  const previousSection = currentSectionIndex > 0 ? sections[currentSectionIndex - 1] : null
  const nextSection = currentSectionIndex < sections.length - 1 ? sections[currentSectionIndex + 1] : null

  if (isLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors duration-200",
        resolvedTheme === 'dark' ? 'dark' : '',
        "bg-background"
      )}>
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading documentation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-200",
      resolvedTheme === 'dark' ? 'dark' : '',
      "bg-background"
    )}>
      {/* Navigation */}
      <DocumentNavbar onSearchOpen={() => setIsSearchOpen(true)} />
      
      {/* Main Layout */}
      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside className="w-80 h-screen sticky top-16 border-r border-border bg-background">
          <DocumentSidebar
            sections={sections}
            activeSection={activeSection}
            activeItem={activeItem}
            onSectionChange={handleSectionChange}
            onItemClick={handleItemClick}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="container mx-auto max-w-4xl px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <div className="text-white">
                    {sections.find(s => s.id === activeSection)?.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {sections.find(s => s.id === activeSection)?.title}
                  </h1>
                  <p className="text-muted-foreground">
                    {sections.find(s => s.id === activeSection)?.description}
                  </p>
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                  {currentSectionIndex + 1} of {sections.length}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-neutral max-w-none dark:prose-invert">
              <MarkdownRenderer 
                content={currentContent}
                className={cn(
                  "transition-all duration-200"
                )}
              />
            </div>

            {/* Footer Navigation */}
            <div className="mt-16 pt-8 border-t border-border">
              <div className="flex justify-between items-center">
                <div>
                  {previousSection && (
                    <Button
                      variant="outline"
                      onClick={() => handleSectionChange(previousSection.id)}
                      className="group"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                      <div className="text-left">
                        <div className="text-xs text-muted-foreground">Previous</div>
                        <div className="font-medium">{previousSection.title}</div>
                      </div>
                    </Button>
                  )}
                </div>
                <div>
                  {nextSection && (
                    <Button
                      variant="outline"
                      onClick={() => handleSectionChange(nextSection.id)}
                      className="group"
                    >
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Next</div>
                        <div className="font-medium">{nextSection.title}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  )}
                </div>
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
        onNavigate={handleSearchNavigate}
        recentSearches={recentSearches}
        onRecentSearch={handleRecentSearch}
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