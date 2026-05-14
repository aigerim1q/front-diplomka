import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import Modal from '@/components/shared/Modal'
import { kskServicesApi } from '@/api/kskServices'
import { ServiceDetail } from '@/types'

const schema = z.object({
  title: z.string().min(3, 'Минимум 3 символа').max(120, 'Максимум 120 символов'),
  description: z.string().min(10, 'Минимум 10 символов').max(2000, 'Максимум 2000 символов'),
  priceText: z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов'),
  providerName: z.string().min(2, 'Минимум 2 символа').max(120, 'Максимум 120 символов'),
  contactPhone: z
    .string()
    .regex(/^\+7\d{10}$/, 'Формат: +7XXXXXXXXXX'),
  contactName: z.string().max(100, 'Максимум 100 символов').optional().or(z.literal('')),
})

type EditServiceForm = z.infer<typeof schema>

interface EditServiceModalProps {
  isOpen: boolean
  onClose: () => void
  service: ServiceDetail | null
}

const inputClass = (error?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
    error ? 'border-red-400' : 'border-slate-200'
  }`

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

const EditServiceModal = ({ isOpen, onClose, service }: EditServiceModalProps) => {
  const queryClient = useQueryClient()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditServiceForm>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (service) {
      reset({
        title: service.title,
        description: service.description,
        priceText: service.priceText,
        providerName: service.providerName,
        contactPhone: service.contactPhone,
        contactName: service.contactName ?? '',
      })
      if (imagePreview) URL.revokeObjectURL(imagePreview)
      setImageFile(null)
      setImagePreview(null)
      setImageError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service])

  const { mutate, isPending } = useMutation({
    mutationFn: (data: EditServiceForm) =>
      kskServicesApi.update(service!.id, {
        title: data.title,
        description: data.description,
        priceText: data.priceText,
        providerName: data.providerName,
        contactPhone: data.contactPhone,
        contactName: data.contactName || undefined,
        image: imageFile,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-services'] })
      toast.success('Сервис обновлён')
      handleClose()
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message ?? 'Ошибка при обновлении')
      } else {
        toast.error('Ошибка при обновлении')
      }
    },
  })

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError('Допустимы: jpg, jpeg, png, webp')
      return
    }
    if (file.size > MAX_SIZE) {
      setImageError('Файл больше 5 МБ')
      return
    }
    setImageError(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleClose = () => {
    reset()
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    setImageError(null)
    onClose()
  }

  const previewSrc = imagePreview ?? service?.coverUrl ?? null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Редактировать сервис">
      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Обложка</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              handleFileSelect(e.dataTransfer.files[0])
            }}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed h-44 flex items-center justify-center overflow-hidden transition-colors ${
              imageError ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            {previewSrc ? (
              <>
                <img src={previewSrc} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium">
                  Заменить фото
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                <p className="text-sm font-medium mt-1">Нажмите или перетащите фото</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              className="hidden"
            />
          </div>
          {imageError && <p className="mt-1 text-xs text-red-500">{imageError}</p>}
          <p className="mt-1 text-xs text-slate-400">
            Если не выбрать новое фото — текущее останется
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Название</label>
          <input {...register('title')} className={inputClass(!!errors.title)} />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Описание</label>
          <textarea {...register('description')} rows={3} className={inputClass(!!errors.description)} />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Компания</label>
            <input {...register('providerName')} className={inputClass(!!errors.providerName)} />
            {errors.providerName && <p className="mt-1 text-xs text-red-500">{errors.providerName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Цена</label>
            <input {...register('priceText')} className={inputClass(!!errors.priceText)} />
            {errors.priceText && <p className="mt-1 text-xs text-red-500">{errors.priceText.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Телефон</label>
            <input {...register('contactPhone')} className={inputClass(!!errors.contactPhone)} />
            {errors.contactPhone && <p className="mt-1 text-xs text-red-500">{errors.contactPhone.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Контактное лицо</label>
            <input {...register('contactName')} className={inputClass(!!errors.contactName)} />
            {errors.contactName && <p className="mt-1 text-xs text-red-500">{errors.contactName.message}</p>}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default EditServiceModal
