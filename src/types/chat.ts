export type ChatThreadType = 1 | 2 // 1 = Direct, 2 = Lounge

export interface ChatMessageDto {
  id: string
  kskId: string
  senderId: string
  senderName: string
  senderFullName: string
  senderApartmentNumber: string | null
  senderAvatarUrl: string | null
  text: string
  threadId: string | null
  threadType: number
  contextAdId: string | null
  createdAt: string
  editedAt: string | null
  isDeleted: boolean
}

export interface ChatThreadDto {
  threadId: string
  type: number
  title: string | null
  lastMessageAt: string | null
  unreadCount: number
  participants: ThreadParticipantDto[]
}

export interface ThreadParticipantDto {
  userId: string
  fullName: string
  avatarUrl: string | null
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
