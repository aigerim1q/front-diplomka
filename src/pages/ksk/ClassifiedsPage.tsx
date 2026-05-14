import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { kskClassifiedsApi } from '@/api/kskClassifieds'
import {
  CLASSIFIED_CATEGORY_LABELS,
  CLASSIFIED_CATEGORY_COLORS,
  CLASSIFIED_CATEGORY_OPTIONS,
  ClassifiedCategory,
} from '@/types'
import ClassifiedDetailModal from './components/modals/ClassifiedDetailModal'

const PAGE_SIZE = 20

const ClassifiedsPage = () => {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const { data, isLoading } = useQuery({
    queryKey: ['ksk-classifieds', page, search, category],
    queryFn: () =>
      kskClassifiedsApi.getAll({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        category: category || undefined,
      }),
  })

  const items = data?.data.items ?? []
  const totalCount = data?.data.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по названию"
            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm w-full"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setPage(1)
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm w-52"
        >
          <option value="">Все категории</option>
          {CLASSIFIED_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setCategory('')
            setSearchInput('')
            setSearch('')
            setPage(1)
          }}
          className="px-4 py-2 text-slate-600 font-medium text-sm hover:text-primary transition-colors"
        >
          Сбросить
        </button>
        <span className="ml-auto text-sm text-slate-500">
          Всего: <span className="font-bold text-slate-900">{totalCount}</span>
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Объявление', 'Автор', 'Категория', 'Цена', 'Просмотры', 'Статус', 'Дата', 'Действия'].map((col) => (
                  <th
                    key={col}
                    className={`px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${col === 'Действия' ? 'text-right' : ''}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((ad) => {
                const categoryKey = ad.category as ClassifiedCategory
                const categoryLabel = CLASSIFIED_CATEGORY_LABELS[categoryKey] ?? ad.category
                const categoryColor = CLASSIFIED_CATEGORY_COLORS[categoryKey] ?? 'bg-slate-100 text-slate-700 border-slate-200'
                return (
                  <tr
                    key={ad.id}
                    onClick={() => setSelectedId(ad.id)}
                    className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                      !ad.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {ad.coverUrl ? (
                            <img src={ad.coverUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-300 text-[20px]">image</span>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-slate-900 line-clamp-2 max-w-[280px]">
                          {ad.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ad.authorName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${categoryColor}`}>
                        {categoryLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                      {ad.priceText}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        {ad.viewsCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                        ad.isActive
                          ? 'bg-primary/10 text-primary'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`size-1.5 rounded-full ${ad.isActive ? 'bg-primary' : 'bg-slate-400'}`} />
                        {ad.isActive ? 'Активно' : 'Скрыто'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(ad.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedId(ad.id)
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                          title="Просмотр"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {items.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-3 block">storefront</span>
              <p className="font-medium">Объявления не найдены</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-sm text-slate-500">
                Страница {page} из {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedId && (
        <ClassifiedDetailModal
          key={selectedId}
          isOpen={!!selectedId}
          onClose={() => setSelectedId(null)}
          classifiedId={selectedId}
        />
      )}
    </div>
  )
}

export default ClassifiedsPage
