import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/shared/Modal'
import { newsApi } from '@/api/news'
import { complexesApi } from '@/api/complexes'
import { NewsDetail, NEWS_CATEGORY_OPTIONS, NewsCategory } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Обязательное поле').max(300, 'Максимум 300 символов'),
  content: z.string().min(1, 'Обязательное поле'),
  category: z.string().refine((v) => ['1', '2', '3', '4'].includes(v), { message: 'Выберите категорию' }),
  publishDate: z.string().min(1, 'Обязательное поле'),
  expirationDate: z.string().optional(),
  isPinned: z.boolean(),
  targetKskTenantId: z.string().optional(),
  targetComplexId: z.string().optional(),
})

type NewsForm = z.infer<typeof schema>

interface NewsFormModalProps {
  isOpen: boolean
  onClose: () => void
  news?: NewsDetail | null
  isConstructionAdmin?: boolean
  isSeniorAdmin?: boolean
}

const inputClass = (error?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all ${
    error ? 'border-red-400' : 'border-zinc-200'
  }`

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const code = err.response?.data?.errorCode
    if (code === 'TARGET_KSK_REQUIRED') return 'Выберите жилой комплекс'
    return err.response?.data?.message ?? fallback
  }
  return fallback
}

const NewsFormModal = ({ isOpen, onClose, news, isConstructionAdmin, isSeniorAdmin }: NewsFormModalProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEdit = !!news
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(news?.imageUrl ?? null)

  const { data: complexesData } = useQuery({
    queryKey: ['complexes-for-news'],
    queryFn: () => complexesApi.getAll({ pageSize: 100 }),
    enabled: (!!isConstructionAdmin || !!isSeniorAdmin) && !isEdit,
  })

  const complexes = (complexesData?.data?.items ?? []).filter(
    (c) => c.isActive && c.linkedKskTenantId
  )

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewsForm>({
    resolver: zodResolver(schema),
    defaultValues: news
      ? {
          title: news.title,
          content: news.content,
          category: String(news.category),
          publishDate: news.publishDate.slice(0, 16),
          expirationDate: news.expirationDate ? news.expirationDate.slice(0, 16) : '',
          isPinned: news.isPinned,
        }
      : { isPinned: false, category: '1', targetKskTenantId: '' },
  })

  const { mutate: createNews, isPending: isCreating, error: createError } = useMutation({
    mutationFn: (data: NewsForm) => newsApi.create({
      title: data.title,
      content: data.content,
      category: Number(data.category) as NewsCategory,
      publishDate: new Date(data.publishDate).toISOString(),
      expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : undefined,
      isPinned: data.isPinned,
      targetKskTenantId: data.targetKskTenantId || undefined,
      targetComplexId: data.targetComplexId || undefined,
    }, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-manage'] })
      toast.success(t('newsForm.toast.created'))
      handleClose()
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, t('newsForm.toast.createError')))
    },
  })

  const { mutate: updateNews, isPending: isUpdating, error: updateError } = useMutation({
    mutationFn: (data: NewsForm) => newsApi.update(news!.id, {
      title: data.title,
      content: data.content,
      category: Number(data.category) as NewsCategory,
      publishDate: new Date(data.publishDate).toISOString(),
      expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : undefined,
      isPinned: data.isPinned,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-manage'] })
      queryClient.invalidateQueries({ queryKey: ['news-detail', news!.id] })
      toast.success(t('newsForm.toast.updated'))
      handleClose()
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, t('newsForm.toast.updateError')))
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleClose = () => {
    reset({ isPinned: false, category: '1', targetKskTenantId: '' })
    setImageFile(null)
    setImagePreview(null)
    onClose()
  }

  const onSubmit = (data: NewsForm) => {
    if ((isConstructionAdmin || isSeniorAdmin) && !isEdit && !data.targetComplexId) {
      toast.error(t('newsForm.selectComplexError'))
      return
    }
    if (isConstructionAdmin && !isEdit && !data.targetKskTenantId) {
      toast.error(t('newsForm.selectComplexError'))
      return
    }
    if (isEdit) updateNews(data)
    else createNews(data)
  }

  const isPending = isCreating || isUpdating
  const errorMessage = createError
    ? getErrorMessage(createError, t('newsForm.toast.saveError'))
    : updateError
      ? getErrorMessage(updateError, t('newsForm.toast.saveError'))
      : null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? t('newsForm.editTitle') : t('newsForm.createTitle')} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Выбор ЖК — для ConstructionAdmin и KskSeniorAdmin при создании */}
        {(isConstructionAdmin || isSeniorAdmin) && !isEdit && (
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">
              {t('newsForm.complex')} <span className="text-red-400">*</span>
            </label>
            {complexes.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-sm">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                {t('newsForm.noLinkedComplexes')}
              </div>
            ) : (
              <>
                {/* hidden field for kskTenantId (ConstructionAdmin only) */}
                {isConstructionAdmin && (
                  <input type="hidden" {...register('targetKskTenantId')} />
                )}
                <select
                  {...register('targetComplexId')}
                  className={inputClass(!!errors.targetComplexId)}
                  onChange={(e) => {
                    const opt = complexes.find(cx => cx.id === e.target.value)
                    if (isConstructionAdmin && opt?.linkedKskTenantId) {
                      // set hidden kskTenantId field via form
                    }
                  }}
                >
                  <option value="">{t('newsForm.selectComplex')}</option>
                  {complexes.map((cx) => (
                    <option key={cx.id} value={cx.id}>
                      {cx.name} — {cx.address}
                    </option>
                  ))}
                </select>
              </>
            )}
            {errors.targetComplexId && (
              <p className="mt-1 text-xs text-red-500">{errors.targetComplexId.message}</p>
            )}
          </div>
        )}

        {/* Фото — только при создании */}
        {!isEdit && (
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">
              {t('newsForm.photo')} <span className="text-zinc-400 font-normal">({t('newsForm.photoHint')})</span>
            </label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-200 aspect-video">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-zinc-600">close</span>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-200 rounded-xl p-5 cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-all">
                <span className="material-symbols-outlined text-3xl text-slate-300">add_photo_alternate</span>
                <span className="text-sm text-zinc-400">{t('newsForm.uploadPhoto')}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>
        )}

        {/* Заголовок */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">{t('newsForm.fields.title')}</label>
          <input
            {...register('title')}
            className={inputClass(!!errors.title)}
            placeholder={t('newsForm.placeholders.title')}
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Содержание */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">{t('newsForm.fields.content')}</label>
          <textarea
            {...register('content')}
            rows={4}
            className={inputClass(!!errors.content) + ' resize-none'}
            placeholder={t('newsForm.placeholders.content')}
          />
          {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>}
        </div>

        {/* Категория */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">{t('newsForm.fields.category')}</label>
          <select {...register('category')} className={inputClass(!!errors.category)}>
            {NEWS_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
        </div>

        {/* Даты */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">{t('newsForm.fields.publishDate')}</label>
            <input
              {...register('publishDate')}
              type="datetime-local"
              className={inputClass(!!errors.publishDate)}
            />
            {errors.publishDate && <p className="mt-1 text-xs text-red-500">{errors.publishDate.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">
              {t('newsForm.fields.expirationDate')} <span className="text-zinc-400 font-normal">({t('tenants.descriptionOptional')})</span>
            </label>
            <input
              {...register('expirationDate')}
              type="datetime-local"
              className={inputClass(!!errors.expirationDate)}
            />
          </div>
        </div>

        {/* Закрепить */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            {...register('isPinned')}
            type="checkbox"
            className="size-4 rounded border-slate-300 accent-zinc-900"
          />
          <span className="text-sm text-zinc-700">{t('newsForm.pin')}</span>
        </label>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-medium text-sm transition-colors">
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending || ((isConstructionAdmin || isSeniorAdmin) && !isEdit && complexes.length === 0)}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {isPending ? t('common.saving') : isEdit ? t('common.save') : t('common.create')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default NewsFormModal
