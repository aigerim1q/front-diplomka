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
import ConstructionDashboardPage from '@/pages/construction/ConstructionDashboardPage'
import ComplexesPage from '@/pages/construction/ComplexesPage'
import ConstructionAnnouncementsPage from '@/pages/construction/ConstructionAnnouncementsPage'

// KSK pages
import KskDashboardPage from '@/pages/ksk/KskDashboardPage'
import ResidentsPage from '@/pages/ksk/ResidentsPage'
import RequestsPage from '@/pages/ksk/RequestsPage'
import AnnouncementsPage from '@/pages/ksk/AnnouncementsPage'
import PollsPage from '@/pages/ksk/PollsPage'

// Layout
import DashboardLayout from '@/components/layout/DashboardLayout'

export const router = createBrowserRouter([
  // Публичные маршруты
  { path: '/login', element: <LoginPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },

  // Смена пароля
  {
    element: <ProtectedRoute requireChangePassword />,
    children: [
      { path: '/change-password', element: <ChangePasswordPage /> },
    ],
  },

  // SuperAdmin
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

  // ConstructionCompanyAdmin
  {
    element: <ProtectedRoute allowedRoles={[2]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/construction-dashboard', element: <ConstructionDashboardPage /> },
          { path: '/complexes', element: <ComplexesPage /> },
          { path: '/construction-announcements', element: <ConstructionAnnouncementsPage /> },
        ],
      },
    ],
  },

  // KskAdmin
  {
    element: <ProtectedRoute allowedRoles={[3]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/ksk-dashboard', element: <KskDashboardPage /> },
          { path: '/residents', element: <ResidentsPage /> },
          { path: '/requests', element: <RequestsPage /> },
          { path: '/announcements', element: <AnnouncementsPage /> },
          { path: '/polls', element: <PollsPage /> },
        ],
      },
    ],
  },

  // Редиректы
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
])
