import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, CheckCircle, Ban, Trash2, ToggleLeft, AlertTriangle, Info } from 'lucide-react'
import { kskClassifiedsApi } from '@/api/kskClassifieds'
import {
  CLASSIFIED_CATEGORY_LABELS,
  CLASSIFIED_CATEGORY_COLORS,
  ClassifiedCategory,
  ClassifiedStatus,
} from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  classifiedId: string | null
}

const STATUS_BADGE: Record<ClassifiedStatus, { label: string; cls: string; dot: string }> = {
  Pending:   { label: 'На проверке',  cls: 'bg-amber-50 text-amber-600 border border-amber-100',    dot: 'bg-amber-400' },
  Published: { label: 'Опубликовано', cls: 'bg-emerald-50 text-emerald-600 border border-emerald-100', dot: 'bg-emerald-500' },
  Rejected:  { label: 'Отклонено',    cls: 'bg-red-50 text-red-500 border border-red-100',           dot: 'bg-red-400' },
}

const ClassifiedDetailModal = ({ isOpen, onClose, classifiedId }: Props) => {
  const queryClient = useQueryClient()
  const [photoIndex, setPhotoIndex]     = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectComment, setRejectComment]   = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['ksk-classified', classifiedId],
    queryFn: () => kskClassifiedsApi.getById(classifiedId!),
    enabled: !!classifiedId && isOpen,
  })

  const ad = data?.data

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ksk-classifieds'] })
    queryClient.invalidateQueries({ queryKey: ['ksk-classified', classifiedId] })
  }

  const { mutate: toggleActive, isPending: isToggling } = useMutation({
    mutationFn: () => kskClassifiedsApi.toggleActive(classifiedId!),
    onSuccess: () => {
      invalidate()
      toast.success(ad?.status !== 'Published' ? 'Объявление одобрено и опубликовано' : 'Снято с публикации')
    },
    onError: () => toast.error('Не удалось изменить статус'),
  })

  const { mutate: rejectAd, isPending: isRejecting } = useMutation({
    mutationFn: () => kskClassifiedsApi.reject(classifiedId!, rejectComment.trim()),
    onSuccess: () => {
      invalidate()
      toast.success('Объявление отклонено')
      handleClose()
    },
    onError: () => toast.error('Не удалось отклонить'),
  })

  const { mutate: deleteAd, isPending: isDeleting } = useMutation({
    mutationFn: () => kskClassifiedsApi.delete(classifiedId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-classifieds'] })
      toast.success('Объявление удалено')
      onClose()
    },
    onError: () => toast.error('Не удалось удалить'),
  })

  const handleClose = () => {
    setConfirmDelete(false)
    setShowRejectForm(false)
    setRejectComment('')
    onClose()
  }

  if (!isOpen) return null

  const photos = ad?.photos ?? []
  const photo  = photos[photoIndex]
  const categoryKey   = ad?.category as ClassifiedCategory
  const categoryLabel = CLASSIFIED_CATEGORY_LABELS[categoryKey] ?? ad?.category
  const categoryColor = CLASSIFIED_CATEGORY_COLORS[categoryKey] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'
  const status     = ad?.status ?? 'Pending'
  const statusInfo = STATUS_BADGE[status] ?? STATUS_BADGE.Pending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-zinc-900 truncate pr-4">
            {ad?.title ?? 'Объявление'}
          </h2>
          <button
            onClick={handleClose}
            className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {isLoading || !ad ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-zinc-400" />
          </div>
        ) : (
          <div className="px-6 py-4 space-y-4">
            {/* Photo gallery */}
            {photos.length > 0 ? (
              <div className="relative bg-zinc-100 rounded-xl overflow-hidden aspect-[16/9]">
                <img src={photo?.url} alt={ad.title} className="w-full h-full object-contain" />
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center text-xs"
                    >‹</button>
                    <button
                      onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center text-xs"
                    >›</button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {photos.map((_, i) => (
                        <button key={i} onClick={() => setPhotoIndex(i)}
                          className={`size-1.5 rounded-full transition-colors ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-zinc-50 rounded-xl aspect-[16/9] flex items-center justify-center border border-zinc-100">
                <div className="text-center text-zinc-300">
                  <span className="material-symbols-outlined text-4xl block">image_not_supported</span>
                  <p className="text-xs mt-1">Без фото</p>
                </div>
              </div>
            )}

            {/* Price + chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-bold text-zinc-900">{ad.priceText}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${categoryColor}`}>
                {categoryLabel}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusInfo.cls}`}>
                <span className={`size-1.5 rounded-full ${statusInfo.dot}`} />
                {statusInfo.label}
              </span>
              <span className="text-xs text-zinc-400 ml-auto">
                {new Date(ad.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Moderation note */}
            {ad.moderationNote && (
              <div className="flex gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-0.5">Пометка модерации</p>
                  <p className="text-xs text-amber-800">{ad.moderationNote}</p>
                </div>
              </div>
            )}

            {/* Rejection reason */}
            {ad.status === 'Rejected' && ad.rejectionReason && (
              <div className="flex gap-2.5 bg-red-50 border border-red-100 rounded-xl p-3">
                <Info size={14} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wider mb-0.5">Причина отказа (видит автор)</p>
                  <p className="text-xs text-red-700">{ad.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Author */}
            <div className="flex items-center gap-3 py-2">
              {ad.authorAvatarUrl ? (
                <img src={ad.authorAvatarUrl} className="size-8 rounded-full object-cover" alt="" />
              ) : (
                <div className="size-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-semibold text-xs">
                  {ad.authorName[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-zinc-900">{ad.authorName}</p>
                {ad.authorApartment && <p className="text-[11px] text-zinc-400">кв. {ad.authorApartment}</p>}
              </div>
              <span className="ml-auto flex items-center gap-1 text-xs text-zinc-400">
                <span className="material-symbols-outlined text-[14px]">visibility</span>
                {ad.viewsCount}
              </span>
            </div>

            {/* Description */}
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Описание</p>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{ad.description}</p>
            </div>

            {/* Actions */}
            {!confirmDelete && !showRejectForm ? (
              <div className="flex gap-2 pt-2 border-t border-zinc-100">
                {/* Approve / Unpublish */}
                {ad.status !== 'Published' ? (
                  <button
                    onClick={() => toggleActive()}
                    disabled={isToggling}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={14} />
                    Одобрить
                  </button>
                ) : (
                  <button
                    onClick={() => toggleActive()}
                    disabled={isToggling}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 text-sm font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50"
                  >
                    <ToggleLeft size={14} />
                    Снять
                  </button>
                )}

                {/* Reject */}
                {ad.status !== 'Rejected' && (
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors"
                  >
                    <Ban size={14} />
                    Отклонить
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : showRejectForm ? (
              <div className="pt-2 border-t border-zinc-100 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Причина отказа</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Этот текст увидит автор объявления.</p>
                </div>
                <textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Например: укажите реальную цену и контактный номер."
                  className="w-full text-sm rounded-xl border border-zinc-200 bg-zinc-50 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{rejectComment.length}/500</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowRejectForm(false); setRejectComment('') }}
                    className="flex-1 py-2 rounded-lg border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => rejectAd()}
                    disabled={isRejecting || rejectComment.trim().length === 0}
                    className="flex-1 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    {isRejecting ? 'Отклонение...' : 'Подтвердить'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-zinc-100 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Удалить объявление?</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Действие необратимо. Объявление будет удалено полностью.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 rounded-lg border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => deleteAd()}
                    disabled={isDeleting}
                    className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClassifiedDetailModal
