import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, X, UserPlus, Edit, KeyRound, Ban, Undo2 } from 'lucide-react'
import { kskResidentsApi } from '@/api/kskResidents'
import { Resident } from '@/types'
import AddResidentModal from './components/modals/AddResidentModal'
import EditResidentModal from './components/modals/EditResidentModal'
import ResetPasswordModal from './components/modals/ResetPasswordModal'
import ConfirmActionModal from '@/pages/super-admin/components/modals/ConfirmActionModal'
import UsersPagination from '@/pages/super-admin/components/UsersPagination'

const PAGE_SIZE = 10

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
]
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

const ResidentsPage = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [tab, setTab]       = useState<'all' | 'active' | 'blocked'>('all')
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen]         = useState(false)
  const [editResident, setEditResident]   = useState<Resident | null>(null)
  const [resetResident, setResetResident] = useState<Resident | null>(null)
  const [confirmModal, setConfirmModal]   = useState<{
    isOpen: boolean; type: 'block' | 'unblock'; resident: Resident | null
  }>({ isOpen: false, type: 'block', resident: null })

  const statusParam = tab === 'active' ? 1 : tab === 'blocked' ? 2 : undefined

  const { data, isLoading } = useQuery({
    queryKey: ['ksk-residents', page, tab],
    queryFn: () => kskResidentsApi.getAll({ page, pageSize: PAGE_SIZE, status: statusParam }),
  })

  // Separate count queries for tab badges
  const { data: activeCount }  = useQuery({
    queryKey: ['ksk-residents-count-active'],
    queryFn: () => kskResidentsApi.getAll({ page: 1, pageSize: 1, status: 1 }),
    staleTime: 30000,
  })
  const { data: blockedCount } = useQuery({
    queryKey: ['ksk-residents-count-blocked'],
    queryFn: () => kskResidentsApi.getAll({ page: 1, pageSize: 1, status: 2 }),
    staleTime: 30000,
  })
  const { data: allCount } = useQuery({
    queryKey: ['ksk-residents-count-all'],
    queryFn: () => kskResidentsApi.getAll({ page: 1, pageSize: 1 }),
    staleTime: 30000,
  })

  const counts = {
    all:     allCount?.data.totalCount ?? 0,
    active:  activeCount?.data.totalCount ?? 0,
    blocked: blockedCount?.data.totalCount ?? 0,
  }

  const { mutate: blockResident,   isPending: isBlocking }   = useMutation({
    mutationFn: (id: string) => kskResidentsApi.block(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-residents'] })
      setConfirmModal({ isOpen: false, type: 'block', resident: null })
    },
  })
  const { mutate: unblockResident, isPending: isUnblocking } = useMutation({
    mutationFn: (id: string) => kskResidentsApi.unblock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-residents'] })
      setConfirmModal({ isOpen: false, type: 'block', resident: null })
    },
  })

  const allResidents = data?.data.items ?? []
  const residents = search
    ? allResidents.filter(r =>
        r.email.toLowerCase().includes(search.toLowerCase()) ||
        `${r.firstName ?? ''} ${r.lastName ?? ''} ${r.fullName ?? ''}`.toLowerCase().includes(search.toLowerCase())
      )
    : allResidents

  const totalCount = data?.data.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const TABS = [
    { key: 'all' as const,     label: t('pages.residents.tabAll'),     count: counts.all },
    { key: 'active' as const,  label: t('pages.residents.tabActive'),   count: counts.active },
    { key: 'blocked' as const, label: t('pages.residents.tabBlocked'), count: counts.blocked },
  ]

  return (
    <div>
      {/* Tabs + add button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-0.5 bg-zinc-100 rounded-xl p-1">
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setPage(1) }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {label}
              <span className={`tabular-nums text-xs ${tab === key ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus size={14} />
          Добавить жильца
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder={t("pages.residents.search")}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {[1,2,3,4].map(i => (
            <div key={i} className="px-5 py-4 border-b border-zinc-100 flex items-center gap-4">
              <div className="size-9 skeleton rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-40 skeleton rounded" />
                <div className="h-2.5 w-56 skeleton rounded" />
              </div>
              <div className="h-4 w-14 skeleton rounded ml-auto" />
            </div>
          ))}
        </div>
      ) : residents.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 py-20 text-center text-zinc-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">group</span>
          <p className="text-sm">Жильцы не найдены</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="grid grid-cols-[2.5fr_2fr_1fr_1.2fr_1fr_90px] gap-4 px-5 py-3 border-b border-zinc-100 bg-zinc-50/60">
            {['Жилец', 'Email', 'Телефон', 'Квартира', 'Статус', 'Действия'].map((col, i) => (
              <span key={i} className={`text-xs text-zinc-400 font-medium ${i === 5 ? 'text-right' : ''}`}>
                {col}
              </span>
            ))}
          </div>

          <ul className="divide-y divide-zinc-100">
            {residents.map((r) => {
              const isBlocked = r.status === 2
              const name = r.fullName || `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || r.email.split('@')[0]

              return (
                <li key={r.id} className={`grid grid-cols-[2.5fr_2fr_1fr_1.2fr_1fr_90px] gap-4 px-5 py-4 items-center hover:bg-zinc-50/60 transition-colors group ${isBlocked ? 'opacity-55' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`size-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${avatarColor(name)}`}>
                      {name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{name}</p>
                      {r.apartmentNumber && (
                        <p className="text-[11px] text-zinc-400 truncate">
                          кв. {r.apartmentNumber}{r.building ? `, корп. ${r.building}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className={`text-xs truncate ${isBlocked ? 'text-zinc-400 line-through' : 'text-zinc-500'}`}>
                    {r.email}
                  </span>

                  <span className="text-xs text-zinc-500">{r.phoneNumber ?? <span className="text-zinc-300">—</span>}</span>

                  <span className="text-xs text-zinc-500">
                    {r.apartmentNumber ? `кв. ${r.apartmentNumber}` : <span className="text-zinc-300">—</span>}
                  </span>

                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <span className={`size-1.5 rounded-full shrink-0 ${isBlocked ? 'bg-zinc-300' : 'bg-emerald-400'}`} />
                    <span className={isBlocked ? 'text-zinc-400' : 'text-zinc-700'}>
                      {isBlocked ? 'Заблокирован' : 'Активен'}
                    </span>
                  </span>

                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditResident(r)} title="Редактировать" className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"><Edit size={13} /></button>
                    <button onClick={() => setResetResident(r)} title="Сбросить пароль" className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"><KeyRound size={13} /></button>
                    {isBlocked ? (
                      <button onClick={() => setConfirmModal({ isOpen: true, type: 'unblock', resident: r })} title="Разблокировать" className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><Undo2 size={13} /></button>
                    ) : (
                      <button onClick={() => setConfirmModal({ isOpen: true, type: 'block', resident: r })} title="Заблокировать" className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Ban size={13} /></button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4">
          <UsersPagination page={page} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}

      <AddResidentModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <EditResidentModal isOpen={!!editResident} onClose={() => setEditResident(null)} resident={editResident} />
      <ResetPasswordModal isOpen={!!resetResident} onClose={() => setResetResident(null)} resident={resetResident} />
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: 'block', resident: null })}
        onConfirm={() => {
          if (!confirmModal.resident) return
          confirmModal.type === 'block' ? blockResident(confirmModal.resident.id) : unblockResident(confirmModal.resident.id)
        }}
        isLoading={isBlocking || isUnblocking}
        type={confirmModal.type}
        userName={confirmModal.resident?.fullName || `${confirmModal.resident?.firstName ?? ''} ${confirmModal.resident?.lastName ?? ''}`.trim()}
      />
    </div>
  )
}

export default ResidentsPage
