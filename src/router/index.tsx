import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

// Auth pages
import LoginPage from '@/pages/auth/LoginPage'
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage'
import UnauthorizedPage from '@/pages/auth/UnauthorizedPage'

// Super Admin pages
import SuperAdminDashboardPage from '@/pages/super-admin/DashboardPage'
import UsersPage from '@/pages/super-admin/UsersPage'
import TenantsPage from '@/pages/super-admin/TenantsPage'

// Construction pages
import ConstructionDashboardPage from '@/pages/construction/DashboardPage'
import ComplexesPage from '@/pages/construction/ComplexesPage'

// KSK pages
import KskDashboardPage from '@/pages/ksk/DashboardPage'
import ResidentsPage from '@/pages/ksk/ResidentsPage'

// Layout
import DashboardLayout from '@/components/layout/DashboardLayout'

export const router = createBrowserRouter([
  // Публичные маршруты
  { path: '/login', element: <LoginPage /> },
  { path: '/change-password', element: <ChangePasswordPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },

  // SuperAdmin маршруты (role: 1)
  {
    element: <ProtectedRoute allowedRoles={[1]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <SuperAdminDashboardPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/tenants', element: <TenantsPage /> },
        ],
      },
    ],
  },

  // ConstructionCompanyAdmin маршруты (role: 2)
  {
    element: <ProtectedRoute allowedRoles={[2]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/construction/dashboard', element: <ConstructionDashboardPage /> },
          { path: '/complexes', element: <ComplexesPage /> },
        ],
      },
    ],
  },

  // KskAdmin маршруты (role: 3)
  {
    element: <ProtectedRoute allowedRoles={[3]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/ksk/dashboard', element: <KskDashboardPage /> },
          { path: '/residents', element: <ResidentsPage /> },
        ],
      },
    ],
  },

  // Редиректы
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
])