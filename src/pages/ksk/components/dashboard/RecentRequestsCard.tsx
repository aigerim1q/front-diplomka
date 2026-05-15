import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ServiceRequestListItem,
  SERVICE_REQUEST_STATUS_LABELS,
  SERVICE_REQUEST_STATUS_COLORS,
} from '@/types'

interface Props {
  requests: ServiceRequestListItem[]
  isLoading?: boolean
}

const RecentRequestsCard = ({ requests, isLoading }: Props) => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const formatRelative = (iso: string): string => {
    const diffMs = Date.now() - new Date(iso).getTime()
    const minutes = Math.round(diffMs / 60000)
    if (minutes < 1) return t('kskDashboard.time.justNow')
    if (minutes < 60) return t('kskDashboard.time.minutesAgo', { count: minutes })
    const hours = Math.round(minutes / 60)
    if (hours < 24) return t('kskDashboard.time.hoursAgo', { count: hours })
    const days = Math.round(hours / 24)
    if (days < 7) return t('kskDashboard.time.daysAgo', { count: days })
    return new Date(iso).toLocaleDateString(i18n.language === 'kk' ? 'kk-KZ' : 'ru-RU')
  }

  const items = [...requests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t('kskDashboard.recent.title')}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('kskDashboard.recent.subtitle')}</p>
        </div>
        <button
          onClick={() => navigate('/requests')}
          className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
        >
          {t('kskDashboard.recent.viewAll')}
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-6 space-y-3 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-slate-400 flex-1 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-5xl mb-2 block">inbox</span>
          <p className="text-sm">{t('kskDashboard.recent.empty')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 flex-1">
          {items.map((r) => (
            <li
              key={r.id}
              onClick={() => navigate('/requests')}
              className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">handyman</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {r.categoryName}
                  {r.assignedWorkerName && (
                    <>
                      <span className="mx-1.5">В·</span>
                      <span className="text-slate-600">{r.assignedWorkerName}</span>
                    </>
                  )}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${SERVICE_REQUEST_STATUS_COLORS[r.status]}`}
              >
                {SERVICE_REQUEST_STATUS_LABELS[r.status]}
              </span>
              <span className="text-xs text-slate-400 shrink-0 w-24 text-right">
                {formatRelative(r.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default RecentRequestsCard
