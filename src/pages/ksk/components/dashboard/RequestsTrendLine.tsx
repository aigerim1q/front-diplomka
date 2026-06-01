import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer,
  Tooltip, CartesianGrid, Legend,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { ServiceRequestListItem } from '@/types'

const BLUE = '#3b82f6'
const GREEN = '#10b981'

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

const DAYS = 14

const toDayKey = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatLabel = (key: string) => {
  const [, m, d] = key.split('-')
  return `${d}.${m}`
}

const RequestsTrendLine = ({ requests, isLoading }: Props) => {
  const { t } = useTranslation()

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (DAYS - 1 - i))
    const key = toDayKey(d.toISOString())
    return { key, label: formatLabel(key) }
  })

  const data = days.map(({ key, label }) => ({
    day: label,
    created: requests.filter((r) => toDayKey(r.createdAt) === key).length,
    completed: requests.filter((r) => r.status === 3 && toDayKey(r.updatedAt) === key).length,
  }))

  const total = data.reduce((acc, d) => acc + d.created, 0)
  const createdLabel = t('kskDashboard.trend.created')
  const completedLabel = t('kskDashboard.trend.completed')

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">{t('kskDashboard.trend.title')}</h3>
          <p className="text-xs text-zinc-400 mt-0.5">{t('kskDashboard.trend.subtitle')}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-zinc-900 tabular-nums">{total}</p>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{t('kskDashboard.trend.period')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[220px] skeleton rounded-lg" />
      ) : (
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GREEN} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f4f4f5" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: '#fafafa' }}
                formatter={(value, name) => [value, name === 'created' ? createdLabel : completedLabel]}
                labelFormatter={(l) => `${t('kskDashboard.trend.date')}: ${l}`}
              />
              <Legend
                verticalAlign="top"
                height={28}
                iconType="circle"
                iconSize={7}
                formatter={(v) => (
                  <span style={{ fontSize: 11, color: '#71717a' }}>
                    {v === 'created' ? createdLabel : completedLabel}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="created"
                stroke={BLUE}
                strokeWidth={2}
                fill="url(#gradCreated)"
                dot={false}
                activeDot={{ r: 5, fill: BLUE, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke={GREEN}
                strokeWidth={2}
                fill="url(#gradCompleted)"
                dot={false}
                activeDot={{ r: 5, fill: GREEN, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default RequestsTrendLine
