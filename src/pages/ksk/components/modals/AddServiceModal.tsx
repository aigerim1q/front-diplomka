import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import Modal from '@/components/shared/Modal'
import { kskServicesApi } from '@/api/kskServices'

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

type AddServiceForm = z.infer<typeof schema>

interface AddServiceModalProps {
  isOpen: boolean
  onClose: () => void
}

const inputClass = (error?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all ${
    error ? 'border-red-400' : 'border-zinc-200'
  }`

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

const AddServiceModal = ({ isOpen, onClose }: AddServiceModalProps) => {
  const queryClient = useQueryClient()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddServiceForm>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const { mutate, isPending } = useMutation({
    mutationFn: kskServicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-services'] })
      toast.success('Сервис создан')
      handleClose()
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message ?? 'Ошибка при создании сервиса')
      } else {
        toast.error('Ошибка при создании сервиса')
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

  const onSubmit = (data: AddServiceForm) => {
    if (!imageFile) {
      setImageError('Загрузите фото')
      return
    }
    mutate({
      title: data.title,
      description: data.description,
      priceText: data.priceText,
      providerName: data.providerName,
      contactPhone: data.contactPhone,
      contactName: data.contactName || undefined,
      image: imageFile,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Создать сервис">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Photo upload */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">Обложка *</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              handleFileSelect(e.dataTransfer.files[0])
            }}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed h-44 flex items-center justify-center overflow-hidden transition-colors ${
              imageError ? 'border-red-400 bg-red-50' : 'border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-zinc-400">
                <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                <p className="text-sm font-medium mt-1">Нажмите или перетащите фото</p>
                <p className="text-xs">jpg / jpeg / png / webp, до 5 МБ</p>
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
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">Название *</label>
          <input {...register('title')} className={inputClass(!!errors.title)} placeholder="Установка кондиционеров" />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">Описание *</label>
          <textarea
            {...register('description')}
            rows={3}
            className={inputClass(!!errors.description)}
            placeholder="Подробное описание услуги..."
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Компания / провайдер *</label>
            <input {...register('providerName')} className={inputClass(!!errors.providerName)} placeholder="ООО Климат+" />
            {errors.providerName && <p className="mt-1 text-xs text-red-500">{errors.providerName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Цена *</label>
            <input {...register('priceText')} className={inputClass(!!errors.priceText)} placeholder="от 5 000 ₸" />
            {errors.priceText && <p className="mt-1 text-xs text-red-500">{errors.priceText.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Телефон *</label>
            <input {...register('contactPhone')} className={inputClass(!!errors.contactPhone)} placeholder="+77001234567" />
            {errors.contactPhone && <p className="mt-1 text-xs text-red-500">{errors.contactPhone.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">
              Контактное лицо <span className="text-zinc-400 font-normal">необязательно</span>
            </label>
            <input {...register('contactName')} className={inputClass(!!errors.contactName)} placeholder="Иван" />
            {errors.contactName && <p className="mt-1 text-xs text-red-500">{errors.contactName.message}</p>}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-medium text-sm transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AddServiceModal
