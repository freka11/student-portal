// Conversation service for managing conversations
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase-client'
import { Conversation, ConversationMetadata } from '@/types/chat'
import { generateConversationId } from './firestore-refs'

// Get or create a conversation between two users
export const getOrCreateConversation = async (
  userId1: string,
  userId2: string,
  type1: 'admin' | 'student',
  type2: 'admin' | 'student',
  name1: string,
  name2: string,
  avatar1?: string,
  avatar2?: string
): Promise<Conversation> => {
  try {
    const conversationId = generateConversationId(userId1, userId2)
    const conversationRef = doc(db, 'conversations', conversationId)

    // Try to get existing conversation
    const existingConv = await getDoc(conversationRef)
    
    if (existingConv.exists()) {
      const data = existingConv.data()
      return {
        id: existingConv.id,
        adminId: data.adminId,
        studentId: data.studentId,
        adminName: data.adminName,
        studentName: data.studentName,
        adminAvatar: data.adminAvatar,
        studentAvatar: data.studentAvatar,
        lastMessage: data.lastMessage,
        lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
        lastMessageSenderId: data.lastMessageSenderId,
        adminUnreadCount: data.adminUnreadCount || 0,
        studentUnreadCount: data.studentUnreadCount || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    }

    // Create new conversation
    const adminId = type1 === 'admin' ? userId1 : userId2
    const studentId = type1 === 'student' ? userId1 : userId2
    const adminName = type1 === 'admin' ? name1 : name2
    const studentName = type1 === 'student' ? name1 : name2
    const adminAvatar = type1 === 'admin' ? avatar1 : avatar2
    const studentAvatar = type1 === 'student' ? avatar1 : avatar2

    const newConversation = {
      id: conversationId,
      adminId,
      studentId,
      adminName,
      studentName,
      adminAvatar: adminAvatar || '',
      studentAvatar: studentAvatar || '',
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: '',
      adminUnreadCount: 0,
      studentUnreadCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(conversationRef, newConversation)

    return {
      ...newConversation,
      lastMessageTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Conversation
  } catch (error) {
    console.error('Error getting or creating conversation:', error)
    throw error
  }
}

// Get conversation metadata
export const getConversationMetadata = async (
  conversationId: string,
  currentUserId: string,
  userType: 'admin' | 'student'
): Promise<ConversationMetadata> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId)
    const conversationSnap = await getDoc(conversationRef)

    if (!conversationSnap.exists()) {
      throw new Error('Conversation not found')
    }

    const data = conversationSnap.data()
    
    // Get the other participant's info
    const isAdmin = userType === 'admin'
    const participantName = isAdmin ? data.studentName : data.adminName
    const participantAvatar = isAdmin ? data.studentAvatar : data.adminAvatar
    const unreadCount = isAdmin ? data.adminUnreadCount : data.studentUnreadCount

    return {
      id: conversationId,
      participantName,
      participantAvatar,
      lastMessage: data.lastMessage,
      lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
      unreadCount,
    }
  } catch (error) {
    console.error('Error getting conversation metadata:', error)
    throw error
  }
}

// Update conversation's last message
export const updateConversationLastMessage = async (
  conversationId: string,
  message: string,
  senderId: string,
  senderType: 'admin' | 'student'
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId)
    const unreadCountField = senderType === 'admin' ? 'studentUnreadCount' : 'adminUnreadCount'

    const conversationSnap = await getDoc(conversationRef)
    if (!conversationSnap.exists()) {
      throw new Error('Conversation not found')
    }

    const currentUnreadCount = conversationSnap.data()[unreadCountField] || 0

    await updateDoc(conversationRef, {
      lastMessage: message,
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: senderId,
      [unreadCountField]: currentUnreadCount + 1,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating conversation last message:', error)
    throw error
  }
}
