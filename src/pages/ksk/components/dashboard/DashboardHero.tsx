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
  return local
    .replace(/[._\-+]/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

const DashboardHero = (_props: DashboardHeroProps) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const name = useMemo(() => displayNameFromEmail(user?.email), [user?.email])

  const greeting = t(greetingKey(), { name: name || t('kskDashboard.hero.fallbackName') })

  const now = new Date()
  const dateStr = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  return (
    <div className="animate-fade-in-up flex items-end justify-between gap-4 pb-2">
      <div>
        <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-1">
          {t('kskDashboard.hero.liveLabel')}
        </p>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{greeting}</h1>
      </div>
      <p className="text-sm text-zinc-400 shrink-0">{dateFormatted}</p>
    </div>
  )
}

export default DashboardHero
