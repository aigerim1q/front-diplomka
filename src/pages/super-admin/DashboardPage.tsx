import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { usersApi } from '@/api/users'
import { tenantsApi } from '@/api/tenants'
import StatCard from '@/components/shared/StatCard'
import RecentUsersTable from './components/RecentUsersTable'

const STAT_CARDS = [
  {
    key: 'complexes',
    icon: 'location_city',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    label: 'Total Tenants',
    trend: '+12%',
  },
  {
    key: 'users',
    icon: 'person',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    label: 'Total Users',
    trend: '+5%',
  },
  {
    key: 'activeUsers',
    icon: 'how_to_reg',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    label: 'Active Users',
    trend: '+8%',
  },
  {
    key: 'blocked',
    icon: 'block',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    label: 'Blocked Users',
    trend: '0%',
  },
]

const DashboardPage = () => {
  const navigate = useNavigate()

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'dashboard'],
    queryFn: () => usersApi.getAll({ page: 1, pageSize: 5 }),
  })

  const { data: tenantsData, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants', 'dashboard'],
    queryFn: () => tenantsApi.getAll(),
  })

  const { data: activeUsersData } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: () => usersApi.getAll({ status: 1, pageSize: 1 }),
  })

  const { data: blockedUsersData } = useQuery({
    queryKey: ['users', 'blocked'],
    queryFn: () => usersApi.getAll({ status: 2, pageSize: 1 }),
  })

  const statValues: Record<string, number> = {
    complexes: tenantsData?.data.totalCount ?? 0,
    users: usersData?.data.totalCount ?? 0,
    activeUsers: activeUsersData?.data.totalCount ?? 0,
    blocked: blockedUsersData?.data.totalCount ?? 0,
  }

  const isLoading = usersLoading || tenantsLoading

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
          <StatCard
            key={card.key}
            icon={card.icon}
            iconBg={card.iconBg}
            iconColor={card.iconColor}
            label={card.label}
            value={statValues[card.key].toLocaleString()}
            trend={card.trend}
          />
        ))}
      </div>

      {/* Recent Users Table */}
      <RecentUsersTable users={(usersData?.data.items ?? []).filter((u) => u.role !== 5)} />
    </div>
  )
}

export default DashboardPage