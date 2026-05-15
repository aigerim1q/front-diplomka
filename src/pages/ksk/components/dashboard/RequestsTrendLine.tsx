import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { ServiceRequestListItem } from '@/types'

interface Props {
  requests: ServiceRequestListItem[]
  isLoading?: boolean
}

const DAYS = 14

const toDayKey = (iso: string): string => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatDayLabel = (key: string): string => {
  const [, m, d] = key.split('-')
  return `${d}.${m}`
}

const RequestsTrendLine = ({ requests, isLoading }: Props) => {
  const { t } = useTranslation()

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const days: { key: string; label: string }[] = []
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = toDayKey(d.toISOString())
    days.push({ key, label: formatDayLabel(key) })
  }

  const data = days.map(({ key, label }) => ({
    day: label,
    created: requests.filter((r) => toDayKey(r.createdAt) === key).length,
    completed: requests.filter(
      (r) => r.status === 3 && toDayKey(r.updatedAt) === key
    ).length,
  }))

  const total = data.reduce((acc, d) => acc + d.created, 0)
  const createdLabel = t('kskDashboard.trend.created')
  const completedLabel = t('kskDashboard.trend.completed')

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t('kskDashboard.trend.title')}</h3>
          <p className="text-xs text-slate-500 mt-1">{t('kskDashboard.trend.subtitle')}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">{total}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider">{t('kskDashboard.trend.period')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[260px] animate-pulse bg-slate-100 rounded-lg" />
      ) : (
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#065F46" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#065F46" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgb(15 23 42)',
                  border: '1px solid rgb(51 65 85)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'rgb(241 245 249)',
                }}
                formatter={(value, name) =>
                  [value as number, name === 'created' ? createdLabel : completedLabel]
                }
                labelFormatter={(l) => `${t('kskDashboard.trend.date')}: ${l}`}
              />
              <Legend
                verticalAlign="top"
                height={28}
                iconType="circle"
                iconSize={8}
                formatter={(v) => (
                  <span className="text-xs text-slate-600">
                    {v === 'created' ? createdLabel : completedLabel}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="created"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#createdGrad)"
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#065F46"
                strokeWidth={2}
                fill="url(#completedGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default RequestsTrendLine
