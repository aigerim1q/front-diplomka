import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Pin } from 'lucide-react'
import { NewsListItem, NEWS_CATEGORY_LABELS, NEWS_CATEGORY_COLORS } from '@/types'

interface Props {
  news: NewsListItem[]
  isLoading?: boolean
}

const PinnedNewsCard = ({ news, isLoading }: Props) => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const items = news
    .filter((n) => n.status === 2 && (n.isPinned || n.category === 4))
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    })
    .slice(0, 4)

  const localeTag = i18n.language === 'kk' ? 'kk-KZ' : 'ru-RU'

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">{t('kskDashboard.pinned.title')}</h3>
          {items.length > 0 && (
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-zinc-100 text-zinc-500 text-[11px] font-semibold">
              {items.length}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/announcements')}
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          {t('kskDashboard.pinned.viewAll')}
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="divide-y divide-zinc-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-3">
              <div className="h-3 w-16 skeleton rounded" />
              <div className="h-3 flex-1 skeleton rounded" />
              <div className="h-3 w-20 skeleton rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center text-zinc-400">
          <span className="material-symbols-outlined text-3xl mb-1.5 block">campaign</span>
          <p className="text-xs">{t('kskDashboard.pinned.empty')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {items.map((n) => {
            const isUrgent = n.category === 4
            return (
              <li key={n.id}>
                <button
                  onClick={() => navigate('/announcements')}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50 transition-colors text-left group"
                >
                  {/* Urgent accent */}
                  <div className={`shrink-0 w-1 h-8 rounded-full ${isUrgent ? 'bg-red-400' : 'bg-zinc-200'}`} />

                  {/* Category */}
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${NEWS_CATEGORY_COLORS[n.category]}`}>
                    {NEWS_CATEGORY_LABELS[n.category]}
                  </span>

                  {/* Title */}
                  <p className="flex-1 text-sm font-medium text-zinc-800 truncate group-hover:text-zinc-900 transition-colors">
                    {n.isPinned && (
                      <Pin size={10} className="inline mr-1.5 text-zinc-400 -mt-0.5" />
                    )}
                    {n.title}
                  </p>

                  {/* Date */}
                  <span className="shrink-0 text-xs text-zinc-400">
                    {new Date(n.publishDate).toLocaleDateString(localeTag, { day: 'numeric', month: 'short' })}
                  </span>

                  <ArrowRight size={13} className="shrink-0 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default PinnedNewsCard
