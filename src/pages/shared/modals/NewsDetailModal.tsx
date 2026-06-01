import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Edit, Send, Archive, Paperclip, Calendar, CalendarX } from 'lucide-react'
import Modal from '@/components/shared/Modal'
import { newsApi } from '@/api/news'
import { NEWS_STATUS_LABELS, NEWS_CATEGORY_LABELS } from '@/types'
import NewsFormModal from './NewsFormModal'

interface Props { isOpen: boolean; onClose: () => void; newsId: string | null }

const STATUS_STYLE: Record<number, string> = {
  1: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
  2: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  3: 'bg-zinc-100 text-zinc-400 border border-zinc-200',
}
const CAT_STYLE: Record<number, string> = {
  1: 'bg-blue-50 text-blue-600', 2: 'bg-amber-50 text-amber-600',
  3: 'bg-violet-50 text-violet-600', 4: 'bg-red-50 text-red-600',
}

const NewsDetailModal = ({ isOpen, onClose, newsId }: Props) => {
  const queryClient = useQueryClient()
  const [isEditOpen, setIsEditOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['news-detail', newsId],
    queryFn: () => newsApi.getById(newsId!),
    enabled: !!newsId && isOpen,
  })
  const news = data?.data

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['news-manage'] })
    queryClient.invalidateQueries({ queryKey: ['news-detail', newsId] })
  }

  const { mutate: changeStatus, isPending: isChanging } = useMutation({
    mutationFn: (s: 2 | 3) => newsApi.changeStatus(newsId!, { newStatus: s }),
    onSuccess: (_, s) => { invalidate(); toast.success(s === 2 ? 'Объявление опубликовано' : 'Перемещено в архив') },
  })

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const isDraft     = news?.status === 1
  const isPublished = news?.status === 2

  return (
    <>
      <Modal isOpen={isOpen && !isEditOpen} onClose={onClose} title="Объявление" size="lg">
        {isLoading || !news ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 skeleton rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLE[news.status]}`}>
                {NEWS_STATUS_LABELS[news.status]}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${CAT_STYLE[news.category] ?? 'bg-zinc-100 text-zinc-500'}`}>
                {NEWS_CATEGORY_LABELS[news.category]}
              </span>
              {news.isPinned && (
                <span className="text-[10px] font-semibold text-amber-600">📌 Закреплено</span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-zinc-900">{news.title}</h3>

            {/* Dates */}
            <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} className="text-zinc-400" />
                Публикация: <span className="font-medium text-zinc-700">{fmt(news.publishDate)}</span>
              </span>
              {news.expirationDate && (
                <span className="flex items-center gap-1.5">
                  <CalendarX size={12} className="text-zinc-400" />
                  Окончание: <span className="font-medium text-zinc-700">{fmt(news.expirationDate)}</span>
                </span>
              )}
            </div>

            {/* Content */}
            <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Содержание</p>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{news.content}</p>
            </div>

            {/* Attachments */}
            {news.attachments.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Вложения</p>
                <div className="space-y-1.5">
                  {news.attachments.map(att => (
                    <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 bg-zinc-50 rounded-lg border border-zinc-100 hover:border-zinc-200 hover:bg-white transition-all text-sm text-zinc-700 font-medium">
                      <Paperclip size={13} className="text-zinc-400" />
                      {att.fileName}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {(isDraft || isPublished) && (
              <div className="border-t border-zinc-100 pt-4 space-y-2">
                {isDraft && (
                  <button onClick={() => setIsEditOpen(true)}
                    className="w-full py-2.5 rounded-xl border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2">
                    <Edit size={14} />Редактировать
                  </button>
                )}
                {isDraft && (
                  <button onClick={() => changeStatus(2)} disabled={isChanging}
                    className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    <Send size={14} />
                    {isChanging ? 'Публикация...' : 'Опубликовать'}
                  </button>
                )}
                {isPublished && (
                  <button onClick={() => changeStatus(3)} disabled={isChanging}
                    className="w-full py-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    <Archive size={14} />
                    {isChanging ? 'Архивирование...' : 'В архив'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {isEditOpen && news && (
        <NewsFormModal key={news.id} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} news={news} />
      )}
    </>
  )
}

export default NewsDetailModal
