import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '@/components/shared/Modal'
import { kskResidentsApi } from '@/api/kskResidents'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  firstName: z.string().min(1, 'Обязательное поле'),
  lastName: z.string().min(1, 'Обязательное поле'),
  phoneNumber: z
    .string()
    .refine((v) => v === '+7' || v.length === 12, {
      message: 'Введите полный номер: +7XXXXXXXXXX',
    })
    .optional()
    .or(z.literal('')),
})

type AddResidentForm = z.infer<typeof schema>

interface AddResidentModalProps {
  isOpen: boolean
  onClose: () => void
}

const inputClass = (error?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
    error ? 'border-red-400' : 'border-slate-200'
  }`

// Телефонное поле — только цифры, префикс +7 фиксирован
const PhoneInput = ({
  value,
  onChange,
  hasError,
}: {
  value: string
  onChange: (val: string) => void
  hasError?: boolean
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    // Берём только цифры из введённого
    const digits = raw.replace(/\D/g, '')
    // Убираем лидирующую 7 (она уже в префиксе)
    const withoutPrefix = digits.startsWith('7') ? digits.slice(1) : digits
    // Максимум 10 цифр после +7
    const limited = withoutPrefix.slice(0, 10)
    onChange('+7' + limited)
  }

  // Не даём удалить +7
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      (e.key === 'Backspace' || e.key === 'Delete') &&
      (e.currentTarget.value === '+7' || e.currentTarget.selectionStart! <= 2)
    ) {
      e.preventDefault()
    }
  }

  return (
    <input
      type="tel"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={inputClass(hasError)}
      placeholder="+7XXXXXXXXXX"
    />
  )
}

const AddResidentModal = ({ isOpen, onClose }: AddResidentModalProps) => {
  const queryClient = useQueryClient()
  const [createdResident, setCreatedResident] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<AddResidentForm>({
    resolver: zodResolver(schema),
    defaultValues: { phoneNumber: '+7' },
  })

  const { mutate, isPending, error: serverError } = useMutation({
    mutationFn: kskResidentsApi.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['ksk-residents'] })
      reset({ phoneNumber: '+7' })
      setCreatedResident({ email: res.data.email, password: res.data.temporaryPassword })
    },
  })

  const onSubmit = (data: AddResidentForm) => {
    mutate({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber === '+7' ? undefined : data.phoneNumber,
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(createdResident?.password ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setCreatedResident(null)
    setCopied(false)
    reset({ phoneNumber: '+7' })
    onClose()
  }

  // Экран успеха
  if (createdResident) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Жилец создан!">
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <span className="material-symbols-outlined text-emerald-500">check_circle</span>
              <span className="font-semibold text-sm">Аккаунт успешно создан</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-500 mb-1">Email</p>
                <p className="font-mono text-sm font-bold text-slate-800">{createdResident.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Временный пароль</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1">
                    {createdResident.password}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-slate-500">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-red-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            Сохраните пароль — он больше не будет показан!
          </p>
          <button
            onClick={handleClose}
            className="w-full py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Готово
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Добавить жильца">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
            Ошибка при создании жильца
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Имя</label>
            <input {...register('firstName')} className={inputClass(!!errors.firstName)} placeholder="Айгерим" />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Фамилия</label>
            <input {...register('lastName')} className={inputClass(!!errors.lastName)} placeholder="Бекова" />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
          <input {...register('email')} type="email" className={inputClass(!!errors.email)} placeholder="resident@mail.kz" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Телефон <span className="text-slate-400 font-normal">(необязательно)</span>
          </label>
          <Controller
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value ?? '+7'}
                onChange={field.onChange}
                hasError={!!errors.phoneNumber}
              />
            )}
          />
          {errors.phoneNumber && <p className="mt-1 text-xs text-red-500">{errors.phoneNumber.message}</p>}
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

export default AddResidentModal