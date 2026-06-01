import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { kskResidentsApi } from '@/api/kskResidents'
import { kskWorkersApi } from '@/api/kskWorkers'
import { kskServiceRequestsApi } from '@/api/kskServiceRequests'
import { newsApi } from '@/api/news'
import { votingsApi } from '@/api/votings'

import RequestsStatusDonut from './components/dashboard/RequestsStatusDonut'
import RequestsCategoriesBar from './components/dashboard/RequestsCategoriesBar'
import RequestsTrendLine from './components/dashboard/RequestsTrendLine'
import WorkersCapacityChart from './components/dashboard/WorkersCapacityChart'
import BuildingsBreakdown from './components/dashboard/BuildingsBreakdown'
import RecentRequestsCard from './components/dashboard/RecentRequestsCard'
import PinnedNewsCard from './components/dashboard/PinnedNewsCard'
import ActiveVotingsCard from './components/dashboard/ActiveVotingsCard'
import DashboardHero from './components/dashboard/DashboardHero'

import { ArrowUpRight } from 'lucide-react'

interface KpiProps {
  icon: string
  label: string
  value: number | string
  hint?: string
  accent?: 'default' | 'warn' | 'good'
  onClick?: () => void
}

const KpiCard = ({ label, value, hint, accent = 'default', onClick }: KpiProps) => (
  <div
    onClick={onClick}
    className={`group relative bg-white rounded-xl border transition-all overflow-hidden ${
      onClick ? 'cursor-pointer hover:shadow-sm' : ''
    } ${accent === 'warn' && Number(value) > 0 ? 'border-zinc-900' : 'border-zinc-200 hover:border-zinc-300'}`}
  >
    {accent === 'warn' && Number(value) > 0 && (
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-900" />
    )}
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-xs text-zinc-500 leading-snug">{label}</p>
        {onClick && (
          <ArrowUpRight size={13} className="text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0 mt-0.5" />
        )}
      </div>
      <p className="text-[28px] font-bold text-zinc-900 tabular-nums leading-none">{value}</p>
      {hint && <p className="text-[11px] text-zinc-400 mt-2 leading-snug">{hint}</p>}
    </div>
  </div>
)

const KskDashboardPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const residentsQuery = useQuery({
    queryKey: ['ksk-dashboard', 'residents'],
    queryFn: () => kskResidentsApi.getAll({ page: 1, pageSize: 100 }),
  })

  const activeResidentsCountQuery = useQuery({
    queryKey: ['ksk-dashboard', 'residents-active-count'],
    queryFn: () => kskResidentsApi.getAll({ page: 1, pageSize: 1, status: 1 }),
  })

  const blockedResidentsCountQuery = useQuery({
    queryKey: ['ksk-dashboard', 'residents-blocked-count'],
    queryFn: () => kskResidentsApi.getAll({ page: 1, pageSize: 1, status: 2 }),
  })

  const workersQuery = useQuery({
    queryKey: ['ksk-dashboard', 'workers'],
    queryFn: () => kskWorkersApi.getAll(),
  })

  const requestsQuery = useQuery({
    queryKey: ['ksk-dashboard', 'requests'],
    queryFn: () => kskServiceRequestsApi.getAll({ page: 1, pageSize: 100 }),
  })

  const newsQuery = useQuery({
    queryKey: ['ksk-dashboard', 'news'],
    queryFn: () => newsApi.getManage(),
  })

  const votingsQuery = useQuery({
    queryKey: ['ksk-dashboard', 'votings'],
    queryFn: () => votingsApi.getAll(),
  })

  const residents = residentsQuery.data?.data.items ?? []
  const totalResidents = residentsQuery.data?.data.totalCount ?? 0
  const activeResidents = activeResidentsCountQuery.data?.data.totalCount ?? 0
  const blockedResidents = blockedResidentsCountQuery.data?.data.totalCount ?? 0

  const workers = workersQuery.data?.data ?? []
  const activeWorkers = workers.filter((w) => w.isActive)
  const availableWorkers = activeWorkers.filter((w) => w.status === 1).length

  const requests = requestsQuery.data?.data.items ?? []
  const newCount = requests.filter((r) => r.status === 1).length
  const inProgressCount = requests.filter((r) => r.status === 2).length
  const needsAttention = newCount + inProgressCount

  const completedToday = requests.filter((r) => {
    if (r.status !== 3) return false
    const d = new Date(r.updatedAt)
    const now = new Date()
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    )
  }).length

  const news = newsQuery.data?.data ?? []
  const votings = votingsQuery.data?.data ?? []
  const activeVotings = votings.filter((v) => v.status === 2).length

  const residentsHint = blockedResidents > 0
    ? t('kskDashboard.kpi.residentsHintBlocked', { active: activeResidents, blocked: blockedResidents })
    : t('kskDashboard.kpi.residentsHint', { active: activeResidents })

  return (
    <div className="space-y-6">
      {/* Hero */}
      <DashboardHero
        newRequests={newCount}
        inProgressRequests={inProgressCount}
        totalResidents={totalResidents}
        activeVotings={activeVotings}
      />

      {/* KPI ряд */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon="group"
          label={t('kskDashboard.kpi.residents')}
          value={totalResidents}
          hint={residentsHint}
          onClick={() => navigate('/residents')}
        />
        <KpiCard
          icon="priority_high"
          label={t('kskDashboard.kpi.needsAttention')}
          value={needsAttention}
          hint={t('kskDashboard.kpi.needsAttentionHint', { new: newCount, inProgress: inProgressCount })}
          accent={newCount > 0 ? 'warn' : 'default'}
          onClick={() => navigate('/requests')}
        />
        <KpiCard
          icon="engineering"
          label={t('kskDashboard.kpi.availableWorkers')}
          value={availableWorkers}
          hint={t('kskDashboard.kpi.availableWorkersHint', { total: activeWorkers.length })}
          accent="good"
          onClick={() => navigate('/workers')}
        />
        <KpiCard
          icon="how_to_vote"
          label={t('kskDashboard.kpi.activeVotings')}
          value={activeVotings}
          hint={
            completedToday > 0
              ? t('kskDashboard.kpi.activeVotingsHintToday', { count: completedToday })
              : t('kskDashboard.kpi.activeVotingsHintDefault')
          }
          onClick={() => navigate('/polls')}
        />
      </div>

      {/* Важные новости */}
      <PinnedNewsCard news={news} isLoading={newsQuery.isLoading} />

      {/* Графики ряд 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RequestsStatusDonut requests={requests} isLoading={requestsQuery.isLoading} />
        <RequestsCategoriesBar requests={requests} isLoading={requestsQuery.isLoading} />
      </div>

      {/* Графики ряд 2 */}
      <RequestsTrendLine requests={requests} isLoading={requestsQuery.isLoading} />

      {/* Графики ряд 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkersCapacityChart
          requests={requests}
          workers={workers}
          isLoading={requestsQuery.isLoading || workersQuery.isLoading}
        />
        <BuildingsBreakdown residents={residents} isLoading={residentsQuery.isLoading} />
      </div>

      {/* Активность ряд: recent requests + active votings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 flex">
          <div className="w-full">
            <RecentRequestsCard requests={requests} isLoading={requestsQuery.isLoading} />
          </div>
        </div>
        <div className="flex">
          <div className="w-full">
            <ActiveVotingsCard votings={votings} isLoading={votingsQuery.isLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default KskDashboardPage
