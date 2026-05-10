import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Modal from '@/components/shared/Modal'
import { kskWorkersApi } from '@/api/kskWorkers'
import { SPECIALIZATION_OPTIONS } from '@/types'

const schema = z.object({
  fullName: z.string().min(2, 'Минимум 2 символа').max(200, 'Максимум 200 символов'),
  phoneNumber: z.string().min(1, 'Обязательное поле').max(50, 'Максимум 50 символов'),
  specialization: z.coerce.number().refine(
    (v) => [1, 2, 3, 4, 5, 99].includes(v),
    { message: 'Выберите специализацию' }
  ),
})

type AddWorkerForm = z.infer<typeof schema>

interface AddWorkerModalProps {
  isOpen: boolean
  onClose: () => void
}

const inputClass = (error?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
    error ? 'border-red-400' : 'border-slate-200'
  }`

const AddWorkerModal = ({ isOpen, onClose }: AddWorkerModalProps) => {
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddWorkerForm>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending, error: serverError } = useMutation({
    mutationFn: kskWorkersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-workers'] })
      reset()
      toast.success('Работник успешно добавлен')
      onClose()
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Добавить работника">
      <form onSubmit={handleSubmit((data) => mutate({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        specialization: data.specialization as any,
      }))} className="space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
            Ошибка при создании работника
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">ФИО</label>
          <input
            {...register('fullName')}
            className={inputClass(!!errors.fullName)}
            placeholder="Иванов Сергей Петрович"
          />
          {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Телефон</label>
          <input
            {...register('phoneNumber')}
            className={inputClass(!!errors.phoneNumber)}
            placeholder="+77001234567"
          />
          {errors.phoneNumber && <p className="mt-1 text-xs text-red-500">{errors.phoneNumber.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Специализация</label>
          <select
            {...register('specialization')}
            className={inputClass(!!errors.specialization)}
            defaultValue=""
          >
            <option value="" disabled>— Выберите специализацию —</option>
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
            {isPending ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AddWorkerModal
