import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

interface NavItem {
  labelKey: string
  icon: string
  to: string
}

const SUPER_ADMIN_NAV: NavItem[] = [
  { labelKey: 'nav.dashboard', icon: 'dashboard', to: '/dashboard' },
  { labelKey: 'nav.users', icon: 'group', to: '/users' },
  { labelKey: 'nav.tenants', icon: 'location_city', to: '/tenants' },
]

const CONSTRUCTION_NAV: NavItem[] = [
  { labelKey: 'nav.dashboard', icon: 'dashboard', to: '/construction-dashboard' },
  { labelKey: 'nav.complexes', icon: 'home_work', to: '/complexes' },
  { labelKey: 'nav.announcements', icon: 'campaign', to: '/construction-announcements' },
]

const KSK_NAV: NavItem[] = [
  { labelKey: 'nav.dashboard', icon: 'dashboard', to: '/ksk-dashboard' },
  { labelKey: 'nav.requests', icon: 'move_to_inbox', to: '/requests' },
  { labelKey: 'nav.residents', icon: 'group', to: '/residents' },
  { labelKey: 'nav.announcements', icon: 'campaign', to: '/announcements' },
  { labelKey: 'nav.polls', icon: 'poll', to: '/polls' },
]

const ROLE_NAV: Record<number, NavItem[]> = {
  1: SUPER_ADMIN_NAV,
  2: CONSTRUCTION_NAV,
  3: KSK_NAV,
}

const ROLE_LABEL_KEY: Record<number, string> = {
  1: 'users.roles.superAdmin',
  2: 'users.roles.constructionAdmin',
  3: 'users.roles.kskAdmin',
}

const Sidebar = () => {
  const { user, clearAuth } = useAuth()
  const { refreshToken } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const navItems = ROLE_NAV[user?.role ?? 1] ?? SUPER_ADMIN_NAV
  const roleLabel = t(ROLE_LABEL_KEY[user?.role ?? 1])

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } finally {
      clearAuth()
      navigate('/login', { replace: true })
    }
  }

  return (
    <aside className="w-[240px] fixed inset-y-0 left-0 bg-white border-r border-slate-200 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary rounded-lg p-2 flex items-center justify-center text-white">
          <span className="material-symbols-outlined">domain</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary">MyHome</h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{roleLabel}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined text-[22px] ${!isActive && 'group-hover:text-primary'}`}>
                  {item.icon}
                </span>
                <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {t(item.labelKey)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 p-2">
          <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold truncate">{user?.email}</p>
            <p className="text-xs text-slate-500 truncate">{roleLabel}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-500 transition-colors"
            title={t('auth.logout')}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
