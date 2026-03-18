import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { complexesApi } from '@/api/complexes'
import DashboardStatCard from './components/DashboardStatCard'
import RecentComplexesTable from './components/RecentComplexesTable'
import AddComplexModal from './components/modals/AddComplexModal'

const STAT_CARDS = [
  {
    key: 'total',
    icon: 'domain',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    label: 'Всего комплексов',
    badge: 'Всего',
    badgeColor: 'bg-slate-100 text-slate-600',
  },
  {
    key: 'active',
    icon: 'check_circle',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    label: 'Активных',
    badge: 'Активные',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    key: 'inactive',
    icon: 'cancel',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    label: 'Неактивных',
    badge: 'Неактивные',
    badgeColor: 'bg-red-100 text-red-700',
  },
  {
    key: 'linked',
    icon: 'link',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    label: 'Привязано к КСК',
    badge: 'КСК',
    badgeColor: 'bg-violet-100 text-violet-700',
  },
]

const DashboardPage = () => {
  const [isAddOpen, setIsAddOpen] = useState(false)

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['complexes', 'dashboard', 'all'],
    queryFn: () => complexesApi.getAll({ page: 1, pageSize: 5 }),
  })

  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ['complexes', 'dashboard', 'active'],
    queryFn: () => complexesApi.getAll({ page: 1, pageSize: 1, isActive: true }),
  })

  const { data: inactiveData, isLoading: inactiveLoading } = useQuery({
    queryKey: ['complexes', 'dashboard', 'inactive'],
    queryFn: () => complexesApi.getAll({ page: 1, pageSize: 1, isActive: false }),
  })

  const isLoading = allLoading || activeLoading || inactiveLoading

  const totalCount = allData?.data.totalCount ?? 0
  const activeCount = activeData?.data.totalCount ?? 0
  const inactiveCount = inactiveData?.data.totalCount ?? 0
  const recentComplexes = allData?.data.items ?? []
  const linkedCount = recentComplexes.filter((c) => !!c.linkedKskTenantId).length

  const statValues: Record<string, number> = {
    total: totalCount,
    active: activeCount,
    inactive: inactiveCount,
    linked: linkedCount,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAT_CARDS.map((card) => (
          <DashboardStatCard
            key={card.key}
            icon={card.icon}
            iconBg={card.iconBg}
            iconColor={card.iconColor}
            label={card.label}
            value={statValues[card.key]}
            badge={card.badge}
            badgeColor={card.badgeColor}
          />
        ))}
      </div>

      {/* Recent Complexes Table */}
      <RecentComplexesTable
        complexes={recentComplexes}
        totalCount={totalCount}
        onNewComplex={() => setIsAddOpen(true)}
      />

      <AddComplexModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </div>
  )
}

export default DashboardPage