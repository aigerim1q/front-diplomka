import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  CartesianGrid, Cell, LabelList,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { Resident } from '@/types'

// Amber — matches workers capacity "in progress" bar
const AMBER = '#f59e0b'

interface TooltipPayloadItem {
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#18181b',
      border: '1px solid #3f3f46',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      color: '#fafafa',
      minWidth: 150,
    }}>
      <p style={{ color: '#a1a1aa', marginBottom: 4 }}>
        Корпус: <span style={{ color: '#fafafa', fontWeight: 600 }}>{label || '—'}</span>
      </p>
      <p style={{ color: '#fafafa', fontWeight: 600 }}>{payload[0].value} жильцов</p>
    </div>
  )
}

interface Props {
  residents: Resident[]
  isLoading?: boolean
}

const BuildingsBreakdown = ({ residents, isLoading }: Props) => {
  const { t } = useTranslation()

  const grouped = new Map<string, number>()
  for (const r of residents) {
    const key = r.building?.trim() || '—'
    grouped.set(key, (grouped.get(key) ?? 0) + 1)
  }

  const data = Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-900">{t('kskDashboard.buildings.title')}</h3>
        <p className="text-xs text-zinc-400 mt-0.5">{t('kskDashboard.buildings.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="h-[240px] skeleton rounded-lg" />
      ) : data.length === 0 ? (
        <div className="h-[240px] flex flex-col items-center justify-center text-zinc-400">
          <span className="material-symbols-outlined text-4xl mb-2">home</span>
          <p className="text-xs">{t('kskDashboard.buildings.empty')}</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ left: -10, right: 16, top: 20, bottom: 0 }}>
              <CartesianGrid stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,158,11,0.05)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: 600, fill: '#71717a' }} />
                {data.map((d, i) => (
                  <Cell key={i} fill={AMBER} fillOpacity={0.3 + 0.7 * (d.value / max)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default BuildingsBreakdown
