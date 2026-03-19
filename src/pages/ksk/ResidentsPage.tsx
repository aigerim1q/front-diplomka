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

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editResident, setEditResident] = useState<Resident | null>(null)
  const [resetResident, setResetResident] = useState<Resident | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    type: 'block' | 'unblock'
    resident: Resident | null
  }>({ isOpen: false, type: 'block', resident: null })

  // Слушаем кнопку "Добавить" из Header
  useEffect(() => {
    const handler = () => setIsAddOpen(true)
    window.addEventListener('openAddModal', handler)
    return () => window.removeEventListener('openAddModal', handler)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['ksk-residents', page, status],
    queryFn: () =>
      kskResidentsApi.getAll({
        page,
        pageSize: PAGE_SIZE,
        status: status ? (Number(status) as 1 | 2) : undefined,
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
      {/* Фильтры */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#065F46]/20 focus:border-[#065F46] outline-none text-sm"
            placeholder="Поиск по имени или email..."
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#065F46]/20 focus:border-[#065F46] outline-none text-sm w-44"
        >
          <option value="">Все статусы</option>
          <option value="1">Активные</option>
          <option value="2">Заблокированные</option>
        </select>
        <button
          onClick={() => { setSearch(''); setStatus(''); setPage(1) }}
          className="px-4 py-2 text-slate-600 font-medium text-sm hover:text-[#065F46] transition-colors"
        >
          Сбросить
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