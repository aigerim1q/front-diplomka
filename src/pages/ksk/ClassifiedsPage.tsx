import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, ChevronRight } from 'lucide-react'
import { kskClassifiedsApi } from '@/api/kskClassifieds'
import {
  CLASSIFIED_CATEGORY_LABELS,
  CLASSIFIED_CATEGORY_OPTIONS,
  ClassifiedCategory,
  ClassifiedStatus,
} from '@/types'
import ClassifiedDetailModal from './components/modals/ClassifiedDetailModal'
import UsersPagination from '@/pages/super-admin/components/UsersPagination'

const PAGE_SIZE = 20

type StatusTab = 'pending' | 'published' | 'rejected' | 'all'

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: 'pending',   label: 'На проверке' },
  { value: 'published', label: 'Опубликованные' },
  { value: 'rejected',  label: 'Отклонённые' },
  { value: 'all',       label: 'Все' },
]

const STATUS_BADGE: Record<ClassifiedStatus, { label: string; cls: string }> = {
  Pending:   { label: 'На проверке',  cls: 'bg-amber-50 text-amber-600 border border-amber-100' },
  Published: { label: 'Опубликовано', cls: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  Rejected:  { label: 'Отклонено',    cls: 'bg-red-50 text-red-500 border border-red-100' },
}

const ClassifiedsPage = () => {
  const [statusTab, setStatusTab]   = useState<StatusTab>('pending')
  const [category, setCategory]     = useState('')
  const [page, setPage]             = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]         = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const id = setTimeout(() => { setSearch(searchInput.trim()); setPage(1) }, 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const { data, isLoading } = useQuery({
    queryKey: ['ksk-classifieds', statusTab, category, page, search],
    queryFn: () =>
      kskClassifiedsApi.getAll({
        page,
        pageSize: PAGE_SIZE,
        status: statusTab,
        category: category || undefined,
        search: search || undefined,
      }),
  })

  const items      = data?.data.items ?? []
  const totalCount = data?.data.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status tabs */}
        <div className="flex gap-0.5 bg-zinc-100 rounded-xl p-1">
          {STATUS_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setStatusTab(value); setPage(1) }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusTab === value
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 w-44"
        >
          <option value="">Все категории</option>
          {CLASSIFIED_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {category && (
          <button
            onClick={() => { setCategory(''); setPage(1) }}
            className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            Сбросить
          </button>
        )}

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={13} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по названию..."
            className="pl-8 pr-8 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 w-56"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearch('') }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="px-5 py-4 border-b border-zinc-100 flex items-center gap-4">
              <div className="size-10 skeleton rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-48 skeleton rounded" />
                <div className="h-2.5 w-32 skeleton rounded" />
              </div>
              <div className="h-5 w-20 skeleton rounded-full" />
              <div className="h-3 w-16 skeleton rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 py-20 text-center text-zinc-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">storefront</span>
          <p className="text-sm">
            {statusTab === 'pending' ? 'Нет объявлений на проверке' : 'Объявления не найдены'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[2.5fr_1.5fr_130px_110px_130px_90px_32px] gap-4 px-5 py-2.5 border-b border-zinc-100 bg-zinc-50">
            {['Объявление', 'Автор', 'Категория', 'Цена', 'Статус', 'Дата', ''].map((col, i) => (
              <span key={i} className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{col}</span>
            ))}
          </div>

          {/* Rows */}
          <ul className="divide-y divide-zinc-100">
            {items.map((ad) => {
              const categoryLabel = CLASSIFIED_CATEGORY_LABELS[ad.category as ClassifiedCategory] ?? ad.category
              const statusInfo = STATUS_BADGE[ad.status] ?? STATUS_BADGE.Pending
              return (
                <li
                  key={ad.id}
                  onClick={() => setSelectedId(ad.id)}
                  className="grid grid-cols-[2.5fr_1.5fr_130px_110px_130px_90px_32px] gap-4 px-5 py-3.5 items-center hover:bg-zinc-50 transition-colors cursor-pointer group"
                >
                  {/* Title + moderationNote */}
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-zinc-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {ad.coverUrl
                        ? <img src={ad.coverUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="material-symbols-outlined text-zinc-300 text-[16px]">image</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{ad.title}</p>
                      {ad.moderationNote && (
                        <p className="text-[11px] text-amber-600 truncate mt-0.5">{ad.moderationNote}</p>
                      )}
                    </div>
                  </div>

                  {/* Author */}
                  <span className="text-xs text-zinc-500 truncate">{ad.authorName}</span>

                  {/* Category */}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[11px] font-medium w-fit">
                    {categoryLabel}
                  </span>

                  {/* Price */}
                  <span className="text-xs font-semibold text-zinc-900 truncate">{ad.priceText}</span>

                  {/* Status */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold w-fit ${statusInfo.cls}`}>
                    {statusInfo.label}
                  </span>

                  {/* Date */}
                  <span className="text-xs text-zinc-400">
                    {new Date(ad.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </span>

                  {/* Arrow */}
                  <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {totalPages > 1 && (
        <UsersPagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      <ClassifiedDetailModal
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        classifiedId={selectedId}
      />
    </div>
  )
}

export default ClassifiedsPage
