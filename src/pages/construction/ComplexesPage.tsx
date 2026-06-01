import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, X, Plus } from 'lucide-react'
import { complexesApi } from '@/api/complexes'
import { Complex } from '@/types'
import ComplexCard from './components/ComplexCard'
import AddComplexModal from './components/modals/AddComplexModal'
import EditComplexModal from './components/modals/EditComplexModal'
import LinkKskModal from './components/modals/LinkKskModal'
import ConfirmComplexModal from './components/modals/ConfirmComplexModal'
import UsersPagination from '@/pages/super-admin/components/UsersPagination'

const PAGE_SIZE = 9

const ComplexesPage = () => {
  const queryClient = useQueryClient()

  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editComplex, setEditComplex]       = useState<Complex | null>(null)
  const [linkKskComplex, setLinkKskComplex] = useState<Complex | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; type: 'activate' | 'deactivate'; complex: Complex | null
  }>({ isOpen: false, type: 'deactivate', complex: null })

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
  const complexes = search.trim()
    ? allComplexes.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.address.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase())
      )
    : allComplexes

  const totalCount = data?.data.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={13} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Поиск по названию, адресу, городу..."
            className="pl-8 pr-8 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 w-full"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <span className="text-xs text-zinc-400 ml-1">
          {totalCount > 0 && `${totalCount} комплекс${totalCount === 1 ? '' : totalCount < 5 ? 'а' : 'ов'}`}
        </span>

        <button
          onClick={() => setIsAddOpen(true)}
          className="ml-auto flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          Добавить комплекс
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="aspect-video skeleton" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 skeleton rounded" />
                <div className="h-3 w-1/2 skeleton rounded" />
                <div className="h-8 skeleton rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : complexes.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 py-24 text-center text-zinc-400">
          <span className="material-symbols-outlined text-5xl mb-3 block">apartment</span>
          <p className="text-sm font-medium">
            {search ? 'Ничего не найдено' : 'Жилые комплексы не добавлены'}
          </p>
          {!search && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              <Plus size={13} />
              Добавить первый
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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

      {/* Modals */}
      <AddComplexModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {editComplex && (
        <EditComplexModal
          key={editComplex.id}
          isOpen={!!editComplex}
          onClose={() => setEditComplex(null)}
          complex={editComplex}
        />
      )}

      <LinkKskModal
        isOpen={!!linkKskComplex}
        onClose={() => setLinkKskComplex(null)}
        complex={linkKskComplex}
      />

      <ConfirmComplexModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: 'deactivate', complex: null })}
        onConfirm={() => {
          if (!confirmModal.complex) return
          confirmModal.type === 'activate'
            ? activate(confirmModal.complex.id)
            : deactivate(confirmModal.complex.id)
        }}
        isLoading={isActivating || isDeactivating}
        type={confirmModal.type}
        complex={confirmModal.complex}
      />
    </div>
  )
}

export default ComplexesPage
