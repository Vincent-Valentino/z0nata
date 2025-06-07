import { useState, useEffect, useMemo } from 'react'
import { ThemeProvider, useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'
import { 
  MarkdownRenderer, 
  DocumentSidebar, 
  DocumentNavbar, 
  getDefaultDocSections 
} from '@/components/block/docs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

// Import markdown content
import introductionMd from '@/content/docs/introduction.md?raw'
import huaweiAiMd from '@/content/docs/huawei-ai.md?raw'
import hciaCertificationMd from '@/content/docs/hcia-certification.md?raw'

interface MarkdownContent {
  [key: string]: string
}

const DocumentationContent = () => {
  const { resolvedTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('introduction')
  const [activeItem, setActiveItem] = useState<string>()
  const [searchValue, setSearchValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const sections = getDefaultDocSections()

  // Markdown content mapping
  const markdownContent: MarkdownContent = {
    'introduction': introductionMd,
    'huawei-ai': huaweiAiMd,
    'hcia-certification': hciaCertificationMd
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
    return markdownContent[activeSection] || '# Content not found\n\nThe requested content could not be loaded.'
  }, [activeSection, markdownContent])

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

  // Initialize from URL
  useEffect(() => {
    const url = new URL(window.location.href)
    const sectionParam = url.searchParams.get('section')
    if (sectionParam && markdownContent[sectionParam]) {
      setActiveSection(sectionParam)
    }
  }, [])

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
      <DocumentNavbar />
      
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