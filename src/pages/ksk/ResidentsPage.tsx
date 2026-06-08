import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kskResidentsApi } from '@/api/kskResidents'
import { Resident } from '@/types'
import ResidentsTable from './components/ResidentsTable'
import AddResidentModal from './components/modals/AddResidentModal'
import EditResidentModal from './components/modals/EditResidentModal'
import ResetPasswordModal from './components/modals/ResetPasswordModal'
import ConfirmActionModal from '@/pages/super-admin/components/modals/ConfirmActionModal'
import UsersPagination from '@/pages/super-admin/components/UsersPagination'

const PAGE_SIZE = 10

const ResidentsPage = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const [tab, setTab] = useState<'all' | 'active' | 'blocked'>('all')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editResident, setEditResident] = useState<Resident | null>(null)
  const [resetResident, setResetResident] = useState<Resident | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    type: 'block' | 'unblock'
    resident: Resident | null
  }>({ isOpen: false, type: 'block', resident: null })

  useEffect(() => {
    const handler = () => setIsAddOpen(true)
    window.addEventListener('openAddModal', handler)
    return () => window.removeEventListener('openAddModal', handler)
  }, [])

  const statusParam = tab === 'active' ? 1 : tab === 'blocked' ? 2 : undefined

  const { data, isLoading } = useQuery({
    queryKey: ['ksk-residents', page, tab],
    queryFn: () =>
      kskResidentsApi.getAll({
        page,
        pageSize: PAGE_SIZE,
        status: statusParam,
      }),
  })

  const { mutate: blockResident, isPending: isBlocking } = useMutation({
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
    ? allResidents.filter(
        (r) =>
          r.email.toLowerCase().includes(search.toLowerCase()) ||
          `${r.firstName ?? ''} ${r.lastName ?? ''} ${r.fullName ?? ''}`
            .toLowerCase()
            .includes(search.toLowerCase())
      )
    : allResidents

  const totalCount = data?.data.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const handleConfirm = () => {
    if (!confirmModal.resident) return
    if (confirmModal.type === 'block') {
      blockResident(confirmModal.resident.id)
    } else {
      unblockResident(confirmModal.resident.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Табы */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
        {([
          { key: 'all', label: t('residents.tabAll') },
          { key: 'active', label: t('residents.tabActive') },
          { key: 'blocked', label: t('residents.tabBlocked') },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Фильтры */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            placeholder={t('residents.searchPlaceholder')}
          />
        </div>
        <button
          onClick={() => { setSearch(''); setPage(1) }}
          className="px-4 py-2 text-slate-600 font-medium text-sm hover:text-primary transition-colors"
        >
          {t('residents.reset')}
        </button>
      </div>

      {/* Таблица */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#065F46]" />
        </div>
      ) : (
        <>
          <ResidentsTable
            residents={residents}
            onEdit={setEditResident}
            onBlock={(r) => setConfirmModal({ isOpen: true, type: 'block', resident: r })}
            onUnblock={(r) => setConfirmModal({ isOpen: true, type: 'unblock', resident: r })}
            onResetPassword={setResetResident}
          />
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

      {/* Модалки */}
      <AddResidentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      <EditResidentModal
        isOpen={!!editResident}
        onClose={() => setEditResident(null)}
        resident={editResident}
      />

      <ResetPasswordModal
        isOpen={!!resetResident}
        onClose={() => setResetResident(null)}
        resident={resetResident}
      />

      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: 'block', resident: null })}
        onConfirm={handleConfirm}
        isLoading={isBlocking || isUnblocking}
        type={confirmModal.type}
        userName={
          confirmModal.resident?.fullName ||
          `${confirmModal.resident?.firstName ?? ''} ${confirmModal.resident?.lastName ?? ''}`.trim()
        }
      />
    </div>
  )
}

export default ResidentsPage