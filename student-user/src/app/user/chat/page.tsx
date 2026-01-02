'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { ChatBubble } from '@/components/admin/ChatBubble'
import { useToast } from '@/components/admin/Toast'
import { Send, MessageSquare, Circle } from 'lucide-react'

interface Message {
  id: string
  content: string
  timestamp: string
  isSent: boolean
  isDelivered?: boolean
}

interface Admin {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastMessageTime: string
  isOnline: boolean
}

export default function UserChatPage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { addToast, ToastContainer } = useToast()

  useEffect(() => {
    const adminInfo: Admin = {
      id: 'admin-1',
      name: 'Admin',
      avatar: 'AD',
      lastMessage: 'Hello! How can I help you today?',
      lastMessageTime: 'Just now',
      isOnline: false // toggle true/false to test
    }

    setAdmin(adminInfo)

    const savedMessages = JSON.parse(
      localStorage.getItem('userChatMessages') || '[]'
    )
    setMessages(savedMessages)
  }, [])

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !admin) return

    const newMsg: Message = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isSent: true,
      isDelivered: false
    }

    const updatedMessages = [...messages, newMsg]
    setMessages(updatedMessages)
    localStorage.setItem('userChatMessages', JSON.stringify(updatedMessages))
    setNewMessage('')
    
    // Simulate delivery after 1 second
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMsg.id 
            ? { ...msg, isDelivered: true }
            : msg
        )
      )
      
      // Update localStorage
      const updatedWithDelivery = updatedMessages.map(msg => 
        msg.id === newMsg.id 
          ? { ...msg, isDelivered: true }
          : msg
      )
      localStorage.setItem('userChatMessages', JSON.stringify(updatedWithDelivery))
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChatHistory = () => {
    setMessages([])
    localStorage.removeItem('userChatMessages')
    addToast('Chat history cleared', 'success')
  }

  return (
    <div className="p-6 h-screen overflow-hidden">
      <ToastContainer />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black">Chat with Admin</h1>
        <p className="text-black mt-2">
          Get help and support from your admin
        </p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-180px)]">
        {/* Admin Info Card */}
        <div className="w-80">
          <Card className="h-full">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">
                    {admin?.avatar || 'AD'}
                  </div>

                  {/* STATUS DOT */}
                  <Circle
                    className={`absolute bottom-4 right-0 h-4 w-4 fill-current ${
                      admin?.isOnline ? 'text-green-500' : 'text-red-600'
                    }`}
                  />
                </div>

                <h3 className="text-xl font-semibold text-black">
                  {admin?.name || 'Admin'}
                </h3>

                <div className="flex items-center justify-center gap-2 mt-2">
                  <Circle
                    className={`h-3 w-3 fill-current ${
                      admin?.isOnline ? 'text-green-500' : 'text-red-600'
                    }`}
                  />
                  <span className="text-sm text-black">
                    {admin?.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-black mb-2">About</h4>
                  <p className="text-sm text-black">
                    Your admin is here to help with questions and support.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-black mb-2">
                    Response Time
                  </h4>
                  <p className="text-sm text-black">
                    Usually responds within a few minutes.
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-black mb-2">Available</h4>
                  <p className="text-sm text-black">
                    Monday - Friday: 9:00 AM - 6:00 PM
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={clearChatHistory}
                  className="w-full hover:cursor-pointer"
                >
                  Clear Chat History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Section */}
        <div className="flex-1">
          <Card className="h-full max-h-[calc(100vh-180px)]">
            <CardContent className="p-0 h-full max-h-[calc(100vh-180px)] flex flex-col">
              {admin ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                          {admin.avatar}
                        </div>

                        {/* STATUS DOT */}
                        <Circle
                          className={`absolute bottom-0 right-0 h-3 w-3 fill-current ${
                            admin.isOnline
                              ? 'text-green-500'
                              : 'text-red-600'
                          }`}
                        />
                      </div>

                      <div>
                        <p className="font-medium text-black">
                          {admin.name}
                        </p>
                        <p className="text-sm text-black">
                          {admin.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 transition-colors" id="chat-messages-container" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                    {messages.map(message => (
                      <ChatBubble
                        key={message.id}
                        message={message.content}
                        timestamp={message.timestamp}
                        isSent={message.isSent}
                        isDelivered={message.isDelivered}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border rounded-lg "
                      />

                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="flex items-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-black text-lg">Loading chat...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
