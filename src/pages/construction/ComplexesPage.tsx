import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { complexesApi } from '@/api/complexes'
import { Complex } from '@/types'
import ComplexCard from './components/ComplexCard'
import AddComplexModal from './components/modals/AddComplexModal'
import EditComplexModal from './components/modals/EditComplexModal'
import LinkKskModal from './components/modals/LinkKskModal'
import ConfirmComplexModal from './components/modals/ConfirmComplexModal'
import UsersPagination from '@/pages/super-admin/components/UsersPagination'

const PAGE_SIZE = 9 // кратно 3 колонкам

const ComplexesPage = () => {
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editComplex, setEditComplex] = useState<Complex | null>(null)
  const [linkKskComplex, setLinkKskComplex] = useState<Complex | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    type: 'activate' | 'deactivate'
    complex: Complex | null
  }>({ isOpen: false, type: 'deactivate', complex: null })

  // Слушаем кнопку "Добавить" из Header
  useEffect(() => {
    const handler = () => setIsAddOpen(true)
    window.addEventListener('openAddModal', handler)
    return () => window.removeEventListener('openAddModal', handler)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['complexes', page],
    queryFn: () => complexesApi.getAll({ page, pageSize: PAGE_SIZE }),
  })

  const { mutate: activate, isPending: isActivating } = useMutation({
    mutationFn: (id: string) => complexesApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complexes'] })
      setConfirmModal({ isOpen: false, type: 'deactivate', complex: null })
    },
  })

  const { mutate: deactivate, isPending: isDeactivating } = useMutation({
    mutationFn: (id: string) => complexesApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complexes'] })
      setConfirmModal({ isOpen: false, type: 'deactivate', complex: null })
    },
  })

  const allComplexes = data?.data.items ?? []
  const complexes = search
    ? allComplexes.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.address.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase())
      )
    : allComplexes

  const totalCount = data?.data.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const handleConfirm = () => {
    if (!confirmModal.complex) return
    if (confirmModal.type === 'deactivate') {
      deactivate(confirmModal.complex.id)
    } else {
      activate(confirmModal.complex.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Фильтр / поиск */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            placeholder="Поиск по названию, адресу, городу..."
          />
        </div>
        {search && (
          <button
            onClick={() => { setSearch(''); setPage(1) }}
            className="px-4 py-2 text-slate-600 font-medium text-sm hover:text-primary transition-colors"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Карточки */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : complexes.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <span className="material-symbols-outlined text-6xl mb-4 block">apartment</span>
          <p className="font-semibold text-lg">Жилые комплексы не найдены</p>
          <p className="text-sm mt-1">Добавьте первый комплекс с помощью кнопки выше</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {complexes.map((complex) => (
              <ComplexCard
                key={complex.id}
                complex={complex}
                onEdit={setEditComplex}
                onLinkKsk={setLinkKskComplex}
                onActivate={(c) => setConfirmModal({ isOpen: true, type: 'activate', complex: c })}
                onDeactivate={(c) => setConfirmModal({ isOpen: true, type: 'deactivate', complex: c })}
              />
            ))}
          </div>

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
      <AddComplexModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      <EditComplexModal
        isOpen={!!editComplex}
        onClose={() => setEditComplex(null)}
        complex={editComplex}
      />

      <LinkKskModal
        isOpen={!!linkKskComplex}
        onClose={() => setLinkKskComplex(null)}
        complex={linkKskComplex}
      />

      <ConfirmComplexModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: 'deactivate', complex: null })}
        onConfirm={handleConfirm}
        isLoading={isActivating || isDeactivating}
        type={confirmModal.type}
        complex={confirmModal.complex}
      />
    </div>
  )
}

export default ComplexesPage
