import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import Modal from '@/components/shared/Modal'
import { kskContactsApi } from '@/api/kskContacts'
import { ContactDto, ContactPositionDto } from '@/types'

const PHONE_RE = /^\+7\d{10}$/

const schema = z.object({
  name:              z.string().min(1, 'Обязательное поле').max(300),
  contactPositionId: z.string().min(1, 'Выберите должность'),
  phone:             z.string().regex(PHONE_RE, 'Введите полный номер: +7XXXXXXXXXX'),
  notes:             z.string().max(2000).optional().or(z.literal('')),
})
type Form = z.infer<typeof schema>

const field = (err?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900 transition-all ${err ? 'border-red-400' : 'border-zinc-200'}`

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium text-zinc-600 mb-1.5">{children}</label>
)

// Phone input with fixed +7 prefix
const PhoneInput = ({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError?: boolean }) => (
  <div className={`flex rounded-lg border overflow-hidden transition-all focus-within:ring-2 focus-within:ring-zinc-900 ${hasError ? 'border-red-400' : 'border-zinc-200'}`}>
    <span className="px-3 py-2 bg-zinc-50 border-r border-zinc-200 text-sm text-zinc-500 font-medium select-none shrink-0">
      +7
    </span>
    <input
      type="tel"
      inputMode="numeric"
      value={value.replace(/^\+7/, '')}
      placeholder="XXX XXX XX XX"
      className="flex-1 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none bg-white"
      maxLength={10}
      onChange={e => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
        onChange('+7' + digits)
      }}
    />
  </div>
)

const parseStored = (description: string) => {
  const lines = description.split('\n')
  const phoneLine = lines.find(l => PHONE_RE.test(l.trim()))
  const notes = lines.filter(l => !PHONE_RE.test(l.trim())).join('\n').trim()
  return { phone: phoneLine?.trim() ?? '+7', notes }
}

interface Props {
  isOpen: boolean; onClose: () => void
  positions: ContactPositionDto[]; editContact?: ContactDto | null
}

const AddContactModal = ({ isOpen, onClose, positions, editContact }: Props) => {
  const queryClient = useQueryClient()
  const isEdit = !!editContact

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '+7' },
  })

  useEffect(() => {
    if (editContact) {
      const { phone, notes } = parseStored(editContact.description)
      reset({ name: editContact.name, contactPositionId: editContact.position.id, phone: phone || '+7', notes })
    } else if (isOpen) {
      reset({ name: '', contactPositionId: '', phone: '+7', notes: '' })
    }
  }, [editContact, isOpen, reset])

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Form) => {
      const parts = [data.phone.trim(), data.notes?.trim()].filter(Boolean)
      const payload = { name: data.name, contactPositionId: data.contactPositionId, description: parts.join('\n') }
      return isEdit ? kskContactsApi.updateContact(editContact!.id, payload) : kskContactsApi.createContact(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-contacts'] })
      toast.success(isEdit ? 'Контакт обновлён' : 'Контакт добавлен')
      handleClose()
    },
    onError: (err: unknown) => {
      toast.error(axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Ошибка') : 'Ошибка')
    },
  })

  const handleClose = () => { reset({ phone: '+7' }); onClose() }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? 'Редактировать контакт' : 'Добавить контакт'} size="sm">
      <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">

        <div>
          <Label>ФИО / Название</Label>
          <input {...register('name')} className={field(!!errors.name)} placeholder="Ахметов Нурлан Серикович" />
          {errors.name && <p className="mt-1 text-[11px] text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <Label>Должность</Label>
          <select {...register('contactPositionId')} className={field(!!errors.contactPositionId)} defaultValue="">
            <option value="" disabled>— Выберите должность —</option>
            {positions.map(p => (
              <option key={p.id} value={p.id}>{p.name}{p.isDefault ? ' (системная)' : ''}</option>
            ))}
          </select>
          {errors.contactPositionId && <p className="mt-1 text-[11px] text-red-500">{errors.contactPositionId.message}</p>}
        </div>

        <div>
          <Label>Телефон</Label>
          <Controller name="phone" control={control}
            render={({ field: f }) => <PhoneInput value={f.value} onChange={f.onChange} hasError={!!errors.phone} />}
          />
          {errors.phone && <p className="mt-1 text-[11px] text-red-500">{errors.phone.message}</p>}
        </div>

        <div>
          <Label>Описание <span className="text-zinc-400 font-normal">(необязательно)</span></Label>
          <textarea {...register('notes')} rows={2}
            className={`${field(!!errors.notes)} resize-none`}
            placeholder="Режим работы, примечания..." />
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-zinc-100">
          <button type="button" onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-sm font-medium transition-colors">
            Отмена
          </button>
          <button type="submit" disabled={isPending}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {isPending ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AddContactModal
