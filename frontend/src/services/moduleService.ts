import { api } from '@/lib/api'

// Types for Module API
export interface Module {
  id: string
  name: string
  description: string
  content: string
  is_published: boolean
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
}

// Hook for easier use in components (optional - using React Query would be better)
export const useModules = (params?: GetModulesRequest) => {
  // This would be better implemented with React Query or SWR for caching
  // For now, this is just a structure suggestion
  return {
    modules: [],
    loading: false,
    error: null,
    refetch: () => {},
  }
} 