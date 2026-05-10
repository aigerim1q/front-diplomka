import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '@/components/shared/Modal'
import { complexesApi } from '@/api/complexes'

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  address: z.string().min(1, 'Обязательное поле'),
  city: z.string().min(1, 'Обязательное поле'),
  region: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
})

type AddComplexForm = z.infer<typeof schema>

interface AddComplexModalProps {
  isOpen: boolean
  onClose: () => void
}

const inputClass = (error?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
    error ? 'border-red-400' : 'border-slate-200'
  }`

const AddComplexModal = ({ isOpen, onClose }: AddComplexModalProps) => {
  const queryClient = useQueryClient()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddComplexForm>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending, error: serverError } = useMutation({
    mutationFn: (data: AddComplexForm) => complexesApi.create(data, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complexes'] })
      handleClose()
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
    reset()
    setImageFile(null)
    setImagePreview(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Добавить жилой комплекс">
      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
            Ошибка при создании комплекса
          </div>
        )}

        {/* Фото */}
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
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
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

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Название</label>
          <input {...register('name')} className={inputClass(!!errors.name)} placeholder="ЖК Алатау" />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Адрес</label>
          <input {...register('address')} className={inputClass(!!errors.address)} placeholder="ул. Абая, 100" />
          {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Город</label>
            <input {...register('city')} className={inputClass(!!errors.city)} placeholder="Алматы" />
            {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Регион</label>
            <input {...register('region')} className={inputClass(!!errors.region)} placeholder="Алматинская область" />
            {errors.region && <p className="mt-1 text-xs text-red-500">{errors.region.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Описание <span className="text-slate-400 font-normal">(необязательно)</span>
          </label>
          <textarea
            {...register('description')}
            className={inputClass()}
            placeholder="Краткое описание комплекса..."
            rows={3}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors">
            Отмена
          </button>
          <button type="submit" disabled={isPending}
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60">
            {isPending ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AddComplexModal