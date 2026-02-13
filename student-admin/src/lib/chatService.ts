// Chat service for Firestore operations
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase-client'
import { Conversation, Message, SendMessageParams } from '@/types/chat'
import { generateConversationId } from './firestore-refs'

// Send a message to Firestore
export const sendMessage = async (params: SendMessageParams): Promise<string> => {
  try {
    const { conversationId, content, senderId, senderType } = params

    // Validate message content
    if (!content.trim()) {
      throw new Error('Message content cannot be empty')
    }

    if (content.length > 5000) {
      throw new Error('Message content exceeds maximum length')
    }

    // Get sender name from Firestore
    const userRef = doc(db, 'users', senderId)
    const userSnap = await getDoc(userRef)
    const senderName = userSnap.exists() ? userSnap.data().name : 'Unknown'

    // Add message to subcollection
    const messagesRef = collection(db, 'conversations', conversationId, 'messages')
    const messageData = {
      conversationId,
      senderId,
      senderType,
      senderName,
      content: content.trim(),
      timestamp: serverTimestamp(),
      deliveryStatus: 'sent' as const,
      readStatus: 'unread' as const,
      metadata: {
        retryCount: 0,
      },
    }

    const docRef = await addDoc(messagesRef, messageData)
    return docRef.id
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

// Get conversations for a user
export const getConversations = async (
  userId: string,
  userType: 'admin' | 'student'
): Promise<Conversation[]> => {
  try {
    // Check if userId is empty
    if (!userId) {
      throw new Error('User ID is required')
    }

    const conversationsRef = collection(db, 'conversations')
    
    // Query based on user type
    const q = userType === 'admin'
      ? query(conversationsRef, where('adminId', '==', userId), orderBy('updatedAt', 'desc'))
      : query(conversationsRef, where('studentId', '==', userId), orderBy('updatedAt', 'desc'))

    const snapshot = await getDocs(q)
    const conversations: Conversation[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      conversations.push({
        id: doc.id,
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
      })
    })

    return conversations
  } catch (error) {
    console.error('Error fetching conversations:', error)
    throw error
  }
}

// Get messages for a conversation with pagination
export const getMessages = async (
  conversationId: string,
  pageLimit: number = 50,
  startAfterDoc?: Timestamp
): Promise<Message[]> => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages')
    
    let q = query(
      messagesRef,
      orderBy('timestamp', 'asc'),
      limit(pageLimit)
    )

    if (startAfterDoc) {
      q = query(
        messagesRef,
        orderBy('timestamp', 'asc'),
        startAfter(startAfterDoc),
        limit(pageLimit)
      )
    }

    const snapshot = await getDocs(q)
    const messages: Message[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      messages.push({
        id: doc.id,
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderType: data.senderType,
        senderName: data.senderName,
        content: data.content,
        timestamp: data.timestamp?.toDate() || new Date(),
        deliveryStatus: data.deliveryStatus,
        readStatus: data.readStatus,
        readAt: data.readAt?.toDate(),
        metadata: data.metadata,
      })
    })

    return messages
  } catch (error) {
    console.error('Error fetching messages:', error)
    throw error
  }
}

// Mark messages as read
export const markAsRead = async (
  conversationId: string,
  userId: string,
  userType: 'admin' | 'student'
): Promise<void> => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages')
    
    // Get all unread messages
    const q = query(messagesRef, where('readStatus', '==', 'unread'))

    const snapshot = await getDocs(q)
    const batch = writeBatch(db)

    // Filter on client side to avoid composite index requirement
    snapshot.forEach((doc) => {
      const data = doc.data()
      // Only mark as read if sent by the other user
      if (data.senderId !== userId) {
        batch.update(doc.ref, {
          readStatus: 'read',
          readAt: serverTimestamp(),
        })
      }
    })

    await batch.commit()

    // Update unread count in conversation
    const conversationRef = doc(db, 'conversations', conversationId)
    const unreadCountField = userType === 'admin' ? 'adminUnreadCount' : 'studentUnreadCount'
    
    await updateDoc(conversationRef, {
      [unreadCountField]: 0,
    })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    throw error
  }
}

// Update message delivery status
export const updateDeliveryStatus = async (
  conversationId: string,
  messageId: string,
  status: 'sent' | 'delivered' | 'failed'
): Promise<void> => {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId)
    await updateDoc(messageRef, {
      deliveryStatus: status,
    })
  } catch (error) {
    console.error('Error updating delivery status:', error)
    throw error
  }
}

// Create a new conversation
export const createConversation = async (
  adminId: string,
  studentId: string,
  adminName: string,
  studentName: string,
  adminAvatar?: string,
  studentAvatar?: string
): Promise<string> => {
  try {
    const conversationId = generateConversationId(adminId, studentId)
    const conversationRef = doc(db, 'conversations', conversationId)

    // Check if conversation already exists
    const existingConv = await getDoc(conversationRef)
    if (existingConv.exists()) {
      return conversationId
    }

    // Create new conversation
    const conversationData = {
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

    await setDoc(conversationRef, conversationData)
    return conversationId
  } catch (error) {
    console.error('Error creating conversation:', error)
    throw error
  }
}

// Update last message in conversation
export const updateLastMessage = async (
  conversationId: string,
  message: string,
  senderId: string,
  userType: 'admin' | 'student'
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId)
    const unreadCountField = userType === 'admin' ? 'studentUnreadCount' : 'adminUnreadCount'

    await updateDoc(conversationRef, {
      lastMessage: message,
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: senderId,
      [unreadCountField]: ((await getDoc(conversationRef)).data()?.[unreadCountField] || 0) + 1,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating last message:', error)
    throw error
  }
}
