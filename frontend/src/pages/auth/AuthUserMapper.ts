interface AuthUser {
  id: string
  _id?: string
  full_name: string
  email: string
  email_verified: boolean
  profile_picture?: string
  last_login?: string
  created_at?: string
  updated_at?: string
  mahasiswa_id?: string
  nim?: string
  faculty?: string
  major?: string
  is_admin?: boolean
  permissions?: string[]
}

interface AuthResponse {
  user: AuthUser
  access_token: string
  refresh_token?: string
  expires_in?: number
}

interface MappedUser {
  id: string
  full_name: string
  email: string
  email_verified: boolean
  profile_picture?: string
  last_login: string
  created_at: string
  updated_at: string
  role: 'admin' | 'student'
  user_type: 'mahasiswa' | 'user' | 'admin'
  nim?: string
  faculty?: string
  major?: string
  is_admin: boolean
  permissions: string[]
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: 'id' | 'en'
    notifications: boolean
  }
  stats: {
    testsCompleted: number
    averageScore: number
    totalTimeSpent: number
    streak: number
  }
}

export const mapAuthResponseToUser = (response: AuthResponse, userType: 'mahasiswa' | 'user' | 'admin'): MappedUser => {
  const isAdmin = response.user.is_admin || false
  const role = isAdmin ? 'admin' : 'student'

  return {
    id: response.user.id || response.user._id || '',
    full_name: response.user.full_name,
    email: response.user.email,
    email_verified: response.user.email_verified || false,
    profile_picture: response.user.profile_picture,
    last_login: response.user.last_login || new Date().toISOString(),
    created_at: response.user.created_at || new Date().toISOString(),
    updated_at: response.user.updated_at || new Date().toISOString(),
    role,
    user_type: userType,
    nim: response.user.mahasiswa_id || response.user.nim,
    faculty: response.user.faculty,
    major: response.user.major,
    is_admin: isAdmin,
    permissions: isAdmin ? ['read', 'write', 'admin'] : ['read'],
    preferences: {
      theme: 'light' as const,
      language: 'id' as const,
      notifications: true,
    },
    stats: {
      testsCompleted: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      streak: 0,
    },
  }
}

export type { AuthUser, AuthResponse, MappedUser } 