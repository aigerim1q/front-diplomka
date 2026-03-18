import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { AuthUser, UserRole } from '@/types'
import BrandHeader from './components/BrandHeader'
import PageFooter from './components/PageFooter'

const schema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z
    .string()
    .min(8, 'Минимум 8 символов')
    .regex(/[A-Z]/, 'Должна быть заглавная буква')
    .regex(/[0-9]/, 'Должна быть цифра')
    .regex(/[^A-Za-z0-9]/, 'Должен быть спецсимвол'),
  confirmPassword: z.string().min(1, 'Подтвердите пароль'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

type ChangePasswordForm = z.infer<typeof schema>

const ROLE_MAP: Record<string, number> = {
  'SuperAdmin': 1,
  'ConstructionCompanyAdmin': 2,
  'KskAdmin': 3,
  'BusinessAdmin': 4,
  'Resident': 5,
}

const ROLE_ROUTES: Record<number, string> = {
  1: '/dashboard',
  2: '/construction/dashboard',
  3: '/ksk/dashboard',
  4: '/dashboard',
  5: '/dashboard',
}

const parseJwt = (token: string): AuthUser => {
  const base64 = token.split('.')[1]
  const decoded = JSON.parse(atob(base64))
  const roleValue = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
    ?? decoded.role
  const role = ROLE_MAP[roleValue] ?? 1
  return {
    userId: decoded.sub,
    email: decoded.email,
    role: role as UserRole,
    tenantId: decoded.tenantId,
    mustChangePassword: false,
  }
}

const inputClass = (error?: boolean) =>
  `block w-full px-4 py-3 rounded-lg border shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition ${
    error ? 'border-red-400' : 'border-gray-300'
  }`

const ChangePasswordPage = () => {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [isPending, setIsPending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsPending(true)
    setServerError(null)

    const email = sessionStorage.getItem('pending_email')
    const oldPassword = sessionStorage.getItem('pending_password')

    if (!email || !oldPassword) {
      toast.error('Сессия истекла. Войдите снова.')
      navigate('/login', { replace: true })
      return
    }

    try {
      // Шаг 1: логинимся со старым паролем чтобы получить токен
      const loginRes = await authApi.login({
        email,
        password: oldPassword,
      })

      const { accessToken, refreshToken } = loginRes.data
      setTokens(accessToken, refreshToken)

      // Шаг 2: меняем пароль с полученным токеном
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })

      toast.success('Пароль успешно изменён')

      // Шаг 3: логинимся с новым паролем
      const newLoginRes = await authApi.login({
        email,
        password: data.newPassword,
      })

      const { accessToken: newToken, refreshToken: newRefresh } = newLoginRes.data
      setTokens(newToken, newRefresh)

      const user = parseJwt(newToken)
      user.mustChangePassword = false
      setUser(user)

      // Чистим sessionStorage
      sessionStorage.removeItem('pending_email')
      sessionStorage.removeItem('pending_password')

      navigate(ROLE_ROUTES[user.role] ?? '/login', { replace: true })
    } catch (err: any) {
      const code = err?.response?.data?.code || err?.response?.data?.errorCode
      if (code === 'AUTH_WEAK_PASSWORD') {
        setServerError('Пароль не соответствует требованиям безопасности')
      } else if (code === 'AUTH_INVALID_CREDENTIALS') {
        setServerError('Неверный текущий пароль')
      } else {
        setServerError('Ошибка при смене пароля. Попробуйте снова')
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <main className="w-full max-w-md">
        <BrandHeader />
        <section className="bg-white py-10 px-8 shadow-xl rounded-2xl border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Смена пароля</h2>
            <p className="text-sm text-gray-500 mt-1">
              Для продолжения необходимо сменить временный пароль
            </p>
          </div>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Текущий пароль
              </label>
              <input
                {...register('currentPassword')}
                type="password"
                placeholder="••••••••"
                className={inputClass(!!errors.currentPassword)}
              />
              {errors.currentPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Новый пароль
              </label>
              <input
                {...register('newPassword')}
                type="password"
                placeholder="••••••••"
                className={inputClass(!!errors.newPassword)}
              />
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                Минимум 8 символов, заглавная буква, цифра и спецсимвол
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Подтвердите пароль
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className={inputClass(!!errors.confirmPassword)}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex justify-center py-3.5 px-4 rounded-lg shadow-md text-base font-bold text-white bg-[#2563EB] hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Сохранение...' : 'Сменить пароль'}
            </button>
          </form>
        </section>
        <PageFooter />
      </main>
    </div>
  )
}

export default ChangePasswordPage