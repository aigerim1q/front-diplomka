import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { VotingListItem } from '@/types'

interface Props {
  votings: VotingListItem[]
  isLoading?: boolean
}

const computeProgress = (v: VotingListItem) => {
  const start = new Date(v.startDate).getTime()
  const end = new Date(v.endDate).getTime()
  const now = Date.now()
  const total = Math.max(end - start, 1)
  const elapsed = Math.min(Math.max(now - start, 0), total)
  const pct = Math.round((elapsed / total) * 100)
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000))
  return { pct, daysLeft }
}

const ActiveVotingsCard = ({ votings, isLoading }: Props) => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const items = votings
    .filter((v) => v.status === 2)
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 4)

  const localeTag = i18n.language === 'kk' ? 'kk-KZ' : 'ru-RU'

  return (
    <div className="bg-white rounded-xl border border-zinc-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">{t('kskDashboard.activeVotings.title')}</h3>
        <button
          onClick={() => navigate('/polls')}
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          {t('kskDashboard.activeVotings.viewAll')}
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="p-4 space-y-4 flex-1">
          {[1,2].map(i => <div key={i} className="h-16 skeleton rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-zinc-400 flex-1 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-4xl mb-2">how_to_vote</span>
          <p className="text-xs">{t('kskDashboard.activeVotings.empty')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 flex-1">
          {items.map((v) => {
            const { pct, daysLeft } = computeProgress(v)
            const isUrgent = daysLeft <= 2

            return (
              <li
                key={v.id}
                onClick={() => navigate('/polls')}
                className="px-5 py-4 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                {/* Title + days */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <p className="text-sm font-medium text-zinc-900 leading-snug line-clamp-2 flex-1">{v.title}</p>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isUrgent
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                  }`}>
                    {daysLeft === 0
                      ? t('kskDashboard.activeVotings.today')
                      : `${daysLeft} дн`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: isUrgent ? '#ef4444' : '#3b82f6',
                    }}
                  />
                </div>

                {/* Meta */}
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  {v.optionsCount} {t('kskDashboard.activeVotings.meta', {
                    count: v.optionsCount,
                    date: new Date(v.endDate).toLocaleDateString(localeTag, { day: 'numeric', month: 'short' }),
                  }).split(' ').slice(1).join(' ')}
                  &nbsp;· до {new Date(v.endDate).toLocaleDateString(localeTag, { day: 'numeric', month: 'short' })}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default ActiveVotingsCard
