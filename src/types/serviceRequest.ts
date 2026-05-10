export type ServiceRequestStatus = 1 | 2 | 3 | 4
// 1 = New, 2 = InProgress, 3 = Completed, 4 = Cancelled

export type ServiceRequestCategory = 1 | 2 | 3 | 4 | 5 | 99

export const SERVICE_REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  1: 'Новая',
  2: 'В работе',
  3: 'Завершена',
  4: 'Отменена',
}

export const SERVICE_REQUEST_STATUS_COLORS: Record<ServiceRequestStatus, string> = {
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-emerald-100 text-emerald-700',
  4: 'bg-slate-100 text-slate-500',
}

export const SERVICE_REQUEST_CATEGORY_LABELS: Record<ServiceRequestCategory, string> = {
  1: 'Сантехника',
  2: 'Электрика',
  3: 'Уборка',
  4: 'Плотницкие работы',
  5: 'Слесарные работы',
  99: 'Прочее',
}

export const SERVICE_REQUEST_CATEGORY_OPTIONS: { value: ServiceRequestCategory; label: string }[] = [
  { value: 1, label: 'Сантехника' },
  { value: 2, label: 'Электрика' },
  { value: 3, label: 'Уборка' },
  { value: 4, label: 'Плотницкие работы' },
  { value: 5, label: 'Слесарные работы' },
  { value: 99, label: 'Прочее' },
]

export interface ServiceRequestListItem {
  id: string
  residentId: string
  title: string
  category: ServiceRequestCategory
  categoryName: string
  status: ServiceRequestStatus
  statusName: string
  assignedWorkerName: string | null
  createdAt: string
  updatedAt: string
}

export interface ServiceRequestDetail {
  id: string
  tenantId: string
  residentId: string
  title: string
  description: string
  category: ServiceRequestCategory
  categoryName: string
  status: ServiceRequestStatus
  statusName: string
  cancelReason: string | null
  assignedWorker: {
    id: string
    fullName: string
    phoneNumber: string
    specialization: string
    isActive: boolean
  } | null
  createdAt: string
  updatedAt: string
}

export interface ServiceRequestsQuery {
  page?: number
  pageSize?: number
  status?: ServiceRequestStatus
  category?: ServiceRequestCategory
}

export interface AssignWorkerRequest {
  workerId: string
}

export interface CancelRequestBody {
  reason?: string
}
