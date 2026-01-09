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
    // Initialize with mock students and messages
    const mockStudents: Student[] = [
      {
        id: 'STU001',
        name: 'Alice Johnson',
        avatar: 'AJ',
        lastMessage: 'Thanks for the help!',
        lastMessageTime: '10:30 AM',
        unreadCount: 2,
        isOnline: true
      },
      {
        id: 'STU002',
        name: 'Bob Smith',
        avatar: 'BS',
        lastMessage: 'I have a question about the assignment',
        lastMessageTime: 'Yesterday',
        unreadCount: 0,
        isOnline: false
      },
      {
        id: 'STU003',
        name: 'Carol Davis',
        avatar: 'CD',
        lastMessage: 'Can you review my submission?',
        lastMessageTime: '2 days ago',
        unreadCount: 1,
        isOnline: false
      }
    ]
    
    // Load mock messages from localStorage or initialize with sample data
    const mockMessages: Record<string, Message[]> = {
      'STU001': [
        {
          id: '1',
          content: 'Hi, I need help with the latest assignment',
          timestamp: '10:15 AM',
          isSent: false,
          isDelivered: true
        },
        {
          id: '2',
          content: 'Sure! What part are you struggling with?',
          timestamp: '10:16 AM',
          isSent: true,
          isDelivered: true
        },
        {
          id: '3',
          content: 'The third question about algorithms',
          timestamp: '10:18 AM',
          isSent: false,
          isDelivered: true
        },
        {
          id: '4',
          content: 'Let me explain the approach step by step...',
          timestamp: '10:20 AM',
          isSent: true,
          isDelivered: true
        },
        {
          id: '5',
          content: 'Thanks for the help!',
          timestamp: '10:30 AM',
          isSent: false,
          isDelivered: true
        }
      ],
      'STU002': [
        {
          id: '1',
          content: 'I have a question about the assignment',
          timestamp: 'Yesterday',
          isSent: false,
          isDelivered: true
        }
      ],
      'STU003': [
        {
          id: '1',
          content: 'Can you review my submission?',
          timestamp: '2 days ago',
          isSent: false,
          isDelivered: true
        }
      ]
    }
    
    // Store in localStorage for persistence
    const storedMessages = localStorage.getItem('adminChatMessages')
    if (!storedMessages) {
      localStorage.setItem('adminChatMessages', JSON.stringify(mockMessages))
    }
    
    setStudents(mockStudents)
  }, [])

  useEffect(() => {
    if (selectedStudent) {
      // Load messages for this student from localStorage
      const allMessages = JSON.parse(localStorage.getItem('adminChatMessages') || '{}')
      const studentMessages = allMessages[selectedStudent.id] || []
      setMessages(studentMessages)
    } else {
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
      
      // Update messages state
      setMessages(prev => [...prev, newMsg])
      
      // Save to localStorage
      const allMessages = JSON.parse(localStorage.getItem('adminChatMessages') || '{}')
      if (!allMessages[selectedStudent.id]) {
        allMessages[selectedStudent.id] = []
      }
      allMessages[selectedStudent.id].push(newMsg)
      localStorage.setItem('adminChatMessages', JSON.stringify(allMessages))
      
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
        
        // Update localStorage with delivered status
        const updatedMessages = JSON.parse(localStorage.getItem('adminChatMessages') || '{}')
        const studentMessages = updatedMessages[selectedStudent.id] || []
        const messageIndex = studentMessages.findIndex((msg: Message) => msg.id === newMsg.id)
        if (messageIndex !== -1) {
          studentMessages[messageIndex].isDelivered = true
          localStorage.setItem('adminChatMessages', JSON.stringify(updatedMessages))
        }
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
    <div className="p-4 sm:p-6 h-full">
      <ToastContainer />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black">Chat</h1>
        <p className="text-black mt-2">Communicate with students</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-160px)] overflow-hidden">

        {/* Student List */}
        <div className={`w-full lg:w-80 ${selectedStudent ? 'hidden lg:block' : ''}`}>
          <Card className="h-full">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="-m-4 mb-4 p-4 bg-[#f0f2f5] border-b border-gray-200">
                <h2 className="text-lg font-semibold text-[#111b21]">Chats</h2>
                <p className="text-xs text-[#667781] mt-1">Select a student to view messages</p>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent"
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
                    <User className="h-12 w-12 text-gray-400 mx-2 mb-2" />
                    <p className="text-gray-500">No students found</p>
                  </div>
                ) : (
                  <div className="">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`
                          p-3 rounded-lg cursor-pointer transition-colors
                          ${selectedStudent?.id === student.id 
                            ? 'bg-blue-50 border border-none' 
                            : 'hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className="">
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
        <div className={`flex-1 min-h-0 ${selectedStudent ? '' : 'hidden lg:block'}`}>
          <Card className="h-full">
            <CardContent className="p-0 h-full flex flex-col min-h-0">
              {selectedStudent ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-[#f0f2f5]">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedStudent(null)}
                        className="lg:hidden hover:cursor-pointer"
                      >
                        Back
                      </Button>
                      <div className="relative">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                          {selectedStudent.avatar}
                        </div>
                        {selectedStudent.isOnline && (
                          <Circle className="absolute bottom-0 right-0 h-3 w-3 text-green-500 fill-current" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[#111b21]">{selectedStudent.name}</p>
                        <p className="text-sm text-[#667781]">
                          {selectedStudent.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 bg-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 transition-colors" id="admin-chat-messages-container">
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
                  <div className="p-3 border-t border-gray-200 bg-[#f0f2f5]">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-full focus:outline-none  focus:border-transparent"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                      >
                         Send
                        <Send className="h-4 w-4" />
                       
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

        {!selectedStudent && (
          <div className="flex-1 min-h-0 lg:hidden">
            <Card className="h-full">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-black text-lg">Select a student to start chatting</p>
                  <p className="text-black text-sm mt-2">Choose from the student list above</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
