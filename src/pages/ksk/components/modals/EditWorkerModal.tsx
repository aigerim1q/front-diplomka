import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Modal from '@/components/shared/Modal'
import { kskWorkersApi } from '@/api/kskWorkers'
import { Worker, SPECIALIZATION_OPTIONS, WorkerSpecialization } from '@/types'

const schema = z.object({
  firstName: z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов'),
  lastName: z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов'),
  phoneNumber: z.string().min(1, 'Обязательное поле').max(50, 'Максимум 50 символов'),
  specialization: z.string().refine(
    (v) => ['1', '2', '3', '4', '5', '99'].includes(v),
    { message: 'Выберите специализацию' }
  ),
})

type EditWorkerForm = z.infer<typeof schema>

interface EditWorkerModalProps {
  isOpen: boolean
  onClose: () => void
  worker: Worker | null
}

const inputClass = (error?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
    error ? 'border-red-400' : 'border-slate-200'
  }`

const splitFullName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

const EditWorkerModal = ({ isOpen, onClose, worker }: EditWorkerModalProps) => {
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditWorkerForm>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (worker) {
      const { firstName, lastName } = splitFullName(worker.fullName)
      reset({
        firstName,
        lastName,
        phoneNumber: worker.phoneNumber,
        specialization: String(worker.specialization),
      })
    }
  }, [worker, reset])

  const { mutate, isPending, error: serverError } = useMutation({
    mutationFn: (data: EditWorkerForm) => kskWorkersApi.update(worker!.id, {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      specialization: Number(data.specialization) as WorkerSpecialization,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-workers'] })
      toast.success('Данные работника обновлены')
      onClose()
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Редактировать работника">
      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
            Ошибка при обновлении данных
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Имя</label>
            <input {...register('firstName')} className={inputClass(!!errors.firstName)} />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Фамилия</label>
            <input {...register('lastName')} className={inputClass(!!errors.lastName)} />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Телефон</label>
          <input
            {...register('phoneNumber')}
            className={inputClass(!!errors.phoneNumber)}
          />
          {errors.phoneNumber && <p className="mt-1 text-xs text-red-500">{errors.phoneNumber.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Специализация</label>
          <select
            {...register('specialization')}
            className={inputClass(!!errors.specialization)}
          >
            {SPECIALIZATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.specialization && <p className="mt-1 text-xs text-red-500">{errors.specialization.message}</p>}
        </div>

        <div className="flex gap-3 justify-end pt-2">
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

export default EditWorkerModal
