import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  LabelList,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { Resident } from '@/types'

interface Props {
  residents: Resident[]
  isLoading?: boolean
}

const BuildingsBreakdown = ({ residents, isLoading }: Props) => {
  const { t } = useTranslation()

  const grouped = new Map<string, number>()
  for (const r of residents) {
    const key = r.building?.trim() || 'вЂ”'
    grouped.set(key, (grouped.get(key) ?? 0) + 1)
  }

  const data = Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const hasData = data.length > 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t('kskDashboard.buildings.title')}</h3>
          <p className="text-xs text-slate-500 mt-1">{t('kskDashboard.buildings.subtitle')}</p>
        </div>
        <span className="material-symbols-outlined text-slate-300">apartment</span>
      </div>

      {isLoading ? (
        <div className="h-[260px] animate-pulse bg-slate-100 rounded-lg" />
      ) : !hasData ? (
        <div className="h-[260px] flex flex-col items-center justify-center text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-2">home</span>
          <p className="text-sm">{t('kskDashboard.buildings.empty')}</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ left: -10, right: 24, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
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
                cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                contentStyle={{
                  background: 'rgb(15 23 42)',
                  border: '1px solid rgb(51 65 85)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'rgb(241 245 249)',
                }}
                formatter={(value) => [
                  `${value} ${t('kskDashboard.buildings.countSuffix')}`,
                  t('kskDashboard.buildings.label'),
                ]}
                labelFormatter={(l) => `${t('kskDashboard.buildings.building')}: ${l}`}
              />
              <Bar dataKey="value" fill="#0891b2" radius={[6, 6, 0, 0]} maxBarSize={48}>
                <LabelList
                  dataKey="value"
                  position="top"
                  style={{ fontSize: 11, fontWeight: 600 }}
                  className="fill-slate-900"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default BuildingsBreakdown
