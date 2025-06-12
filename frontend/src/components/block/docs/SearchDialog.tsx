import React, { useState, useMemo, useEffect } from 'react'
import { Search, FileText, Hash, Clock, ArrowRight } from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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

interface SearchResult {
  type: 'section' | 'item'
  id: string
  title: string
  description?: string
  sectionTitle?: string
  icon?: React.ReactNode
  level?: number
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sections: DocSection[]
  onNavigate: (sectionId: string, itemId?: string) => void
  recentSearches?: string[]
  onRecentSearch?: (query: string) => void
}

export const SearchDialog = ({
  open,
  onOpenChange,
  sections,
  onNavigate,
  recentSearches = [],
  onRecentSearch
}: SearchDialogProps) => {
  const [query, setQuery] = useState('')

  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim()) return []

    const results: SearchResult[] = []
    const lowerQuery = query.toLowerCase()

    // Search sections
    sections.forEach(section => {
      if (
        section.title.toLowerCase().includes(lowerQuery) ||
        section.description.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: 'section',
          id: section.id,
          title: section.title,
          description: section.description,
          icon: section.icon
        })
      }

      // Search items within sections
      section.items?.forEach(item => {
        if (item.title.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'item',
            id: item.id,
            title: item.title,
            sectionTitle: section.title,
            level: item.level
          })
        }
      })
    })

    return results.slice(0, 10) // Limit to 10 results
  }, [query, sections])

  const filteredRecentSearches = useMemo(() => {
    return recentSearches.filter(search => 
      search.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5)
  }, [recentSearches, query])

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'section') {
      onNavigate(result.id)
    } else {
      // Find the section for this item
      const section = sections.find(s => 
        s.items?.some(item => item.id === result.id)
      )
      if (section) {
        onNavigate(section.id, result.id)
      }
    }
    
    // Add to recent searches
    if (query.trim() && onRecentSearch) {
      onRecentSearch(query.trim())
    }
    
    onOpenChange(false)
    setQuery('')
  }

  const handleRecentSearch = (searchQuery: string) => {
    setQuery(searchQuery)
  }

  // Clear query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search documentation..."
        value={query}
        onValueChange={setQuery}
        className="border-0 focus:ring-0"
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty className="py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">No results found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for different keywords
              </p>
            </div>
          </div>
        </CommandEmpty>

        {/* Recent searches when no query */}
        {!query && filteredRecentSearches.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {filteredRecentSearches.map((search, index) => (
              <CommandItem
                key={index}
                value={`recent-${search}`}
                onSelect={() => handleRecentSearch(search)}
                className="gap-3"
              >
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1">{search}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Search results */}
        {query && searchResults.length > 0 && (
          <>
            {/* Sections */}
            {searchResults.filter(r => r.type === 'section').length > 0 && (
              <CommandGroup heading="Sections">
                {searchResults
                  .filter(r => r.type === 'section')
                  .map((result) => (
                    <CommandItem
                      key={result.id}
                      value={`section-${result.id}`}
                      onSelect={() => handleSelect(result)}
                      className="gap-3 py-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="text-white text-sm">
                            {result.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {result.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {result.description}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Section
                      </Badge>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}

            {/* Items */}
            {searchResults.filter(r => r.type === 'item').length > 0 && (
              <CommandGroup heading="Content">
                {searchResults
                  .filter(r => r.type === 'item')
                  .map((result) => (
                    <CommandItem
                      key={result.id}
                      value={`item-${result.id}`}
                      onSelect={() => handleSelect(result)}
                      className="gap-3 py-2"
                    >
                      <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {result.title}
                        </div>
                        {result.sectionTitle && (
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            in {result.sectionTitle}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          H{result.level}
                        </Badge>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
          </>
        )}

        {/* Help text */}
        {!query && filteredRecentSearches.length === 0 && (
          <div className="py-8 px-4">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Search Documentation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Find sections, headings, and content quickly
                </p>
              </div>
              <div className="flex justify-center">
                <Badge variant="outline" className="text-xs">
                  Type to search...
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  )
} 