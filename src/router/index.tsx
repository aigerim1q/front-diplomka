import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

// Auth pages
import LoginPage from '@/pages/auth/LoginPage'
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage'
import UnauthorizedPage from '@/pages/auth/UnauthorizedPage'

// Super Admin pages
import DashboardPage from '@/pages/super-admin/DashboardPage'
import UsersPage from '@/pages/super-admin/UsersPage'
import TenantsPage from '@/pages/super-admin/TenantsPage'

// Construction pages
import ComplexesPage from '@/pages/construction/ComplexesPage'

// KSK pages
import ResidentsPage from '@/pages/ksk/ResidentsPage'

// Layout
import DashboardLayout from '@/components/layout/DashboardLayout'

export const router = createBrowserRouter([
  // Публичные маршруты
  { path: '/login', element: <LoginPage /> },
  { path: '/change-password', element: <ChangePasswordPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },

  // SuperAdmin маршруты
  {
    element: <ProtectedRoute allowedRoles={[1]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/tenants', element: <TenantsPage /> },
        ],
      },
    ],
  },

  // ConstructionCompanyAdmin маршруты
  {
    element: <ProtectedRoute allowedRoles={[2]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/complexes', element: <ComplexesPage /> },
        ],
      },
    ],
  },

  // KskAdmin маршруты
  {
    element: <ProtectedRoute allowedRoles={[3]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/residents', element: <ResidentsPage /> },
        ],
      },
    ],
  },

  // Редиректы
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
])