import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { moduleService, type Module, type DragDropItem } from '@/services/moduleService'
import {
  DocumentationStatsCard,
  DocumentationTreeView,
  DocumentationContentView,
  CreateDocumentationDialog,
  EditDocumentationDialog
} from './documentation'

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

interface FormErrors {
  title?: string
  description?: string
  content?: string
  parentId?: string
}

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

export const AdminDocumentation = () => {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [selectedItem, setSelectedItem] = useState<DocModule | null>(null)
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
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [draggedItem, setDraggedItem] = useState<DragDropItem | null>(null)

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
      setModules([])
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
        isPublished: module.is_published,
        order: module.order
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
        isPublished: subModule.is_published,
        order: subModule.order
      }))

      return [moduleDoc, ...subModuleDocs]
    })
  }, [modules])

  // Build tree structure for hierarchical display
  const treeData: TreeNode[] = useMemo(() => {
    const moduleNodes: TreeNode[] = []
    
    // Filter modules based on search and status
    const filteredModules = modules.filter(module => {
      const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           module.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = selectedStatus === 'all' || 
                           (selectedStatus === 'published' && module.is_published) ||
                           (selectedStatus === 'draft' && !module.is_published)
      return matchesSearch && matchesStatus
    })

    // Sort modules by order
    const sortedModules = [...filteredModules].sort((a, b) => a.order - b.order)

    sortedModules.forEach(module => {
      const moduleNode: TreeNode = {
        id: module.id,
        title: module.name,
        type: 'module',
        isPublished: module.is_published,
        order: module.order,
        children: [],
        isExpanded: expandedNodes.has(module.id)
      }

      // Add submodules as children
      if (module.sub_modules) {
        const sortedSubModules = [...module.sub_modules].sort((a, b) => a.order - b.order)
        
        sortedSubModules.forEach(subModule => {
          const subModuleNode: TreeNode = {
            id: subModule.id,
            title: subModule.name,
            type: 'submodule',
            parentId: module.id,
            isPublished: subModule.is_published,
            order: subModule.order,
            children: [],
            isExpanded: false
          }
          moduleNode.children.push(subModuleNode)
        })
      }

      moduleNodes.push(moduleNode)
    })

    console.log('Tree data generated:', moduleNodes)
    return moduleNodes
  }, [modules, searchTerm, selectedStatus, expandedNodes])

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const handleSelectItem = (item: TreeNode) => {
    const docItem = docs.find(doc => doc.id === item.id)
    setSelectedItem(docItem || null)
  }

  const handleDragStart = (item: DragDropItem) => {
    console.log('Drag started:', item)
    setDraggedItem(item)
  }

  const handleDragEnd = async (targetItem: DragDropItem, position: 'before' | 'after' | 'inside') => {
    console.log('handleDragEnd called:', { draggedItem, targetItem, position })
    
    if (!draggedItem || draggedItem.id === targetItem.id) {
      console.log('Drag cancelled: same item or no dragged item')
      setDraggedItem(null)
      return
    }

    try {
      setError(null)
      console.log('Processing drag operation:', { draggedItem, targetItem, position })

      if (position === 'inside' && targetItem.type === 'module') {
        // Moving item inside a module (making it a submodule)
        if (draggedItem.type === 'module') {
          // Convert module to submodule - not supported yet
          console.log('Converting module to submodule not yet implemented')
          setDraggedItem(null)
          return
        } else {
          // Moving submodule to different parent module
          if (draggedItem.parentId === targetItem.id) {
            // Same parent, no need to move
            setDraggedItem(null)
            return
          }

          // First, delete from old parent
          if (draggedItem.parentId) {
            await moduleService.deleteSubModule(draggedItem.parentId, draggedItem.id)
          }

          // Then create in new parent
          const draggedDoc = docs.find(d => d.id === draggedItem.id)
          if (draggedDoc) {
            await moduleService.createSubModule(targetItem.id, {
              name: draggedDoc.title,
              description: draggedDoc.description,
              content: draggedDoc.content
            })
          }
        }
      } else {
        // Reordering within same level
        if (draggedItem.type === 'module' && targetItem.type === 'module') {
          // Reordering modules
          const moduleIds = treeData
            .filter(node => node.type === 'module')
            .map(node => node.id)
          
          const draggedIndex = moduleIds.indexOf(draggedItem.id)
          const targetIndex = moduleIds.indexOf(targetItem.id)
          
          if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedItem(null)
            return
          }

          // Remove dragged item and insert at new position
          const reorderedIds = [...moduleIds]
          const [draggedId] = reorderedIds.splice(draggedIndex, 1)
          const insertIndex = position === 'before' ? targetIndex : targetIndex + 1
          reorderedIds.splice(insertIndex, 0, draggedId)

          await moduleService.reorderModules(reorderedIds)
          
        } else if (draggedItem.type === 'submodule' && targetItem.type === 'submodule' && 
                   draggedItem.parentId === targetItem.parentId) {
          // Reordering submodules within same parent
          const parentModule = modules.find(m => m.id === draggedItem.parentId)
          if (!parentModule) {
            setDraggedItem(null)
            return
          }

          const subModuleIds = parentModule.sub_modules
            .map(sm => sm.id)
          
          const draggedIndex = subModuleIds.indexOf(draggedItem.id)
          const targetIndex = subModuleIds.indexOf(targetItem.id)
          
          if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedItem(null)
            return
          }

          // Remove dragged item and insert at new position
          const reorderedIds = [...subModuleIds]
          const [draggedId] = reorderedIds.splice(draggedIndex, 1)
          const insertIndex = position === 'before' ? targetIndex : targetIndex + 1
          reorderedIds.splice(insertIndex, 0, draggedId)

          await moduleService.reorderSubModules(draggedItem.parentId!, reorderedIds)
          
        } else if (draggedItem.type === 'submodule' && targetItem.type === 'module') {
          // Moving submodule to different module
          if (draggedItem.parentId === targetItem.id) {
            setDraggedItem(null)
            return
          }

          // Delete from old parent and create in new parent
          if (draggedItem.parentId) {
            await moduleService.deleteSubModule(draggedItem.parentId, draggedItem.id)
          }

          const draggedDoc = docs.find(d => d.id === draggedItem.id)
          if (draggedDoc) {
            await moduleService.createSubModule(targetItem.id, {
              name: draggedDoc.title,
              description: draggedDoc.description,
              content: draggedDoc.content
            })
          }
        }
      }

      await fetchModules()
      toast.success('Items reordered successfully')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder items'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Drag and drop error:', err)
    } finally {
      setDraggedItem(null)
    }
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

    try {
      setSubmitLoading(true)
      setError(null)

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

      await fetchModules()
      setShowEditDialog(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document')
    } finally {
      setSubmitLoading(false)
    }
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
      if (selectedItem?.id === docId) {
        setSelectedItem(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }

  const handleInputChange = (field: keyof typeof newDoc, value: string) => {
    setNewDoc(prev => ({ ...prev, [field]: value }))
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
    <div className="h-full min-h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Documentation Management</h1>
          <p className="text-muted-foreground">Create and manage learning modules with drag-and-drop ordering (numbering handled in markdown content)</p>
        </div>
        
        <Button onClick={() => {
          resetForm()
          setShowCreateDialog(true)
        }} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Documentation
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="flex-shrink-0 mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content - Two Panel Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-hidden">
        {/* Left Panel - Tree View */}
        <div className="lg:col-span-1 min-h-0 overflow-hidden">
          <DocumentationTreeView
            treeData={treeData}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            onToggleExpansion={toggleNodeExpansion}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            draggedItem={draggedItem}
            docsLength={docs.length}
          />
        </div>

        {/* Right Panel - Content Management */}
        <div className="lg:col-span-2 min-h-0 overflow-hidden">
          <DocumentationContentView
            selectedItem={selectedItem}
            onToggleStatus={handleToggleStatus}
            onStartEdit={handleStartEdit}
            onDeleteDoc={handleDeleteDoc}
          />
        </div>
      </div>

      {/* Create Dialog */}
      <CreateDocumentationDialog
        isOpen={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        newDoc={newDoc}
        onInputChange={handleInputChange}
        formErrors={formErrors}
        modules={modules}
        submitLoading={submitLoading}
        onSubmit={handleAddDoc}
        onCancel={() => {
          setShowCreateDialog(false)
          resetForm()
        }}
      />

      {/* Edit Dialog */}
      <EditDocumentationDialog
        isOpen={showEditDialog}
        onOpenChange={setShowEditDialog}
        editingDoc={editingDoc}
        newDoc={newDoc}
        onInputChange={handleInputChange}
        formErrors={formErrors}
        submitLoading={submitLoading}
        onSubmit={handleEditDoc}
        onCancel={() => {
          setShowEditDialog(false)
          setError(null)
          resetForm()
        }}
      />

      {/* Summary */}
      <div className="flex-shrink-0 mt-6">
        <DocumentationStatsCard docs={docs} />
      </div>
    </div>
  )
} 