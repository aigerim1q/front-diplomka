import { ChevronLeft, ChevronRight } from 'lucide-react'

interface UsersPaginationProps {
  page: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
  label?: string
}

const UsersPagination = ({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  label = 'записей',
}: UsersPaginationProps) => {
  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, totalCount)

  const pages = (): (number | '...')[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 3)               return [1, 2, 3, '...', totalPages]
    if (page >= totalPages - 2)  return [1, '...', totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', page - 1, page, page + 1, '...', totalPages]
  }

  return (
    <div className="flex items-center justify-between px-1 py-2">
      <p className="text-xs text-zinc-400">
        {from}–{to} из {totalCount.toLocaleString()} {label}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="size-8 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {pages().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="w-8 text-center text-xs text-zinc-400 select-none">
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(Number(p))}
              className={`size-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                page === p
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="size-8 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default UsersPagination
