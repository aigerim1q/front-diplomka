import { UserStatus } from './auth'

export interface Resident {
  id: string
  email: string
  fullName: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  status: UserStatus
  mustChangePassword: boolean
  lastLoginAt?: string
  createdAt: string
}

export interface CreateResidentRequest {
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
}

export interface CreateResidentResponse {
  userId: string
  email: string
  temporaryPassword: string
  mustChangePassword: boolean
}

export interface UpdateResidentRequest {
  firstName: string
  lastName: string
  phoneNumber?: string
}

export interface ResidentsQuery {
  page?: number
  pageSize?: number
  status?: UserStatus
}

export interface ResetResidentPasswordResponse {
  temporaryPassword: string
}