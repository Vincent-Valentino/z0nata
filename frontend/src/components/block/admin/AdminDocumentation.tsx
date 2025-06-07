import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  File
} from 'lucide-react'

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

export const AdminDocumentation = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'module' | 'submodule'>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newDoc, setNewDoc] = useState({
    title: '',
    description: '',
    content: '',
    type: 'module' as const,
    parentId: ''
  })

  // Mock data - replace with real API calls
  const docs: DocModule[] = [
    {
      id: '1',
      title: 'Getting Started Guide',
      description: 'Complete guide for new users',
      content: '# Getting Started\n\nWelcome to Zonata...',
      type: 'module',
      createdBy: 'admin@zonata.com',
      createdAt: '2024-03-01',
      updatedAt: '2024-03-15',
      isPublished: true
    },
    {
      id: '2',
      title: 'Account Setup',
      description: 'How to set up your account',
      content: '## Account Setup\n\nTo create your account...',
      type: 'submodule',
      parentId: '1',
      createdBy: 'admin@zonata.com',
      createdAt: '2024-03-02',
      updatedAt: '2024-03-10',
      isPublished: true
    },
    {
      id: '3',
      title: 'API Documentation',
      description: 'Complete API reference',
      content: '# API Documentation\n\nThis document covers...',
      type: 'module',
      createdBy: 'admin@zonata.com',
      createdAt: '2024-02-20',
      updatedAt: '2024-03-14',
      isPublished: false
    }
  ]

  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || doc.type === typeFilter
    
    return matchesSearch && matchesType
  })

  const modules = docs.filter(doc => doc.type === 'module')
  const getSubmodules = (moduleId: string) => docs.filter(doc => doc.type === 'submodule' && doc.parentId === moduleId)

  const getDocTypeIcon = (type: string) => {
    return type === 'module' ? <Folder className="h-4 w-4" /> : <File className="h-4 w-4" />
  }

  const getDocTypeBadge = (type: string) => {
    return type === 'module' ? 
      <Badge variant="default" className="bg-blue-100 text-blue-700">Module</Badge> :
      <Badge variant="secondary" className="bg-purple-100 text-purple-700">Submodule</Badge>
  }

  const getStatusBadge = (isPublished: boolean) => {
    return isPublished ? 
      <Badge variant="default" className="bg-green-100 text-green-700">Published</Badge> :
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Draft</Badge>
  }

  const handleAddDoc = () => {
    console.log('Adding documentation:', newDoc)
    // Implement add documentation logic
    setIsAddDialogOpen(false)
    setNewDoc({
      title: '',
      description: '',
      content: '',
      type: 'module',
      parentId: ''
    })
  }

  const handleDeleteDoc = (docId: string) => {
    console.log('Deleting documentation:', docId)
    // Implement delete logic
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{docs.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modules</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {docs.filter(d => d.type === 'module').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submodules</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {docs.filter(d => d.type === 'submodule').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {docs.filter(d => d.isPublished).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={typeFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setTypeFilter('all')}
              className="gap-2"
            >
              All
            </Button>
            <Button
              variant={typeFilter === 'module' ? 'default' : 'outline'}
              onClick={() => setTypeFilter('module')}
              className="gap-2"
            >
              <Folder className="h-4 w-4" />
              Modules
            </Button>
            <Button
              variant={typeFilter === 'submodule' ? 'default' : 'outline'}
              onClick={() => setTypeFilter('submodule')}
              className="gap-2"
            >
              <File className="h-4 w-4" />
              Submodules
            </Button>
          </div>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Documentation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add New Documentation</DialogTitle>
              <DialogDescription>
                Create a new module or submodule with markdown content
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Enter documentation title..."
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select 
                    value={newDoc.type} 
                    onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value as 'module' | 'submodule' })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="module">Module</option>
                    <option value="submodule">Submodule</option>
                  </select>
                </div>
              </div>
              
              {newDoc.type === 'submodule' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Parent Module</label>
                  <select 
                    value={newDoc.parentId} 
                    onChange={(e) => setNewDoc({ ...newDoc, parentId: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select parent module...</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>{module.title}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Brief description of the documentation..."
                  value={newDoc.description}
                  onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Content (Markdown)</label>
                <Textarea
                  placeholder="Write your markdown content here..."
                  value={newDoc.content}
                  onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                  className="h-64 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  You can use standard Markdown syntax including headers, lists, links, and code blocks.
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDoc}>
                  Add Documentation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documentation Structure View */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hierarchical View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Documentation Structure
            </CardTitle>
            <CardDescription>Organized by modules and submodules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modules.map((module) => (
                <div key={module.id} className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Folder className="h-4 w-4 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{module.title}</h4>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(module.isPublished)}
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Submodules */}
                  <div className="ml-6 space-y-2">
                    {getSubmodules(module.id).map((submodule) => (
                      <div key={submodule.id} className="flex items-center justify-between p-2 border rounded bg-muted/30">
                        <div className="flex items-center gap-3">
                          <File className="h-3 w-3 text-purple-600" />
                          <div>
                            <h5 className="text-sm font-medium">{submodule.title}</h5>
                            <p className="text-xs text-muted-foreground">{submodule.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(submodule.isPublished)}
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* List View */}
        <Card>
          <CardHeader>
            <CardTitle>All Documents ({filteredDocs.length})</CardTitle>
            <CardDescription>Complete list of documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getDocTypeIcon(doc.type)}
                        <h3 className="font-medium">{doc.title}</h3>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {getDocTypeBadge(doc.type)}
                        {getStatusBadge(doc.isPublished)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {doc.createdBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Updated {doc.updatedAt}
                        </span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                        {doc.content.substring(0, 100)}...
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteDoc(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredDocs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documentation found matching your criteria</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 