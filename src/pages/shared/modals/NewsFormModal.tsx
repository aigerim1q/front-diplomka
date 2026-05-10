import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Modal from '@/components/shared/Modal'
import { newsApi } from '@/api/news'
import { NewsDetail, NEWS_CATEGORY_OPTIONS } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Обязательное поле').max(300, 'Максимум 300 символов'),
  content: z.string().min(1, 'Обязательное поле'),
  category: z.coerce.number().refine((v) => [1, 2, 3, 4].includes(v), { message: 'Выберите категорию' }),
  publishDate: z.string().min(1, 'Обязательное поле'),
  expirationDate: z.string().optional(),
  isPinned: z.boolean(),
})

type NewsForm = z.infer<typeof schema>

interface NewsFormModalProps {
  isOpen: boolean
  onClose: () => void
  news?: NewsDetail | null
}

const inputClass = (error?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
    error ? 'border-red-400' : 'border-slate-200'
  }`

const NewsFormModal = ({ isOpen, onClose, news }: NewsFormModalProps) => {
  const queryClient = useQueryClient()
  const isEdit = !!news
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewsForm>({
    resolver: zodResolver(schema),
    defaultValues: { isPinned: false, category: 1 },
  })

  useEffect(() => {
    if (news) {
      reset({
        title: news.title,
        content: news.content,
        category: news.category,
        publishDate: news.publishDate.slice(0, 16),
        expirationDate: news.expirationDate ? news.expirationDate.slice(0, 16) : '',
        isPinned: news.isPinned,
      })
      setImagePreview((news as any).imageUrl ?? null)
      setImageFile(null)
    } else {
      reset({ isPinned: false, category: 1 })
      setImagePreview(null)
      setImageFile(null)
    }
  }, [news, reset])

  const { mutate: createNews, isPending: isCreating, error: createError } = useMutation({
    mutationFn: (data: NewsForm) => newsApi.create({
      title: data.title,
      content: data.content,
      category: data.category as any,
      publishDate: new Date(data.publishDate).toISOString(),
      expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : undefined,
      isPinned: data.isPinned,
    }, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-manage'] })
      toast.success('Объявление создано')
      handleClose()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.response?.data?.errorCode || 'Ошибка при создании'
      toast.error(msg)
    },
  })

  const { mutate: updateNews, isPending: isUpdating, error: updateError } = useMutation({
    mutationFn: (data: NewsForm) => newsApi.update(news!.id, {
      title: data.title,
      content: data.content,
      category: data.category as any,
      publishDate: new Date(data.publishDate).toISOString(),
      expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : undefined,
      isPinned: data.isPinned,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-manage'] })
      queryClient.invalidateQueries({ queryKey: ['news-detail', news!.id] })
      toast.success('Объявление обновлено')
      handleClose()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.response?.data?.errorCode || 'Ошибка при обновлении'
      toast.error(msg)
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
    reset({ isPinned: false, category: 1 })
    setImageFile(null)
    setImagePreview(null)
    onClose()
  }

  const onSubmit = (data: NewsForm) => {
    if (isEdit) {
      updateNews(data)
    } else {
      createNews(data)
    }
  }

  const isPending = isCreating || isUpdating

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? 'Редактировать объявление' : 'Создать объявление'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {(createError || updateError) && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
            {(createError as any)?.response?.data?.message ||
             (updateError as any)?.response?.data?.message ||
             'Ошибка при сохранении. Проверьте данные.'}
          </div>
        )}

        {/* Фото — только при создании */}
        {!isEdit && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Фото <span className="text-slate-400 font-normal">(необязательно, jpg/png, до 5 МБ)</span>
            </label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-600">close</span>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                <span className="material-symbols-outlined text-3xl text-slate-300">add_photo_alternate</span>
                <span className="text-sm text-slate-400">Нажмите чтобы загрузить фото</span>
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
          <label className="block text-xs font-semibold text-slate-600 mb-1">Заголовок</label>
          <input
            {...register('title')}
            className={inputClass(!!errors.title)}
            placeholder="Плановое отключение воды"
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Содержание */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Содержание</label>
          <textarea
            {...register('content')}
            rows={4}
            className={inputClass(!!errors.content) + ' resize-none'}
            placeholder="Уважаемые жильцы..."
          />
          {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>}
        </div>

        {/* Категория */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Категория</label>
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">Дата публикации</label>
            <input
              {...register('publishDate')}
              type="datetime-local"
              className={inputClass(!!errors.publishDate)}
            />
            {errors.publishDate && <p className="mt-1 text-xs text-red-500">{errors.publishDate.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Дата окончания <span className="text-slate-400 font-normal">(необязательно)</span>
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
            className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-slate-700">Закрепить объявление</span>
        </label>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors">
            Отмена
          </button>
          <button type="submit" disabled={isPending}
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60">
            {isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default NewsFormModal