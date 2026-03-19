import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import { AuthUser, UserRole } from '@/types'
import BrandHeader from './components/BrandHeader'
import LoginForm, { LoginFormValues } from './components/LoginForm'
import PageFooter from './components/PageFooter'

const ROLE_MAP: Record<string, number> = {
  'SuperAdmin': 1,
  'ConstructionCompanyAdmin': 2,
  'KskAdmin': 3,
  'BusinessAdmin': 4,
  'Resident': 5,
}

const ROLE_ROUTES: Record<number, string> = {
  1: '/dashboard',
  2: '/construction-dashboard',
  3: '/residents',
  4: '/dashboard',
  5: '/dashboard',
}

// Ключ роли в JWT от .NET Identity
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

const parseJwt = (token: string): AuthUser => {
  const base64 = token.split('.')[1]
  const decoded = JSON.parse(atob(base64))
  const roleClaim = decoded[ROLE_CLAIM] ?? decoded.role
  const role = ROLE_MAP[roleClaim] ?? 1
  return {
    userId: decoded.sub,
    email: decoded.email,
    role: role as UserRole,
    tenantId: decoded.tenantId,
    mustChangePassword: false,
  }
}

const LoginPage = () => {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [serverError, setServerError] = useState<string | null>(null)

  const handleLogin = async (data: LoginFormValues) => {
    setServerError(null)
    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      })

      const { accessToken, refreshToken, mustChangePassword } = response.data

      setTokens(accessToken, refreshToken)

      const user = parseJwt(accessToken)
      user.mustChangePassword = mustChangePassword
      setUser(user)

      if (mustChangePassword) {
        navigate('/change-password', { replace: true })
        return
      }

      navigate(ROLE_ROUTES[user.role] ?? '/login', { replace: true })
    } catch (err: any) {
      const code = err?.response?.data?.code
      if (code === 'AUTH_INVALID_CREDENTIALS') {
        setServerError('Неверный email или пароль')
      } else {
        setServerError('Произошла ошибка. Попробуйте позже')
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <main className="w-full max-w-md">
        <BrandHeader />
        <LoginForm onSubmit={handleLogin} serverError={serverError} />
        <PageFooter />
      </main>
    </div>
  )
}

export default LoginPage