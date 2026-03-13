// Hook for managing chat messages with pagination
import { useState, useCallback, useEffect } from 'react'
import { Message } from '@/types/chat'
import { getMessages } from '@/lib/chatService'
import { useChatListener } from './useChatListener'

interface UseChatMessagesOptions {
  conversationId: string | null
  pageLimit?: number
}

export const useChatMessages = (options: UseChatMessagesOptions) => {
  const { conversationId, pageLimit = 50 } = options
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const handleMessagesUpdate = useCallback(
    (updatedMessages: Message[]) => {
      setMessages(updatedMessages)
      setError(null)
      setHasMore(updatedMessages.length === pageLimit)
      setLoading(false)
    },
    [pageLimit]
  )

  const handleListenerError = useCallback((err: Error) => {
    console.error('Listener error:', err)
    setError(err.message)
    setLoading(false)
  }, [])

  // Load initial messages
  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setLoading(false)
      return
    }

    // Show loading immediately when switching conversations.
    // Real-time listener will clear this when it delivers the first snapshot.
    setLoading(true)

    const loadMessages = async () => {
      try {
        setLoading(true)
        setError(null)
        const initialMessages = await getMessages(conversationId, pageLimit)
        setMessages(initialMessages)
        setHasMore(initialMessages.length === pageLimit)
      } catch (err) {
        console.error('Error loading messages:', err)
        setError(err instanceof Error ? err.message : 'Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [conversationId, pageLimit])

  // Set up real-time listener
  useChatListener(conversationId, {
    onMessagesUpdate: handleMessagesUpdate,
    onError: handleListenerError,
  })

  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || messages.length === 0) return

    try {
      setLoading(true)
      const oldestMessage = messages[0]
      const moreMessages = await getMessages(
        conversationId,
        pageLimit,
        oldestMessage.timestamp as any
      )

      if (moreMessages.length < pageLimit) {
        setHasMore(false)
      }

      setMessages((prev) => [...moreMessages, ...prev])
    } catch (err) {
      console.error('Error loading more messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to load more messages')
    } finally {
      setLoading(false)
    }
  }, [conversationId, hasMore, messages, pageLimit])

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMore,
  }
}
