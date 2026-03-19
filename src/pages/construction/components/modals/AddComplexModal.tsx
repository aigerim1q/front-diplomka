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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddComplexForm>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending, error: serverError } = useMutation({
    mutationFn: complexesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complexes'] })
      reset()
      onClose()
    },
  })

  const handleClose = () => { reset(); onClose() }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Добавить жилой комплекс">
      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
            Ошибка при создании комплекса
          </div>
        )}

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
