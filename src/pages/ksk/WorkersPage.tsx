import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserPlus, Edit, UserX, Search, X } from 'lucide-react'
import { kskWorkersApi } from '@/api/kskWorkers'
import { Worker, SPECIALIZATION_OPTIONS, SPECIALIZATION_LABELS, WorkerSpecialization } from '@/types'
import AddWorkerModal from './components/modals/AddWorkerModal'
import EditWorkerModal from './components/modals/EditWorkerModal'
import ConfirmActionModal from '@/pages/super-admin/components/modals/ConfirmActionModal'

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700','bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700','bg-sky-100 text-sky-700',
  'bg-orange-100 text-orange-700','bg-teal-100 text-teal-700',
]
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

const WorkersPage = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [tab, setTab]   = useState<'all' | 'active' | 'inactive'>('all')
  const [spec, setSpec] = useState('')
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen]       = useState(false)
  const [editWorker, setEditWorker]     = useState<Worker | null>(null)
  const [confirmDeact, setConfirmDeact] = useState<Worker | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['ksk-workers', spec],
    queryFn: () => kskWorkersApi.getAll({
      specialization: spec ? (Number(spec) as WorkerSpecialization) : undefined,
    }),
  })

  const { mutate: deactivate, isPending: isDeactivating } = useMutation({
    mutationFn: (id: string) => kskWorkersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-workers'] })
      setConfirmDeact(null)
      toast.success('Работник деактивирован')
    },
  })

  const all       = data?.data ?? []
  const counts    = { all: all.length, active: all.filter(w => w.isActive).length, inactive: all.filter(w => !w.isActive).length }
  const tabFilter = tab === 'active' ? all.filter(w => w.isActive) : tab === 'inactive' ? all.filter(w => !w.isActive) : all
  const workers   = search ? tabFilter.filter(w => w.fullName.toLowerCase().includes(search.toLowerCase())) : tabFilter

  const TABS = [
    { key: 'all' as const,      label: t('pages.workers.tabAll'),      count: counts.all },
    { key: 'active' as const,   label: t('pages.workers.tabActive'),   count: counts.active },
    { key: 'inactive' as const, label: t('pages.workers.tabInactive'), count: counts.inactive },
  ]

  return (
    <div>
      {/* Single toolbar row */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Tabs */}
        <div className="flex gap-0.5 bg-zinc-100 rounded-xl p-1 shrink-0">
          {TABS.map(({ key, label, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {label}
              <span className={`tabular-nums text-xs ${tab === key ? 'text-zinc-500' : 'text-zinc-400'}`}>{count}</span>
            </button>
          ))}
        </div>

        {/* Specialization */}
        <select value={spec} onChange={e => setSpec(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 w-44">
          {<option value="">{t("pages.workers.allSpecializations")}</option>}
          {SPECIALIZATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {spec && (
          <button onClick={() => setSpec('')} className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">Сбросить</button>
        )}

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={13} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("pages.workers.search")}
            className="pl-8 pr-8 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 w-48" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"><X size={13} /></button>}
        </div>

        {/* Add */}
        <button onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0">
          <UserPlus size={14} />
          Добавить работника
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {[1,2,3].map(i => (
            <div key={i} className="px-5 py-4 border-b border-zinc-100 flex items-center gap-4">
              <div className="size-9 skeleton rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1"><div className="h-3 w-36 skeleton rounded" /><div className="h-2.5 w-24 skeleton rounded" /></div>
              <div className="h-5 w-20 skeleton rounded-full" />
              <div className="h-5 w-16 skeleton rounded-full" />
            </div>
          ))}
        </div>
      ) : workers.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 py-20 text-center text-zinc-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">engineering</span>
          <p className="text-sm">Работники не найдены</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_80px] gap-4 px-5 py-3 border-b border-zinc-100 bg-zinc-50/60">
            {['Работник','Телефон','Специализация','Занятость','Статус','Действия'].map((col, i) => (
              <span key={i} className={`text-xs text-zinc-400 font-medium ${i===5?'text-right':''}`}>{col}</span>
            ))}
          </div>

          <ul className="divide-y divide-zinc-100">
            {workers.map(w => {
              const inactive = !w.isActive
              const busy     = w.status === 2
              const color    = avatarColor(w.fullName)
              return (
                <li key={w.id} className={`grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_80px] gap-4 px-5 py-4 items-center hover:bg-zinc-50/60 transition-colors group ${inactive ? 'opacity-55' : ''}`}>

                  {/* Работник */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`size-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${color}`}>
                      {w.fullName[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{w.fullName}</p>
                      <p className="text-[11px] text-zinc-400">{new Date(w.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>

                  {/* Телефон */}
                  <span className="text-xs text-zinc-500">{w.phoneNumber}</span>

                  {/* Специализация */}
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 text-[11px] font-medium w-fit">
                    <span className="material-symbols-outlined text-[13px]">build</span>
                    {SPECIALIZATION_LABELS[w.specialization] ?? w.specializationName}
                  </span>

                  {/* Занятость */}
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${busy ? 'text-amber-600' : 'text-emerald-600'}`}>
                    <span className={`size-1.5 rounded-full shrink-0 ${busy ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    {w.availabilityLabel || (busy ? 'Занят' : 'Свободен')}
                  </span>

                  {/* Статус */}
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <span className={`size-1.5 rounded-full shrink-0 ${inactive ? 'bg-zinc-300' : 'bg-emerald-400'}`} />
                    <span className={inactive ? 'text-zinc-400' : 'text-zinc-700'}>
                      {inactive ? 'Неактивен' : 'Активен'}
                    </span>
                  </span>

                  {/* Действия */}
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditWorker(w)} title="Редактировать"
                      className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
                      <Edit size={13} />
                    </button>
                    {w.isActive && (
                      <button onClick={() => setConfirmDeact(w)} title="Деактивировать"
                        className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <UserX size={13} />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <AddWorkerModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <EditWorkerModal isOpen={!!editWorker} onClose={() => setEditWorker(null)} worker={editWorker} />
      <ConfirmActionModal
        isOpen={!!confirmDeact}
        onClose={() => setConfirmDeact(null)}
        onConfirm={() => confirmDeact && deactivate(confirmDeact.id)}
        isLoading={isDeactivating}
        type="block"
        userName={confirmDeact?.fullName ?? ''}
      />
    </div>
  )
}

export default WorkersPage
