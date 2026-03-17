import { api } from '@/lib/axios'
import {
  User,
  CreateUserRequest,
  CreateUserResponse,
  ResetPasswordResponse,
  UsersQuery,
  PaginatedResponse,
} from '@/types'

export const usersApi = {
  getAll: (params?: UsersQuery) =>
    api.get<PaginatedResponse<User>>('/api/super-admin/users', { params }),

  getById: (id: string) =>
    api.get<User>(`/api/super-admin/users/${id}`),

  create: (data: CreateUserRequest) =>
    api.post<CreateUserResponse>('/api/super-admin/users', data),

  block: (id: string) =>
    api.patch(`/api/super-admin/users/${id}/block`),

  unblock: (id: string) =>
    api.patch(`/api/super-admin/users/${id}/unblock`),

  resetPassword: (id: string) =>
    api.post<ResetPasswordResponse>(`/api/super-admin/users/${id}/reset-password`),
}