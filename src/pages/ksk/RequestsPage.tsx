import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { kskServiceRequestsApi } from '@/api/kskServiceRequests'
import {
  ServiceRequestStatus,
  ServiceRequestCategory,
  SERVICE_REQUEST_STATUS_LABELS,
  SERVICE_REQUEST_STATUS_COLORS,
  SERVICE_REQUEST_CATEGORY_LABELS,
  SERVICE_REQUEST_CATEGORY_OPTIONS,
} from '@/types'
import ServiceRequestDetailModal from './components/modals/ServiceRequestDetailModal'
import UsersPagination from '@/pages/super-admin/components/UsersPagination'

const PAGE_SIZE = 20

const TABS: { key: 'all' | ServiceRequestStatus; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 1, label: 'Новые' },
  { key: 2, label: 'В работе' },
  { key: 3, label: 'Завершены' },
  { key: 4, label: 'Отменены' },
]

const RequestsPage = () => {
  const [tab, setTab] = useState<'all' | ServiceRequestStatus>('all')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
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

  const requests = data?.data.items ?? []
  const totalCount = data?.data.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Табы по статусам */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit flex-wrap">
        {TABS.map(({ key, label }) => (
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

      {/* Фильтр по категории */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm w-56"
        >
          <option value="">Все категории</option>
          {SERVICE_REQUEST_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => { setCategory(''); setPage(1) }}
          className="px-4 py-2 text-slate-600 font-medium text-sm hover:text-primary transition-colors"
        >
          Сбросить
        </button>
        <span className="ml-auto text-sm text-slate-400">
          Всего: <span className="font-semibold text-slate-700">{totalCount}</span>
        </span>
      </div>

      {/* Таблица */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Заявка', 'Категория', 'Статус', 'Работник', 'Дата', ''].map((col, i) => (
                    <th
                      key={i}
                      className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedRequestId(req.id)}
                  >
                    {/* Заявка */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900 max-w-[220px] truncate">{req.title}</p>
                    </td>

                    {/* Категория */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                        <span className="material-symbols-outlined text-[14px]">build</span>
                        {SERVICE_REQUEST_CATEGORY_LABELS[req.category] ?? req.categoryName}
                      </span>
                    </td>

                    {/* Статус */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${SERVICE_REQUEST_STATUS_COLORS[req.status]}`}>
                        {SERVICE_REQUEST_STATUS_LABELS[req.status]}
                      </span>
                    </td>

                    {/* Работник */}
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {req.assignedWorkerName ?? <span className="text-slate-300">—</span>}
                    </td>

                    {/* Дата */}
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                    </td>

                    {/* Стрелка */}
                    <td className="px-6 py-4">
                      <span className="material-symbols-outlined text-slate-300 text-[20px]">chevron_right</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {requests.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-3 block">inbox</span>
                <p className="font-medium">Заявки не найдены</p>
              </div>
            )}
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

      {/* Детальная модалка */}
      <ServiceRequestDetailModal
        isOpen={!!selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        requestId={selectedRequestId}
      />
    </div>
  )
}

export default RequestsPage