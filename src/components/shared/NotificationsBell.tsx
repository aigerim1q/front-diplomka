import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { kskServiceRequestsApi } from '@/api/kskServiceRequests'
import { kskResidentsApi } from '@/api/kskResidents'
import { votingsApi } from '@/api/votings'
import { newsApi } from '@/api/news'
import { kskChatApi } from '@/api/kskChat'
import { ServiceRequestStatus } from '@/types'

type ActivityEvent = {
  id: string
  icon: string
  iconBg: string
  iconColor: string
  title: string
  description: string
  timestamp: number
  to: string
}

const WINDOW_MS = 30 * 86_400_000 // последние 30 дней

const lastSeenKey = (userId?: string) => `notifications:lastSeenAt:${userId ?? 'anon'}`

const NotificationsBell = () => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user, isKskAdmin } = useAuth()
  const kskId = user?.tenantId ?? null
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const [lastSeenAt, setLastSeenAt] = useState<number>(() => {
    const stored = localStorage.getItem(lastSeenKey(user?.userId))
    return stored ? Number(stored) : Date.now() - 7 * 86_400_000
  })

  useEffect(() => {
    const stored = localStorage.getItem(lastSeenKey(user?.userId))
    setLastSeenAt(stored ? Number(stored) : Date.now() - 7 * 86_400_000)
  }, [user?.userId])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Префиксы ключей совпадают с теми, что инвалидируют модалки —
  // создание/правка любой сущности тут же триггерит refetch уведомлений.
  const requestsQuery = useQuery({
    queryKey: ['ksk-service-requests', 'notifications-feed'],
    queryFn: () => kskServiceRequestsApi.getAll({ page: 1, pageSize: 50 }),
    enabled: isKskAdmin,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  const votingsQuery = useQuery({
    queryKey: ['votings', 'notifications-feed'],
    queryFn: () => votingsApi.getAll(),
    enabled: isKskAdmin,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  const newsQuery = useQuery({
    queryKey: ['news-manage', 'notifications-feed'],
    queryFn: () => newsApi.getManage(),
    enabled: isKskAdmin,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  const residentsQuery = useQuery({
    queryKey: ['ksk-residents', 'notifications-feed'],
    queryFn: () => kskResidentsApi.getAll({ page: 1, pageSize: 20 }),
    enabled: isKskAdmin,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: true,
  })

  const chatQuery = useQuery({
    queryKey: ['ksk-chat', 'notifications-feed', kskId],
    queryFn: () => kskChatApi.getLoungeHistory(kskId!, 1, 20),
    enabled: isKskAdmin && !!kskId,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  const localeTag = i18n.language === 'kk' ? 'kk-KZ' : 'ru-RU'

  const events = useMemo<ActivityEvent[]>(() => {
    const out: ActivityEvent[] = []
    const cutoff = Date.now() - WINDOW_MS

    const REQUEST_META: Record<ServiceRequestStatus, { titleKey: string; icon: string; bg: string; color: string; useUpdatedAt: boolean }> = {
      1: { titleKey: 'notifications.newRequest', icon: 'add_task', bg: 'bg-blue-100', color: 'text-blue-600', useUpdatedAt: false },
      2: { titleKey: 'notifications.requestInProgress', icon: 'engineering', bg: 'bg-amber-100', color: 'text-amber-600', useUpdatedAt: true },
      3: { titleKey: 'notifications.requestCompleted', icon: 'task_alt', bg: 'bg-emerald-100', color: 'text-emerald-600', useUpdatedAt: true },
      4: { titleKey: 'notifications.requestCancelled', icon: 'cancel', bg: 'bg-slate-100', color: 'text-slate-500', useUpdatedAt: true },
    }

    for (const r of requestsQuery.data?.data.items ?? []) {
      const meta = REQUEST_META[r.status]
      const tsIso = meta.useUpdatedAt ? r.updatedAt : r.createdAt
      const ts = new Date(tsIso).getTime()
      if (ts < cutoff) continue
      out.push({
        id: `req-${r.id}-${r.status}`,
        icon: meta.icon,
        iconBg: meta.bg,
        iconColor: meta.color,
        title: t(meta.titleKey),
        description: r.title,
        timestamp: ts,
        to: '/requests',
      })
    }

    for (const n of newsQuery.data?.data ?? []) {
      if (n.status !== 2) continue
      const ts = new Date(n.publishDate).getTime()
      if (ts < cutoff) continue
      out.push({
        id: `news-${n.id}`,
        icon: n.isPinned ? 'push_pin' : 'campaign',
        iconBg: n.category === 4 ? 'bg-red-100' : 'bg-primary/10',
        iconColor: n.category === 4 ? 'text-red-600' : 'text-primary',
        title: n.isPinned
          ? t('notifications.pinnedAnnouncement')
          : t('notifications.newAnnouncement'),
        description: n.title,
        timestamp: ts,
        to: '/announcements',
      })
    }

    for (const v of votingsQuery.data?.data ?? []) {
      if (v.status !== 2) continue
      const startTs = new Date(v.startDate).getTime()
      const endTs = new Date(v.endDate).getTime()
      const now = Date.now()
      const daysLeft = Math.max(0, Math.ceil((endTs - now) / 86_400_000))

      if (startTs >= cutoff) {
        out.push({
          id: `vote-start-${v.id}`,
          icon: 'how_to_vote',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          title: t('notifications.newVoting'),
          description: v.title,
          timestamp: startTs,
          to: '/polls',
        })
      }

      if (daysLeft <= 3 && endTs >= now) {
        out.push({
          id: `vote-end-${v.id}`,
          icon: 'schedule',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          title: t('notifications.votingEndingSoon'),
          description: `${v.title} · ${
            daysLeft === 0
              ? t('notifications.endsToday')
              : t('notifications.daysLeft', { count: daysLeft })
          }`,
          timestamp: now, // всегда «текущее» — чтобы висело сверху до окончания
          to: '/polls',
        })
      }
    }

    for (const r of residentsQuery.data?.data.items ?? []) {
      const ts = new Date(r.createdAt).getTime()
      if (ts < cutoff) continue
      out.push({
        id: `res-${r.id}`,
        icon: 'person_add',
        iconBg: 'bg-cyan-100',
        iconColor: 'text-cyan-600',
        title: t('notifications.newResident'),
        description: r.fullName || `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || r.email,
        timestamp: ts,
        to: '/residents',
      })
    }

    for (const m of chatQuery.data?.data.items ?? []) {
      if (m.isDeleted) continue
      const ts = new Date(m.createdAt).getTime()
      if (ts < cutoff) continue
      const sender = m.authorName || '—'
      out.push({
        id: `chat-${m.id}`,
        icon: 'chat',
        iconBg: 'bg-violet-100',
        iconColor: 'text-violet-600',
        title: t('notifications.newChatMessage'),
        description: `${sender}: ${m.text}`,
        timestamp: ts,
        to: '/chat',
      })
    }

    return out.sort((a, b) => b.timestamp - a.timestamp)
  }, [requestsQuery.data, newsQuery.data, votingsQuery.data, residentsQuery.data, chatQuery.data, t])

  const unreadCount = events.filter((e) => e.timestamp > lastSeenAt).length

  const formatRelative = (ts: number): string => {
    const diffMs = Date.now() - ts
    const minutes = Math.round(diffMs / 60000)
    if (minutes < 1) return t('kskDashboard.time.justNow')
    if (minutes < 60) return t('kskDashboard.time.minutesAgo', { count: minutes })
    const hours = Math.round(minutes / 60)
    if (hours < 24) return t('kskDashboard.time.hoursAgo', { count: hours })
    const days = Math.round(hours / 24)
    if (days < 7) return t('kskDashboard.time.daysAgo', { count: days })
    return new Date(ts).toLocaleDateString(localeTag)
  }

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next && unreadCount > 0) {
      const now = Date.now()
      setLastSeenAt(now)
      localStorage.setItem(lastSeenKey(user?.userId), String(now))
    }
  }

  const handleMarkAllRead = () => {
    const now = Date.now()
    setLastSeenAt(now)
    localStorage.setItem(lastSeenKey(user?.userId), String(now))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        title={t('notifications.title')}
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[380px] bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">notifications</span>
              <h4 className="font-bold text-slate-900">{t('notifications.title')}</h4>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                  {t('notifications.unreadBadge', { count: unreadCount })}
                </span>
              )}
            </div>
            {events.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-primary font-semibold hover:underline"
                title={t('notifications.markAllRead')}
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {events.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-2 block">notifications_off</span>
              <p className="text-sm">{t('notifications.empty')}</p>
            </div>
          ) : (
            <>
              <ul className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                {events.slice(0, 20).map((n) => {
                  const isUnread = n.timestamp > lastSeenAt
                  return (
                    <li
                      key={n.id}
                      onClick={() => {
                        navigate(n.to)
                        setOpen(false)
                      }}
                      className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors ${
                        isUnread ? 'bg-primary/[0.03] hover:bg-primary/5' : 'hover:bg-slate-50'
                      }`}
 >
 <div className={`${n.iconBg} ${n.iconColor} size-9 rounded-lg flex items-center justify-center shrink-0`}>
                        <span className="material-symbols-outlined text-[18px]">{n.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p className="text-sm font-semibold text-slate-900 flex-1">{n.title}</p>
                          {isUnread && (
                            <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 truncate mt-0.5">{n.description}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{formatRelative(n.timestamp)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {isKskAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    navigate('/requests')
                    setOpen(false)
                  }}
                  className="block w-full px-4 py-3 border-t border-slate-100 text-sm font-semibold text-primary hover:bg-slate-50 text-center"
                >
                  {t('notifications.viewAllRequests')}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationsBell
