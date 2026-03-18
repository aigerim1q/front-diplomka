import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/types'

export const useAuth = () => {
  const { user, accessToken, setTokens, setUser, clearAuth } = useAuthStore()

  const isAuthenticated = !!accessToken && !!user

  const hasRole = (role: UserRole) => user?.role === role

  const isSuperAdmin = user?.role === 1
  const isConstructionAdmin = user?.role === 2
  const isKskAdmin = user?.role === 3
  const isBusinessAdmin = user?.role === 4

  return {
    user,
    isAuthenticated,
    hasRole,
    isSuperAdmin,
    isConstructionAdmin,
    isKskAdmin,
    isBusinessAdmin,
    setTokens,
    setUser,
    clearAuth,
  }
}