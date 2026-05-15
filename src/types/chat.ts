export interface ChatMessageDto {
  id: string
  threadId: string
  authorId: string
  authorName: string
  text: string
  isDeleted: boolean
  createdAt: string
  editedAt: string | null
}

export interface ChatThreadDto {
  id: string
  type: 'Lounge' | 'Direct'
  name: string
  participantCount: number
  unreadCount: number
  lastMessageAt: string | null
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
