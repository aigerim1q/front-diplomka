import { useTranslation } from 'react-i18next'
import { Building2, ClipboardList, MessageSquare, BarChart3, type LucideIcon } from 'lucide-react'

const FEATURES: { icon: LucideIcon; key: string }[] = [
  { icon: ClipboardList, key: 'auth.feature1' },
  { icon: MessageSquare, key: 'auth.feature2' },
  { icon: BarChart3,     key: 'auth.feature3' },
]

const BrandPanel = () => {
  const { t } = useTranslation()

  return (
    <aside className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative overflow-hidden bg-zinc-950 text-white flex-col justify-between p-12 xl:p-16">
      {/* Background photo (Unsplash CDN) */}
      <img
        src="https://images.unsplash.com/photo-1650363700594-8e149ed80eec?auto=format&fit=crop&w=1400&q=80"
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover"
      />
      {/* Dark overlay for legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40" />
      <div className="pointer-events-none absolute inset-0 bg-zinc-950/30" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="size-11 rounded-2xl bg-white flex items-center justify-center">
          <Building2 size={22} className="text-zinc-950" strokeWidth={2} />
        </div>
        <span className="text-xl font-bold tracking-tight">MyHome</span>
      </div>

      {/* Tagline + features */}
      <div className="relative z-10 max-w-md">
        <h2 className="text-3xl xl:text-[2.5rem] font-bold leading-[1.15] tracking-tight">
          {t('auth.brandTagline')}
        </h2>

        <ul className="mt-10 space-y-5">
          {FEATURES.map(({ icon: Icon, key }) => (
            <li key={key} className="flex items-center gap-4">
              <span className="size-10 shrink-0 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                <Icon size={18} strokeWidth={1.75} className="text-white" />
              </span>
              <span className="text-zinc-300 text-[15px] leading-snug">{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <p className="relative z-10 text-sm text-zinc-500">
        © 2025 MyHome Management Platform
      </p>
    </aside>
  )
}

export default BrandPanel
