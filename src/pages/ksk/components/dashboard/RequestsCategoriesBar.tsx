import { useTranslation } from 'react-i18next'
import { ServiceRequestListItem, SERVICE_REQUEST_CATEGORY_LABELS, ServiceRequestCategory } from '@/types'

// Blue palette — matches trend "created" line

const SHADES = ['#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd','#bfdbfe']

interface Props {
  requests: ServiceRequestListItem[]
  isLoading?: boolean
}

const ALL_CATEGORIES: ServiceRequestCategory[] = [1, 2, 3, 4, 5, 99]

const RequestsCategoriesBar = ({ requests, isLoading }: Props) => {
  const { t } = useTranslation()

  const data = ALL_CATEGORIES
    .map((c) => ({
      label: SERVICE_REQUEST_CATEGORY_LABELS[c],
      value: requests.filter((r) => r.category === c).length,
    }))
    .sort((a, b) => b.value - a.value)

  const max = Math.max(...data.map((d) => d.value), 1)
  const hasData = data.some((d) => d.value > 0)

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-900">{t('kskDashboard.categories.title')}</h3>
        <p className="text-xs text-zinc-400 mt-0.5">{t('kskDashboard.categories.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-7 skeleton rounded-md" />)}
        </div>
      ) : !hasData ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-zinc-400">
          <span className="material-symbols-outlined text-4xl mb-2">category</span>
          <p className="text-xs">{t('kskDashboard.categories.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.map((d, i) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 w-[110px] shrink-0 truncate">{d.label}</span>
              <div className="flex-1 h-5 bg-zinc-100 rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all duration-500"
                  style={{
                    width: d.value === 0 ? '0%' : `${Math.max((d.value / max) * 100, 8)}%`,
                    background: SHADES[i % SHADES.length],
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-zinc-900 tabular-nums w-5 text-right">
                {d.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RequestsCategoriesBar
