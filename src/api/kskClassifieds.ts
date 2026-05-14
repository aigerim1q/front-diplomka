import { api } from '@/lib/axios'
import {
  ClassifiedAdListItem,
  ClassifiedAdDetail,
  ClassifiedsQuery,
  Paginated,
} from '@/types'

export const kskClassifiedsApi = {
  getAll: (params?: ClassifiedsQuery) =>
    api.get<Paginated<ClassifiedAdListItem>>('/api/ksk/classifieds', { params }),

  getById: (id: string) =>
    api.get<ClassifiedAdDetail>(`/api/ksk/classifieds/${id}`),

  toggleActive: (id: string) =>
    api.patch(`/api/ksk/classifieds/${id}/toggle-active`),

  delete: (id: string) =>
    api.delete(`/api/ksk/classifieds/${id}`),
}
