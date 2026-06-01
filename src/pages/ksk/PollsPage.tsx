import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Plus, Clock, ChevronRight } from 'lucide-react'
import { votingsApi } from '@/api/votings'
import { VotingStatus, VOTING_STATUS_LABELS } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import CreateVotingModal from './components/modals/CreateVotingModal'
import VotingDetailModal from './components/modals/VotingDetailModal'

const STATUS_DOT: Record<number, string> = {
  1: 'bg-zinc-300',
  2: 'bg-blue-400',
  3: 'bg-zinc-200',
}
const STATUS_BADGE: Record<number, string> = {
  1: 'bg-zinc-100 text-zinc-500',
  2: 'bg-blue-50 text-blue-600',
  3: 'bg-zinc-100 text-zinc-400',
}

const getDaysLeft = (end: string) =>
  Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000))

const getPct = (start: string, end: string) => {
  const s = new Date(start).getTime(), e = new Date(end).getTime(), n = Date.now()
  return Math.min(100, Math.max(0, Math.round(((n - s) / (e - s)) * 100)))
}

const PollsPage = () => {
  const { t } = useTranslation()
  const TABS = [
    { key: 'all' as const,        label: t('pages.polls.tabAll') },
    { key: 1 as VotingStatus,     label: t('pages.polls.tabDrafts') },
    { key: 2 as VotingStatus,     label: t('pages.polls.tabActive') },
    { key: 3 as VotingStatus,     label: t('pages.polls.tabCompleted') },
  ]
  const [tab, setTab]                   = useState<'all' | VotingStatus>('all')
  const { isKskSeniorAdmin } = useAuth()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedId, setSelectedId]     = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['votings', tab],
    queryFn: () => votingsApi.getAll({ status: tab !== 'all' ? (tab as VotingStatus) : undefined }),
  })

  const all = data?.data ?? []
  const tabCounts = {
    all: all.length,
    1: all.filter(v => v.status === 1).length,
    2: all.filter(v => v.status === 2).length,
    3: all.filter(v => v.status === 3).length,
  }

  const fmtRange = (s: string, e: string) => {
    const fmt = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    return `${fmt(s)} — ${fmt(e)}`
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-0.5 bg-zinc-100 rounded-xl p-1">
          {TABS.map(({ key, label }) => {
            const count = tabCounts[key as keyof typeof tabCounts] ?? 0
            return (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tab === key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}>
                {label}
                <span className={`tabular-nums text-xs ${tab === key ? 'text-zinc-500' : 'text-zinc-400'}`}>{count}</span>
              </button>
            )
          })}
        </div>
        <button onClick={() => setIsCreateOpen(true)}
          className="ml-auto flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={14} />Создать опрос
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-32 skeleton rounded-xl" />)}
        </div>
      ) : all.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 py-20 text-center text-zinc-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">poll</span>
          <p className="text-sm">Опросы не найдены</p>
          <p className="text-xs mt-1">{t("pages.polls.createBtn")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
          {all.map(v => {
            const isActive = v.status === 2
            const daysLeft = isActive ? getDaysLeft(v.endDate) : 0
            const pct      = isActive ? getPct(v.startDate, v.endDate) : 100

            return (
              <div key={v.id} onClick={() => setSelectedId(v.id)}
                className="group px-6 py-5 hover:bg-zinc-50 transition-colors cursor-pointer flex gap-5 items-start">

                {/* Left status dot */}
                <div className="flex flex-col items-center gap-1.5 pt-1 shrink-0">
                  <div className={`size-2.5 rounded-full ${STATUS_DOT[v.status]}`} />
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  {/* Top meta */}
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[v.status]}`}>
                      {VOTING_STATUS_LABELS[v.status]}
                    </span>
                    <span className="text-xs text-zinc-400">{fmtRange(v.startDate, v.endDate)}</span>
                    <span className="text-xs text-zinc-400">·</span>
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <span className="material-symbols-outlined text-[12px]">check_box</span>
                      {v.optionsCount} вар.
                    </span>
                    {isActive && daysLeft <= 3 && (
                      <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <Clock size={11} />
                        {daysLeft === 0 ? 'Сегодня' : `${daysLeft} дн.`}
                      </span>
                    )}
                  </div>

                  {/* Question */}
                  <h3 className="text-sm font-semibold text-zinc-900 mb-1">{v.title}</h3>
                  {v.description && (
                    <p className="text-xs text-zinc-500 line-clamp-1 mb-3">{v.description}</p>
                  )}

                  {/* Progress (active only) */}
                  {isActive && (
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        {daysLeft === 0 ? 'последний день' : `${daysLeft} дн. осталось`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight size={15} className="text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0 mt-1" />
              </div>
            )
          })}
        </div>
      )}

      <CreateVotingModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} isSeniorAdmin={isKskSeniorAdmin} />
      <VotingDetailModal isOpen={!!selectedId} onClose={() => setSelectedId(null)} votingId={selectedId} />
    </div>
  )
}

export default PollsPage
