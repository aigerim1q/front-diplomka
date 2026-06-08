import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher'
import NotificationsBell from '@/components/shared/NotificationsBell'

const Header = () => {
  const location = useLocation()
  const { t } = useTranslation()

  const ADD_BUTTONS: Record<string, string> = {
    '/users': t('users.addUser'),
    '/tenants': t('tenants.addTenant'),
    '/complexes': t('complexes.addComplex'),
    '/residents': t('residents.addResident'),
    '/workers': t('workers.addWorker'),
    '/polls': t('polls.createPoll'),
    '/construction-polls': t('polls.createPoll'),
    '/announcements': t('announcements.createAnnouncement'),
    '/construction-announcements': t('announcements.createAnnouncement'),
    '/services': t('services.add'),
    '/contacts': t('contacts.add'),
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
    '/chat-lounge': t('chatLounge.title'),
    '/contacts': t('contacts.title'),
  }
  const title = PAGE_TITLES[location.pathname] ?? 'MyHome'
  const addLabel = ADD_BUTTONS[location.pathname]

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <div className="flex items-center gap-4">
        <NotificationsBell />
        <LanguageSwitcher />
        {addLabel && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openAddModal'))}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {addLabel}
          </button>
        )}
      </div>
    </header>
  )
}

export default Header