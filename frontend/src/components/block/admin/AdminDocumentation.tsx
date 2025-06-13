import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Search, 
  BookOpen, 
  FileText, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  User,
  Folder,
  File,
  Loader2,
  AlertCircle,
  Clock,
  Globe,
  EyeOff,
  Save
} from 'lucide-react'
import { moduleService, type Module } from '@/services/moduleService'
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
}

interface FormErrors {
  title?: string
  description?: string
  content?: string
  parentId?: string
}

export const AdminDocumentation = () => {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'module' | 'submodule'>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingDoc, setEditingDoc] = useState<DocModule | null>(null)
  const [newDoc, setNewDoc] = useState({
    title: '',
    description: '',
    content: '',
    type: 'module' as 'module' | 'submodule',
    parentId: ''
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [viewingDoc, setViewingDoc] = useState<DocModule | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!newDoc.title.trim()) {
      errors.title = 'Title is required'
    } else if (newDoc.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters'
    } else if (newDoc.title.trim().length > 200) {
      errors.title = 'Title must be less than 200 characters'
    }

    if (newDoc.description.trim().length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }

    if (!newDoc.content.trim()) {
      errors.content = 'Content is required'
    }

    if (newDoc.type === 'submodule' && !newDoc.parentId) {
      errors.parentId = 'Parent module is required for submodules'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const fetchModules = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await moduleService.getModules({ search: searchTerm, limit: 100 })
      setModules(response.modules || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch modules')
      console.error('Error fetching modules:', err)
      setModules([]) // Ensure modules is always an array, never null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModules()
  }, [])

  // Convert modules to DocModule format for display with proper null safety
  const docs: DocModule[] = useMemo(() => {
    if (!modules || !Array.isArray(modules)) {
      return []
    }

    return (modules || []).flatMap(module => {
      const moduleDoc: DocModule = {
        id: module.id,
        title: module.name,
        description: module.description,
        content: module.content,
        type: 'module',
        createdBy: module.created_by,
        createdAt: module.created_at,
        updatedAt: module.updated_at,
        isPublished: module.is_published
      }

      const subModuleDocs: DocModule[] = (module.sub_modules || []).map(subModule => ({
        id: subModule.id,
        title: subModule.name,
        description: subModule.description,
        content: subModule.content,
        type: 'submodule',
        parentId: module.id,
        createdBy: subModule.created_by,
        createdAt: subModule.created_at,
        updatedAt: subModule.updated_at,
        isPublished: subModule.is_published
      }))

      return [moduleDoc, ...subModuleDocs]
    })
  }, [modules])

  // Filter docs based on search and type
  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || doc.type === selectedType
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'published' && doc.isPublished) ||
                         (selectedStatus === 'draft' && !doc.isPublished)
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getSubmodules = (moduleId: string) => docs.filter(doc => doc.type === 'submodule' && doc.parentId === moduleId)

  const getDocTypeIcon = (type: string) => {
    return type === 'module' ? <Folder className="w-4 h-4" /> : <File className="w-4 h-4" />
  }

  const getDocTypeBadge = (type: string) => {
    return type === 'module' ? 
      <Badge variant="default" className="text-xs">Module</Badge> : 
      <Badge variant="secondary" className="text-xs">Submodule</Badge>
  }

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

  const resetForm = () => {
    setNewDoc({
      title: '',
      description: '',
      content: '',
      type: 'module',
      parentId: ''
    })
    setFormErrors({})
    setEditingDoc(null)
    setViewingDoc(null)
  }

  const handleAddDoc = async () => {
    if (!validateForm()) return

    try {
      setSubmitLoading(true)
      setError(null)

      if (newDoc.type === 'module') {
        await moduleService.createModule({
          name: newDoc.title.trim(),
          description: newDoc.description.trim(),
          content: newDoc.content.trim()
        })
      } else {
        await moduleService.createSubModule(newDoc.parentId, {
          name: newDoc.title.trim(),
          description: newDoc.description.trim(),
          content: newDoc.content.trim()
        })
      }

      await fetchModules()
      setShowCreateDialog(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEditDoc = async () => {
    if (!validateForm() || !editingDoc) return

    // Check if user is trying to convert between types
    const isTypeChange = editingDoc.type !== newDoc.type
    
    if (isTypeChange) {
      const confirmMessage = editingDoc.type === 'module' 
        ? 'Converting a module to a submodule will move it under another module. Are you sure?'
        : 'Converting a submodule to a module will make it independent. Are you sure?'
      
      if (!confirm(confirmMessage)) {
        return
      }
    }

    try {
      setSubmitLoading(true)
      setError(null)

      if (isTypeChange) {
        // For type conversion, we need to handle it specially
        if (newDoc.type === 'module') {
          // Converting submodule to module - create new module and delete submodule
          await moduleService.createModule({
            name: newDoc.title.trim(),
            description: newDoc.description.trim(),
            content: newDoc.content.trim()
          })
          if (editingDoc.parentId) {
            await moduleService.deleteSubModule(editingDoc.parentId, editingDoc.id)
          }
        } else {
          // Converting module to submodule - create new submodule and delete module
          if (newDoc.parentId) {
            await moduleService.createSubModule(newDoc.parentId, {
              name: newDoc.title.trim(),
              description: newDoc.description.trim(),
              content: newDoc.content.trim()
            })
            await moduleService.deleteModule(editingDoc.id)
          }
        }
      } else {
        // Regular update without type change
        if (editingDoc.type === 'module') {
          await moduleService.updateModule(editingDoc.id, {
            name: newDoc.title.trim(),
            description: newDoc.description.trim(),
            content: newDoc.content.trim()
          })
        } else if (editingDoc.parentId) {
          await moduleService.updateSubModule(editingDoc.parentId, editingDoc.id, {
            name: newDoc.title.trim(),
            description: newDoc.description.trim(),
            content: newDoc.content.trim()
          })
        }
      }

      await fetchModules()
      setShowEditDialog(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleViewDoc = (doc: DocModule) => {
    setViewingDoc(doc)
    setShowViewDialog(true)
  }

  const handleStartEdit = (doc: DocModule) => {
    setEditingDoc(doc)
    setNewDoc({
      title: doc.title,
      description: doc.description,
      content: doc.content,
      type: doc.type,
      parentId: doc.parentId || ''
    })
    setShowEditDialog(true)
  }

  const handleToggleStatus = async (doc: DocModule) => {
    try {
      setError(null)
      
      if (doc.type === 'module') {
        await moduleService.toggleModulePublication(doc.id, !doc.isPublished)
      } else if (doc.parentId) {
        await moduleService.toggleSubModulePublication(doc.parentId, doc.id, !doc.isPublished)
      }
      
      await fetchModules()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update publication status')
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }

    try {
      setError(null)
      const doc = docs.find(d => d.id === docId)
      
      if (doc?.type === 'module') {
        await moduleService.deleteModule(docId)
      } else if (doc?.parentId) {
        await moduleService.deleteSubModule(doc.parentId, docId)
      }
      
      await fetchModules()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }

  const handleInputChange = (field: keyof typeof newDoc, value: string) => {
    setNewDoc(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (loading && (!modules || modules.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading documentation...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Documentation Management</h1>
          <p className="text-muted-foreground">Create and manage learning modules and documentation</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Documentation
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
                    onClick={() => handleInputChange('type', 'module')}
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    Module
                  </Button>
                  <Button
                    type="button"
                    variant={newDoc.type === 'submodule' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => handleInputChange('type', 'submodule')}
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
                    onChange={(e) => handleInputChange('parentId', e.target.value)}
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
                  onChange={(e) => handleInputChange('title', e.target.value)}
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
                  onChange={(e) => handleInputChange('description', e.target.value)}
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
                  onChange={(e) => handleInputChange('content', e.target.value)}
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
                onClick={() => {
                  setShowCreateDialog(false)
                  resetForm()
                }}
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleAddDoc} disabled={submitLoading}>
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
      </div>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={(open) => {
        setShowViewDialog(open)
        if (!open) {
          setViewingDoc(null)
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingDoc?.type === 'module' ? (
                <Folder className="w-5 h-5" />
              ) : (
                <File className="w-5 h-5" />
              )}
              {viewingDoc?.title}
            </DialogTitle>
            <DialogDescription>
              {viewingDoc?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {viewingDoc && (
              <MarkdownRenderer 
                content={viewingDoc.content} 
                className="prose prose-sm dark:prose-invert max-w-none"
              />
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {viewingDoc?.createdBy}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {viewingDoc && new Date(viewingDoc.createdAt).toLocaleDateString()}
              </div>
              {viewingDoc && getStatusBadge(viewingDoc.isPublished)}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => viewingDoc && handleStartEdit(viewingDoc)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowViewDialog(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open)
        if (!open) {
          setError(null)
          resetForm()
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
            {/* Type and Parent Module Display */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="flex items-center gap-2">
                {newDoc.type === 'module' ? (
                  <Folder className="w-4 h-4" />
                ) : (
                  <File className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {newDoc.type === 'module' ? 'Module' : 'Submodule'}
                </span>
                {newDoc.type === 'submodule' && newDoc.parentId && (
                  <span className="text-sm text-muted-foreground">
                    → {modules.find(m => m.id === newDoc.parentId)?.name}
                  </span>
                )}
              </div>
            </div>

                         {/* Option to change parent or convert type */}
             <div className="space-y-2">
               <label className="text-sm font-medium">Change Type or Parent</label>
               {editingDoc && editingDoc.type !== newDoc.type && (
                 <Alert>
                   <AlertCircle className="h-4 w-4" />
                   <AlertDescription>
                     Warning: Converting between module types will recreate the item with a new ID.
                   </AlertDescription>
                 </Alert>
               )}
               <div className="grid grid-cols-2 gap-2">
                 <Button
                   type="button"
                   variant={newDoc.type === 'module' ? 'default' : 'outline'}
                   className="justify-start"
                   onClick={() => handleInputChange('type', 'module')}
                 >
                   <Folder className="w-4 h-4 mr-2" />
                   Module
                 </Button>
                 <Button
                   type="button"
                   variant={newDoc.type === 'submodule' ? 'default' : 'outline'}
                   className="justify-start"
                   onClick={() => handleInputChange('type', 'submodule')}
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
                  onChange={(e) => handleInputChange('parentId', e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="">Select a parent module</option>
                  {modules.filter(m => m.is_published && m.id !== editingDoc?.id).map(module => (
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
                onChange={(e) => handleInputChange('title', e.target.value)}
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
                onChange={(e) => handleInputChange('description', e.target.value)}
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
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Enter content in markdown format..."
                rows={8}
                className="font-mono text-sm"
              />
              {formErrors.content && (
                <p className="text-sm text-red-600">{formErrors.content}</p>
              )}
            </div>

            {/* Publication Status */}
            {editingDoc && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Publication Status</label>
                <div className="flex items-center gap-2">
                  {getStatusBadge(editingDoc.isPublished)}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(editingDoc)}
                  >
                    {editingDoc.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditDialog(false)
                resetForm()
              }}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEditDoc} disabled={submitLoading}>
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as 'all' | 'module' | 'submodule')}
          className="px-3 py-2 border border-input bg-background rounded-md"
        >
          <option value="all">All Types</option>
          <option value="module">Modules Only</option>
          <option value="submodule">Submodules Only</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'published' | 'draft')}
          className="px-3 py-2 border border-input bg-background rounded-md"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>

        <Button variant="outline" onClick={fetchModules} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Search className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Documentation List */}
      <div className="grid gap-4">
        {filteredDocs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No documentation found</h3>
              <p className="text-muted-foreground text-center">
                {docs.length === 0 
                  ? "Get started by creating your first module or submodule"
                  : "Try adjusting your search or filter criteria"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDocs.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {getDocTypeIcon(doc.type)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                        {getDocTypeBadge(doc.type)}
                        {getStatusBadge(doc.isPublished)}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {doc.description || 'No description available'}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(doc)}
                      title={doc.isPublished ? 'Unpublish' : 'Publish'}
                    >
                      {doc.isPublished ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Globe className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewDoc(doc)}
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleStartEdit(doc)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {doc.createdBy}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Updated {new Date(doc.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                
                {doc.type === 'module' && (
                  <div className="mt-3">
                    {getSubmodules(doc.id).length > 0 ? (
                      <div className="text-sm text-muted-foreground">
                        <FileText className="w-3 h-3 inline mr-1" />
                        {getSubmodules(doc.id).length} submodule(s)
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No submodules
                      </div>
                    )}
                  </div>
                )}
                
                {doc.type === 'submodule' && doc.parentId && (
                  <div className="mt-3">
                    <div className="text-sm text-muted-foreground">
                      <Folder className="w-3 h-3 inline mr-1" />
                      Parent: {modules.find(m => m.id === doc.parentId)?.name || 'Unknown'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">{docs.filter(d => d.type === 'module').length}</div>
              <div className="text-muted-foreground">Modules</div>
            </div>
            <div>
              <div className="font-medium">{docs.filter(d => d.type === 'submodule').length}</div>
              <div className="text-muted-foreground">Submodules</div>
            </div>
            <div>
              <div className="font-medium">{docs.filter(d => d.isPublished).length}</div>
              <div className="text-muted-foreground">Published</div>
            </div>
            <div>
              <div className="font-medium">{docs.filter(d => !d.isPublished).length}</div>
              <div className="text-muted-foreground">Drafts</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 