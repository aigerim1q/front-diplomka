import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, type LucideIcon,
  LayoutDashboard, ClipboardList, Users, HardHat,
  Megaphone, BarChart2, ShoppingBag, MessageSquare,
  Briefcase, BookUser, ReceiptText,
  Building2, Building, UserCog,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

interface NavItem {
  labelKey: string
  icon: LucideIcon
  to: string
}

const SUPER_ADMIN_NAV: NavItem[][] = [[
  { labelKey: 'nav.dashboard',  icon: LayoutDashboard, to: '/dashboard' },
  { labelKey: 'nav.users',      icon: Users,           to: '/users' },
  { labelKey: 'nav.tenants',    icon: Building,        to: '/tenants' },
]]

const CONSTRUCTION_NAV: NavItem[][] = [[
  { labelKey: 'nav.dashboard',     icon: LayoutDashboard, to: '/construction-dashboard' },
  { labelKey: 'nav.complexes',     icon: Building2,       to: '/complexes' },
  { labelKey: 'nav.announcements', icon: Megaphone,       to: '/construction-announcements' },
  { labelKey: 'nav.polls',         icon: BarChart2,       to: '/construction-polls' },
]]

const KSK_NAV: NavItem[][] = [
  [
    { labelKey: 'nav.dashboard', icon: LayoutDashboard, to: '/ksk-dashboard' },
    { labelKey: 'nav.requests',  icon: ClipboardList,   to: '/requests' },
    { labelKey: 'nav.residents', icon: Users,           to: '/residents' },
    { labelKey: 'nav.workers',   icon: HardHat,         to: '/workers' },
  ],
  [
    { labelKey: 'nav.announcements', icon: Megaphone,      to: '/announcements' },
    { labelKey: 'nav.polls',         icon: BarChart2,      to: '/polls' },
    { labelKey: 'nav.classifieds',   icon: ShoppingBag,    to: '/classifieds' },
    { labelKey: 'nav.chatLounge',    icon: MessageSquare,  to: '/chat' },
  ],
  [
    { labelKey: 'nav.services',  icon: Briefcase,    to: '/services' },
    { labelKey: 'nav.contacts',  icon: BookUser,     to: '/contacts' },
    { labelKey: 'nav.reports',   icon: ReceiptText,  to: '/reports' },
  ],
]

// KskSeniorAdmin: same as KSK but +team section, no chat lounge (no complexId)
const KSK_SENIOR_NAV: NavItem[][] = [
  [
    { labelKey: 'nav.dashboard', icon: LayoutDashboard, to: '/ksk-dashboard' },
    { labelKey: 'nav.requests',  icon: ClipboardList,   to: '/requests' },
    { labelKey: 'nav.residents', icon: Users,           to: '/residents' },
    { labelKey: 'nav.workers',   icon: HardHat,         to: '/workers' },
  ],
  [
    { labelKey: 'nav.announcements', icon: Megaphone,   to: '/announcements' },
    { labelKey: 'nav.polls',         icon: BarChart2,   to: '/polls' },
    { labelKey: 'nav.classifieds',   icon: ShoppingBag, to: '/classifieds' },
  ],
  [
    { labelKey: 'nav.services',  icon: Briefcase,    to: '/services' },
    { labelKey: 'nav.contacts',  icon: BookUser,     to: '/contacts' },
    { labelKey: 'nav.reports',   icon: ReceiptText,  to: '/reports' },
  ],
  [
    { labelKey: 'nav.team', icon: UserCog, to: '/team' },
  ],
]

const ROLE_NAV: Record<number, NavItem[][]> = {
  1: SUPER_ADMIN_NAV,
  2: CONSTRUCTION_NAV,
  3: KSK_NAV,
  7: KSK_SENIOR_NAV,
}

const ROLE_LABEL_KEY: Record<number, string> = {
  1: 'users.roles.superAdmin',
  2: 'users.roles.constructionAdmin',
  3: 'users.roles.kskAdmin',
  7: 'users.roles.kskSeniorAdmin',
}

const Sidebar = () => {
  const { user, clearAuth } = useAuth()
  const { refreshToken } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const navGroups = ROLE_NAV[user?.role ?? 1] ?? SUPER_ADMIN_NAV
  const roleKey   = ROLE_LABEL_KEY[user?.role ?? 1] ?? 'users.roles.superAdmin'
  const roleLabel = t(roleKey)
  const initials  = user?.email?.[0]?.toUpperCase() ?? 'U'

  const handleLogout = async () => {
    try { if (refreshToken) await authApi.logout(refreshToken) }
    finally { clearAuth(); navigate('/login', { replace: true }) }
  }

  return (
    <aside className="w-[240px] fixed inset-y-0 left-0 bg-white border-r border-zinc-200 flex flex-col z-50">

      {/* Logo */}
      <div className="h-14 px-4 flex items-center gap-3 border-b border-zinc-100 shrink-0">
        <div className="size-8 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
          <Building2 size={16} className="text-white" />
        </div>
        <span className="text-base font-bold text-zinc-900 tracking-tight">MyHome</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="my-2 border-t border-zinc-100" />}
            <div className="space-y-0.5">
              {group.map(({ to, labelKey, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors outline-none ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-900 font-semibold'
                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
                    }`
                  }
                >
                  <Icon size={16} strokeWidth={1.75} className="shrink-0" />
                  {t(labelKey)}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-zinc-100 p-3 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="size-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 font-semibold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate">{user?.email}</p>
            <p className="text-xs text-zinc-500 truncate">{roleLabel}</p>
          </div>
          <button
            onClick={handleLogout}
            title={t('auth.logout')}
            className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-zinc-50 transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
