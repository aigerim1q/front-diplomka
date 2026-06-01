import { api } from '@/lib/axios'
import { PaginatedResponse } from '@/types/user'
import { Complex } from '@/types'

export interface TeamMember {
  id: string
  fullName: string
  email: string
  residentialComplexId: string | null
  status: 'Active' | 'Blocked'
}

export interface CreateTeamMemberRequest {
  email: string
  firstName: string
  lastName: string
  residentialComplexId?: string
}

export interface AssignComplexRequest {
  residentialComplexId: string
}

export const kskTeamApi = {
  getMembers: () =>
    api.get<TeamMember[]>('/api/ksk/team'),

  createMember: (data: CreateTeamMemberRequest) =>
    api.post<{ userId: string; email: string }>('/api/ksk/team', data),

  assignComplex: (id: string, data: AssignComplexRequest) =>
    api.patch(`/api/ksk/team/${id}/complex`, data),

  deleteMember: (id: string) =>
    api.delete(`/api/ksk/team/${id}`),

  getComplexes: () =>
    api.get<PaginatedResponse<Complex>>('/api/construction-company/residential-complexes', {
      params: { pageSize: 100 },
    }),
}
