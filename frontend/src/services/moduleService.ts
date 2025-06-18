import { api } from '@/lib/api'

// Types for Module API
export interface Module {
  id: string
  name: string
  description: string
  content: string
  is_published: boolean
  order: number
  sub_modules: SubModule[]
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

export interface SubModule {
  id: string
  name: string
  description: string
  content: string
  is_published: boolean
  order: number
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

export interface CreateModuleRequest {
  name: string
  description: string
  content: string
  sub_modules?: SubModule[]
}

export interface UpdateModuleRequest {
  name?: string
  description?: string
  content?: string
  sub_modules?: SubModule[]
}

export interface CreateSubModuleRequest {
  name: string
  description: string
  content: string
}

export interface GetModulesRequest {
  page?: number
  limit?: number
  search?: string
  published?: boolean
}

export interface GetModulesResponse {
  modules: Module[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// Order update interfaces for drag-and-drop functionality
export interface ModuleOrderUpdate {
  module_id: string
  order: number
}

export interface SubModuleOrderUpdate {
  submodule_id: string
  order: number
}

export interface BulkReorderRequest {
  module_updates?: ModuleOrderUpdate[]
  submodule_updates?: SubModuleOrderUpdate[]
}

// Drag and drop item interface
export interface DragDropItem {
  id: string
  type: 'module' | 'submodule'
  parentId?: string
  order: number
  title: string
  isPublished: boolean
}

// Module Service
export const moduleService = {
  // Get all modules with filtering and pagination
  getModules: async (params?: GetModulesRequest): Promise<GetModulesResponse> => {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.published !== undefined) searchParams.append('published', params.published.toString())

    const query = searchParams.toString()
    return api.get<GetModulesResponse>(`/modules${query ? `?${query}` : ''}`)
  },

  // Get module by ID
  getModule: async (id: string): Promise<Module> => {
    return api.get<Module>(`/modules/${id}`)
  },

  // Create new module (Admin only)
  createModule: async (data: CreateModuleRequest): Promise<Module> => {
    return api.post<Module>('/admin/modules', data)
  },

  // Update module (Admin only)
  updateModule: async (id: string, data: UpdateModuleRequest): Promise<Module> => {
    return api.put<Module>(`/admin/modules/${id}`, data)
  },

  // Delete module (Admin only)
  deleteModule: async (id: string): Promise<void> => {
    return api.delete<void>(`/admin/modules/${id}`)
  },

  // Toggle module publication status (Admin only)
  toggleModulePublication: async (id: string, published: boolean): Promise<Module> => {
    return api.patch<Module>(`/admin/modules/${id}/publish`, { published })
  },

  // SubModule operations

  // Create submodule (Admin only)
  createSubModule: async (moduleId: string, data: CreateSubModuleRequest): Promise<SubModule> => {
    return api.post<SubModule>(`/admin/modules/${moduleId}/submodules`, data)
  },

  // Update submodule (Admin only)
  updateSubModule: async (moduleId: string, subModuleId: string, data: CreateSubModuleRequest): Promise<SubModule> => {
    return api.put<SubModule>(`/admin/modules/${moduleId}/submodules/${subModuleId}`, data)
  },

  // Delete submodule (Admin only)
  deleteSubModule: async (moduleId: string, subModuleId: string): Promise<void> => {
    return api.delete<void>(`/admin/modules/${moduleId}/submodules/${subModuleId}`)
  },

  // Toggle submodule publication status (Admin only)
  toggleSubModulePublication: async (moduleId: string, subModuleId: string, published: boolean): Promise<SubModule> => {
    return api.patch<SubModule>(`/admin/modules/${moduleId}/submodules/${subModuleId}/publish`, { published })
  },

  // Reorder modules (Admin only)
  reorderModules: async (moduleIds: string[]): Promise<void> => {
    console.log('Reordering modules:', moduleIds)
    return api.post<void>('/admin/modules/reorder', { module_ids: moduleIds })
  },

  // Reorder submodules (Admin only)
  reorderSubModules: async (moduleId: string, subModuleIds: string[]): Promise<void> => {
    console.log('Reordering submodules:', { moduleId, subModuleIds })
    return api.post<void>(`/admin/modules/${moduleId}/submodules/reorder`, { submodule_ids: subModuleIds })
  },

  // Bulk reorder modules and submodules (Admin only)
  bulkReorder: async (data: BulkReorderRequest): Promise<void> => {
    return api.post<void>('/admin/modules/bulk-reorder', data)
  },

  // Helper function to convert modules to drag-drop items
  convertToDragDropItems: (modules: Module[]): DragDropItem[] => {
    const items: DragDropItem[] = []
    
    modules.forEach(module => {
      // Add module
      items.push({
        id: module.id,
        type: 'module',
        order: module.order || 0,
        title: module.name,
        isPublished: module.is_published
      })
      
      // Add submodules
      if (module.sub_modules) {
        module.sub_modules.forEach(subModule => {
          items.push({
            id: subModule.id,
            type: 'submodule',
            parentId: module.id,
            order: subModule.order || 0,
            title: subModule.name,
            isPublished: subModule.is_published
          })
        })
      }
    })
    
    return items.sort((a, b) => {
      // Sort modules first, then submodules within each module
      if (a.type === 'module' && b.type === 'module') {
        return a.order - b.order
      }
      if (a.type === 'submodule' && b.type === 'submodule') {
        if (a.parentId === b.parentId) {
          return a.order - b.order
        }
        // Different parents, maintain module order
        const moduleA = modules.find(m => m.id === a.parentId)
        const moduleB = modules.find(m => m.id === b.parentId)
        return (moduleA?.order || 0) - (moduleB?.order || 0)
      }
      // Module comes before its submodules
      if (a.type === 'module' && b.type === 'submodule' && b.parentId === a.id) {
        return -1
      }
      if (b.type === 'module' && a.type === 'submodule' && a.parentId === b.id) {
        return 1
      }
      // General module vs submodule ordering
      return a.type === 'module' ? -1 : 1
    })
  },
}

// Hook for easier use in components (optional - using React Query would be better)
export const useModules = () => {
  return {
    modules: [],
    loading: false,
    error: null,
    refetch: () => Promise.resolve()
  }
} 