import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Plus, Pin, Paperclip, Calendar } from 'lucide-react'
import { newsApi } from '@/api/news'
import {
  NewsStatus,
  NEWS_STATUS_LABELS,
  NEWS_CATEGORY_LABELS,
  NEWS_CATEGORY_OPTIONS,
} from '@/types'
import NewsFormModal from './modals/NewsFormModal'
import { useAuthStore } from '@/store/authStore'
import NewsDetailModal from './modals/NewsDetailModal'

const CAT_ACCENT: Record<number, string> = {
  1: 'border-t-blue-400',
  2: 'border-t-amber-400',
  3: 'border-t-violet-400',
  4: 'border-t-red-400',
}
const CAT_BG: Record<number, string> = {
  1: 'bg-blue-50 text-blue-600',
  2: 'bg-amber-50 text-amber-600',
  3: 'bg-violet-50 text-violet-600',
  4: 'bg-red-50 text-red-600',
}
const STATUS_STYLE: Record<number, string> = {
  1: 'bg-zinc-100 text-zinc-400',
  2: 'bg-emerald-50 text-emerald-600',
  3: 'bg-zinc-100 text-zinc-300',
}

const AnnouncementsPage = () => {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isConstructionAdmin = user?.role === 2
  const isSeniorAdmin = user?.role === 7
  const TABS = [
    { key: 'all' as const,  label: t('pages.announcements.tabAll') },
    { key: 1 as NewsStatus, label: t('pages.announcements.tabDrafts') },
    { key: 2 as NewsStatus, label: t('pages.announcements.tabPublished') },
    { key: 3 as NewsStatus, label: t('pages.announcements.tabArchive') },
  ]
  const [tab, setTab]   = useState<'all' | NewsStatus>('all')
  const [cat, setCat]   = useState('')
  const [isCreateOpen, setIsCreateOpen]     = useState(false)
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['news-manage', tab],
    queryFn: () => newsApi.getManage({ status: tab !== 'all' ? (tab as NewsStatus) : undefined }),
  })

  const allNews = data?.data ?? []
  const news    = cat ? allNews.filter(n => n.category === Number(cat)) : allNews

  const tabCounts = {
    all: allNews.length,
    1: allNews.filter(n => n.status === 1).length,
    2: allNews.filter(n => n.status === 2).length,
    3: allNews.filter(n => n.status === 3).length,
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

  // Pinned first, then by date
  const sorted = [...news].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  })

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-0.5 bg-zinc-100 rounded-xl p-1 shrink-0">
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

        <select value={cat} onChange={e => setCat(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 w-44">
          <option value="">{t("pages.announcements.allCategories")}</option>
          {NEWS_CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {cat && <button onClick={() => setCat('')} className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">Сбросить</button>}

        <button onClick={() => setIsCreateOpen(true)}
          className="ml-auto flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0">
          <Plus size={14} />Создать объявление
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 skeleton rounded-xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 py-20 text-center text-zinc-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">campaign</span>
          <p className="text-sm">Объявления не найдены</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sorted.map(item => {
            const isArchived = item.status === 3
            const isDraft    = item.status === 1
            return (
              <div key={item.id} onClick={() => setSelectedNewsId(item.id)}
                className={`group relative bg-white rounded-xl border-t-2 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer flex flex-col ${
                  CAT_ACCENT[item.category] ?? 'border-t-zinc-300'
                } ${isArchived ? 'opacity-55' : ''}`}>

                <div className="flex-1 p-5">
                  {/* Top: category + status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${CAT_BG[item.category] ?? 'bg-zinc-100 text-zinc-500'}`}>
                      {NEWS_CATEGORY_LABELS[item.category]}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLE[item.status]}`}>
                      {NEWS_STATUS_LABELS[item.status]}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="flex items-start gap-1.5 mb-3">
                    {item.isPinned && <Pin size={12} className="text-amber-400 shrink-0 mt-0.5" />}
                    <h3 className={`text-sm font-semibold leading-snug line-clamp-2 ${isDraft ? 'text-zinc-500' : 'text-zinc-900'}`}>
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 pb-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Calendar size={11} />
                    {formatDate(item.publishDate)}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.attachmentsCount > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-zinc-400">
                        <Paperclip size={11} />{item.attachmentsCount}
                      </span>
                    )}
                    <span className="material-symbols-outlined text-zinc-200 group-hover:text-zinc-400 transition-colors text-[16px]">
                      open_in_new
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isCreateOpen && <NewsFormModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} isConstructionAdmin={isConstructionAdmin} isSeniorAdmin={isSeniorAdmin} />}
      <NewsDetailModal isOpen={!!selectedNewsId} onClose={() => setSelectedNewsId(null)} newsId={selectedNewsId} />
    </div>
  )
}

export default AnnouncementsPage
