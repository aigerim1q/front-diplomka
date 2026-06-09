import {
  useEffect, useRef, useState, type KeyboardEvent,
} from 'react'
import {
  HubConnection, HubConnectionBuilder,
  HubConnectionState, LogLevel,
} from '@microsoft/signalr'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { kskChatApi, ChatResidentItem } from '@/api/kskChat'
import { useAuth } from '@/hooks/useAuth'
import { ChatMessageDto, ChatThreadDto } from '@/types'

const HUB_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/hubs/chat`
const PAGE_SIZE = 50

// ─── helpers ──────────────────────────────────────────────────────────────────
const getMsgAuthorId   = (m: ChatMessageDto) => m.authorId   ?? m.senderId
const getMsgAuthorName = (m: ChatMessageDto) =>
  m.authorName ?? m.senderFullName ?? m.senderName ?? '?'
const byTime = (a: ChatMessageDto, b: ChatMessageDto) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
const getThreadId = (t: ChatThreadDto) => t.threadId ?? t.id ?? ''

const AVATAR_COLORS = [
  'bg-violet-200 text-violet-800', 'bg-sky-200 text-sky-800',
  'bg-emerald-200 text-emerald-800', 'bg-amber-200 text-amber-800',
  'bg-rose-200 text-rose-800', 'bg-indigo-200 text-indigo-800',
]
const avatarColor = (name: string) =>
  AVATAR_COLORS[(name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString())     return 'Сегодня'
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

const fmtLastMsg = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

// ─── types ────────────────────────────────────────────────────────────────────
type ActiveView = { type: 'lounge' } | { type: 'dm'; thread: ChatThreadDto }

// ─── main page ────────────────────────────────────────────────────────────────
const ChatPage = () => {
  const { user } = useAuth()
  const kskId = user?.tenantId ?? null
  const myId  = user?.userId   ?? null

  // threads
  const [dmThreads, setDmThreads]     = useState<ChatThreadDto[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [activeView, setActiveView]   = useState<ActiveView>({ type: 'lounge' })
  const [isNewDmOpen, setIsNewDmOpen] = useState(false)

  // messages for current panel
  const [messages, setMessages]     = useState<ChatMessageDto[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [inputText, setInputText]   = useState('')
  const [isSending, setIsSending]   = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editText, setEditText]     = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // lounge thread id
  const [loungeThreadId, setLoungeThreadId] = useState<string | null>(null)

  const connectionRef  = useRef<HubConnection | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [connState, setConnState] = useState<HubConnectionState>(HubConnectionState.Disconnected)

  // ── load thread list ────────────────────────────────────────────────────────
  const loadThreads = async () => {
    try {
      const [threadsRes, unreadRes] = await Promise.all([
        kskChatApi.getThreads(),
        kskChatApi.getUnreadCounts(),
      ])
      const all = threadsRes.data as ChatThreadDto[]
      setDmThreads(all.filter(t => t.type === 1 || t.type === 'Direct'))
      setUnreadCounts(unreadRes.data as Record<string, number>)
    } catch { /* silent */ }
  }

  // ── load messages for current view ──────────────────────────────────────────
  const loadMessages = async (view: ActiveView) => {
    setIsLoading(true)
    setMessages([])
    try {
      if (view.type === 'lounge' && kskId) {
        const res = await kskChatApi.getLoungeHistory(kskId, 1, PAGE_SIZE)
        const raw = res.data as any
        const items: ChatMessageDto[] = Array.isArray(raw?.items) ? raw.items
          : Array.isArray(raw) ? raw : []
        setMessages(items.filter(m => !m.isDeleted).sort(byTime))
      } else if (view.type === 'dm') {
        const tid = getThreadId(view.thread)
        const res = await kskChatApi.getThreadHistory(tid, 1, PAGE_SIZE)
        const raw = res.data as any
        const items: ChatMessageDto[] = Array.isArray(raw?.items) ? raw.items
          : Array.isArray(raw) ? raw : []
        setMessages(items.filter(m => !m.isDeleted).sort(byTime))
        await kskChatApi.markThreadRead(tid).catch(() => {})
        setUnreadCounts(prev => ({ ...prev, [tid]: 0 }))
      }
    } catch { /* silent */ }
    finally { setIsLoading(false) }
  }

  // ── SignalR: single connection, join/leave rooms ──────────────────────────
  useEffect(() => {
    if (!kskId) return
    let cancelled = false

    const connect = async () => {
      const conn = new HubConnectionBuilder()
        .withUrl(HUB_URL, { accessTokenFactory: () => localStorage.getItem('accessToken') ?? '' })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build()

      conn.on('ReceiveMessage', (msg: ChatMessageDto & { threadType?: number }) => {
        setMessages(prev => {
          // determine if this message belongs to current view
          const isLounge = msg.threadType === 2 || (!msg.threadId || msg.threadId === loungeThreadId)
          const isDm     = activeView.type === 'dm' && msg.threadId === getThreadId(activeView.thread)
          if (activeView.type === 'lounge' && !isLounge) return prev
          if (activeView.type === 'dm'     && !isDm)     return prev
          return prev.some(m => m.id === msg.id) ? prev : [...prev, msg].sort(byTime)
        })
        // bump unread for DM threads not currently open
        setDmThreads(prev => prev.map(t => {
          const tid = getThreadId(t)
          if (msg.threadId === tid && (activeView.type !== 'dm' || getThreadId(activeView.thread) !== tid)) {
            setUnreadCounts(u => ({ ...u, [tid]: (u[tid] ?? 0) + 1 }))
          }
          return t
        }))
      })

      conn.on('MessageDeleted', (evt: { messageId: string }) => {
        setMessages(prev => prev.filter(m => m.id !== evt.messageId))
      })
      conn.on('MessageEdited', (evt: { messageId: string; text: string; editedAt: string }) => {
        setMessages(prev => prev.map(m =>
          m.id === evt.messageId ? { ...m, text: evt.text, editedAt: evt.editedAt } : m
        ))
      })

      conn.onreconnecting(() => setConnState(HubConnectionState.Reconnecting))
      conn.onreconnected(async () => {
        setConnState(HubConnectionState.Connected)
        try { await conn.invoke('JoinRoom', kskId) } catch { /* ignore */ }
      })
      conn.onclose(() => setConnState(HubConnectionState.Disconnected))

      try {
        await conn.start()
        if (cancelled) { conn.stop(); return }
        setConnState(HubConnectionState.Connected)
        await conn.invoke('JoinRoom', kskId)
        connectionRef.current = conn
      } catch {
        if (!cancelled) toast.error('Не удалось подключиться к чату')
      }
    }

    const init = async () => {
      try {
        const res = await kskChatApi.initLounge()
        if (!cancelled) setLoungeThreadId(res.data.threadId)
      } catch { /* ignore */ }
      if (!cancelled) {
        await loadThreads()
        await loadMessages({ type: 'lounge' })
      }
      connect()
    }

    init()
    return () => {
      cancelled = true
      const c = connectionRef.current
      if (c) { c.invoke('LeaveRoom', kskId).catch(() => {}); c.stop(); connectionRef.current = null }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kskId])

  // ── switch view ──────────────────────────────────────────────────────────
  const switchView = async (view: ActiveView) => {
    setActiveView(view)
    setInputText(''); setEditingId(null); setConfirmDeleteId(null)

    // join new room if DM
    const conn = connectionRef.current
    if (conn?.state === HubConnectionState.Connected) {
      if (view.type === 'dm') {
        const tid = getThreadId(view.thread)
        try { await conn.invoke('JoinRoom', tid) } catch { /* ignore */ }
      }
    }
    await loadMessages(view)
  }

  // auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // ── send ─────────────────────────────────────────────────────────────────
  const activeTid = activeView.type === 'dm'
    ? getThreadId(activeView.thread)
    : loungeThreadId

  const handleSend = async () => {
    const text = inputText.trim()
    if (!text || !activeTid || isSending) return
    setIsSending(true)
    try {
      const res = await kskChatApi.sendMessage(activeTid, text)
      const created = res.data
      if (created?.id)
        setMessages(prev => prev.some(m => m.id === created.id) ? prev : [...prev, created].sort(byTime))
      setInputText('')
    } catch { toast.error('Не удалось отправить') }
    finally { setIsSending(false) }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleDelete = async (id: string) => {
    try {
      await kskChatApi.deleteMessage(id)
      setMessages(prev => prev.filter(m => m.id !== id))
      setConfirmDeleteId(null)
    } catch { toast.error('Не удалось удалить') }
  }

  const handleEditSave = async (id: string) => {
    const text = editText.trim()
    if (!text) return
    try {
      await kskChatApi.editMessage(id, text)
      setMessages(prev => prev.map(m => m.id === id ? { ...m, text, editedAt: new Date().toISOString() } : m))
      setEditingId(null)
    } catch { toast.error('Не удалось изменить') }
  }

  // ── connection badge ─────────────────────────────────────────────────────
  const connInfo: Record<HubConnectionState, { text: string; dot: string }> = {
    [HubConnectionState.Disconnected]:  { text: 'Отключено',         dot: 'bg-red-400' },
    [HubConnectionState.Connecting]:    { text: 'Подключение...',     dot: 'bg-amber-400' },
    [HubConnectionState.Connected]:     { text: 'В сети',             dot: 'bg-emerald-400' },
    [HubConnectionState.Disconnecting]: { text: 'Отключение...',      dot: 'bg-amber-400' },
    [HubConnectionState.Reconnecting]:  { text: 'Переподключение...', dot: 'bg-amber-400' },
  }
  const ci = connInfo[connState]

  // ── message grouping ─────────────────────────────────────────────────────
  const grouped = messages.reduce<{ date: string; items: ChatMessageDto[] }[]>((acc, msg) => {
    const date = fmtDate(msg.createdAt)
    const last = acc[acc.length - 1]
    if (last && last.date === date) last.items.push(msg)
    else acc.push({ date, items: [msg] })
    return acc
  }, [])

  // ── helpers for DM thread ────────────────────────────────────────────────
  const getOtherParticipant = (thread: ChatThreadDto) => {
    const parts = thread.participants ?? []
    return parts.find(p => p.userId !== myId) ?? parts[0] ?? null
  }

  // ── render panel header name ──────────────────────────────────────────────
  const panelTitle = activeView.type === 'lounge'
    ? 'Общий чат ЖК'
    : (() => {
        const other = getOtherParticipant(activeView.thread)
        return other?.fullName ?? other?.name ?? 'Личное сообщение'
      })()

  if (!kskId) return (
    <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-400">
      <span className="material-symbols-outlined text-5xl mb-3 block">forum</span>
      <p>ЖК не определён. Чат недоступен.</p>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm flex h-[calc(100vh-9rem)] overflow-hidden">

      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col border-r border-zinc-100">

        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100">
          <span className="text-sm font-bold text-zinc-900">Чаты</span>
          <button
            onClick={() => setIsNewDmOpen(true)}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
            title="Новое сообщение"
          >
            <span className="material-symbols-outlined text-[20px]">edit_square</span>
          </button>
        </div>

        {/* Lounge tile */}
        <button
          onClick={() => switchView({ type: 'lounge' })}
          className={`flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-zinc-50 ${
            activeView.type === 'lounge'
              ? 'bg-zinc-900 text-white'
              : 'hover:bg-zinc-50 text-zinc-900'
          }`}
        >
          <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
            activeView.type === 'lounge' ? 'bg-white/20' : 'bg-zinc-100'
          }`}>
            <span className={`material-symbols-outlined text-[18px] ${activeView.type === 'lounge' ? 'text-white' : 'text-zinc-500'}`}>
              group
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">Общий чат ЖК</p>
            <p className={`text-xs truncate mt-0.5 ${activeView.type === 'lounge' ? 'text-white/60' : 'text-zinc-400'}`}>
              Все жильцы
            </p>
          </div>
        </button>

        {/* DM list */}
        <div className="flex-1 overflow-y-auto">
          {dmThreads.length === 0 ? (
            <div className="px-4 py-8 text-center text-zinc-400">
              <span className="material-symbols-outlined text-3xl mb-2 block">chat_bubble_outline</span>
              <p className="text-xs">Нет личных сообщений</p>
              <button
                onClick={() => setIsNewDmOpen(true)}
                className="mt-3 text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2 transition-colors"
              >
                Начать переписку
              </button>
            </div>
          ) : (
            dmThreads.map(thread => {
              const tid   = getThreadId(thread)
              const other = getOtherParticipant(thread)
              const name  = other?.fullName ?? other?.name ?? 'Собеседник'
              const unread = unreadCounts[tid] ?? 0
              const isActive = activeView.type === 'dm' && getThreadId(activeView.thread) === tid
              const color = avatarColor(name)

              return (
                <button
                  key={tid}
                  onClick={() => switchView({ type: 'dm', thread })}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-zinc-50 ${
                    isActive ? 'bg-zinc-50' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className={`size-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${color}`}>
                    {name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{name}</p>
                      <span className="text-[11px] text-zinc-400 shrink-0">
                        {fmtLastMsg(thread.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className="text-xs text-zinc-400 truncate">
                        {thread.lastMessagePreview ?? 'Нет сообщений'}
                      </p>
                      {unread > 0 && (
                        <span className="shrink-0 size-4 rounded-full bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Panel header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-100 shrink-0">
          <div className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
            activeView.type === 'lounge'
              ? 'bg-zinc-100 text-zinc-500'
              : avatarColor(panelTitle)
          }`}>
            {activeView.type === 'lounge'
              ? <span className="material-symbols-outlined text-[20px]">group</span>
              : <span className="text-sm font-bold">{panelTitle[0].toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 leading-none">{panelTitle}</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {activeView.type === 'lounge' ? 'Все жильцы' : 'Личное сообщение'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 shrink-0">
            <span className={`size-1.5 rounded-full ${ci.dot}`} />
            {ci.text}
          </div>
        </div>

        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
          style={{ background: 'linear-gradient(180deg,#f8f9fb 0%,#f2f4f7 100%)' }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-zinc-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-2">
              <span className="material-symbols-outlined text-5xl">chat_bubble_outline</span>
              <p className="text-sm">Сообщений пока нет. Напишите первым!</p>
            </div>
          ) : (
            grouped.map(group => (
              <div key={group.date}>
                <div className="flex justify-center my-3">
                  <span className="px-3 py-1 rounded-full bg-white/80 text-zinc-500 text-[11px] font-medium shadow-sm border border-zinc-100">
                    {group.date}
                  </span>
                </div>
                {group.items.map((msg, idx) => {
                  const authorId   = getMsgAuthorId(msg)
                  const authorName = getMsgAuthorName(msg)
                  const isMe       = !!(myId && authorId && authorId === myId)
                  const prevMsg    = group.items[idx - 1]
                  const isSame     = !!(prevMsg && getMsgAuthorId(prevMsg) === authorId)
                  const color      = avatarColor(authorName)

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${isSame ? 'mt-0.5' : 'mt-3'}`}
                    >
                      {!isMe && (
                        <div className={`size-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mb-0.5 ${isSame ? 'invisible' : color}`}>
                          {authorName[0].toUpperCase()}
                        </div>
                      )}

                      <div className={`max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isSame && (
                          <span className={`text-[11px] font-semibold mb-1 px-1 ${isMe ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {isMe ? 'Вы (КСК)' : authorName}
                          </span>
                        )}

                        {editingId === msg.id ? (
                          <div className="w-72">
                            <textarea
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(msg.id) }
                                if (e.key === 'Escape') setEditingId(null)
                              }}
                              autoFocus rows={2}
                              className="w-full text-sm rounded-xl border border-zinc-300 bg-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            />
                            <div className="flex gap-1.5 mt-1 justify-end">
                              <button onClick={() => setEditingId(null)} className="px-2 py-0.5 text-xs text-zinc-500 hover:text-zinc-900">Отмена</button>
                              <button onClick={() => handleEditSave(msg.id)} className="px-2 py-0.5 text-xs bg-zinc-900 text-white rounded-md">Сохранить</button>
                            </div>
                          </div>
                        ) : (
                          <div className={`group relative px-3.5 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words ${
                            isMe ? 'bg-zinc-900 text-white rounded-br-sm' : 'bg-white text-zinc-900 border border-zinc-100 rounded-bl-sm'
                          }`}>
                            {msg.text}
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                              {msg.editedAt && <span className={`text-[10px] italic ${isMe ? 'text-white/50' : 'text-zinc-400'}`}>изм.</span>}
                              <span className={`text-[10px] ${isMe ? 'text-white/60' : 'text-zinc-400'}`}>{fmtTime(msg.createdAt)}</span>
                            </div>

                            {confirmDeleteId === msg.id ? (
                              <div className={`absolute top-0 ${isMe ? 'right-full mr-2' : 'left-full ml-2'} flex items-center gap-1 bg-white border border-zinc-200 rounded-xl shadow-md px-2 py-1.5 z-10 whitespace-nowrap`}>
                                <button onClick={() => handleDelete(msg.id)} className="text-xs text-red-600 font-semibold hover:text-red-700">Удалить</button>
                                <span className="text-zinc-300">·</span>
                                <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-zinc-500 hover:text-zinc-900">Отмена</button>
                              </div>
                            ) : (
                              <div className={`absolute top-1 ${isMe ? 'right-full mr-1.5' : 'left-full ml-1.5'} hidden group-hover:flex items-center gap-0.5 bg-white border border-zinc-100 rounded-lg shadow-sm p-0.5 z-10`}>
                                {isMe && (
                                  <button
                                    onClick={() => { setEditingId(msg.id); setEditText(msg.text) }}
                                    className="size-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">edit</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => setConfirmDeleteId(msg.id)}
                                  className="size-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[14px]">delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {isMe && (
                        <div className={`size-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mb-0.5 bg-zinc-200 text-zinc-700 ${isSame ? 'invisible' : ''}`}>
                          {(user?.email?.[0] ?? 'A').toUpperCase()}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="px-4 py-3 border-t border-zinc-100 bg-white shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Написать сообщение... (Enter — отправить)"
              rows={1}
              className="flex-1 resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 max-h-32 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isSending || !activeTid}
              className="size-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSending ? 'hourglass_empty' : 'send'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── NEW DM MODAL ──────────────────────────────────────────────────────── */}
      {isNewDmOpen && (
        <NewDmModal
          myId={myId}
          onClose={() => setIsNewDmOpen(false)}
          onStart={async (residentId, residentName) => {
            setIsNewDmOpen(false)
            try {
              const res = await kskChatApi.getOrCreateDmThread(residentId)
              const tid = res.data.threadId
              await loadThreads()
              // find thread or construct placeholder
              setDmThreads(prev => {
                const exists = prev.find(t => getThreadId(t) === tid)
                if (exists) {
                  switchView({ type: 'dm', thread: exists })
                  return prev
                }
                const placeholder: ChatThreadDto = {
                  threadId: tid, type: 1, unreadCount: 0, lastMessageAt: null,
                  participants: [{ userId: residentId, fullName: residentName }],
                }
                switchView({ type: 'dm', thread: placeholder })
                return [placeholder, ...prev]
              })
            } catch { toast.error('Не удалось открыть чат') }
          }}
        />
      )}
    </div>
  )
}

// ─── New DM modal ─────────────────────────────────────────────────────────────
interface NewDmModalProps {
  myId: string | null
  onClose: () => void
  onStart: (residentId: string, residentName: string) => void
}

const NewDmModal = ({ onClose, onStart }: NewDmModalProps) => {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['residents-for-dm'],
    queryFn: kskChatApi.getChatResidents,
    staleTime: 30_000,
  })

  const allResidents: ChatResidentItem[] = data?.data ?? []
  const residents = allResidents.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return (r.fullName ?? '').toLowerCase().includes(q) ||
      (r.email ?? '').toLowerCase().includes(q) ||
      (r.apartmentNumber ?? '').toLowerCase().includes(q)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <span className="text-base font-semibold text-zinc-900 flex-1">Новое сообщение</span>
          <button onClick={onClose} className="size-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-zinc-100">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px]">search</span>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по имени, email или квартире..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
            />
          </div>
        </div>

        {/* Resident list */}
        <div className="flex-1 overflow-y-auto py-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-400" />
            </div>
          ) : residents.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-sm">Жильцы не найдены</div>
          ) : (
            residents.map(r => {
              const name  = r.fullName ?? (`${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || r.email)
              const color = avatarColor(name)
              return (
                <button
                  key={r.id}
                  onClick={() => onStart(r.id, name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left"
                >
                  <div className={`size-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${color}`}>
                    {name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">{name}</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {r.apartmentNumber ? `кв. ${r.apartmentNumber}` : r.email}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatPage
