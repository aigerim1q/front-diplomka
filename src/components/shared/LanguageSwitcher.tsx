import { useTranslation } from 'react-i18next'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ru' ? 'kk' : 'ru')
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-600"
    >
      <span className="material-symbols-outlined text-[16px]">language</span>
      {i18n.language === 'ru' ? 'ҚАЗ' : 'РУС'}
    </button>
  )
}

export default LanguageSwitcher