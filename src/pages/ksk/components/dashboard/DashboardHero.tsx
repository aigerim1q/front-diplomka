import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'

interface DashboardHeroProps {
  newRequests: number
  inProgressRequests: number
  totalResidents: number
  activeVotings: number
}

const greetingKey = () => {
  const hour = new Date().getHours()
  if (hour < 5) return 'kskDashboard.hero.greetingNight'
  if (hour < 12) return 'kskDashboard.hero.greetingMorning'
  if (hour < 18) return 'kskDashboard.hero.greetingDay'
  return 'kskDashboard.hero.greetingEvening'
}

const displayNameFromEmail = (email?: string | null) => {
  if (!email) return ''
  const local = email.split('@')[0]
  const cleaned = local.replace(/[._\-+]/g, ' ').trim()
  if (!cleaned) return ''
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

const DashboardHero = ({
  newRequests,
  inProgressRequests,
  totalResidents,
  activeVotings,
}: DashboardHeroProps) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const name = useMemo(() => displayNameFromEmail(user?.email), [user?.email])

  const greeting = t(greetingKey(), { name: name || t('kskDashboard.hero.fallbackName') })
  const needsAttention = newRequests + inProgressRequests

  const summary =
    needsAttention > 0
      ? t('kskDashboard.hero.summaryAttention', { count: needsAttention })
      : t('kskDashboard.hero.summaryCalm')

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-emerald-700 to-teal-600 text-white shadow-lg shadow-emerald-900/10 animate-fade-in-up">
      {/* Decorative pattern */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-[420px] w-[420px] text-white/10"
        viewBox="0 0 200 200"
        fill="none"
      >
        <defs>
          <radialGradient id="hero-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="100" fill="url(#hero-grad)" />
        <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <svg
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-10 h-72 w-72 text-white/5"
        viewBox="0 0 100 100"
      >
        <pattern id="hero-dots" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="currentColor" />
        </pattern>
        <rect width="100" height="100" fill="url(#hero-dots)" />
      </svg>

      <div className="relative px-8 py-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-100/80 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-200" />
          </span>
          {t('kskDashboard.hero.liveLabel')}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{greeting}</h1>
        <p className="mt-2 text-base text-emerald-50/90 max-w-xl">{summary}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <HeroStat
            color="amber"
            value={newRequests}
            label={t('kskDashboard.hero.stats.new')}
          />
          <HeroStat
            color="blue"
            value={inProgressRequests}
            label={t('kskDashboard.hero.stats.inProgress')}
          />
          <HeroStat
            color="emerald"
            value={totalResidents}
            label={t('kskDashboard.hero.stats.residents')}
          />
          <HeroStat
            color="violet"
            value={activeVotings}
            label={t('kskDashboard.hero.stats.votings')}
          />
        </div>
      </div>
    </div>
  )
}

interface HeroStatProps {
  color: 'amber' | 'blue' | 'emerald' | 'violet'
  value: number
  label: string
}

const HeroStat = ({ color, value, label }: HeroStatProps) => {
  const dotMap: Record<HeroStatProps['color'], string> = {
    amber: 'bg-amber-300',
    blue: 'bg-sky-300',
    emerald: 'bg-emerald-200',
    violet: 'bg-violet-300',
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1.5 text-sm font-medium text-white">
      <span className={`size-1.5 rounded-full ${dotMap[color]} animate-pulse-soft`} />
      <span className="tabular-nums font-bold">{value}</span>
      <span className="text-white/80">{label}</span>
    </div>
  )
}

export default DashboardHero
