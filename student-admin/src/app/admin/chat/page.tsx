'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { ChatBubble } from '@/components/admin/ChatBubble'
import { useToast } from '@/components/admin/Toast'
import { Send, Search, User, Circle, MessageSquare } from 'lucide-react'

interface Message {
  id: string
  content: string
  timestamp: string
  isSent: boolean
  isDelivered?: boolean
}

interface Student {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
}

export default function ChatPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { addToast, ToastContainer } = useToast()

  useEffect(() => {
    // Initialize with empty state - no API calls
    setStudents([])
    setMessages([])
  }, [])

  useEffect(() => {
    if (selectedStudent) {
      setMessages([])
    }
  }, [selectedStudent])

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    
    // Only auto-scroll if user is at bottom or new message is sent
    const container = document.getElementById('admin-chat-messages-container')
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50
      if (isAtBottom || messages.length === 0) {
        setTimeout(scrollToBottom, 100)
      }
    } else {
      scrollToBottom()
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedStudent) return

    const newMsg: Message = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSent: true,
      isDelivered: false
    }

    try {
      // Simulate sending message
      await new Promise(resolve => setTimeout(resolve, 300))
      setMessages(prev => [...prev, newMsg])
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
      }, 1000)
    } catch (error) {
      addToast('Failed to send message', 'error')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 h-full">
      <ToastContainer />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black">Chat</h1>
        <p className="text-black mt-2">Communicate with students</p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Student List */}
        <div className="w-80">
          <Card className="h-full">
            <CardContent className="p-4 h-full flex flex-col">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Student List */}
              <div className="flex-1 overflow-y-auto">
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-black">No students available</p>
                    <p className="text-sm text-black mt-2">Add students to start chatting</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No students found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`
                          p-3 rounded-lg cursor-pointer transition-colors
                          ${selectedStudent?.id === student.id 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                              {student.avatar}
                            </div>
                            {student.isOnline && (
                              <Circle className="absolute bottom-0 right-0 h-3 w-3 text-green-500 fill-current" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-black truncate">
                                {student.name}
                              </p>
                              <span className="text-xs text-black">
                                {student.lastMessageTime}
                              </span>
                            </div>
                            <p className="text-sm text-black truncate mt-1">
                              {student.lastMessage}
                            </p>
                          </div>
                          {student.unreadCount > 0 && (
                            <div className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {student.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Conversation */}
        <div className="flex-1">
          <Card className="h-full">
            <CardContent className="p-0 h-full flex flex-col">
              {selectedStudent ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                          {selectedStudent.avatar}
                        </div>
                        {selectedStudent.isOnline && (
                          <Circle className="absolute bottom-0 right-0 h-3 w-3 text-green-500 fill-current" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-black">{selectedStudent.name}</p>
                        <p className="text-sm text-black">
                          {selectedStudent.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 transition-colors" id="admin-chat-messages-container">
                    {messages.map((message) => (
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

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="flex items-center gap-2"
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-black text-lg">Select a student to start chatting</p>
                    <p className="text-black text-sm mt-2">Choose from the student list on the left</p>
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
