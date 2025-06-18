import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Folder, 
  File, 
  Settings,
  Edit,
  Trash2,
  Globe,
  EyeOff,
  User,
  Calendar,
  Clock
} from 'lucide-react'
import { MarkdownRenderer } from '@/components/block/docs/MarkdownRenderer'

interface DocModule {
  id: string
  title: string
  description: string
  content: string
  type: 'module' | 'submodule'
  parentId?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  isPublished: boolean
  order: number
}

interface DocumentationContentViewProps {
  selectedItem: DocModule | null
  onToggleStatus: (doc: DocModule) => void
  onStartEdit: (doc: DocModule) => void
  onDeleteDoc: (docId: string) => void
}

export const DocumentationContentView = ({
  selectedItem,
  onToggleStatus,
  onStartEdit,
  onDeleteDoc
}: DocumentationContentViewProps) => {
  return (
    <Card className="h-full max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {selectedItem ? (
                <>
                  {selectedItem.type === 'module' ? (
                    <Folder className="w-5 h-5 text-blue-600" />
                  ) : (
                    <File className="w-5 h-5 text-gray-600" />
                  )}
                  {selectedItem.title}
                </>
              ) : (
                <>
                  <Settings className="w-5 h-5" />
                  Content Management
                </>
              )}
            </CardTitle>
            <CardDescription>
              {selectedItem 
                ? `${selectedItem.type === 'module' ? 'Module' : 'Submodule'} • ${selectedItem.isPublished ? 'Published' : 'Draft'}`
                : 'Select an item from the tree to view and edit its content'
              }
            </CardDescription>
          </div>
          
          {selectedItem && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus(selectedItem)}
              >
                {selectedItem.isPublished ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartEdit(selectedItem)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeleteDoc(selectedItem.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 overflow-hidden p-4">
        {selectedItem ? (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Item Details */}
            <div className="flex-shrink-0 mb-3 p-3 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground">Created By</div>
                  <div className="flex items-center gap-1 mt-1">
                    <User className="w-3 h-3" />
                    <span className="truncate">{selectedItem.createdBy}</span>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Created</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span className="truncate">{new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Last Updated</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    <span className="truncate">{new Date(selectedItem.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              {selectedItem.description && (
                <div className="mt-3">
                  <div className="font-medium text-muted-foreground mb-1">Description</div>
                  <p className="text-sm line-clamp-2 break-words">{selectedItem.description}</p>
                </div>
              )}
            </div>

            {/* Content Preview */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="flex-shrink-0 font-medium text-muted-foreground mb-2">Content Preview</div>
              <div className="flex-1 min-h-0 max-h-[75vh] border rounded-lg overflow-hidden bg-background/50 backdrop-blur-sm">
                <ScrollArea className="h-full max-h-[75vh] w-full">
                  <div className="p-4 space-y-3">
                    <MarkdownRenderer 
                      content={selectedItem.content} 
                      className="prose prose-sm dark:prose-invert max-w-none break-words hyphens-auto leading-relaxed prose-headings:scroll-mt-2 prose-p:mb-3 prose-headings:mb-2"
                    />
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No item selected</h3>
              <p className="text-muted-foreground">
                Select a module or submodule from the tree to view its content
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 