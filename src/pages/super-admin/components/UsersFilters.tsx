import { useTranslation } from 'react-i18next'

interface UsersFiltersProps {
  search: string
  role: string
  status: string
  onSearchChange: (v: string) => void
  onRoleChange: (v: string) => void
  onStatusChange: (v: string) => void
  onClear: () => void
}

const selectClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm'

const UsersFilters = ({
  search, role, status,
  onSearchChange, onRoleChange, onStatusChange, onClear,
}: UsersFiltersProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="relative flex-1 w-full">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
          placeholder={t('users.searchPlaceholder')}
        />
      </div>
      <div className="w-full md:w-40">
        <select value={role} onChange={(e) => onRoleChange(e.target.value)} className={selectClass}>
          <option value="">{t('common.allRoles')}</option>
          <option value="2">{t('users.roles.constructionAdmin')}</option>
          <option value="3">{t('users.roles.kskAdmin')}</option>
          <option value="4">{t('users.roles.businessAdmin')}</option>
        </select>
      </div>
      <div className="w-full md:w-40">
        <select value={status} onChange={(e) => onStatusChange(e.target.value)} className={selectClass}>
          <option value="">{t('common.allStatuses')}</option>
          <option value="1">{t('common.active')}</option>
          <option value="2">{t('common.blocked')}</option>
        </select>
      </div>
      <button
        onClick={onClear}
        className="w-full md:w-auto px-4 py-2 text-slate-600 font-medium text-sm hover:text-primary transition-colors"
      >
        {t('common.clearFilters')}
      </button>
    </div>
  )
}

export default UsersFilters