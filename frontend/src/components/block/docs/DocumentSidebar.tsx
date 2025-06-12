import { useState, useMemo } from 'react'
import { Search, Book, FileText, GraduationCap, ChevronRight, Hash, X } from 'lucide-react'
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([activeSection]))

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
    <div className="h-full flex flex-col bg-background border-r border-border pt-5">
      {/* Search */}
      <div className="p-4 border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-focus-within:text-primary" />
          <Input
            type="text"
            placeholder="Filter sections..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-background/70 border-border/50 text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary shadow-sm hover:shadow-md transition-all duration-200 focus:shadow-lg"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted rounded-full"
              onClick={() => onSearchChange('')}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-2">
          {filteredSections.map((section) => (
            <div key={section.id}>
              <Button
                variant={activeSection === section.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start p-3 h-auto transition-all duration-200 text-foreground",
                  activeSection === section.id 
                    ? "bg-secondary/80 text-secondary-foreground border border-border/50 shadow-sm" 
                    : "hover:bg-muted/60 hover:text-foreground border border-transparent hover:border-border/30"
                )}
                onClick={() => {
                  onSectionChange(section.id)
                  if (section.items && section.items.length > 0) {
                    toggleSection(section.id)
                  }
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "text-lg flex-shrink-0 transition-colors",
                      activeSection === section.id ? "text-secondary-foreground" : "text-primary"
                    )}>
                      {section.icon}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-medium truncate text-sm text-foreground">{section.title}</div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {section.description}
                      </div>
                    </div>
                  </div>
                  {section.items && section.items.length > 0 && (
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-transform duration-200 flex-shrink-0 text-muted-foreground",
                        expandedSections.has(section.id) && "rotate-90"
                      )}
                    />
                  )}
                </div>
              </Button>

              {/* Subsections */}
              {section.items && expandedSections.has(section.id) && (
                <div className="ml-4 mt-2 space-y-1 border-l border-border/30 pl-2">
                  {section.items.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeItem === item.id ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start text-sm transition-colors duration-200 h-8 text-foreground",
                        activeItem === item.id 
                          ? "bg-secondary/60 text-secondary-foreground border border-border/50" 
                          : "hover:bg-muted/50 hover:text-foreground border border-transparent hover:border-border/20"
                      )}
                      onClick={() => onItemClick?.(item.id)}
                      style={{ paddingLeft: `${item.level * 12 + 8}px` }}
                    >
                      <Hash className="w-3 h-3 mr-2 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate text-foreground">{item.title}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="text-xs text-muted-foreground text-center">
          <Badge variant="outline" className="text-xs bg-background/70 text-foreground border-border/50">
            {sections.length} sections
          </Badge>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .prose::-webkit-scrollbar,
        nav::-webkit-scrollbar {
          width: 6px;
        }
        
        .prose::-webkit-scrollbar-track,
        nav::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 3px;
        }
        
        .prose::-webkit-scrollbar-thumb,
        nav::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 3px;
        }
        
        .prose::-webkit-scrollbar-thumb:hover,
        nav::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
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