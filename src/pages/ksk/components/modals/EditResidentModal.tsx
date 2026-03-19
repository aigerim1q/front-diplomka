import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '@/components/shared/Modal'
import { kskResidentsApi } from '@/api/kskResidents'
import { Resident } from '@/types'

const schema = z.object({
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

type EditResidentForm = z.infer<typeof schema>

interface EditResidentModalProps {
  isOpen: boolean
  onClose: () => void
  resident: Resident | null
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
    const digits = raw.replace(/\D/g, '')
    const withoutPrefix = digits.startsWith('7') ? digits.slice(1) : digits
    const limited = withoutPrefix.slice(0, 10)
    onChange('+7' + limited)
  }

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

const EditResidentModal = ({ isOpen, onClose, resident }: EditResidentModalProps) => {
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<EditResidentForm>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (resident) {
      // Если номер есть но не начинается на +7 — добавляем префикс
      const phone = resident.phoneNumber
        ? resident.phoneNumber.startsWith('+7')
          ? resident.phoneNumber
          : '+7' + resident.phoneNumber.replace(/\D/g, '')
        : '+7'

      reset({
        firstName: resident.firstName ?? '',
        lastName: resident.lastName ?? '',
        phoneNumber: phone,
      })
    }
  }, [resident, reset])

  const { mutate, isPending, error: serverError } = useMutation({
    mutationFn: (data: EditResidentForm) => kskResidentsApi.update(resident!.id, {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber === '+7' ? undefined : data.phoneNumber,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-residents'] })
      onClose()
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Редактировать жильца">
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
            {isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default EditResidentModal