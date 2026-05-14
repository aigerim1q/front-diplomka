export interface ServiceListItem {
  id: string
  title: string
  priceText: string
  providerName: string
  contactPhone: string
  coverUrl: string
  isActive: boolean
  createdAt: string
}

export interface ServiceDetail extends ServiceListItem {
  description: string
  contactName: string | null
  updatedAt: string
}

export interface Paginated<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
}

export interface ServicesQuery {
  page?: number
  pageSize?: number
  search?: string
}

export interface CreateServiceForm {
  title: string
  description: string
  priceText: string
  providerName: string
  contactPhone: string
  contactName?: string
  image: File
}

export interface UpdateServiceForm {
  title: string
  description: string
  priceText: string
  providerName: string
  contactPhone: string
  contactName?: string
  image?: File | null
}
