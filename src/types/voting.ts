export type VotingStatus = 1 | 2 | 3
// 1 = Draft, 2 = Active, 3 = Closed

export type VotingCreatorType = 1 | 2
// 1 = Ksk, 2 = ConstructionCompany

export const VOTING_STATUS_LABELS: Record<VotingStatus, string> = {
  1: 'Черновик',
  2: 'Активно',
  3: 'Завершено',
}

export const VOTING_STATUS_COLORS: Record<VotingStatus, string> = {
  1: 'bg-slate-100 text-slate-600',
  2: 'bg-emerald-100 text-emerald-700',
  3: 'bg-blue-100 text-blue-700',
}

export interface VotingListItem {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: VotingStatus
  creatorType: VotingCreatorType
  optionsCount: number
}

export interface VotingOption {
  id: string
  text: string
  orderIndex: number
}

export interface VotingDetail {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: VotingStatus
  creatorType: VotingCreatorType
  showResultsAfterVote: boolean
  options: VotingOption[]
}

export interface VotingResultOption {
  optionId: string
  text: string
  votes: number
  percentage: number
}

export interface VotingResults {
  votingId: string
  totalVotes: number
  options: VotingResultOption[]
}

export interface CreateVotingRequest {
  title: string
  description: string
  startDate: string
  endDate: string
  showResultsAfterVote: boolean
  options: string[]
}

export interface ChangeVotingStatusRequest {
  newStatus: VotingStatus
}

export interface VotingsQuery {
  status?: VotingStatus
}
