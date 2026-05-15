import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  NewsListItem,
  NEWS_CATEGORY_LABELS,
  NEWS_CATEGORY_COLORS,
} from '@/types'

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
    .slice(0, 3)

  const localeTag = i18n.language === 'kk' ? 'kk-KZ' : 'ru-RU'

  return (
    <div className="bg-gradient-to-br from-amber-50 via-white to-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">push_pin</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('kskDashboard.pinned.title')}</h3>
            <p className="text-xs text-slate-500">{items.length > 0 ? `${items.length}` : ''}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/announcements')}
          className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
        >
          {t('kskDashboard.pinned.viewAll')}
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-14 text-center text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-2 block">campaign</span>
          <p className="text-sm">{t('kskDashboard.pinned.empty')}</p>
        </div>
      ) : (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate('/announcements')}
              className="group text-left bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all p-4 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                {n.isPinned && (
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">push_pin</span>
                )}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${NEWS_CATEGORY_COLORS[n.category]}`}
                >
                  {NEWS_CATEGORY_LABELS[n.category]}
                </span>
                {n.category === 4 && (
                  <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900 line-clamp-3 flex-1 group-hover:text-primary transition-colors">
                {n.title}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span>{new Date(n.publishDate).toLocaleDateString(localeTag)}</span>
                {n.attachmentsCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">attach_file</span>
                    {n.attachmentsCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PinnedNewsCard
