import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher'

const Header = () => {
  const location = useLocation()
  const { t } = useTranslation()

  const ADD_BUTTONS: Record<string, string> = {
    '/users': t('users.addUser'),
    '/tenants': t('tenants.addTenant'),
    '/complexes': t('complexes.addComplex'),
    '/residents': t('residents.addResident'),
  }

  const PAGE_TITLES: Record<string, string> = {
    '/dashboard': t('dashboard.title'),
    '/users': t('users.title'),
    '/tenants': t('tenants.title'),
    '/complexes': t('complexes.title'),
    '/residents': t('residents.title'),
  }

  const title = PAGE_TITLES[location.pathname] ?? 'MyHome'
  const addLabel = ADD_BUTTONS[location.pathname]

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            className="pl-10 pr-4 py-1.5 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary w-64 outline-none"
            placeholder={t('common.search')}
            type="text"
          />
        </div>
        <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
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