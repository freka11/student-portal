'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/types/chat'
import { ChatBubble } from '@/components/admin/ChatBubble'
import { MessageSquare } from 'lucide-react'

interface MessageThreadProps {
  messages: Message[]
  currentUserId: string
  loading: boolean
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void
}

export const MessageThread = ({
  messages,
  currentUserId,
  loading,
  onScroll,
}: MessageThreadProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Auto-scroll on new messages
    const timer = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timer)
  }, [messages])

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No messages yet</p>
          <p className="text-sm text-gray-400 mt-2">Start the conversation</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto p-4 space-y-2 bg-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 transition-colors"
      id="chat-messages-container"
    >
      {messages.map((message) => (
        <ChatBubble
          key={message.id}
          message={message.content}
          timestamp={message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          isSent={message.senderId === currentUserId}
          isDelivered={message.deliveryStatus === 'delivered'}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
