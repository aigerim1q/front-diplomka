import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import { toast } from 'sonner'
import axios from 'axios'
import { kskChatApi } from '@/api/kskChat'
import { useAuth } from '@/hooks/useAuth'
import {
  ChatMessageDto,
  ChatMessageDeletedEvent,
  ChatMessageEditedEvent,
} from '@/types'

const HUB_URL = '/hubs/chat'
const PAGE_SIZE = 50

const ChatLoungePage = () => {
  const { user } = useAuth()
  const kskId = user?.tenantId ?? null

  const [messages, setMessages] = useState<ChatMessageDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    HubConnectionState.Disconnected
  )
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)

  const connectionRef = useRef<HubConnection | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Load history + connect to SignalR
  useEffect(() => {
    if (!kskId) return

    let cancelled = false

    const loadHistory = async () => {
      try {
        const res = await kskChatApi.getLoungeHistory(kskId, 1, PAGE_SIZE)
        if (cancelled) return
        // API returns DESC, reverse for display oldest → newest
        const items = Array.isArray(res.data?.items) ? res.data.items : []
        setMessages([...items].reverse())
      } catch (err) {
        if (cancelled) return
        const detail = axios.isAxiosError(err)
          ? `${err.response?.status ?? ''} ${err.response?.data?.message ?? err.response?.data?.title ?? err.message}`
          : 'unknown error'
        console.error('[chat] loadHistory failed:', err)
        toast.error(`История чата не загрузилась: ${detail}`)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    const connect = async () => {
      const connection = new HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => localStorage.getItem('accessToken') ?? '',
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build()

      connection.on('ReceiveMessage', (msg: ChatMessageDto) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      })

      connection.on('MessageDeleted', (evt: ChatMessageDeletedEvent) => {
        setMessages((prev) => prev.filter((m) => m.id !== evt.messageId))
      })

      connection.on('MessageEdited', (evt: ChatMessageEditedEvent) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === evt.messageId
              ? { ...m, text: evt.text, editedAt: evt.editedAt }
              : m
          )
        )
      })

      connection.onreconnecting(() => setConnectionState(HubConnectionState.Reconnecting))
      connection.onreconnected(async () => {
        setConnectionState(HubConnectionState.Connected)
        try {
          await connection.invoke('JoinRoom', kskId)
        } catch {
          /* ignore */
        }
      })
      connection.onclose(() => setConnectionState(HubConnectionState.Disconnected))

      try {
        await connection.start()
        if (cancelled) {
          await connection.stop()
          return
        }
        setConnectionState(HubConnectionState.Connected)
        await connection.invoke('JoinRoom', kskId)
        connectionRef.current = connection
      } catch {
        if (!cancelled) toast.error('Не удалось подключиться к чату в реальном времени')
      }
    }

    loadHistory()
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

  const handleDelete = async (id: string) => {
    try {
      await kskChatApi.deleteMessage(id)
      setMessages((prev) => prev.filter((m) => m.id !== id))
      setConfirmDeleteId(null)
      toast.success('Сообщение удалено')
    } catch {
      toast.error('Не удалось удалить сообщение')
    }
  }

  const handleSend = async () => {
    const text = inputText.trim()
    if (!text || !kskId || isSending) return
    setIsSending(true)
    try {
      const res = await kskChatApi.sendLoungeMessage(kskId, text)
      const created = res.data
      if (created?.id) {
        setMessages((prev) =>
          prev.some((m) => m.id === created.id) ? prev : [...prev, created]
        )
      }
      setInputText('')
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? `${err.response?.status ?? ''} ${err.response?.data?.message ?? err.response?.data?.title ?? err.message}`
        : 'unknown error'
      toast.error(`Не удалось отправить сообщение: ${detail}`)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Group by date
  const grouped = messages.reduce<{ date: string; items: ChatMessageDto[] }[]>((acc, msg) => {
    const date = formatDate(msg.createdAt)
    const last = acc[acc.length - 1]
    if (last && last.date === date) {
      last.items.push(msg)
    } else {
      acc.push({ date, items: [msg] })
    }
    return acc
  }, [])

  if (!kskId) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
        <span className="material-symbols-outlined text-5xl mb-3 block">forum</span>
        <p>ЖК не определён. Чат недоступен.</p>
      </div>
    )
  }

  const connectionLabel: Record<HubConnectionState, { text: string; color: string }> = {
    [HubConnectionState.Disconnected]: { text: 'Отключено', color: 'bg-red-500' },
    [HubConnectionState.Connecting]: { text: 'Подключение...', color: 'bg-amber-500' },
    [HubConnectionState.Connected]: { text: 'В сети', color: 'bg-emerald-500' },
    [HubConnectionState.Disconnecting]: { text: 'Отключение...', color: 'bg-amber-500' },
    [HubConnectionState.Reconnecting]: { text: 'Переподключение...', color: 'bg-amber-500' },
  }
  const conn = connectionLabel[connectionState]

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-9rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">forum</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">Чат ЖК</h3>
          <p className="text-xs text-slate-500">Общий чат жильцов</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className={`size-2 rounded-full ${conn.color}`} />
          {conn.text}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-50/30">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-2">chat_bubble_outline</span>
            <p className="font-medium">Сообщений пока нет</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.date} className="space-y-3">
              <div className="flex justify-center">
                <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">
                  {group.date}
                </span>
              </div>
              {group.items.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3 group">
                  {msg.senderAvatarUrl ? (
                    <img
                      src={msg.senderAvatarUrl}
                      alt=""
                      className="size-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {(msg.senderFullName || msg.senderName)[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {msg.senderFullName || msg.senderName}
                      </span>
                      {msg.senderApartmentNumber && (
                        <span className="text-xs text-slate-500">кв. {msg.senderApartmentNumber}</span>
                      )}
                      <span className="text-xs text-slate-400">{formatTime(msg.createdAt)}</span>
                      {msg.editedAt && (
                        <span className="text-xs text-slate-400 italic">(изменено)</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                  </div>
                  {confirmDeleteId === msg.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="px-2 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
                      >
                        Удалить
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(msg.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                      title="Удалить сообщение"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="px-4 py-3 border-t border-slate-100 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary max-h-32"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            {isSending ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatLoungePage
