import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Modal from '@/components/shared/Modal'
import { newsApi } from '@/api/news'
import {
  NEWS_STATUS_LABELS,
  NEWS_STATUS_COLORS,
  NEWS_CATEGORY_LABELS,
  NEWS_CATEGORY_COLORS,
} from '@/types'
import NewsFormModal from './NewsFormModal'

interface NewsDetailModalProps {
  isOpen: boolean
  onClose: () => void
  newsId: string | null
}

const NewsDetailModal = ({ isOpen, onClose, newsId }: NewsDetailModalProps) => {
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
    mutationFn: (newStatus: 2 | 3) => newsApi.changeStatus(newsId!, { newStatus }),
    onSuccess: (_, newStatus) => {
      invalidate()
      toast.success(newStatus === 2 ? 'Объявление опубликовано' : 'Объявление архивировано')
    },
  })

  const isDraft = news?.status === 1
  const isPublished = news?.status === 2

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <Modal isOpen={isOpen && !isEditOpen} onClose={onClose} title="Объявление">
        {isLoading || !news ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Заголовок + статус */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {news.isPinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    <span className="material-symbols-outlined text-[13px]">push_pin</span>
                    Закреплено
                  </span>
                )}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${NEWS_STATUS_COLORS[news.status]}`}>
                  {NEWS_STATUS_LABELS[news.status]}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${NEWS_CATEGORY_COLORS[news.category]}`}>
                  {NEWS_CATEGORY_LABELS[news.category]}
                </span>
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900">{news.title}</h3>

            {/* Даты */}
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">event</span>
                Публикация: <span className="font-semibold text-slate-700">{formatDate(news.publishDate)}</span>
              </span>
              {news.expirationDate && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">event_busy</span>
                  Окончание: <span className="font-semibold text-slate-700">{formatDate(news.expirationDate)}</span>
                </span>
              )}
            </div>

            {/* Содержание */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{news.content}</p>
            </div>

            {/* Вложения */}
            {news.attachments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Вложения</p>
                <div className="space-y-2">
                  {news.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm text-slate-700 font-medium"
                    >
                      <span className="material-symbols-outlined text-[18px] text-slate-400">attach_file</span>
                      {att.fileName}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Действия */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              {isDraft && (
                <>
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Редактировать
                  </button>
                  <button
                    onClick={() => changeStatus(2)}
                    disabled={isChanging}
                    className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">publish</span>
                    {isChanging ? 'Публикация...' : 'Опубликовать'}
                  </button>
                </>
              )}
              {isPublished && (
                <button
                  onClick={() => changeStatus(3)}
                  disabled={isChanging}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">archive</span>
                  {isChanging ? 'Архивирование...' : 'В архив'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Модалка редактирования */}
      <NewsFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        news={news}
      />
    </>
  )
}

export default NewsDetailModal
