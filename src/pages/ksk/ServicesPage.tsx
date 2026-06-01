import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, X, Plus, Edit, Power, Trash2, Phone } from 'lucide-react'
import { kskServicesApi } from '@/api/kskServices'
import { ServiceListItem } from '@/types'
import AddServiceModal from './components/modals/AddServiceModal'
import EditServiceModal from './components/modals/EditServiceModal'
import DeleteServiceConfirmModal from './components/modals/DeleteServiceConfirmModal'

const PAGE_SIZE = 24

const ServicesPage = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch]               = useState('')
  const [searchInput, setSearchInput]     = useState('')
  const [showInactive, setShowInactive]   = useState(true)
  const [isAddOpen, setIsAddOpen]         = useState(false)
  const [editServiceId, setEditServiceId] = useState<string | null>(null)
  const [deleteService, setDeleteService] = useState<ServiceListItem | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const { data, isLoading } = useQuery({
    queryKey: ['ksk-services', search],
    queryFn: () => kskServicesApi.getAll({ page: 1, pageSize: PAGE_SIZE, search: search || undefined }),
  })

  const { data: editServiceData } = useQuery({
    queryKey: ['ksk-service', editServiceId],
    queryFn: () => kskServicesApi.getById(editServiceId!),
    enabled: !!editServiceId,
  })
  const editService = editServiceData?.data ?? null

  const { mutate: toggleActive } = useMutation({
    mutationFn: (id: string) => kskServicesApi.toggleActive(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ksk-services'] }); toast.success('Статус обновлён') },
    onError: () => toast.error('Не удалось изменить статус'),
  })

  const { mutate: deleteSvc, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => kskServicesApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ksk-services'] }); toast.success('Сервис удалён'); setDeleteService(null) },
    onError: () => toast.error('Не удалось удалить'),
  })

  const allServices = data?.data.items ?? []
  const services    = showInactive ? allServices : allServices.filter(s => s.isActive)
  const totalCount  = data?.data.totalCount ?? 0

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={13} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={t("pages.services.search")}
            className="pl-8 pr-8 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 w-full"
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Show inactive toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)}
            className="rounded accent-zinc-900" />
          <span className="text-sm text-zinc-600">{t("pages.services.inactive")}</span>
        </label>

        <span className="text-xs text-zinc-400 shrink-0">
          <span className="font-semibold text-zinc-700">{totalCount}</span> {t("pages.services.count")}
        </span>

        <button onClick={() => setIsAddOpen(true)}
          className="ml-auto flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0">
          <Plus size={14} />{t("pages.services.createBtn")}
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="rounded-xl overflow-hidden border border-zinc-200 bg-white">
              <div className="aspect-video skeleton" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-3/4 skeleton rounded" />
                <div className="h-2.5 w-1/2 skeleton rounded" />
                <div className="h-3 w-1/3 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 py-20 text-center text-zinc-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">home_repair_service</span>
          <p className="text-sm">{t("pages.services.notFound")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {services.map(service => {
            const inactive = !service.isActive
            return (
              <div key={service.id}
                className={`group bg-white rounded-xl border border-zinc-200 overflow-hidden flex flex-col transition-all hover:border-zinc-300 hover:shadow-md ${inactive ? 'opacity-55' : ''}`}>

                {/* Cover — fixed 160px height */}
                <div className="relative h-40 bg-zinc-100 shrink-0 overflow-hidden">
                  {service.coverUrl ? (
                    <img src={service.coverUrl} alt={service.title}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-zinc-200">home_repair_service</span>
                    </div>
                  )}
                  {inactive && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-zinc-900/60 text-white text-[10px] font-medium">
                      Неактивен
                    </span>
                  )}
                </div>

                {/* Text content */}
                <div className="p-3.5 flex-1 flex flex-col gap-1 border-b border-zinc-100">
                  <h3 className="text-sm font-semibold text-zinc-900 line-clamp-1">{service.title}</h3>
                  <p className="text-xs text-zinc-400 truncate">{service.providerName}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    {service.priceText
                      ? <span className="text-sm font-bold text-zinc-900">{service.priceText} тг</span>
                      : <span />}
                    {service.contactPhone && (
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Phone size={10} />{service.contactPhone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-3.5 py-2.5 flex items-center justify-end gap-0.5">
                  <button onClick={() => setEditServiceId(service.id)} title="Редактировать"
                    className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
                    <Edit size={13} />
                  </button>
                  <button onClick={() => toggleActive(service.id)} title={inactive ? 'Активировать' : 'Деактивировать'}
                    className={`size-7 flex items-center justify-center rounded-md transition-colors ${
                      inactive ? 'text-zinc-300 hover:text-emerald-500 hover:bg-emerald-50' : 'text-zinc-400 hover:text-amber-500 hover:bg-amber-50'
                    }`}>
                    <Power size={13} />
                  </button>
                  <button onClick={() => setDeleteService(service)} title="Удалить"
                    className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AddServiceModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <EditServiceModal isOpen={!!editServiceId && !!editService} onClose={() => setEditServiceId(null)} service={editService} />
      <DeleteServiceConfirmModal
        isOpen={!!deleteService}
        onClose={() => setDeleteService(null)}
        onConfirm={() => deleteService && deleteSvc(deleteService.id)}
        isLoading={isDeleting}
        serviceTitle={deleteService?.title ?? ''}
      />
    </div>
  )
}

export default ServicesPage
