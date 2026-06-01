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
import ConstructionPollsPage from '@/pages/construction/ConstructionPollsPage'

// KSK pages
import KskDashboardPage from '@/pages/ksk/KskDashboardPage'
import ResidentsPage from '@/pages/ksk/ResidentsPage'
import WorkersPage from '@/pages/ksk/WorkersPage'
import RequestsPage from '@/pages/ksk/RequestsPage'
import AnnouncementsPage from '@/pages/ksk/AnnouncementsPage_ksk'
import PollsPage from '@/pages/ksk/PollsPage'
import ServicesPage from '@/pages/ksk/ServicesPage'
import ClassifiedsPage from '@/pages/ksk/ClassifiedsPage'
import ChatPage from '@/pages/ksk/ChatPage'
import TeamPage from '@/pages/ksk/TeamPage'
import ContactsPage from '@/pages/ksk/ContactsPage'
import ReportsPage from '@/pages/ksk/ReportsPage'

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
          { path: '/construction-polls', element: <ConstructionPollsPage /> },
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
          { path: '/workers', element: <WorkersPage /> },
          { path: '/requests', element: <RequestsPage /> },
          { path: '/announcements', element: <AnnouncementsPage /> },
          { path: '/polls', element: <PollsPage /> },
          { path: '/services', element: <ServicesPage /> },
          { path: '/classifieds', element: <ClassifiedsPage /> },
          { path: '/chat', element: <ChatPage /> },
          { path: '/contacts', element: <ContactsPage /> },
          { path: '/reports', element: <ReportsPage /> },
        ],
      },
    ],
  },


  // KskSeniorAdmin
  {
    element: <ProtectedRoute allowedRoles={[7]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/team',          element: <TeamPage /> },
          { path: '/ksk-dashboard', element: <KskDashboardPage /> },
          { path: '/residents',     element: <ResidentsPage /> },
          { path: '/workers',       element: <WorkersPage /> },
          { path: '/requests',      element: <RequestsPage /> },
          { path: '/announcements', element: <AnnouncementsPage /> },
          { path: '/polls',         element: <PollsPage /> },
          { path: '/services',      element: <ServicesPage /> },
          { path: '/classifieds',   element: <ClassifiedsPage /> },
          { path: '/contacts',      element: <ContactsPage /> },
          { path: '/reports',       element: <ReportsPage /> },
        ],
      },
    ],
  },

  // Редиректы
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
])
