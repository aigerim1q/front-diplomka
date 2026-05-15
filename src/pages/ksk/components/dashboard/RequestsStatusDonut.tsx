import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useTranslation } from 'react-i18next'
import {
  ServiceRequestListItem,
  SERVICE_REQUEST_STATUS_LABELS,
  ServiceRequestStatus,
} from '@/types'

const STATUS_COLORS: Record<ServiceRequestStatus, string> = {
  1: '#3b82f6',
  2: '#f59e0b',
  3: '#065F46',
  4: '#94a3b8',
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t('kskDashboard.statusDonut.title')}</h3>
          <p className="text-xs text-slate-500 mt-1">{t('kskDashboard.statusDonut.subtitle')}</p>
        </div>
        <span className="material-symbols-outlined text-slate-300">donut_large</span>
      </div>

      {isLoading ? (
        <div className="h-[280px] animate-pulse bg-slate-100 rounded-lg" />
      ) : total === 0 ? (
        <div className="h-[280px] flex flex-col items-center justify-center text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-2">inbox</span>
          <p className="text-sm">{t('kskDashboard.statusDonut.empty')}</p>
        </div>
      ) : (
        <div className="relative">
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((d) => (
                    <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => {
                    const v = Number(value)
                    return [`${v} (${Math.round((v / total) * 100)}%)`, name]
                  }}
                  contentStyle={{
                    background: 'rgb(15 23 42)',
                    border: '1px solid rgb(51 65 85)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'rgb(241 245 249)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-3xl font-bold text-slate-900">{total}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              {t('kskDashboard.statusDonut.total')}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((d) => (
          <div key={d.status} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full shrink-0"
              style={{ background: STATUS_COLORS[d.status] }}
            />
            <span className="text-xs text-slate-600 truncate">{d.name}</span>
            <span className="text-xs font-semibold text-slate-900 ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RequestsStatusDonut
