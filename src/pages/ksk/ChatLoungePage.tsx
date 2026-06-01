import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import { toast } from 'sonner'
import { kskChatApi } from '@/api/kskChat'
import { useAuth } from '@/hooks/useAuth'
import {
  ChatMessageDto,
  ChatMessageDeletedEvent,
  ChatMessageEditedEvent,
} from '@/types'

const HUB_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/hubs/chat`
const PAGE_SIZE = 50

const getMsgAuthorId   = (msg: ChatMessageDto) => msg.authorId ?? msg.senderId
const getMsgAuthorName = (msg: ChatMessageDto) =>
  msg.authorName ?? msg.senderFullName ?? msg.senderName ?? '?'

const AVATAR_COLORS = [
  'bg-violet-200 text-violet-800', 'bg-sky-200 text-sky-800',
  'bg-emerald-200 text-emerald-800', 'bg-amber-200 text-amber-800',
  'bg-rose-200 text-rose-800', 'bg-indigo-200 text-indigo-800',
  'bg-teal-200 text-teal-800', 'bg-orange-200 text-orange-800',
]
const avatarColor = (name: string) =>
  AVATAR_COLORS[(name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]

const byTime = (a: ChatMessageDto, b: ChatMessageDto) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()

const ChatLoungePage = () => {
  const { user } = useAuth()
  const kskId = user?.tenantId ?? null
  const myId  = user?.userId  ?? null

  const [messages, setMessages]               = useState<ChatMessageDto[]>([])
  const [isLoading, setIsLoading]             = useState(true)
  const [connectionState, setConnectionState] = useState<HubConnectionState>(HubConnectionState.Disconnected)
  const [editingId, setEditingId]             = useState<string | null>(null)
  const [editText, setEditText]               = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [inputText, setInputText]             = useState('')
  const [isSending, setIsSending]             = useState(false)
  const [threadId, setThreadId]               = useState<string | null>(null)

  const connectionRef  = useRef<HubConnection | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // ─── Load history once on mount ───────────────────────────────────────────
  const loadHistory = async (tid: string | null, kid: string | null) => {
    try {
      let items: ChatMessageDto[] = []

      // Primary: lounge endpoint — all users' messages for this KSK
      if (kid) {
        try {
          const res = await kskChatApi.getLoungeHistory(kid, 1, PAGE_SIZE)
          const raw = res.data as any
          const arr: ChatMessageDto[] = Array.isArray(raw?.items) ? raw.items
            : Array.isArray(raw) ? raw : []
          if (arr.length > 0) items = arr
        } catch (e) {
          console.warn('[chat] getLoungeHistory failed, trying thread endpoint:', e)
        }
      }

      // Fallback: thread-scoped endpoint
      if (items.length === 0 && tid) {
        try {
          const res = await kskChatApi.getThreadHistory(tid, 1, PAGE_SIZE)
          const raw = res.data as any
          items = Array.isArray(raw?.items) ? raw.items
            : Array.isArray(raw) ? raw : []
        } catch (e) {
          console.warn('[chat] getThreadHistory failed:', e)
        }
      }

      const visible = items.filter((m) => !m.isDeleted).sort(byTime)
      setMessages(visible)
    } catch (err) {
      console.error('[chat] loadHistory error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Main effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!kskId) return
    let cancelled = false

    const init = async () => {
      // 1. Init lounge → get threadId
      let tid: string | null = null
      try {
        const res = await kskChatApi.initLounge()
        if (cancelled) return
        tid = res.data.threadId
        setThreadId(tid)
      } catch (err) {
        console.error('[chat] initLounge error:', err)
      }

      // 2. Load history ONCE — after this, SignalR handles everything
      if (!cancelled) await loadHistory(tid, kskId)
    }

    const connect = async () => {
      const connection = new HubConnectionBuilder()
        .withUrl(HUB_URL, { accessTokenFactory: () => localStorage.getItem('accessToken') ?? '' })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build()

      // New message from anyone — just append, never replace
      connection.on('ReceiveMessage', (msg: ChatMessageDto) => {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg].sort(byTime)
        )
      })

      connection.on('MessageDeleted', (evt: ChatMessageDeletedEvent) => {
        setMessages((prev) => prev.filter((m) => m.id !== evt.messageId))
      })

      connection.on('MessageEdited', (evt: ChatMessageEditedEvent) => {
        setMessages((prev) => prev.map((m) =>
          m.id === evt.messageId ? { ...m, text: evt.text, editedAt: evt.editedAt } : m
        ))
      })

      connection.onreconnecting(() => setConnectionState(HubConnectionState.Reconnecting))
      connection.onreconnected(async () => {
        setConnectionState(HubConnectionState.Connected)
        try { await connection.invoke('JoinRoom', kskId) } catch { /* ignore */ }
      })
      connection.onclose(() => setConnectionState(HubConnectionState.Disconnected))

      try {
        await connection.start()
        if (cancelled) { await connection.stop(); return }
        setConnectionState(HubConnectionState.Connected)
        await connection.invoke('JoinRoom', kskId)
        connectionRef.current = connection
      } catch {
        if (!cancelled) toast.error('Не удалось подключиться к чату')
      }
    }

    init()
    connect()

    return () => {
      cancelled = true
      const conn = connectionRef.current
      if (conn) {
        conn.invoke('LeaveRoom', kskId).catch(() => {})
        conn.stop().catch(() => {})
        connectionRef.current = null
      }
    }
  }, [kskId])

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await kskChatApi.deleteMessage(id)
      setMessages((prev) => prev.filter((m) => m.id !== id))
      setConfirmDeleteId(null)
      toast.success('Сообщение удалено')
    } catch { toast.error('Не удалось удалить') }
  }

  const handleEditSave = async (id: string) => {
    const text = editText.trim()
    if (!text) return
    try {
      await kskChatApi.editMessage(id, text)
      setMessages((prev) => prev.map((m) =>
        m.id === id ? { ...m, text, editedAt: new Date().toISOString() } : m
      ))
      setEditingId(null)
    } catch { toast.error('Не удалось изменить сообщение') }
  }

  const handleSend = async () => {
    const text = inputText.trim()
    if (!text || !threadId || isSending) return
    setIsSending(true)
    try {
      const res = await kskChatApi.sendMessage(threadId, text)
      const created = res.data
      if (created?.id) {
        setMessages((prev) =>
          prev.some((m) => m.id === created.id) ? prev : [...prev, created].sort(byTime)
        )
      }
      setInputText('')
    } catch { toast.error('Не удалось отправить') }
    finally { setIsSending(false) }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const fmtDate = (iso: string) => {
    const d         = new Date(iso)
    const today     = new Date()
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString())     return 'Сегодня'
    if (d.toDateString() === yesterday.toDateString()) return 'Вчера'
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const grouped = messages.reduce<{ date: string; items: ChatMessageDto[] }[]>((acc, msg) => {
    const date = fmtDate(msg.createdAt)
    const last = acc[acc.length - 1]
    if (last && last.date === date) last.items.push(msg)
    else acc.push({ date, items: [msg] })
    return acc
  }, [])

  const connInfo: Record<HubConnectionState, { text: string; dot: string }> = {
    [HubConnectionState.Disconnected]:  { text: 'Отключено',         dot: 'bg-red-400' },
    [HubConnectionState.Connecting]:    { text: 'Подключение...',     dot: 'bg-amber-400' },
    [HubConnectionState.Connected]:     { text: 'В сети',             dot: 'bg-emerald-400' },
    [HubConnectionState.Disconnecting]: { text: 'Отключение...',      dot: 'bg-amber-400' },
    [HubConnectionState.Reconnecting]:  { text: 'Переподключение...', dot: 'bg-amber-400' },
  }
  const ci = connInfo[connectionState]

  if (!kskId) return (
    <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-400">
      <span className="material-symbols-outlined text-5xl mb-3 block">forum</span>
      <p>ЖК не определён. Чат недоступен.</p>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col h-[calc(100vh-9rem)] overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-100 bg-white shrink-0">
        <div className="size-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
          <span className="material-symbols-outlined text-[20px]">group</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 leading-none">Общий чат ЖК</p>
          <p className="text-xs text-zinc-400 mt-0.5">Все жильцы</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 shrink-0">
          <span className={`size-1.5 rounded-full ${ci.dot}`} />
          {ci.text}
        </div>
      </div>

      {/* Messages */}
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
          grouped.map((group) => (
            <div key={group.date}>
              <div className="flex justify-center my-3">
                <span className="px-3 py-1 rounded-full bg-white/80 text-zinc-500 text-[11px] font-medium shadow-sm border border-zinc-100">
                  {group.date}
                </span>
              </div>

              {group.items.map((msg, idx) => {
                const authorId     = getMsgAuthorId(msg)
                const authorName   = getMsgAuthorName(msg)
                const isMe         = !!(myId && authorId && authorId === myId)
                const prevMsg      = group.items[idx - 1]
                const isSameAuthor = !!(prevMsg && getMsgAuthorId(prevMsg) === authorId)
                const color        = avatarColor(authorName)

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${isSameAuthor ? 'mt-0.5' : 'mt-3'}`}
                  >
                    {!isMe && (
                      <div className={`size-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mb-0.5 ${isSameAuthor ? 'invisible' : color}`}>
                        {authorName[0].toUpperCase()}
                      </div>
                    )}

                    <div className={`max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isSameAuthor && (
                        <span className={`text-[11px] font-semibold mb-1 px-1 ${isMe ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {isMe ? 'Вы (КСК)' : authorName}
                        </span>
                      )}

                      {editingId === msg.id ? (
                        <div className="w-72">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
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
                          isMe
                            ? 'bg-zinc-900 text-white rounded-br-sm'
                            : 'bg-white text-zinc-900 border border-zinc-100 rounded-bl-sm'
                        }`}>
                          {msg.text}
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                            {msg.editedAt && (
                              <span className={`text-[10px] italic ${isMe ? 'text-white/50' : 'text-zinc-400'}`}>изм.</span>
                            )}
                            <span className={`text-[10px] ${isMe ? 'text-white/60' : 'text-zinc-400'}`}>
                              {fmt(msg.createdAt)}
                            </span>
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
                                  title="Изменить"
                                >
                                  <span className="material-symbols-outlined text-[14px]">edit</span>
                                </button>
                              )}
                              <button
                                onClick={() => setConfirmDeleteId(msg.id)}
                                className="size-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Удалить"
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {isMe && (
                      <div className={`size-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mb-0.5 bg-zinc-200 text-zinc-700 ${isSameAuthor ? 'invisible' : ''}`}>
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
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Написать сообщение... (Enter — отправить)"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent max-h-32 transition-all"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() || isSending || !threadId}
            className="size-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isSending ? 'hourglass_empty' : 'send'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatLoungePage
