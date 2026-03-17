import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Modal from '@/components/shared/Modal'
import { usersApi } from '@/api/users'
import { tenantsApi } from '@/api/tenants'
import { UserRole } from '@/types'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  firstName: z.string().min(1, 'Обязательное поле'),
  lastName: z.string().min(1, 'Обязательное поле'),
  role: z.string().min(1, 'Выберите роль'),
  tenantId: z.string().min(1, 'Выберите организацию'),
})

type AddUserForm = z.infer<typeof schema>

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (password: string, email: string) => void
}

const ROLES = [
  { value: 2, label: 'Construction Company Admin' },
  { value: 3, label: 'KSK Admin' },
  { value: 4, label: 'Business Admin' },
]

const inputClass = (error?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
    error ? 'border-red-400' : 'border-slate-200'
  }`

const AddUserModal = ({ isOpen, onClose, onSuccess }: AddUserModalProps) => {
  const queryClient = useQueryClient()
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.getAll(),
    enabled: isOpen,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddUserForm>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending, error: serverError } = useMutation({
    mutationFn: usersApi.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      reset()
      setCreatedUser({ email: res.data.email, password: res.data.temporaryPassword })
    },
  })

  const onSubmit = (data: AddUserForm) => {
    mutate({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: Number(data.role) as UserRole,
      tenantId: data.tenantId,
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(createdUser?.password ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setCreatedUser(null)
    setCopied(false)
    onClose()
  }

  // Экран успеха
  if (createdUser) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Пользователь создан!">
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <span className="material-symbols-outlined text-emerald-500">check_circle</span>
              <span className="font-semibold text-sm">Аккаунт успешно создан</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-500 mb-1">Email</p>
                <p className="font-mono text-sm font-bold text-slate-800">{createdUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Временный пароль</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1">
                    {createdUser.password}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    title="Скопировать"
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Добавить пользователя">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
            Ошибка при создании пользователя
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Имя</label>
            <input {...register('firstName')} className={inputClass(!!errors.firstName)} placeholder="Иван" />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Фамилия</label>
            <input {...register('lastName')} className={inputClass(!!errors.lastName)} placeholder="Петров" />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
          <input {...register('email')} type="email" className={inputClass(!!errors.email)} placeholder="user@example.com" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Роль</label>
          <select {...register('role')} className={inputClass(!!errors.role)}>
            <option value="">Выберите роль</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Организация</label>
          <select {...register('tenantId')} className={inputClass(!!errors.tenantId)}>
            <option value="">Выберите организацию</option>
            {tenantsData?.data.items.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {errors.tenantId && <p className="mt-1 text-xs text-red-500">{errors.tenantId.message}</p>}
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

export default AddUserModal