export type TenantType =
  | 1  // ConstructionCompany
  | 2  // KSK
  | 3  // Business

export interface Tenant {
  id: string
  name: string
  type: TenantType
  description?: string
  isActive: boolean
  createdAt: string
}

export interface CreateTenantRequest {
  name: string
  type: TenantType
  description?: string
}

export interface CreateTenantResponse {
  tenantId: string
  name: string
  type: TenantType
  isActive: boolean
}

export interface TenantsQuery {
  type?: TenantType
}