import { api } from '@/lib/axios'
import { LoginRequest, LoginResponse, ChangePasswordRequest } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/api/auth/login', data),

  logout: (refreshToken: string) =>
    api.post('/api/auth/logout', { refreshToken }),

  refresh: (refreshToken: string) =>
    api.post('/api/auth/refresh', { refreshToken }),

  changePassword: (data: ChangePasswordRequest) =>
    api.post('/api/auth/change-temporary-password', data),
}