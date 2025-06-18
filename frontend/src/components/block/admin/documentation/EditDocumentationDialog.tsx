import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Save, Loader2 } from 'lucide-react'

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

interface EditDocumentationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingDoc: DocModule | null
  newDoc: NewDoc
  onInputChange: (field: keyof NewDoc, value: string) => void
  formErrors: FormErrors
  submitLoading: boolean
  onSubmit: () => void
  onCancel: () => void
}

export const EditDocumentationDialog = ({
  isOpen,
  onOpenChange,
  editingDoc,
  newDoc,
  onInputChange,
  formErrors,
  submitLoading,
  onSubmit,
  onCancel
}: EditDocumentationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) {
        onCancel()
      }
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Documentation</DialogTitle>
          <DialogDescription>
            Make changes to the {editingDoc?.type} content and settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
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
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 