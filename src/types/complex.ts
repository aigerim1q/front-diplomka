export interface Complex {
  id: string
  name: string
  address: string
  city: string
  region: string
  description?: string
  isActive: boolean
  linkedKskTenantId?: string | null
  createdAt: string
}

export interface CreateComplexRequest {
  name: string
  address: string
  city: string
  region: string
  description?: string
}

export interface UpdateComplexRequest {
  name: string
  address: string
  city: string
  region: string
  description?: string
}

export interface LinkKskRequest {
  kskTenantId: string
}

export interface ComplexesQuery {
  page?: number
  pageSize?: number
  isActive?: boolean
}