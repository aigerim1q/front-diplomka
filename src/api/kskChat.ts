import { api } from '@/lib/axios'
import { ChatMessageDto, ChatThreadDto, Paginated } from '@/types'

export const kskChatApi = {
  initLounge: () =>
    api.post<{ threadId: string }>('/api/chat/lounge/init'),

  getThreads: () =>
    api.get<ChatThreadDto[]>('/api/chat/threads'),

  getUnreadCounts: () =>
    api.get<Record<string, number>>('/api/chat/unread-counts'),

  markThreadRead: (threadId: string) =>
    api.patch(`/api/chat/threads/${threadId}/read`),

  getLoungeHistory: (kskId: string, page = 1, pageSize = 50) =>
    api.get<Paginated<ChatMessageDto>>(`/api/chat/${kskId}/messages`, {
      params: { page, pageSize },
    }),

  getThreadHistory: (threadId: string, page = 1, pageSize = 50) =>
    api.get<Paginated<ChatMessageDto>>(`/api/chat/threads/${threadId}/messages`, {
      params: { page, pageSize },
    }),

  sendMessage: (threadId: string, text: string) =>
    api.post<ChatMessageDto>(`/api/chat/threads/${threadId}/messages`, { text }),

  deleteMessage: (id: string) =>
    api.delete(`/api/chat/messages/${id}`),

  editMessage: (id: string, text: string) =>
    api.patch<ChatMessageDto>(`/api/chat/messages/${id}`, { text }),

  getOrCreateDmThread: (otherUserId: string) =>
    api.post<{ threadId: string }>('/api/chat/threads/with-user', { otherUserId }),

  getChatResidents: () =>
    api.get<ChatResidentItem[]>('/api/chat/residents'),
}

export interface ChatResidentItem {
  id: string
  fullName: string
  email: string
  apartmentNumber: string | null
}
