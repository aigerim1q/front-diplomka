import { api } from '@/lib/axios'
import {
  Tenant,
  CreateTenantRequest,
  CreateTenantResponse,
  TenantsQuery,
  PaginatedResponse,
} from '@/types'

export const tenantsApi = {
  getAll: (params?: TenantsQuery) =>
    api.get<PaginatedResponse<Tenant>>('/api/super-admin/tenants', { params }),

  getById: (id: string) =>
    api.get<Tenant>(`/api/super-admin/tenants/${id}`),

  create: (data: CreateTenantRequest) =>
    api.post<CreateTenantResponse>('/api/super-admin/tenants', data),
}