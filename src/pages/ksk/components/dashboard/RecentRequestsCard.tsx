import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import {
  ServiceRequestListItem,
  SERVICE_REQUEST_STATUS_LABELS,
  SERVICE_REQUEST_CATEGORY_LABELS,
} from '@/types'

interface Props {
  requests: ServiceRequestListItem[]
  isLoading?: boolean
}

const STATUS_STYLES: Record<number, string> = {
  1: 'bg-blue-50 text-blue-600 border border-blue-100',
  2: 'bg-amber-50 text-amber-600 border border-amber-100',
  3: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  4: 'bg-zinc-100 text-zinc-400 border border-zinc-200',
}


const RecentRequestsCard = ({ requests, isLoading }: Props) => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(
      i18n.language === 'kk' ? 'kk-KZ' : 'ru-RU',
      { day: 'numeric', month: 'short' }
    )

  const items = [...requests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="bg-white rounded-xl border border-zinc-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">{t('kskDashboard.recent.title')}</h3>
          <p className="text-xs text-zinc-400 mt-0.5">{t('kskDashboard.recent.subtitle')}</p>
        </div>
        <button
          onClick={() => navigate('/requests')}
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          {t('kskDashboard.recent.viewAll')}
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="p-4 space-y-3 flex-1">
          {[1,2,3].map(i => <div key={i} className="h-12 skeleton rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-zinc-400 flex-1 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
          <p className="text-xs">{t('kskDashboard.recent.empty')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 flex-1">
          {items.map((r) => (
            <li
              key={r.id}
              onClick={() => navigate('/requests')}
              className="px-5 py-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors cursor-pointer group"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{r.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">
                  {SERVICE_REQUEST_CATEGORY_LABELS[r.category]}
                  {r.assignedWorkerName && (
                    <> · <span className="text-zinc-500">{r.assignedWorkerName}</span></>
                  )}
                </p>
              </div>

              {/* Badge */}
              <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status]}`}>
                {SERVICE_REQUEST_STATUS_LABELS[r.status]}
              </span>

              {/* Date */}
              <span className="shrink-0 text-xs text-zinc-400 w-16 text-right">
                {formatDate(r.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default RecentRequestsCard
