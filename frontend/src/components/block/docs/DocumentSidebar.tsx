import { useState, useMemo, useEffect } from 'react'
import { Search, Book, FileText, GraduationCap, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

interface DocumentSidebarProps {
  sections: DocSection[]
  activeSection: string
  activeItem?: string
  onSectionChange: (sectionId: string) => void
  onItemClick?: (itemId: string) => void
  searchValue: string
  onSearchChange: (value: string) => void
}

export const DocumentSidebar = ({
  sections,
  activeSection,
  activeItem,
  onSectionChange,
  onItemClick,
  searchValue,
  onSearchChange
}: DocumentSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Auto-expand section that contains the active item or if activeSection is a submodule
    const initialExpanded = new Set([activeSection])
    
    // Check if activeSection is actually a submodule - if so, expand its parent
    sections.forEach(section => {
      if (section.items?.some(item => item.id === activeSection)) {
        initialExpanded.add(section.id)
      }
    })
    
    return initialExpanded
  })

  // Update expanded sections when activeSection changes
  useEffect(() => {
    // Check if activeSection is a submodule and auto-expand its parent
    sections.forEach(section => {
      if (section.items?.some(item => item.id === activeSection)) {
        setExpandedSections(prev => new Set([...prev, section.id]))
      }
    })
  }, [activeSection, sections])

  const filteredSections = useMemo(() => {
    if (!searchValue) return sections

    return sections.filter(section =>
      section.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      section.description.toLowerCase().includes(searchValue.toLowerCase()) ||
      section.items?.some(item =>
        item.title.toLowerCase().includes(searchValue.toLowerCase())
      )
    )
  }, [sections, searchValue])

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div className="h-full flex flex-col bg-card border-r border-border/30">
      {/* Search */}
      <div className="p-4 border-b border-border/30 bg-muted/20">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-focus-within:text-blue-500" />
          <Input
            type="text"
            placeholder="Search documentation..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-background border-border/50 text-foreground placeholder:text-muted-foreground/70 focus:bg-background focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted/60 rounded-full"
              onClick={() => onSearchChange('')}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto bg-card">
        <nav className="p-3 space-y-1">
          {filteredSections.map((section, moduleIndex) => (
            <div key={section.id} className="space-y-1">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start p-0 h-auto transition-all duration-200 group border-0 hover:bg-transparent",
                  activeSection === section.id 
                    ? "" 
                    : ""
                )}
                onClick={() => {
                  onSectionChange(section.id)
                  if (section.items && section.items.length > 0) {
                    toggleSection(section.id)
                  }
                }}
              >
                <div className={cn(
                  "flex items-center justify-between w-full p-3 rounded-lg transition-all duration-200",
                  activeSection === section.id 
                    ? "bg-blue-50 border border-blue-200/60 text-blue-900 shadow-sm" 
                    : "hover:bg-muted/40 hover:border-border/40 border border-transparent"
                )}>
                  <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    <div className={cn(
                      "p-1.5 rounded-md transition-colors flex-shrink-0",
                      activeSection === section.id 
                        ? "bg-blue-100 text-blue-600" 
                        : "bg-muted/60 text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground"
                    )}>
                      {section.icon}
                    </div>
                    <div className="text-left min-w-0 flex-1 overflow-hidden max-w-[180px]">
                      <div className={cn(
                        "font-semibold text-sm leading-5 transition-colors",
                        "overflow-hidden text-ellipsis whitespace-nowrap max-w-full",
                        activeSection === section.id 
                          ? "text-blue-900" 
                          : "text-foreground group-hover:text-foreground"
                      )} 
                      title={section.title}>
                        {section.title}
                      </div>
                      <div className={cn(
                        "text-xs leading-4 mt-0.5 transition-colors",
                        "overflow-hidden text-ellipsis whitespace-nowrap max-w-full",
                        activeSection === section.id 
                          ? "text-blue-700/80" 
                          : "text-muted-foreground/90 group-hover:text-muted-foreground"
                      )}
                      title={section.description}>
                        {section.description}
                      </div>
                    </div>
                  </div>
                  {section.items && section.items.length > 0 && (
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-all duration-200 flex-shrink-0 ml-2",
                        activeSection === section.id 
                          ? "text-blue-600 rotate-90" 
                          : "text-muted-foreground/60 group-hover:text-muted-foreground",
                        expandedSections.has(section.id) && "rotate-90"
                      )}
                    />
                  )}
                </div>
              </Button>

              {/* Subsections */}
              {section.items && expandedSections.has(section.id) && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {section.items.map((item, subIndex) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-sm transition-all duration-200 h-auto p-0 group border-0 hover:bg-transparent"
                      )}
                      onClick={() => onItemClick?.(item.id)}
                    >
                      <div className={cn(
                        "flex items-center gap-2.5 w-full p-2.5 rounded-md transition-all duration-200",
                        (activeItem === item.id || activeSection === item.id)
                          ? "bg-blue-50/70 text-blue-800 border border-blue-200/40" 
                          : "hover:bg-muted/30 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/30",
                        `ml-${item.level * 3}`
                      )}>
                        <div className={cn(
                          "w-1 h-1 rounded-full flex-shrink-0 transition-colors",
                          (activeItem === item.id || activeSection === item.id)
                            ? "bg-blue-500" 
                            : "bg-muted-foreground/40 group-hover:bg-muted-foreground/60"
                        )} />
                        <div 
                          className={cn(
                            "font-medium text-sm leading-5 transition-colors min-w-0 flex-1",
                            "overflow-hidden text-ellipsis whitespace-nowrap max-w-[140px]"
                          )}
                          title={item.title}
                        >
                          {item.title}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/30 bg-muted/10">
        <div className="flex items-center justify-center">
          <Badge variant="secondary" className="text-xs bg-muted/60 text-muted-foreground border-0 font-medium">
            <Book className="w-3 h-3 mr-1.5" />
            {sections.length} modules
          </Badge>
        </div>
      </div>
    </div>
  )
}

// Default sections data
export const getDefaultDocSections = (): DocSection[] => [
  {
    id: 'introduction',
    title: 'Pengenalan AI',
    icon: <Book className="w-5 h-5" />,
    description: 'Konsep dasar Artificial Intelligence',
    items: [
      { id: 'what-is-ai', title: 'Apa itu AI?', level: 1 },
      { id: 'ai-concepts', title: 'Konsep Utama AI', level: 1 },
      { id: 'machine-learning', title: 'Machine Learning', level: 2 },
      { id: 'deep-learning', title: 'Deep Learning', level: 2 },
      { id: 'nlp', title: 'Natural Language Processing', level: 2 },
      { id: 'ai-applications', title: 'Aplikasi AI', level: 1 },
      { id: 'ai-history', title: 'Sejarah Perkembangan AI', level: 1 },
      { id: 'ai-challenges', title: 'Tantangan dalam AI', level: 1 },
      { id: 'future-trends', title: 'Tren Masa Depan', level: 1 }
    ]
  },
  {
    id: 'huawei-ai',
    title: 'Huawei AI Framework',
    icon: <FileText className="w-5 h-5" />,
    description: 'Framework dan tools Huawei untuk AI',
    items: [
      { id: 'overview', title: 'Overview', level: 1 },
      { id: 'mindspore', title: 'MindSpore Framework', level: 1 },
      { id: 'mindspore-features', title: 'Fitur Utama MindSpore', level: 2 },
      { id: 'mindspore-architecture', title: 'Arsitektur MindSpore', level: 2 },
      { id: 'ascend', title: 'Ascend Chipset', level: 1 },
      { id: 'ascend-910', title: 'Ascend 910', level: 2 },
      { id: 'ascend-310', title: 'Ascend 310', level: 2 },
      { id: 'cloud-services', title: 'Huawei Cloud AI Services', level: 1 },
      { id: 'cann', title: 'CANN Architecture', level: 1 },
      { id: 'best-practices', title: 'Best Practices', level: 1 },
      { id: 'tools', title: 'Tools dan Utilities', level: 1 }
    ]
  },
  {
    id: 'hcia-certification',
    title: 'HCIA-AI Certification',
    icon: <GraduationCap className="w-5 h-5" />,
    description: 'Persiapan sertifikasi HCIA-AI',
    items: [
      { id: 'overview', title: 'Overview Sertifikasi', level: 1 },
      { id: 'target-audience', title: 'Target Audience', level: 1 },
      { id: 'exam-structure', title: 'Exam Structure', level: 1 },
      { id: 'syllabus', title: 'Syllabus Detail', level: 1 },
      { id: 'ai-fundamentals', title: 'AI Fundamentals (25%)', level: 2 },
      { id: 'machine-learning-exam', title: 'Machine Learning (20%)', level: 2 },
      { id: 'deep-learning-exam', title: 'Deep Learning (20%)', level: 2 },
      { id: 'huawei-stack', title: 'Huawei AI Stack (20%)', level: 2 },
      { id: 'ai-applications-exam', title: 'AI Applications (15%)', level: 2 },
      { id: 'study-materials', title: 'Study Materials', level: 1 },
      { id: 'preparation-timeline', title: 'Preparation Timeline', level: 1 },
      { id: 'hands-on-labs', title: 'Hands-on Labs', level: 1 },
      { id: 'exam-tips', title: 'Tips Ujian', level: 1 },
      { id: 'mock-exam', title: 'Mock Exam Questions', level: 1 }
    ]
  }
] 