import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher'
import NotificationsBell from '@/components/shared/NotificationsBell'

const Header = () => {
  const location = useLocation()
  const { t } = useTranslation()
  const { user, isKskAdmin } = useAuth()

  const ADD_BUTTONS: Record<string, string> = {
    '/users': t('users.addUser'),
    '/tenants': t('tenants.addTenant'),
    '/construction-polls': t('polls.createPoll'),
    '/polls': t('polls.createPoll'),
  }

  const PAGE_TITLES: Record<string, string> = {
    '/dashboard': t('dashboard.title'),
    '/ksk-dashboard': t('dashboard.title'),
    '/users': t('users.title'),
    '/tenants': t('tenants.title'),
    '/complexes': t('complexes.title'),
    '/construction-dashboard': t('dashboard.title'),
    '/construction-announcements': t('nav.announcements'),
    '/construction-polls': t('nav.polls'),
    '/residents': t('residents.title'),
    '/workers': t('workers.title'),
    '/requests': t('nav.requests'),
    '/announcements': t('nav.announcements'),
    '/polls': t('nav.polls'),
    '/services': t('services.title'),
    '/classifieds': t('classifieds.title'),
    '/chat': t('chatLounge.title'),
    '/contacts': t('contacts.title'),
    '/team': 'Команда',
  }

  const title = PAGE_TITLES[location.pathname] ?? 'MyHome'
  const addLabel = ADD_BUTTONS[location.pathname]
  const showSearch = location.pathname !== '/complexes'

  return (
    <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        {isKskAdmin && user?.complexId && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-500 text-xs font-medium">
            <span className="material-symbols-outlined text-[13px]">apartment</span>
            ЖК #{user.complexId.slice(0, 8)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
            <input
              className="pl-8 pr-3 py-1.5 bg-zinc-100 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 w-52 transition-all"
              placeholder={t('common.search')}
              type="text"
            />
          </div>
        )}
        <NotificationsBell />
        <LanguageSwitcher />
        {addLabel && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openAddModal'))}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            {addLabel}
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
