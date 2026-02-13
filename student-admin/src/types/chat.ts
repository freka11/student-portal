// Chat data models and types

export interface Conversation {
  id: string
  adminId: string
  studentId: string
  adminName: string
  studentName: string
  adminAvatar?: string
  studentAvatar?: string
  lastMessage: string
  lastMessageTime: Date
  lastMessageSenderId: string
  adminUnreadCount: number
  studentUnreadCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderType: 'admin' | 'student'
  senderName: string
  content: string
  timestamp: Date
  deliveryStatus: 'sent' | 'delivered' | 'failed'
  readStatus: 'unread' | 'read'
  readAt?: Date
  metadata?: {
    retryCount?: number
    errorMessage?: string
  }
}

export interface ChatState {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  messages: Message[]
  loading: boolean
  error: string | null
  searchQuery: string
}

export interface SendMessageParams {
  conversationId: string
  content: string
  senderId: string
  senderType: 'admin' | 'student'
}

export interface ConversationMetadata {
  id: string
  participantName: string
  participantAvatar?: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
}
