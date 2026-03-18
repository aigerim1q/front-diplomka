import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher'

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
  remember: z.boolean().optional(),
})

export type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSubmit: (data: LoginFormValues) => Promise<void>
  serverError: string | null
}

const LoginForm = ({ onSubmit, serverError }: LoginFormProps) => {
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <section className="bg-white py-10 px-8 shadow-xl rounded-2xl border border-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
            {t('auth.invalidCredentials')}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="email">
            {t('auth.email')}
          </label>
          <input
            {...register('email')}
            id="email"
            type="email"
            placeholder="admin@myhome.com"
            className={`block w-full px-4 py-3 rounded-lg border shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition ${
              errors.email ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Пароль */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-semibold text-gray-700" htmlFor="password">
              {t('auth.password')}
            </label>
            <a href="#" className="text-sm font-bold text-[#2563EB] hover:text-blue-700 transition">
              {t('auth.forgotPassword')}
            </a>
          </div>
          <input
            {...register('password')}
            id="password"
            type="password"
            placeholder="••••••••"
            className={`block w-full px-4 py-3 rounded-lg border shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition ${
              errors.password ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              {...register('remember')}
              id="remember"
              type="checkbox"
              className="h-4 w-4 text-[#2563EB] focus:ring-[#2563EB] border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-600 cursor-pointer">
              {t('auth.rememberDevice')}
            </label>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Кнопка */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-3.5 px-4 rounded-lg shadow-md text-base font-bold text-white bg-[#2563EB] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </button>

      </form>
    </section>
  )
}

export default LoginForm