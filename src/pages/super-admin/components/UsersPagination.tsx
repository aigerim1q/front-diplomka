interface UsersPaginationProps {
  page: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
}

const UsersPagination = ({ page, totalPages, totalCount, pageSize, onPageChange }: UsersPaginationProps) => {
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)

  const pages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 3) return [1, 2, 3, '...', totalPages]
    if (page >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', page - 1, page, page + 1, '...', totalPages]
  }

  return (
    <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-t border-slate-200">
      <p className="text-sm text-slate-500">
        Showing {from} to {to} of {totalCount.toLocaleString()} users
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-white transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        {pages().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="text-slate-400 px-1">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(Number(p))}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                page === p ? 'bg-primary text-white' : 'hover:bg-white text-slate-700'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-white transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  )
}

export default UsersPagination