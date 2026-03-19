import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import BrandHeader from './components/BrandHeader'
import PageFooter from './components/PageFooter'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z
      .string()
      .min(8, 'Минимум 8 символов')
      .regex(/[A-Z]/, 'Должна быть хотя бы одна заглавная буква')
      .regex(/[0-9]/, 'Должна быть хотя бы одна цифра')
      .regex(/[^A-Za-z0-9]/, 'Должен быть хотя бы один спецсимвол'),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type ChangePasswordForm = z.infer<typeof schema>

const inputClass = (hasError?: boolean) =>
  `block w-full px-4 py-3 rounded-lg border shadow-sm text-gray-900 placeholder-gray-400
   focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition
   ${hasError ? 'border-red-400' : 'border-gray-300'}`

const ChangePasswordPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { clearAuth, setUser, user } = useAuthStore()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: ChangePasswordForm) => {
    setServerError(null)
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })

      // Сбрасываем флаг в сторе и редиректим на логин
      if (user) {
        setUser({ ...user, mustChangePassword: false })
      }
      clearAuth()
      navigate('/login', { replace: true })
    } catch (err: any) {
      const code = err?.response?.data?.code
      if (code === 'AUTH_INVALID_CREDENTIALS') {
        setServerError('Текущий пароль введён неверно')
      } else {
        setServerError('Произошла ошибка. Попробуйте позже')
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <main className="w-full max-w-md">
        <BrandHeader />

        <section className="bg-white py-10 px-8 shadow-xl rounded-2xl border border-gray-100">
          {/* Заголовок */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('auth.changePassword')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('auth.mustChangePassword')}</p>
          </div>

          {/* Предупреждение */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
            <span className="material-symbols-outlined text-amber-500 text-[20px] mt-0.5 flex-shrink-0">
              info
            </span>
            <p className="text-sm text-amber-700">
              Вам выдан временный пароль. Придумайте новый пароль для входа в систему.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                {serverError}
              </div>
            )}

            {/* Текущий пароль */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('auth.currentPassword')}
              </label>
              <div className="relative">
                <input
                  {...register('currentPassword')}
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={inputClass(!!errors.currentPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showCurrent ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>
              )}
            </div>

            {/* Новый пароль */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('auth.newPassword')}
              </label>
              <div className="relative">
                <input
                  {...register('newPassword')}
                  type={showNew ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={inputClass(!!errors.newPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showNew ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Минимум 8 символов, заглавная буква, цифра и спецсимвол (!@#$...)
              </p>
            </div>

            {/* Подтверждение */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={inputClass(!!errors.confirmPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showConfirm ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3.5 px-4 rounded-lg shadow-md text-base font-bold text-white bg-[#2563EB] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? 'Сохранение...' : t('common.save')}
            </button>
          </form>
        </section>

        <PageFooter />
      </main>
    </div>
  )
}

export default ChangePasswordPage