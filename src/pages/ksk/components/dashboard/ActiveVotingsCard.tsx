import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { VotingListItem } from '@/types'

interface Props {
  votings: VotingListItem[]
  isLoading?: boolean
}

const computeProgress = (v: VotingListItem): { pct: number; daysLeft: number } => {
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600">how_to_vote</span>
          <h3 className="text-lg font-bold text-slate-900">{t('kskDashboard.activeVotings.title')}</h3>
        </div>
        <button
          onClick={() => navigate('/polls')}
          className="text-primary text-sm font-semibold hover:underline"
        >
          {t('kskDashboard.activeVotings.viewAll')}
        </button>
      </div>

      {isLoading ? (
        <div className="p-6 space-y-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-slate-400 flex-1 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-5xl mb-2 block">how_to_vote</span>
          <p className="text-sm">{t('kskDashboard.activeVotings.empty')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 flex-1">
          {items.map((v) => {
            const { pct, daysLeft } = computeProgress(v)
            return (
              <li
                key={v.id}
                onClick={() => navigate('/polls')}
                className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-900 truncate flex-1 pr-2">
                    {v.title}
                  </p>
                  <span className="text-xs font-bold text-emerald-700 shrink-0">
                    {daysLeft === 0
                      ? t('kskDashboard.activeVotings.today')
                      : t('kskDashboard.activeVotings.daysShort', { count: daysLeft })}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {t('kskDashboard.activeVotings.meta', {
                    count: v.optionsCount,
                    date: new Date(v.endDate).toLocaleDateString(localeTag),
                  })}
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
