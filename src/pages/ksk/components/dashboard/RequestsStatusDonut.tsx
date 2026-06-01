import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useTranslation } from 'react-i18next'
import { ServiceRequestListItem, SERVICE_REQUEST_STATUS_LABELS, ServiceRequestStatus } from '@/types'

// Semantic Grafana-style palette
const STATUS_COLORS: Record<ServiceRequestStatus, string> = {
  1: '#3b82f6', // blue  — Новая
  2: '#f59e0b', // amber — В работе
  3: '#10b981', // emerald — Завершена
  4: '#94a3b8', // slate — Отменена
}

const TOOLTIP_STYLE = {
  background: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#fafafa',
  padding: '8px 12px',
}

interface Props {
  requests: ServiceRequestListItem[]
  isLoading?: boolean
}

const RequestsStatusDonut = ({ requests, isLoading }: Props) => {
  const { t } = useTranslation()

  const data = ([1, 2, 3, 4] as ServiceRequestStatus[]).map((s) => ({
    name: SERVICE_REQUEST_STATUS_LABELS[s],
    value: requests.filter((r) => r.status === s).length,
    status: s,
  }))

  const total = requests.length

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-900">{t('kskDashboard.statusDonut.title')}</h3>
        <p className="text-xs text-zinc-400 mt-0.5">{t('kskDashboard.statusDonut.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="h-[260px] skeleton rounded-lg" />
      ) : total === 0 ? (
        <div className="h-[260px] flex flex-col items-center justify-center text-zinc-400">
          <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
          <p className="text-xs">{t('kskDashboard.statusDonut.empty')}</p>
        </div>
      ) : (
        <>
          <div className="relative" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={68}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((d) => (
                    <Cell key={d.status} fill={STATUS_COLORS[d.status]} opacity={d.value === 0 ? 0.15 : 1} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: '#fafafa' }}
                  formatter={(value, name) => {
                    const v = Number(value)
                    return [`${v}  (${total > 0 ? Math.round((v / total) * 100) : 0}%)`, name]
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-bold text-zinc-900 tabular-nums">{total}</p>
              <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mt-0.5">
                {t('kskDashboard.statusDonut.total')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 pt-4 border-t border-zinc-100">
            {data.map((d) => (
              <div key={d.status} className="flex items-center gap-2">
                <span className="size-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[d.status] }} />
                <span className="text-xs text-zinc-500 truncate flex-1">{d.name}</span>
                <span className="text-xs font-semibold text-zinc-900 tabular-nums">{d.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default RequestsStatusDonut
