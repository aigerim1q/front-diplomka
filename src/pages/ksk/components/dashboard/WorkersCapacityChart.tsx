import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from 'recharts'
import { useTranslation } from 'react-i18next'
import { ServiceRequestListItem, Worker, SPECIALIZATION_LABELS, WorkerSpecialization } from '@/types'

const AMBER = '#f59e0b'
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
  workers: Worker[]
  isLoading?: boolean
}

const SPECS: WorkerSpecialization[] = [1, 2, 3, 4, 5, 99]

const WorkersCapacityChart = ({ requests, workers, isLoading }: Props) => {
  const { t } = useTranslation()

  const data = SPECS.map((s) => ({
    name: SPECIALIZATION_LABELS[s],
    inProgress: requests.filter((r) => r.category === s && r.status === 2).length,
    available: workers.filter((w) => w.isActive && w.specialization === s && w.status === 1).length,
  }))

  const hasData = data.some((d) => d.inProgress > 0 || d.available > 0)
  const inProgressLabel = t('kskDashboard.capacity.inProgress')
  const availableLabel = t('kskDashboard.capacity.available')

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-900">{t('kskDashboard.capacity.title')}</h3>
        <p className="text-xs text-zinc-400 mt-0.5">{t('kskDashboard.capacity.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="h-[240px] skeleton rounded-lg" />
      ) : !hasData ? (
        <div className="h-[240px] flex flex-col items-center justify-center text-zinc-400">
          <span className="material-symbols-outlined text-4xl mb-2">engineering</span>
          <p className="text-xs">{t('kskDashboard.capacity.empty')}</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="#f4f4f5" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={44}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: '#fafafa' }}
                formatter={(value, name) => [value, name === 'inProgress' ? inProgressLabel : availableLabel]}
              />
              <Legend
                verticalAlign="top"
                height={28}
                iconType="circle"
                iconSize={7}
                formatter={(v) => (
                  <span style={{ fontSize: 11, color: '#71717a' }}>
                    {v === 'inProgress' ? inProgressLabel : availableLabel}
                  </span>
                )}
              />
              <Bar dataKey="inProgress" fill={AMBER} fillOpacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="available" fill={GREEN} fillOpacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default WorkersCapacityChart
