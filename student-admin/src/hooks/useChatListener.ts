// Hook for managing Firestore real-time listeners
import { useEffect, useRef, useCallback } from 'react'
import { collection, onSnapshot, query, orderBy, Unsubscribe } from 'firebase/firestore'
import { db } from '@/lib/firebase-client'
import { Message } from '@/types/chat'

interface UseChatListenerOptions {
  onMessagesUpdate: (messages: Message[]) => void
  onError?: (error: Error) => void
}

export const useChatListener = (
  conversationId: string | null,
  options: UseChatListenerOptions
) => {
  const unsubscribeRef = useRef<Unsubscribe | null>(null)
  const optionsRef = useRef<UseChatListenerOptions>(options)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const subscribe = useCallback(() => {
    if (!conversationId) return

    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages')
      const q = query(messagesRef, orderBy('timestamp', 'asc'))

      unsubscribeRef.current = onSnapshot(
        q,
        (snapshot) => {
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
          optionsRef.current.onMessagesUpdate(messages)
        },
        (error) => {
          console.error('Listener error:', error)
          optionsRef.current.onError?.(error as Error)
        }
      )
    } catch (error) {
      console.error('Error setting up listener:', error)
      optionsRef.current.onError?.(error as Error)
    }
  }, [conversationId])

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
  }, [])

  useEffect(() => {
    subscribe()
    return () => {
      unsubscribe()
    }
  }, [subscribe, unsubscribe])

  return {
    subscribe,
    unsubscribe,
  }
}
