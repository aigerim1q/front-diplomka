import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import Modal from '@/components/shared/Modal'
import { kskWorkersApi } from '@/api/kskWorkers'
import { SPECIALIZATION_OPTIONS, WorkerSpecialization } from '@/types'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  firstName: z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов'),
  lastName: z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов'),
  phoneNumber: z.string().min(1, 'Обязательное поле').max(50, 'Максимум 50 символов'),
  specialization: z.string().refine(
    (v) => ['1', '2', '3', '4', '5', '99'].includes(v),
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

  const { mutate, isPending } = useMutation({
    mutationFn: kskWorkersApi.create,
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['ksk-workers'] })
      reset()
      toast.success(`Аккаунт создан. Временный пароль отправлен на ${vars.email}`)
      onClose()
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const code = err.response?.data?.errorCode
        if (code === 'SR_WORKER_EMAIL_TAKEN') {
          toast.error('Пользователь с таким email уже существует')
          return
        }
        toast.error(err.response?.data?.message ?? 'Ошибка при создании работника')
      } else {
        toast.error('Ошибка при создании работника')
      }
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Добавить работника">
      <form
        onSubmit={handleSubmit((data) =>
          mutate({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            specialization: Number(data.specialization) as WorkerSpecialization,
          })
        )}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Имя</label>
            <input
              {...register('firstName')}
              className={inputClass(!!errors.firstName)}
              placeholder="Сергей"
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Фамилия</label>
            <input
              {...register('lastName')}
              className={inputClass(!!errors.lastName)}
              placeholder="Иванов"
            />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            className={inputClass(!!errors.email)}
            placeholder="worker@example.com"
          />
          <p className="mt-1 text-xs text-slate-400">
            На этот адрес будет отправлен временный пароль
          </p>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
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
