import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { newsApi } from '@/api/news'
import {
  NewsStatus,
  NEWS_STATUS_COLORS,
  NEWS_CATEGORY_COLORS,
  NEWS_CATEGORY_OPTIONS,
} from '@/types'
import NewsFormModal from './modals/NewsFormModal'
import NewsDetailModal from './modals/NewsDetailModal'

const TABS_KEYS = [
  { key: 'all' as const, tKey: 'announcements.tabAll' },
  { key: 1 as const, tKey: 'announcements.tabDrafts' },
  { key: 2 as const, tKey: 'announcements.tabPublished' },
  { key: 3 as const, tKey: 'announcements.tabArchived' },
]

const AnnouncementsPage = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'all' | NewsStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null)

  useEffect(() => {
    const handler = () => setIsCreateOpen(true)
    window.addEventListener('openAddModal', handler)
    return () => window.removeEventListener('openAddModal', handler)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['news-manage', tab],
    queryFn: () =>
      newsApi.getManage({
        status: tab !== 'all' ? (tab as NewsStatus) : undefined,
      }),
  })

  const allNews = data?.data ?? []
  const news = categoryFilter
    ? allNews.filter((n) => n.category === Number(categoryFilter))
    : allNews

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Табы */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit flex-wrap">
        {TABS_KEYS.map(({ key, tKey }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t(tKey)}
          </button>
        ))}
      </div>

      {/* Фильтр по категории */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm w-52"
        >
          <option value="">{t('announcements.allCategories')}</option>
          {NEWS_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => setCategoryFilter('')}
          className="px-4 py-2 text-slate-600 font-medium text-sm hover:text-primary transition-colors"
        >
          {t('announcements.reset')}
        </button>
        <span className="ml-auto text-sm text-slate-400">
          {t('announcements.total')}: <span className="font-semibold text-slate-700">{news.length}</span>
        </span>
      </div>

      {/* Список */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : news.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm text-center py-20 text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3 block">campaign</span>
          <p className="font-medium">{t('announcements.empty')}</p>
          <p className="text-sm mt-1">{t('announcements.emptyHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {news.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedNewsId(item.id)}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Бейджи */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {item.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                        <span className="material-symbols-outlined text-[12px]">push_pin</span>
                        {t('announcements.pinned')}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${NEWS_STATUS_COLORS[item.status]}`}>
  {t(`announcements.statuses.${['','draft','published','archived'][item.status]}`)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${NEWS_CATEGORY_COLORS[item.category]}`}>
  {t(`announcements.categories.${['','general','maintenance','announcement','emergency'][item.category]}`)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">event</span>
                      {formatDate(item.publishDate)}
                    </span>
                    {item.attachmentsCount > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">attach_file</span>
                        {item.attachmentsCount}
                      </span>
                    )}
                  </div>
                </div>

                <span className="material-symbols-outlined text-slate-300 text-[20px] group-hover:text-primary transition-colors shrink-0 mt-1">
                  chevron_right
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модалки */}
      {isCreateOpen && (
        <NewsFormModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      )}

      <NewsDetailModal
        isOpen={!!selectedNewsId}
        onClose={() => setSelectedNewsId(null)}
        newsId={selectedNewsId}
      />
    </div>
  )
}

export default AnnouncementsPage
