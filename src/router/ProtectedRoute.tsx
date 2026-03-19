import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  requireChangePassword?: boolean
}

const ProtectedRoute = ({ allowedRoles, requireChangePassword }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth()

  // Не авторизован — на логин
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Маршрут только для смены пароля
  if (requireChangePassword) {
    if (!user?.mustChangePassword) {
      return <Navigate to="/dashboard" replace />
    }
    return <Outlet />
  }

  // Обычный защищённый маршрут — если mustChangePassword, гоним на смену пароля
  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user!.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default ProtectedRoute