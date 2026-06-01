import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { kskChatApi } from '@/api/kskChat'

const ChatPreviewCard = () => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const kskId = user?.tenantId ?? null

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ksk-chat', 'lounge-preview', kskId],
    queryFn: () => kskChatApi.getLoungeHistory(kskId!, 1, 5),
    enabled: !!kskId,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
  })

  const messages = [...(data?.data.items ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const formatRelative = (iso: string): string => {
    const diffMs = Date.now() - new Date(iso).getTime()
    const minutes = Math.round(diffMs / 60000)
    if (minutes < 1) return t('kskDashboard.time.justNow')
    if (minutes < 60) return t('kskDashboard.time.minutesAgo', { count: minutes })
    const hours = Math.round(minutes / 60)
    if (hours < 24) return t('kskDashboard.time.hoursAgo', { count: hours })
    const days = Math.round(hours / 24)
    if (days < 7) return t('kskDashboard.time.daysAgo', { count: days })
    return new Date(iso).toLocaleDateString(i18n.language === 'kk' ? 'kk-KZ' : 'ru-RU')
  }

  const isEmpty = !kskId || isError || messages.length === 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[280px]">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">forum</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 truncate">
            {t('kskDashboard.chat.title')}
          </h3>
        </div>
        <button
          onClick={() => navigate('/chat')}
          className="text-primary hover:bg-primary/5 rounded-lg p-1.5 transition-colors shrink-0"
          title={t('kskDashboard.chat.viewAll')}
        >
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-5 space-y-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[32px]">chat_bubble</span>
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">
            {!kskId
              ? t('kskDashboard.chat.noKsk')
              : t('kskDashboard.chat.empty')}
          </p>
          {kskId && (
            <button
              onClick={() => navigate('/chat')}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              {t('kskDashboard.chat.viewAll')} в†’
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {messages.map((m) => {
            const initial = m.authorName?.[0]?.toUpperCase() ?? '?'
            return (
              <li
                key={m.id}
                onClick={() => navigate('/chat')}
                className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {m.authorName}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-auto shrink-0">
                      {formatRelative(m.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{m.text}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default ChatPreviewCard
