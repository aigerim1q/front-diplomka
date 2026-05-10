import { api } from '@/lib/axios'
import {
  Complex,
  CreateComplexRequest,
  UpdateComplexRequest,
  LinkKskRequest,
  ComplexesQuery,
} from '@/types'
import { PaginatedResponse } from '@/types/user'

const toFormData = (data: CreateComplexRequest | UpdateComplexRequest, image?: File | null): FormData => {
  const fd = new FormData()
  fd.append('Name', data.name)
  fd.append('Address', data.address)
  fd.append('City', data.city)
  fd.append('Region', data.region)
  if (data.description) fd.append('Description', data.description)
  if (image) fd.append('Image', image)
  return fd
}

export const complexesApi = {
  getAll: (params?: ComplexesQuery) =>
    api.get<PaginatedResponse<Complex>>('/api/construction-company/residential-complexes', { params }),

  getById: (id: string) =>
    api.get<Complex>(`/api/construction-company/residential-complexes/${id}`),

  create: (data: CreateComplexRequest, image?: File | null) =>
    api.post<Complex>('/api/construction-company/residential-complexes', toFormData(data, image), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: UpdateComplexRequest, image?: File | null) =>
    api.put(`/api/construction-company/residential-complexes/${id}`, toFormData(data, image), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  linkKsk: (id: string, data: LinkKskRequest) =>
    api.patch(`/api/construction-company/residential-complexes/${id}/link-ksk`, data),

  activate: (id: string) =>
    api.patch(`/api/construction-company/residential-complexes/${id}/activate`),

  deactivate: (id: string) =>
    api.patch(`/api/construction-company/residential-complexes/${id}/deactivate`),

  getAvailableKsk: () =>
    api.get<{ id: string; name: string }[]>('/api/construction-company/ksk'),
}