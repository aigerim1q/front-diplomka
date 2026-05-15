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
import {
  ServiceRequestListItem,
  SERVICE_REQUEST_CATEGORY_LABELS,
  ServiceRequestCategory,
} from '@/types'

interface Props {
  requests: ServiceRequestListItem[]
  isLoading?: boolean
}

const ALL_CATEGORIES: ServiceRequestCategory[] = [1, 2, 3, 4, 5, 99]

const RequestsCategoriesBar = ({ requests, isLoading }: Props) => {
  const { t } = useTranslation()

  const data = ALL_CATEGORIES.map((c) => ({
    name: SERVICE_REQUEST_CATEGORY_LABELS[c],
    value: requests.filter((r) => r.category === c).length,
  }))
    .sort((a, b) => b.value - a.value)

  const hasData = data.some((d) => d.value > 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t('kskDashboard.categories.title')}</h3>
          <p className="text-xs text-slate-500 mt-1">{t('kskDashboard.categories.subtitle')}</p>
        </div>
        <span className="material-symbols-outlined text-slate-300">stacked_bar_chart</span>
      </div>

      {isLoading ? (
        <div className="h-[280px] animate-pulse bg-slate-100 rounded-lg" />
      ) : !hasData ? (
        <div className="h-[280px] flex flex-col items-center justify-center text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-2">category</span>
          <p className="text-sm">{t('kskDashboard.categories.empty')}</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ left: 12, right: 24, top: 8, bottom: 8 }}>
              <CartesianGrid horizontal={false} stroke="currentColor" className="text-slate-100" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fontSize: 12, fill: 'currentColor' }}
                className="text-slate-600"
                axisLine={false}
                tickLine={false}
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
                  `${value} ${t('kskDashboard.categories.countSuffix')}`,
                  t('kskDashboard.categories.label'),
                ]}
              />
              <Bar dataKey="value" fill="#065F46" radius={[0, 6, 6, 0]}>
                <LabelList dataKey="value" position="right" style={{ fill: 'currentColor', fontSize: 12, fontWeight: 600 }} className="fill-slate-900" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default RequestsCategoriesBar
