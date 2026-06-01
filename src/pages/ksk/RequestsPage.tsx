import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Search, X } from 'lucide-react'
import { kskServiceRequestsApi } from '@/api/kskServiceRequests'
import {
  ServiceRequestStatus,
  ServiceRequestCategory,
  SERVICE_REQUEST_STATUS_LABELS,
  SERVICE_REQUEST_CATEGORY_LABELS,
  SERVICE_REQUEST_CATEGORY_OPTIONS,
} from '@/types'
import ServiceRequestDetailModal from './components/modals/ServiceRequestDetailModal'
import UsersPagination from '@/pages/super-admin/components/UsersPagination'

const PAGE_SIZE = 20

const STATUS_STYLES: Record<number, string> = {
  1: 'bg-blue-50 text-blue-600 border border-blue-100',
  2: 'bg-amber-50 text-amber-600 border border-amber-100',
  3: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  4: 'bg-zinc-100 text-zinc-400 border border-zinc-200',
}

const RequestsPage = () => {
  const { t } = useTranslation()
  const TABS = [
    { key: 'all' as const, label: t('pages.requests.tabAll') },
    { key: 1 as ServiceRequestStatus, label: t('pages.requests.tabNew') },
    { key: 2 as ServiceRequestStatus, label: t('pages.requests.tabInProgress') },
    { key: 3 as ServiceRequestStatus, label: t('pages.requests.tabCompleted') },
    { key: 4 as ServiceRequestStatus, label: t('pages.requests.tabCancelled') },
  ]
  const [tab, setTab] = useState<'all' | ServiceRequestStatus>('all')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['ksk-service-requests', tab, category, page],
    queryFn: () =>
      kskServiceRequestsApi.getAll({
        page,
        pageSize: PAGE_SIZE,
        status: tab !== 'all' ? (tab as ServiceRequestStatus) : undefined,
        category: category ? (Number(category) as ServiceRequestCategory) : undefined,
      }),
  })

  // Per-status counts for tab badges
  const { data: allData } = useQuery({
    queryKey: ['ksk-service-requests-all-counts'],
    queryFn: () => kskServiceRequestsApi.getAll({ page: 1, pageSize: 200 }),
    staleTime: 30000,
  })
  const _allItems = allData?.data.items ?? []
  const counts: Record<string | number, number> = {
    all: allData?.data.totalCount ?? 0,
    1: _allItems.filter((r) => r.status === 1).length,
    2: _allItems.filter((r) => r.status === 2).length,
    3: _allItems.filter((r) => r.status === 3).length,
    4: _allItems.filter((r) => r.status === 4).length,
  }

  const allRequests = data?.data.items ?? []
  const requests = search.trim()
    ? allRequests.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    : allRequests
  const totalCount = data?.data.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-4">

      {/* Toolbar: табы + фильтр в одной строке */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Статус-табы */}
        <div className="flex gap-0.5 bg-zinc-100 rounded-xl p-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setPage(1) }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === key
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {label}
              {counts[key] > 0 && (
                <span className={`tabular-nums text-xs ${
                  tab === key ? 'text-zinc-500' : 'text-zinc-400'
                }`}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Категория */}
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 w-44"
        >
          <option value="">{t("pages.requests.allCategories")}</option>
          {SERVICE_REQUEST_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {category && (
          <button
            onClick={() => { setCategory(''); setPage(1) }}
            className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            Сбросить
          </button>
        )}

        {/* Поиск */}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={13} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("pages.requests.search")}
            className="pl-8 pr-8 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 w-56"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              <X size={13} />
            </button>
          )}
        </div>


      </div>

      {/* Таблица */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="px-5 py-4 border-b border-zinc-100 flex items-center gap-4">
              <div className="h-3 w-48 skeleton rounded" />
              <div className="h-3 w-20 skeleton rounded" />
              <div className="h-5 w-16 skeleton rounded-full ml-auto" />
              <div className="h-3 w-20 skeleton rounded" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 py-20 text-center text-zinc-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">inbox</span>
          <p className="text-sm">Заявки не найдены</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {/* Заголовок таблицы */}
          <div className="grid grid-cols-[1fr_140px_120px_160px_100px_32px] gap-4 px-5 py-2.5 border-b border-zinc-100 bg-zinc-50">
            {['Заявка', 'Категория', 'Статус', 'Работник', 'Дата', ''].map((col, i) => (
              <span key={i} className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{col}</span>
            ))}
          </div>

          {/* Строки */}
          <ul className="divide-y divide-zinc-100">
            {requests.map((req) => (
              <li
                key={req.id}
                onClick={() => setSelectedRequestId(req.id)}
                className="grid grid-cols-[1fr_140px_120px_160px_100px_32px] gap-4 px-5 py-3.5 items-center hover:bg-zinc-50 transition-colors cursor-pointer group"
              >
                {/* Заявка */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{req.title}</p>
                </div>

                {/* Категория */}
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[11px] font-medium truncate w-fit">
                  {SERVICE_REQUEST_CATEGORY_LABELS[req.category]}
                </span>

                {/* Статус */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold w-fit ${STATUS_STYLES[req.status]}`}>
                  {SERVICE_REQUEST_STATUS_LABELS[req.status]}
                </span>

                {/* Работник */}
                <span className="text-xs text-zinc-500 truncate">
                  {req.assignedWorkerName ?? <span className="text-zinc-300">—</span>}
                </span>

                {/* Дата */}
                <span className="text-xs text-zinc-400">
                  {new Date(req.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>

                {/* Стрелка */}
                <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {totalPages > 1 && (
        <UsersPagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      <ServiceRequestDetailModal
        isOpen={!!selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        requestId={selectedRequestId}
      />
    </div>
  )
}

export default RequestsPage
