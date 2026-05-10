import { api } from '@/lib/axios'
import {
  VotingListItem,
  VotingDetail,
  VotingResults,
  CreateVotingRequest,
  ChangeVotingStatusRequest,
  VotingsQuery,
} from '@/types'

export const votingsApi = {
  getAll: (params?: VotingsQuery) =>
    api.get<VotingListItem[]>('/api/votings', { params }),

  getById: (id: string) =>
    api.get<VotingDetail>(`/api/votings/${id}`),

  getResults: (id: string) =>
    api.get<VotingResults>(`/api/votings/${id}/results`),

  create: (data: CreateVotingRequest) =>
    api.post<string>('/api/votings', data),

  changeStatus: (id: string, data: ChangeVotingStatusRequest) =>
    api.patch(`/api/votings/${id}/status`, data),
}
