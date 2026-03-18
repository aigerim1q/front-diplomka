import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tenantsApi } from '@/api/tenants'
import TenantsTable from './components/TenantsTable'
import UsersPagination from './components/UsersPagination'
import AddTenantModal from './components/modals/AddTenantModal'

const PAGE_SIZE = 10

const TenantsPage = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)

  useEffect(() => {
    const handler = () => setIsAddOpen(true)
    window.addEventListener('openAddModal', handler)
    return () => window.removeEventListener('openAddModal', handler)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', page, type],
    queryFn: () => tenantsApi.getAll({
      type: type ? Number(type) as any : undefined,
    }),
  })

  const allTenants = data?.data.items ?? []
  const tenants = search
    ? allTenants.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      )
    : allTenants

  const totalCount = data?.data.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">

      {/* Фильтры */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            placeholder="Поиск по названию..."
          />
        </div>
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm w-48"
        >
          <option value="">Все типы</option>
          <option value="1">Строительная компания</option>
          <option value="2">КСК</option>
          <option value="3">Бизнес</option>
        </select>
        <button
          onClick={() => { setSearch(''); setType(''); setPage(1) }}
          className="px-4 py-2 text-slate-600 font-medium text-sm hover:text-primary transition-colors"
        >
          Сбросить
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Всего организаций', value: totalCount, icon: 'domain', color: 'text-primary bg-primary/10' },
          { label: 'Строительных компаний', value: allTenants.filter(t => t.type === 1 || t.type as any === 'ConstructionCompany').length, icon: 'construction', color: 'text-purple-600 bg-purple-100' },
          { label: 'КСК', value: allTenants.filter(t => t.type === 2 || t.type as any === 'KSK').length, icon: 'location_city', color: 'text-blue-600 bg-blue-100' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div>
              <p className="text-slate-500 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Таблица */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <TenantsTable tenants={tenants} />
          {totalPages > 1 && (
            <UsersPagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <AddTenantModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </div>
  )
}

export default TenantsPage