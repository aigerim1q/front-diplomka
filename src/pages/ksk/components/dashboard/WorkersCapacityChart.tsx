import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import {
  ServiceRequestListItem,
  Worker,
  SPECIALIZATION_LABELS,
  WorkerSpecialization,
} from '@/types'

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
    available: workers.filter(
      (w) => w.isActive && w.specialization === s && w.status === 1
    ).length,
  }))

  const hasData = data.some((d) => d.inProgress > 0 || d.available > 0)

  const inProgressLabel = t('kskDashboard.capacity.inProgress')
  const availableLabel = t('kskDashboard.capacity.available')

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t('kskDashboard.capacity.title')}</h3>
          <p className="text-xs text-slate-500 mt-1">{t('kskDashboard.capacity.subtitle')}</p>
        </div>
        <span className="material-symbols-outlined text-slate-300">balance</span>
      </div>

      {isLoading ? (
        <div className="h-[280px] animate-pulse bg-slate-100 rounded-lg" />
      ) : !hasData ? (
        <div className="h-[280px] flex flex-col items-center justify-center text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-2">engineering</span>
          <p className="text-sm">{t('kskDashboard.capacity.empty')}</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                contentStyle={{
                  background: 'rgb(15 23 42)',
                  border: '1px solid rgb(51 65 85)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'rgb(241 245 249)',
                }}
                formatter={(value, name) => [
                  value as number,
                  name === 'inProgress' ? inProgressLabel : availableLabel,
                ]}
              />
              <Legend
                verticalAlign="top"
                height={28}
                iconType="circle"
                iconSize={8}
                formatter={(v) => (
                  <span className="text-xs text-slate-600">
                    {v === 'inProgress' ? inProgressLabel : availableLabel}
                  </span>
                )}
              />
              <Bar dataKey="inProgress" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar dataKey="available" fill="#065F46" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default WorkersCapacityChart
