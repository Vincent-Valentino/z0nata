import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Folder, File, Plus, Loader2 } from 'lucide-react'
import { type Module } from '@/services/moduleService'

interface FormErrors {
  title?: string
  description?: string
  content?: string
  parentId?: string
}

interface NewDoc {
  title: string
  description: string
  content: string
  type: 'module' | 'submodule'
  parentId: string
}

interface CreateDocumentationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  newDoc: NewDoc
  onInputChange: (field: keyof NewDoc, value: string) => void
  formErrors: FormErrors
  modules: Module[]
  submitLoading: boolean
  onSubmit: () => void
  onCancel: () => void
}

export const CreateDocumentationDialog = ({
  isOpen,
  onOpenChange,
  newDoc,
  onInputChange,
  formErrors,
  modules,
  submitLoading,
  onSubmit,
  onCancel
}: CreateDocumentationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Documentation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Documentation</DialogTitle>
          <DialogDescription>
            Create a new module or submodule for the learning platform
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Type *</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={newDoc.type === 'module' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => onInputChange('type', 'module')}
              >
                <Folder className="w-4 h-4 mr-2" />
                Module
              </Button>
              <Button
                type="button"
                variant={newDoc.type === 'submodule' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => onInputChange('type', 'submodule')}
              >
                <File className="w-4 h-4 mr-2" />
                Submodule
              </Button>
            </div>
          </div>

          {/* Parent Module Selection for Submodules */}
          {newDoc.type === 'submodule' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Parent Module *</label>
              <select
                value={newDoc.parentId}
                onChange={(e) => onInputChange('parentId', e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="">Select a parent module</option>
                {modules.filter(m => m.is_published).map(module => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
              {formErrors.parentId && (
                <p className="text-sm text-red-600">{formErrors.parentId}</p>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Title * <span className="text-muted-foreground">({newDoc.title.length}/200)</span>
            </label>
            <Input
              value={newDoc.title}
              onChange={(e) => onInputChange('title', e.target.value)}
              placeholder="Enter title..."
              maxLength={200}
            />
            {formErrors.title && (
              <p className="text-sm text-red-600">{formErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description <span className="text-muted-foreground">({newDoc.description.length}/500)</span>
            </label>
            <Textarea
              value={newDoc.description}
              onChange={(e) => onInputChange('description', e.target.value)}
              placeholder="Enter description..."
              rows={3}
              maxLength={500}
            />
            {formErrors.description && (
              <p className="text-sm text-red-600">{formErrors.description}</p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Content (Markdown) * <span className="text-muted-foreground">({newDoc.content.length} characters)</span>
            </label>
            <Textarea
              value={newDoc.content}
              onChange={(e) => onInputChange('content', e.target.value)}
              placeholder="Enter content in markdown format..."
              rows={8}
              className="font-mono text-sm"
            />
            {formErrors.content && (
              <p className="text-sm text-red-600">{formErrors.content}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitLoading}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitLoading}>
            {submitLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 