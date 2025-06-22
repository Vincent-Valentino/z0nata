import { api } from '@/lib/api'
import { toast } from 'sonner'
import { mapAuthResponseToUser, type AuthResponse } from './AuthUserMapper'

interface MikroskilFormData {
  nim: string
  email: string
  password: string
  name?: string
  confirmPassword?: string
  faculty?: string
  major?: string
}

interface RegularFormData {
  email: string
  password: string
  name?: string
  confirmPassword?: string
}

interface AuthHandlerOptions {
  login: (user: any, accessToken: string, refreshToken?: string) => void
  navigate: (path: string) => void
}

export const handleMikroskilAuth = async (
  data: MikroskilFormData, 
  authType: 'login' | 'register',
  { login, navigate }: AuthHandlerOptions
) => {
  try {
    if (authType === 'register') {
      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        toast.error('Password dan konfirmasi password tidak cocok')
        return
      }

      // Prepare registration data for backend
      const registerData = {
        full_name: data.name || '',
        email: data.email,
        password: data.password,
        user_type: 'mahasiswa', // This maps to UserTypeMahasiswa in backend
        nim: data.nim,
        faculty: data.faculty || '',
        major: data.major || ''
      }

      const response = await api.post<AuthResponse>('/auth/register', registerData)
      const user = mapAuthResponseToUser(response, 'mahasiswa')

      login(user, response.access_token, response.refresh_token)
      toast.success('Registrasi berhasil! Selamat datang!')
      navigate('/home')
      
    } else {
      // Login
      const loginData = {
        email: data.email,
        password: data.password,
        remember_me: false
      }

      const response = await api.post<AuthResponse>('/auth/login', loginData)
      const user = mapAuthResponseToUser(response, 'mahasiswa')

      login(user, response.access_token, response.refresh_token)
      toast.success('Login berhasil! Selamat datang kembali!')
      navigate('/home')
    }
  } catch (error: any) {
    console.error(`Mikroskil ${authType} error:`, error)
    toast.error(error.message || `${authType === 'register' ? 'Registrasi' : 'Login'} gagal`)
  }
}

export const handleRegularAuth = async (
  data: RegularFormData, 
  authType: 'login' | 'register',
  { login, navigate }: AuthHandlerOptions
) => {
  try {
    if (authType === 'register') {
      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        toast.error('Password dan konfirmasi password tidak cocok')
        return
      }

      // Prepare registration data for backend
      const registerData = {
        full_name: data.name || '',
        email: data.email,
        password: data.password,
        user_type: 'user' // This maps to UserTypeExternal in backend
      }

      const response = await api.post<AuthResponse>('/auth/register', registerData)
      const user = mapAuthResponseToUser(response, 'user')

      login(user, response.access_token, response.refresh_token)
      toast.success('Registrasi berhasil! Selamat datang!')
      navigate('/home')
      
    } else {
      // Login
      const loginData = {
        email: data.email,
        password: data.password,
        remember_me: false
      }

      const response = await api.post<AuthResponse>('/auth/login', loginData)
      const user = mapAuthResponseToUser(response, 'user')

      login(user, response.access_token, response.refresh_token)
      toast.success('Login berhasil! Selamat datang kembali!')
      navigate('/home')
    }
  } catch (error: any) {
    console.error(`Regular ${authType} error:`, error)
    toast.error(error.message || `${authType === 'register' ? 'Registrasi' : 'Login'} gagal`)
  }
}

export type { MikroskilFormData, RegularFormData, AuthHandlerOptions } 