import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Modal from '@/components/shared/Modal'
import { kskClassifiedsApi } from '@/api/kskClassifieds'
import {
  CLASSIFIED_CATEGORY_LABELS,
  CLASSIFIED_CATEGORY_COLORS,
  ClassifiedCategory,
} from '@/types'

interface ClassifiedDetailModalProps {
  isOpen: boolean
  onClose: () => void
  classifiedId: string | null
}

const ClassifiedDetailModal = ({ isOpen, onClose, classifiedId }: ClassifiedDetailModalProps) => {
  const queryClient = useQueryClient()
  const [photoIndex, setPhotoIndex] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['ksk-classified', classifiedId],
    queryFn: () => kskClassifiedsApi.getById(classifiedId!),
    enabled: !!classifiedId && isOpen,
  })

  const ad = data?.data

  const { mutate: toggleActive, isPending: isToggling } = useMutation({
    mutationFn: () => kskClassifiedsApi.toggleActive(classifiedId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-classifieds'] })
      queryClient.invalidateQueries({ queryKey: ['ksk-classified', classifiedId] })
      toast.success('Статус обновлён')
    },
    onError: () => toast.error('Не удалось изменить статус'),
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

  const photos = ad?.photos ?? []
  const photo = photos[photoIndex]
  const categoryKey = ad?.category as ClassifiedCategory
  const categoryLabel = CLASSIFIED_CATEGORY_LABELS[categoryKey] ?? ad?.category
  const categoryColor = CLASSIFIED_CATEGORY_COLORS[categoryKey] ?? 'bg-slate-100 text-slate-700 border-slate-200'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ad?.title ?? 'Объявление'}>
      {isLoading || !ad ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Photo gallery */}
          {photos.length > 0 ? (
            <div className="relative bg-slate-100 rounded-xl overflow-hidden aspect-[4/3]">
              <img
                src={photo?.url}
                alt={ad.title}
                className="w-full h-full object-contain"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIndex(i)}
                        className={`size-1.5 rounded-full transition-colors ${
                          i === photoIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-slate-100 rounded-xl aspect-[4/3] flex items-center justify-center text-slate-400">
              <div className="text-center">
                <span className="material-symbols-outlined text-5xl">image_not_supported</span>
                <p className="text-sm mt-1">Без фото</p>
              </div>
            </div>
          )}

          {/* Title + price */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">{ad.title}</h3>
            <span className="shrink-0 text-lg font-bold text-primary whitespace-nowrap">
              {ad.priceText}
            </span>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryColor}`}>
              {categoryLabel}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              ad.isActive
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              <span className={`size-1.5 rounded-full ${ad.isActive ? 'bg-primary' : 'bg-slate-400'}`} />
              {ad.isActive ? 'Активно' : 'Неактивно'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <span className="material-symbols-outlined text-[14px]">visibility</span>
              {ad.viewsCount}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {new Date(ad.createdAt).toLocaleDateString('ru-RU')}
            </span>
          </div>

          {/* Description */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Описание</p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ad.description}</p>
          </div>

          {/* Author */}
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Автор</p>
            <div className="flex items-center gap-3">
              {ad.authorAvatarUrl ? (
                <img src={ad.authorAvatarUrl} className="size-10 rounded-full object-cover" alt="" />
              ) : (
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {ad.authorName[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-900">{ad.authorName}</p>
                {ad.authorApartment && (
                  <p className="text-xs text-slate-500">кв. {ad.authorApartment}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {!confirmDelete ? (
            <div className="border-t border-slate-100 pt-4 flex gap-2">
              <button
                onClick={() => toggleActive()}
                disabled={isToggling}
                className="flex-1 py-2.5 rounded-xl border border-amber-200 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {ad.isActive ? 'toggle_on' : 'toggle_off'}
                </span>
                {ad.isActive ? 'Деактивировать' : 'Активировать'}
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Удалить
              </button>
            </div>
          ) : (
            <div className="border-t border-slate-100 pt-4 space-y-2 bg-red-50 -mx-2 px-4 py-3 rounded-xl">
              <p className="text-sm font-semibold text-red-700">
                Удалить объявление?
              </p>
              <p className="text-xs text-red-600">
                Действие необратимо. Жилец увидит, что его объявление удалено модератором.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => deleteAd()}
                  disabled={isDeleting}
                  className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {isDeleting ? 'Удаление...' : 'Подтвердить'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export default ClassifiedDetailModal
