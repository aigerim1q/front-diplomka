import { UserRole, UserStatus } from './auth'

export interface User {
  userId: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  tenantId?: string
  createdAt: string
}

export interface CreateUserRequest {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  tenantId: string
}

export interface CreateUserResponse {
  userId: string
  email: string
  temporaryPassword: string
}

export interface ResetPasswordResponse {
  userId: string
  temporaryPassword: string
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages?: number
}

export interface UsersQuery {
  page?: number
  pageSize?: number
  role?: UserRole
  status?: UserStatus
  tenantId?: string
}