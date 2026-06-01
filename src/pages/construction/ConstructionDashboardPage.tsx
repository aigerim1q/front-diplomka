import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Building2, CheckCircle, Link2, BarChart3, Vote } from 'lucide-react'
import { complexesApi } from '@/api/complexes'
import { votingsApi } from '@/api/votings'
import { newsApi } from '@/api/news'
import { Complex } from '@/types'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

// ── KPI card ─────────────────────────────────────────────────────────────────
interface KpiProps {
  icon: React.ReactNode
  label: string
  value: number | string
  hint?: string
  urgent?: boolean
  to?: string
  loading?: boolean
}
const KpiCard = ({ icon, label, value, hint, urgent, to, loading }: KpiProps) => {
  const navigate = useNavigate()
  return (
    <div
      onClick={to ? () => navigate(to) : undefined}
      className={`relative bg-white rounded-xl border overflow-hidden transition-all ${
        to ? 'cursor-pointer hover:shadow-sm' : ''
      } ${urgent && Number(value) > 0 ? 'border-zinc-900' : 'border-zinc-200 hover:border-zinc-300'}`}
    >
      {urgent && Number(value) > 0 && <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-900" />}
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="size-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500">
            {icon}
          </div>
          {to && <ArrowUpRight size={13} className="text-zinc-300 hover:text-zinc-500 shrink-0 mt-0.5" />}
        </div>
        {loading ? (
          <div className="h-8 w-12 skeleton rounded mb-1.5" />
        ) : (
          <p className="text-[28px] font-bold text-zinc-900 tabular-nums leading-none">{value}</p>
        )}
        <p className="text-xs text-zinc-500 mt-1.5 leading-snug">{label}</p>
        {hint && <p className="text-[11px] text-zinc-400 mt-1">{hint}</p>}
      </div>
    </div>
  )
}

// ── Custom donut label ────────────────────────────────────────────────────────
const DONUT_COLORS = ['#18181b', '#d4d4d8']

const ConstructionDashboardPage = () => {
  const { data: complexesData, isLoading: complexesLoading, isError: complexesError } = useQuery({
    queryKey: ['construction-dashboard-complexes'],
    queryFn: () => complexesApi.getAll({ page: 1, pageSize: 100 }),
  })

  const { data: votingsData } = useQuery({
    queryKey: ['construction-dashboard-votings'],
    queryFn: () => votingsApi.getAll(),
  })

  const { data: newsData } = useQuery({
    queryKey: ['construction-dashboard-news'],
    queryFn: () => newsApi.getManage(),
  })

  const complexes: Complex[] = complexesData?.data.items ?? []
  const votings = votingsData?.data ?? []
  const news = (newsData?.data as any)?.items ?? newsData?.data ?? []

  // ── Derived metrics ──────────────────────────────────────────────────────
  const total      = complexes.length
  const active     = complexes.filter(c => c.isActive).length
  const inactive   = total - active
  const withKsk    = complexes.filter(c => !!c.linkedKskTenantId).length
  const withoutKsk = total - withKsk
  const activePolls = votings.filter((v: any) => v.status === 2).length
  const totalNews   = Array.isArray(news) ? news.length : 0

  // ── Donut data ───────────────────────────────────────────────────────────
  const donutData = [
    { name: 'Активные', value: active },
    { name: 'Неактивные', value: inactive },
  ]

  // ── Region breakdown ─────────────────────────────────────────────────────
  const regionMap: Record<string, number> = {}
  complexes.forEach(c => {
    regionMap[c.region] = (regionMap[c.region] ?? 0) + 1
  })
  const regionData = Object.entries(regionMap)
    .map(([region, count]) => ({ region: region.replace(' область', '').replace(' Область', ''), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  // ── KSK link breakdown ───────────────────────────────────────────────────
  const kskData = [
    { name: 'С КСК', value: withKsk },
    { name: 'Без КСК', value: withoutKsk },
  ]

  // ── Recent complexes ─────────────────────────────────────────────────────
  const recent = [...complexes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">

      {/* KPI row */}
      {complexesError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          Не удалось загрузить данные по комплексам. Проверьте подключение к бэкенду.
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard icon={<Building2 size={16} />} label="Всего комплексов"  value={total}      to="/complexes" loading={complexesLoading} />
        <KpiCard icon={<CheckCircle size={16} />} label="Активных"         value={active}     hint={total ? `${Math.round(active/total*100)}% от всех` : undefined} loading={complexesLoading} />
        <KpiCard icon={<Building2 size={16} />}   label="Неактивных"       value={inactive}   urgent loading={complexesLoading} />
        <KpiCard icon={<Link2 size={16} />}        label="Без КСК"          value={withoutKsk} urgent hint="Требуют привязки" to="/complexes" loading={complexesLoading} />
        <KpiCard icon={<Vote size={16} />}          label="Активных опросов" value={activePolls} to="/construction-polls" />
        <KpiCard icon={<BarChart3 size={16} />}    label="Объявлений"       value={totalNews}  to="/construction-announcements" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Donut — active vs inactive */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <p className="text-sm font-semibold text-zinc-900 mb-4">Статус комплексов</p>
          {total === 0 ? (
            <div className="h-40 flex items-center justify-center text-zinc-300 text-sm">Нет данных</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" strokeWidth={0}>
                    {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {donutData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i] }} />
                    <span className="text-xs text-zinc-500">{d.name} — <b className="text-zinc-900">{d.value}</b></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bar — by region */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 col-span-1 md:col-span-2">
          <p className="text-sm font-semibold text-zinc-900 mb-4">Комплексы по регионам</p>
          {regionData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-zinc-300 text-sm">Нет данных</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={regionData} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7', boxShadow: 'none' }}
                  cursor={{ fill: '#f4f4f5' }}
                  formatter={(v) => [v as number, 'Комплексов']}
                />
                <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Recent complexes */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <p className="text-sm font-semibold text-zinc-900">Последние комплексы</p>
            <a href="/complexes" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1">
              Все <ArrowUpRight size={11} />
            </a>
          </div>
          {recent.length === 0 ? (
            <div className="py-12 text-center text-zinc-300 text-sm">Нет комплексов</div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {recent.map(c => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="size-8 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                    {c.imageUrl
                      ? <img src={c.imageUrl} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center"><Building2 size={14} className="text-zinc-400" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{c.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{c.city}, {c.region}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`size-1.5 rounded-full ${c.isActive ? 'bg-emerald-400' : 'bg-zinc-300'}`} />
                    <span className={`text-[11px] font-medium ${c.isActive ? 'text-emerald-600' : 'text-zinc-400'}`}>
                      {c.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* KSK link status + active polls */}
        <div className="flex flex-col gap-4">

          {/* KSK donut */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 flex-1">
            <p className="text-sm font-semibold text-zinc-900 mb-3">Привязка КСК</p>
            {total === 0 ? (
              <div className="h-24 flex items-center justify-center text-zinc-300 text-sm">Нет данных</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie data={kskData} cx="50%" cy="50%" innerRadius={30} outerRadius={46} dataKey="value" strokeWidth={0}>
                      <Cell fill="#18181b" />
                      <Cell fill="#e4e4e7" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-zinc-900 shrink-0" />
                    <span className="text-xs text-zinc-500">С КСК — <b className="text-zinc-900">{withKsk}</b></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-zinc-200 shrink-0" />
                    <span className="text-xs text-zinc-500">Без КСК — <b className="text-zinc-900">{withoutKsk}</b></span>
                  </div>
                  {withoutKsk > 0 && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-2 py-1 mt-2">
                      {withoutKsk} комплекс{withoutKsk === 1 ? '' : withoutKsk < 5 ? 'а' : 'ов'} без КСК
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active votings list */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden flex-1">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
              <p className="text-sm font-semibold text-zinc-900">Активные опросы</p>
              <a href="/construction-polls" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1">
                Все <ArrowUpRight size={11} />
              </a>
            </div>
            {activePolls === 0 ? (
              <div className="py-8 text-center text-zinc-300 text-sm">Нет активных опросов</div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {votings.filter((v: any) => v.status === 2).slice(0, 3).map((v: any) => (
                  <li key={v.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-zinc-900 truncate">{v.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{v.optionsCount} вариантов</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConstructionDashboardPage
