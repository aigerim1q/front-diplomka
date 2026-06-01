import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '@/components/shared/Modal'
import { kskResidentsApi } from '@/api/kskResidents'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  firstName: z.string().min(1, 'Обязательное поле'),
  lastName: z.string().min(1, 'Обязательное поле'),
  phoneNumber: z.string().refine(v => v === '+7' || v.length === 12, { message: 'Введите полный номер: +7XXXXXXXXXX' }).optional().or(z.literal('')),
  apartmentNumber: z.string().min(1, 'Обязательное поле'),
  building: z.string().min(1, 'Обязательное поле'),
  entrance: z.string().min(1, 'Обязательное поле'),
  floor: z.string().min(1, 'Обязательное поле').refine(v => /^\d+$/.test(v) && Number(v) > 0, { message: 'Положительное число' }),
})
type Form = z.infer<typeof schema>

const field = (err?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900 transition-all ${err ? 'border-red-400' : 'border-zinc-200'}`

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium text-zinc-600 mb-1.5">{children}</label>
)
const Err = ({ msg }: { msg?: string }) =>
  msg ? <p className="mt-1 text-[11px] text-red-500">{msg}</p> : null

const PhoneInput = ({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError?: boolean }) => (
  <input
    type="tel"
    value={value}
    placeholder="+7XXXXXXXXXX"
    className={field(hasError)}
    onChange={e => {
      const digits = e.target.value.replace(/\D/g, '')
      const without = digits.startsWith('7') ? digits.slice(1) : digits
      onChange('+7' + without.slice(0, 10))
    }}
    onKeyDown={e => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && (e.currentTarget.value === '+7' || e.currentTarget.selectionStart! <= 2)) e.preventDefault()
    }}
  />
)

const AddResidentModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { phoneNumber: '+7' },
  })

  const { mutate, isPending, error: serverError } = useMutation({
    mutationFn: kskResidentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-residents'] })
      reset({ phoneNumber: '+7' })
      toast.success('Жилец создан', { description: 'Временный пароль отправлен на email' })
      onClose()
    },
  })

  const onSubmit = (data: Form) => mutate({
    email: data.email, firstName: data.firstName, lastName: data.lastName,
    phoneNumber: data.phoneNumber === '+7' ? undefined : data.phoneNumber,
    apartmentNumber: data.apartmentNumber, building: data.building,
    entrance: data.entrance, floor: Number(data.floor),
  })

  const handleClose = () => { reset({ phoneNumber: '+7' }); onClose() }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Добавить жильца">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
            Ошибка при создании жильца
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Имя</Label>
            <input {...register('firstName')} className={field(!!errors.firstName)} placeholder="Айгерим" />
            <Err msg={errors.firstName?.message} />
          </div>
          <div>
            <Label>Фамилия</Label>
            <input {...register('lastName')} className={field(!!errors.lastName)} placeholder="Бекова" />
            <Err msg={errors.lastName?.message} />
          </div>
        </div>

        <div>
          <Label>Email</Label>
          <input {...register('email')} type="email" className={field(!!errors.email)} placeholder="resident@mail.kz" />
          <Err msg={errors.email?.message} />
        </div>

        <div>
          <Label>Телефон <span className="text-zinc-400 font-normal">(необязательно)</span></Label>
          <Controller name="phoneNumber" control={control}
            render={({ field: f }) => <PhoneInput value={f.value ?? '+7'} onChange={f.onChange} hasError={!!errors.phoneNumber} />}
          />
          <Err msg={errors.phoneNumber?.message} />
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">Адрес проживания</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label>Квартира</Label>
              <input {...register('apartmentNumber')} className={field(!!errors.apartmentNumber)} placeholder="42" />
              <Err msg={errors.apartmentNumber?.message} />
            </div>
            <div>
              <Label>Корпус</Label>
              <input {...register('building')} className={field(!!errors.building)} placeholder="А" />
              <Err msg={errors.building?.message} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Подъезд</Label>
              <input {...register('entrance')} className={field(!!errors.entrance)} placeholder="3" />
              <Err msg={errors.entrance?.message} />
            </div>
            <div>
              <Label>Этаж</Label>
              <input {...register('floor')} type="number" min={1} className={field(!!errors.floor)} placeholder="5" />
              <Err msg={errors.floor?.message} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-zinc-100">
          <button type="button" onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-sm font-medium transition-colors">
            Отмена
          </button>
          <button type="submit" disabled={isPending}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {isPending ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AddResidentModal
