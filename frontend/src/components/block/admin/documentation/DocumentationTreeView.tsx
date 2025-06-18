import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  BookOpen, 
  Folder, 
  File, 
  ChevronRight,
  ChevronDown,
  GripVertical,
  FolderOpen,
  Globe,
  EyeOff
} from 'lucide-react'
import { type DragDropItem } from '@/services/moduleService'

interface TreeNode {
  id: string
  title: string
  type: 'module' | 'submodule'
  parentId?: string
  isPublished: boolean
  order: number
  children: TreeNode[]
  isExpanded: boolean
}

interface DocumentationTreeViewProps {
  treeData: TreeNode[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedStatus: 'all' | 'published' | 'draft'
  setSelectedStatus: (status: 'all' | 'published' | 'draft') => void
  selectedItem: any
  onSelectItem: (item: TreeNode) => void
  onToggleExpansion: (nodeId: string) => void
  onDragStart: (item: DragDropItem) => void
  onDragEnd: (targetItem: DragDropItem, position: 'before' | 'after' | 'inside') => void
  draggedItem: DragDropItem | null
  docsLength: number
}

export const DocumentationTreeView = ({
  treeData,
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  selectedItem,
  onSelectItem,
  onToggleExpansion,
  onDragStart,
  onDragEnd,
  draggedItem,
  docsLength
}: DocumentationTreeViewProps) => {
  const getStatusBadge = (isPublished: boolean) => {
    return isPublished ? 
      <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
        <Globe className="w-3 h-3 mr-1" />
        Published
      </Badge> : 
      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
        <EyeOff className="w-3 h-3 mr-1" />
        Draft
      </Badge>
  }

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children.length > 0
    const isSelected = selectedItem?.id === node.id
    const isDraggedOver = draggedItem && draggedItem.id !== node.id
    const isBeingDragged = draggedItem && draggedItem.id === node.id
    
    return (
      <div key={node.id} className="select-none">
        <div
          className={`
            flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/50 transition-colors
            ${isSelected ? 'bg-primary/10 border border-primary/20' : ''}
            ${isDraggedOver ? 'border-2 border-dashed border-primary/50' : ''}
            ${isBeingDragged ? 'opacity-50 bg-muted' : ''}
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onSelectItem(node)}
          draggable
          onDragStart={(e) => {
            e.stopPropagation()
            onDragStart({
              id: node.id,
              type: node.type,
              parentId: node.parentId,
              order: node.order,
              title: node.title,
              isPublished: node.isPublished
            })
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            
            if (draggedItem && draggedItem.id !== node.id) {
              // Determine drop position based on mouse position
              const rect = e.currentTarget.getBoundingClientRect()
              const y = e.clientY - rect.top
              const height = rect.height
              
              let position: 'before' | 'after' | 'inside' = 'after'
              
              if (node.type === 'module' && hasChildren) {
                // For modules with children, allow dropping inside
                if (y < height * 0.25) {
                  position = 'before'
                } else if (y > height * 0.75) {
                  position = 'after'
                } else {
                  position = 'inside'
                }
              } else {
                // For modules without children or submodules, only before/after
                position = y < height * 0.5 ? 'before' : 'after'
              }
              
              onDragEnd({
                id: node.id,
                type: node.type,
                parentId: node.parentId,
                order: node.order,
                title: node.title,
                isPublished: node.isPublished
              }, position)
            }
          }}
        >
          <GripVertical className="w-3 h-3 text-muted-foreground opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing" />
          
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpansion(node.id)
              }}
            >
              {node.isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          ) : (
            <div className="w-4" />
          )}
          
          {node.type === 'module' ? (
            node.isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-600" />
            ) : (
              <Folder className="w-4 h-4 text-blue-600" />
            )
          ) : (
            <File className="w-4 h-4 text-gray-600" />
          )}
          
          <span className="flex-1 text-sm truncate">{node.title}</span>
          
          {getStatusBadge(node.isPublished)}
        </div>
        
        {hasChildren && node.isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="h-full max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Documentation Tree
        </CardTitle>
        <CardDescription>
          Drag and drop to reorder modules and submodules
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
        {/* Filters */}
        <div className="flex-shrink-0 space-y-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'published' | 'draft')}
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <Separator className="flex-shrink-0 mb-4" />

        {/* Tree View */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full max-h-[80vh]">
            {treeData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No documentation found</h3>
                <p className="text-muted-foreground text-sm">
                  {docsLength === 0 
                    ? "Get started by creating your first module"
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-1 pr-2 pb-4">
                {treeData.map(node => renderTreeNode(node))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
} 