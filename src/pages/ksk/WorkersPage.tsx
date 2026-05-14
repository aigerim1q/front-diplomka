import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { kskWorkersApi } from '@/api/kskWorkers'
import { Worker, SPECIALIZATION_OPTIONS, SPECIALIZATION_LABELS, WorkerSpecialization } from '@/types'
import AddWorkerModal from './components/modals/AddWorkerModal'
import EditWorkerModal from './components/modals/EditWorkerModal'
import ConfirmActionModal from '@/pages/super-admin/components/modals/ConfirmActionModal'

const WorkersPage = () => {
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<'all' | 'active' | 'inactive'>('all')
  const [specializationFilter, setSpecializationFilter] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editWorker, setEditWorker] = useState<Worker | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState<Worker | null>(null)

  useEffect(() => {
    const handler = () => setIsAddOpen(true)
    window.addEventListener('openAddModal', handler)
    return () => window.removeEventListener('openAddModal', handler)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['ksk-workers', specializationFilter],
    queryFn: () =>
      kskWorkersApi.getAll({
        specialization: specializationFilter
          ? (Number(specializationFilter) as WorkerSpecialization)
          : undefined,
      }),
  })

  const { mutate: deactivate, isPending: isDeactivating } = useMutation({
    mutationFn: (id: string) => kskWorkersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-workers'] })
      setConfirmDeactivate(null)
      toast.success('Работник деактивирован')
    },
  })

  const allWorkers = data?.data ?? []
  const activeCount = allWorkers.filter((w) => w.isActive).length
  const inactiveCount = allWorkers.filter((w) => !w.isActive).length

  const workers = allWorkers.filter((w) => {
    if (tab === 'active') return w.isActive
    if (tab === 'inactive') return !w.isActive
    return true
  })

  return (
    <div className="space-y-6">
      {/* Табы */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
        {([
          { key: 'all', label: 'Все', count: allWorkers.length },
          { key: 'active', label: 'Активные', count: activeCount },
          { key: 'inactive', label: 'Неактивные', count: inactiveCount },
        ] as const).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              tab === key
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Фильтры */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <select
          value={specializationFilter}
          onChange={(e) => setSpecializationFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm w-56"
        >
          <option value="">Все специализации</option>
          {SPECIALIZATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => setSpecializationFilter('')}
          className="px-4 py-2 text-slate-600 font-medium text-sm hover:text-primary transition-colors"
        >
          Сбросить
        </button>
      </div>

      {/* Таблица */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Работник', 'Телефон', 'Специализация', 'Статус занятости', 'Статус', 'Дата добавления', 'Действия'].map((col) => (
                  <th
                    key={col}
                    className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${col === 'Действия' ? 'text-right' : ''}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workers.map((worker) => {
                const isInactive = !worker.isActive
                const isBusy = worker.status === 2
                return (
                  <tr
                    key={worker.id}
                    className={`hover:bg-slate-50/50 transition-colors ${isInactive ? 'opacity-60' : ''}`}
                  >
                    {/* ФИО */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                          {worker.fullName[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span className={`text-sm font-semibold ${isInactive ? 'text-slate-400' : 'text-slate-900'}`}>
                          {worker.fullName}
                        </span>
                      </div>
                    </td>

                    {/* Телефон */}
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {worker.phoneNumber}
                    </td>

                    {/* Специализация */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                        <span className="material-symbols-outlined text-[14px]">build</span>
                        {SPECIALIZATION_LABELS[worker.specialization] ?? worker.specializationName}
                      </span>
                    </td>

                    {/* Статус занятости */}
                    <td className="px-6 py-4">
                      <span
                        title={worker.availabilityComment ?? undefined}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isBusy
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${isBusy ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        {worker.availabilityLabel || (isBusy ? 'Занят' : 'Свободен')}
                      </span>
                    </td>

                    {/* Статус (активен/деактивирован) */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        isInactive
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        <span className={`size-1.5 rounded-full ${isInactive ? 'bg-slate-400' : 'bg-primary'}`} />
                        {isInactive ? 'Деактивирован' : 'Активен'}
                      </span>
                    </td>

                    {/* Дата */}
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(worker.createdAt).toLocaleDateString('ru-RU')}
                    </td>

                    {/* Действия */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditWorker(worker)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                          title="Редактировать"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        {worker.isActive && (
                          <button
                            onClick={() => setConfirmDeactivate(worker)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            title="Деактивировать"
                          >
                            <span className="material-symbols-outlined text-[20px]">person_off</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {workers.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-3 block">engineering</span>
              <p className="font-medium">Работники не найдены</p>
            </div>
          )}
        </div>
      )}

      {/* Модалки */}
      <AddWorkerModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      <EditWorkerModal
        isOpen={!!editWorker}
        onClose={() => setEditWorker(null)}
        worker={editWorker}
      />

      <ConfirmActionModal
        isOpen={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={() => confirmDeactivate && deactivate(confirmDeactivate.id)}
        isLoading={isDeactivating}
        type="block"
        userName={confirmDeactivate?.fullName ?? ''}
      />
    </div>
  )
}

export default WorkersPage
