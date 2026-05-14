import { api } from '@/lib/axios'
import {
  Worker,
  CreateWorkerRequest,
  CreateWorkerResponse,
  UpdateWorkerRequest,
  WorkersQuery,
} from '@/types'

export const kskWorkersApi = {
  getAll: (params?: WorkersQuery) =>
    api.get<Worker[]>('/api/ksk/workers', { params }),

  create: (data: CreateWorkerRequest) =>
    api.post<CreateWorkerResponse>('/api/ksk/workers', data),

  update: (id: string, data: UpdateWorkerRequest) =>
    api.put(`/api/ksk/workers/${id}`, data),

  deactivate: (id: string) =>
    api.delete(`/api/ksk/workers/${id}`),
}
