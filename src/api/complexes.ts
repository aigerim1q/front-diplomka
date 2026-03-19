import { api } from '@/lib/axios'
import {
  Complex,
  CreateComplexRequest,
  UpdateComplexRequest,
  LinkKskRequest,
  ComplexesQuery,
} from '@/types'
import { PaginatedResponse } from '@/types/user'

export const complexesApi = {
  getAll: (params?: ComplexesQuery) =>
    api.get<PaginatedResponse<Complex>>('/api/construction-company/residential-complexes', { params }),

  getById: (id: string) =>
    api.get<Complex>(`/api/construction-company/residential-complexes/${id}`),

  create: (data: CreateComplexRequest) =>
    api.post<Complex>('/api/construction-company/residential-complexes', data),

  update: (id: string, data: UpdateComplexRequest) =>
    api.put(`/api/construction-company/residential-complexes/${id}`, data),

  linkKsk: (id: string, data: LinkKskRequest) =>
    api.patch(`/api/construction-company/residential-complexes/${id}/link-ksk`, data),

  activate: (id: string) =>
    api.patch(`/api/construction-company/residential-complexes/${id}/activate`),

  deactivate: (id: string) =>
    api.patch(`/api/construction-company/residential-complexes/${id}/deactivate`),
}
