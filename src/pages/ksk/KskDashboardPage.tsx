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

interface KpiProps {
  icon: string
  label: string
  value: number | string
  hint?: string
  iconBg: string
  iconColor: string
  accent?: 'default' | 'warn' | 'good'
  onClick?: () => void
}

const KpiCard = ({ icon, label, value, hint, iconBg, iconColor, accent = 'default', onClick }: KpiProps) => {
  const accentBorder = {
    default: 'border-slate-200',
    warn: 'border-amber-200',
    good: 'border-emerald-200',
  }[accent]

  return (
    <div
      onClick={onClick}
      className={`bg-white p-6 rounded-xl border ${accentBorder} shadow-sm hover:shadow-md transition-all ${ onClick ?'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`${iconBg} ${iconColor} p-3 rounded-lg`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {onClick && (
          <span className="material-symbols-outlined text-slate-300 text-[20px]">arrow_outward</span>
        )}
      </div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <h3 className="text-3xl font-bold mt-1 text-slate-900">{value}</h3>
      {hint && <p className="text-xs text-slate-500 mt-2">{hint}</p>}
    </div>
  )
}

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          icon="group"
          label={t('kskDashboard.kpi.residents')}
          value={totalResidents}
          hint={residentsHint}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          onClick={() => navigate('/residents')}
        />
        <KpiCard
          icon="priority_high"
          label={t('kskDashboard.kpi.needsAttention')}
          value={needsAttention}
          hint={t('kskDashboard.kpi.needsAttentionHint', { new: newCount, inProgress: inProgressCount })}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          accent={newCount > 0 ? 'warn' : 'default'}
          onClick={() => navigate('/requests')}
        />
        <KpiCard
          icon="engineering"
          label={t('kskDashboard.kpi.availableWorkers')}
          value={availableWorkers}
          hint={t('kskDashboard.kpi.availableWorkersHint', { total: activeWorkers.length })}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
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
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
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
