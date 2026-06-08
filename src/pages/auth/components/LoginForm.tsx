import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'

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

const DEMO_ACCOUNTS = [
  { label: 'КСК Админ', email: 'nugmanmyrzabek8@gmail.com', password: 'Qwerty.2026' },
  { label: 'Застройщик', email: 'nugmanmyrzabek@gmail.com', password: 'Qwerty.2026' },
  { label: 'Супер Админ', email: 'superadmin@housing.kz', password: 'SuperAdmin123!' },
]

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
    <section>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{t('auth.welcomeBack')}</h1>
        <p className="text-sm text-zinc-500 mt-1.5">{t('auth.welcomeSubtitle')}</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
            {t('auth.invalidCredentials')}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="email">
            {t('auth.email')}
          </label>
          <input
            {...register('email')}
            id="email"
            type="email"
            placeholder="admin@myhome.com"
            className={`block w-full px-3.5 py-2.5 rounded-lg border text-zinc-900 placeholder:text-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition ${
              errors.email ? 'border-red-400' : 'border-zinc-200 hover:border-zinc-300'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Пароль */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-zinc-700" htmlFor="password">
              {t('auth.password')}
            </label>
            <a href="#" className="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition">
              {t('auth.forgotPassword')}
            </a>
          </div>
          <input
            {...register('password')}
            id="password"
            type="password"
            placeholder="••••••••"
            className={`block w-full px-3.5 py-2.5 rounded-lg border text-zinc-900 placeholder:text-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition ${
              errors.password ? 'border-red-400' : 'border-zinc-200 hover:border-zinc-300'
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <input
            {...register('remember')}
            id="remember"
            type="checkbox"
            className="h-4 w-4 accent-zinc-900 border-zinc-300 rounded cursor-pointer"
          />
          <label htmlFor="remember" className="text-sm text-zinc-600 cursor-pointer">
            {t('auth.rememberDevice')}
          </label>
        </div>

        {/* Кнопка */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </button>

        {/* Демо-аккаунты */}
        <div className="pt-2 border-t border-zinc-100">
          <p className="text-xs font-medium text-zinc-400 mb-3 text-center uppercase tracking-wide">Демо-доступ</p>
          <div className="flex flex-col gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.label}
                type="button"
                disabled={isSubmitting}
                onClick={() => onSubmit({ email: acc.email, password: acc.password })}
                className="w-full flex items-center justify-between py-2.5 px-4 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm font-semibold text-zinc-800">{acc.label}</span>
                <span className="text-xs text-zinc-400">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>

      </form>
    </section>
  )
}

export default LoginForm
