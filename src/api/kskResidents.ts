import { api } from '@/lib/axios'
import {
  Resident,
  CreateResidentRequest,
  CreateResidentResponse,
  UpdateResidentRequest,
  ResidentsQuery,
  ResetResidentPasswordResponse,
} from '@/types'
import { PaginatedResponse } from '@/types/user'

export const kskResidentsApi = {
  getAll: (params?: ResidentsQuery) =>
    api.get<PaginatedResponse<Resident>>('/api/ksk/residents', { params }),

  getById: (id: string) =>
    api.get<Resident>(`/api/ksk/residents/${id}`),

  create: (data: CreateResidentRequest) =>
    api.post<CreateResidentResponse>('/api/ksk/residents', data),

  update: (id: string, data: UpdateResidentRequest) =>
    api.put(`/api/ksk/residents/${id}`, data),

  block: (id: string) =>
    api.patch(`/api/ksk/residents/${id}/block`),

  unblock: (id: string) =>
    api.patch(`/api/ksk/residents/${id}/unblock`),

  resetPassword: (id: string) =>
    api.post<ResetResidentPasswordResponse>(`/api/ksk/residents/${id}/reset-password`),
}