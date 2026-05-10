import { api } from '@/lib/axios'
import {
  ServiceRequestListItem,
  ServiceRequestDetail,
  ServiceRequestsQuery,
  AssignWorkerRequest,
  CancelRequestBody,
} from '@/types'
import { PaginatedResponse } from '@/types/user'

export const kskServiceRequestsApi = {
  getAll: (params?: ServiceRequestsQuery) =>
    api.get<PaginatedResponse<ServiceRequestListItem>>('/api/ksk/service-requests', { params }),

  getById: (id: string) =>
    api.get<ServiceRequestDetail>(`/api/ksk/service-requests/${id}`),

  accept: (id: string) =>
    api.patch(`/api/ksk/service-requests/${id}/accept`),

  assign: (id: string, data: AssignWorkerRequest) =>
    api.patch(`/api/ksk/service-requests/${id}/assign`, data),

  complete: (id: string) =>
    api.patch(`/api/ksk/service-requests/${id}/complete`),

  cancel: (id: string, data?: CancelRequestBody) =>
    api.patch(`/api/ksk/service-requests/${id}/cancel`, data),
}
