import { api } from '@/lib/axios'
import {
  ServiceListItem,
  ServiceDetail,
  Paginated,
  ServicesQuery,
  CreateServiceForm,
  UpdateServiceForm,
} from '@/types'

const buildFormData = (data: CreateServiceForm | UpdateServiceForm) => {
  const fd = new FormData()
  fd.append('Title', data.title)
  fd.append('Description', data.description)
  fd.append('PriceText', data.priceText)
  fd.append('ProviderName', data.providerName)
  fd.append('ContactPhone', data.contactPhone)
  if (data.contactName) fd.append('ContactName', data.contactName)
  if (data.image) fd.append('Image', data.image)
  return fd
}

export const kskServicesApi = {
  getAll: (params?: ServicesQuery) =>
    api.get<Paginated<ServiceListItem>>('/api/ksk/services', { params }),

  getById: (id: string) =>
    api.get<ServiceDetail>(`/api/ksk/services/${id}`),

  create: (data: CreateServiceForm) =>
    api.post<{ id: string }>('/api/ksk/services', buildFormData(data), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: UpdateServiceForm) =>
    api.put(`/api/ksk/services/${id}`, buildFormData(data), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  toggleActive: (id: string) =>
    api.patch(`/api/ksk/services/${id}/toggle-active`),

  delete: (id: string) =>
    api.delete(`/api/ksk/services/${id}`),
}
