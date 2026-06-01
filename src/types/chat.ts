export interface ChatParticipant {
  userId: string
  fullName?: string
  name?: string
  avatarUrl?: string | null
  apartmentNumber?: string | null
}

export interface ChatThreadDto {
  threadId?: string
  id?: string
  type: number | 'Lounge' | 'Direct'
  participants?: ChatParticipant[]
  name?: string
  participantCount?: number
  unreadCount: number
  lastMessageAt: string | null
  lastMessagePreview?: string | null
}

export interface ChatMessageDto {
  id: string
  threadId: string
  authorId?: string
  senderId?: string
  authorName?: string
  senderName?: string
  senderFullName?: string
  text: string
  isDeleted: boolean
  createdAt: string
  editedAt: string | null
}

export interface ChatMessageDeletedEvent {
  messageId: string
  threadId: string | null
}

export interface ChatMessageEditedEvent {
  messageId: string
  threadId: string | null
  text: string
  editedAt: string
}
