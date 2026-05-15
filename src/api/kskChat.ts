import { api } from '@/lib/axios'
import { ChatMessageDto, Paginated } from '@/types'

export const kskChatApi = {
  getLoungeHistory: (kskId: string, page = 1, pageSize = 50) =>
    api.get<Paginated<ChatMessageDto>>(`/api/chat/${kskId}/messages`, {
      params: { page, pageSize },
    }),

  sendLoungeMessage: (kskId: string, text: string) =>
    api.post<ChatMessageDto>(`/api/chat/messages`, {
      kskId,
      text,
      threadType: 2, // Lounge
    }),

  deleteMessage: (id: string) =>
    api.delete(`/api/chat/messages/${id}`),

  editMessage: (id: string, text: string) =>
    api.patch<ChatMessageDto>(`/api/chat/messages/${id}`, { text }),
}
