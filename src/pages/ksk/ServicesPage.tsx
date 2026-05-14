import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { kskServicesApi } from '@/api/kskServices'
import { ServiceListItem } from '@/types'
import AddServiceModal from './components/modals/AddServiceModal'
import EditServiceModal from './components/modals/EditServiceModal'
import DeleteServiceConfirmModal from './components/modals/DeleteServiceConfirmModal'

const PAGE_SIZE = 24

const ServicesPage = () => {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editServiceId, setEditServiceId] = useState<string | null>(null)
  const [deleteService, setDeleteService] = useState<ServiceListItem | null>(null)

  useEffect(() => {
    const handler = () => setIsAddOpen(true)
    window.addEventListener('openAddModal', handler)
    return () => window.removeEventListener('openAddModal', handler)
  }, [])

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const { data, isLoading } = useQuery({
    queryKey: ['ksk-services', search],
    queryFn: () =>
      kskServicesApi.getAll({
        page: 1,
        pageSize: PAGE_SIZE,
        search: search || undefined,
      }),
  })

  const { data: editServiceData } = useQuery({
    queryKey: ['ksk-service', editServiceId],
    queryFn: () => kskServicesApi.getById(editServiceId!),
    enabled: !!editServiceId,
  })
  const editService = editServiceData?.data ?? null

  const { mutate: toggleActive } = useMutation({
    mutationFn: (id: string) => kskServicesApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-services'] })
      toast.success('Статус обновлён')
    },
    onError: () => toast.error('Не удалось изменить статус'),
  })

  const { mutate: deleteSvc, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => kskServicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-services'] })
      toast.success('Сервис удалён')
      setDeleteService(null)
    },
    onError: () => toast.error('Не удалось удалить сервис'),
  })

  const allServices = data?.data.items ?? []
  const services = showInactive ? allServices : allServices.filter((s) => s.isActive)
  const totalCount = data?.data.totalCount ?? 0

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по названию или провайдеру"
            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm w-full"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded text-primary focus:ring-primary/20"
          />
          <span className="text-sm text-slate-600 font-medium">Показывать неактивные</span>
        </label>
        <span className="ml-auto text-sm text-slate-500">
          Всего: <span className="font-bold text-slate-900">{totalCount}</span>
        </span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 text-center py-16 text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3 block">home_repair_service</span>
          <p className="font-medium">Сервисы не найдены</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => {
            const inactive = !service.isActive
            return (
              <div
                key={service.id}
                className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all ${
                  inactive ? 'opacity-60' : 'hover:shadow-md'
                }`}
              >
                {/* Cover */}
                <div className="relative aspect-[16/9] bg-slate-100">
                  <img
                    src={service.coverUrl}
                    alt={service.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  {inactive && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-900/70 text-white text-xs font-semibold">
                      Неактивен
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">
                    {service.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{service.providerName}</p>
                  <p className="text-sm font-semibold text-primary">{service.priceText}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-auto pt-2">
                    <span className="material-symbols-outlined text-[14px]">call</span>
                    {service.contactPhone}
                  </p>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button
                    onClick={() => setEditServiceId(service.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                    title="Редактировать"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => toggleActive(service.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-500 transition-colors"
                    title={inactive ? 'Активировать' : 'Деактивировать'}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {inactive ? 'toggle_off' : 'toggle_on'}
                    </span>
                  </button>
                  <button
                    onClick={() => setDeleteService(service)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Удалить"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <AddServiceModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <EditServiceModal
        isOpen={!!editServiceId && !!editService}
        onClose={() => setEditServiceId(null)}
        service={editService}
      />
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
