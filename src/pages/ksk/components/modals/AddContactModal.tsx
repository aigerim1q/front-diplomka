import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import Modal from '@/components/shared/Modal'
import { kskContactsApi } from '@/api/kskContacts'
import { ContactDto, ContactPositionDto } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(300, 'Максимум 300 символов'),
  description: z.string().min(1, 'Обязательное поле').max(2000, 'Максимум 2000 символов'),
  contactPositionId: z.string().min(1, 'Выберите должность'),
})

type ContactForm = z.infer<typeof schema>

interface AddContactModalProps {
  isOpen: boolean
  onClose: () => void
  positions: ContactPositionDto[]
  editContact?: ContactDto | null
}

const inputClass = (error?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
    error ? 'border-red-400' : 'border-slate-200'
  }`

const AddContactModal = ({ isOpen, onClose, positions, editContact }: AddContactModalProps) => {
  const queryClient = useQueryClient()
  const isEdit = !!editContact

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactForm>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (editContact) {
      reset({
        name: editContact.name,
        description: editContact.description,
        contactPositionId: editContact.position.id,
      })
    } else if (isOpen) {
      reset({ name: '', description: '', contactPositionId: '' })
    }
  }, [editContact, isOpen, reset])

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ContactForm) =>
      isEdit
        ? kskContactsApi.updateContact(editContact!.id, data)
        : kskContactsApi.createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-contacts'] })
      toast.success(isEdit ? 'Контакт обновлён' : 'Контакт добавлен')
      handleClose()
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message ?? 'Не удалось сохранить контакт')
      } else {
        toast.error('Не удалось сохранить контакт')
      }
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? 'Редактировать контакт' : 'Добавить контакт'}>
      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">ФИО / Название</label>
          <input
            {...register('name')}
            className={inputClass(!!errors.name)}
            placeholder="Ахметов Нурлан Серикович"
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Должность</label>
          <select
            {...register('contactPositionId')}
            className={inputClass(!!errors.contactPositionId)}
            defaultValue=""
          >
            <option value="" disabled>— Выберите должность —</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.isDefault ? ' (системная)' : ''}
              </option>
            ))}
          </select>
          {errors.contactPositionId && (
            <p className="mt-1 text-xs text-red-500">{errors.contactPositionId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Описание / контакты</label>
          <textarea
            {...register('description')}
            rows={4}
            className={inputClass(!!errors.description)}
            placeholder="Круглосуточно, тел. +77001234567"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
          )}
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
            {isPending ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AddContactModal
