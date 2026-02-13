// Firestore collection references and helper functions
import { db } from './firebase-client'
import {
  collection,
  doc,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore'
import { Conversation, Message } from '@/types/chat'

// Collection references
export const conversationsCollection = collection(
  db,
  'conversations'
) as CollectionReference<Conversation>

export const usersCollection = collection(db, 'users')

// Helper functions to get document references
export const getConversationRef = (
  conversationId: string
): DocumentReference<Conversation> => {
  return doc(db, 'conversations', conversationId) as DocumentReference<Conversation>
}

export const getMessagesCollection = (
  conversationId: string
): CollectionReference<Message> => {
  return collection(
    db,
    'conversations',
    conversationId,
    'messages'
  ) as CollectionReference<Message>
}

export const getMessageRef = (
  conversationId: string,
  messageId: string
): DocumentReference<Message> => {
  return doc(
    db,
    'conversations',
    conversationId,
    'messages',
    messageId
  ) as DocumentReference<Message>
}

export const getUserRef = (userId: string) => {
  return doc(db, 'users', userId)
}

// Helper function to generate conversation ID
export const generateConversationId = (
  userId1: string,
  userId2: string
): string => {
  // Sort IDs to ensure consistent conversation ID regardless of order
  const [id1, id2] = [userId1, userId2].sort()
  return `${id1}_${id2}`
}
