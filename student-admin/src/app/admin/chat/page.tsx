'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { MessageSquare, Search, Crown, ChevronLeft } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { useTeacherChat } from '@/hooks/useTeacherChat'
import { useAvailableUsers } from '@/hooks/useAvailableUsers'
import { MessageThread } from '@/components/admin/MessageThread'
import { MessageInput } from '@/components/admin/MessageInput'
import { ConversationAssignment } from '@/components/admin/ConversationAssignment'
import { useAdminUser } from '@/hooks/useAdminUser'
import { createConversation } from '@/lib/chatService'
import { getUsersByRole } from '@/lib/userService'
import { auth } from '@/lib/firebase-client'
import { config } from '@/lib/config'
import { DateRangePicker } from '@heroui/date-picker'
import { type DateValue } from '@internationalized/date'
import { X } from 'lucide-react'
type DateRange = {
  start: DateValue
  end: DateValue
}



export default function ChatPage() {
  const { admin, ready } = useAdminUser()
  const { addToast, ToastContainer } = useToast()
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const [teachers, setTeachers] = useState<any[]>([])
  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  // Always call hooks in a stable order (do not conditionally call hooks)
  const isTeacher = admin?.role === 'teacher'
  const adminChatHook = useChat({ userId: admin?.id || '', userType: 'admin', enabled: !isTeacher })
  const teacherChatHook = useTeacherChat({ userId: admin?.id || '', enabled: isTeacher })

  const chatHook = isTeacher ? teacherChatHook : adminChatHook

  const {
    allConversations,
    conversations,
    selectedConversation,
    messages,
    loading,
    error,
    searchQuery,
    selectConversation,
    sendMessage,
    searchConversations,
  } = chatHook

  const { users: availableUsers, loading: usersLoading } = useAvailableUsers(
    admin?.id || '',
    'admin'
  )

  // Fetch teachers directly for assignment dropdown
  useEffect(() => {
    const loadTeachers = async () => {
      if (!admin?.id) return
      if (admin?.role !== 'super_admin' && admin?.role !== 'admin') {
        setTeachers([])
        return
      }

      try {
        const [teachers, admins, superAdmins] = await Promise.all([
          getUsersByRole('teacher'),
          getUsersByRole('admin'),
          getUsersByRole('super_admin')
        ])
        
        // Combine all and filter out the current user so they don't assign to themselves unnecessarily (optional, but good practice. actually let's skip filtering current user so they can assign to themselves)
        const allAssignable = [...teachers, ...admins, ...superAdmins]
        setTeachers(allAssignable)
      } catch (err) {
        console.error('Error loading teachers:', err)
        setTeachers([])
      }
    }
    

    loadTeachers()
  }, [admin?.id, admin?.role])

  // Debug logging
  useEffect(() => {
    console.log('🔍 Admin Chat Debug - Admin User:', admin)
    console.log('🔍 Admin Chat Debug - Available Users:', availableUsers)
    console.log('🔍 Admin Chat Debug - Teachers:', teachers)
    console.log('🔍 Admin Chat Debug - Users Loading:', usersLoading)
    console.log('🔍 Admin Chat Debug - Conversations:', conversations)
    console.log('🔍 Admin Chat Debug - Selected Conversation:', selectedConversation)
  }, [admin, availableUsers, teachers, usersLoading, conversations, selectedConversation])

  useEffect(() => {
    if (error) {
      console.error('Chat error:', error)
      addToast(error, 'error')
      
      // Check if it's a Firestore permission error
      if (error.includes('permission') || error.includes('Permission')) {
        console.log('⚠️ Firestore permission error detected!')
        console.log('Follow these steps to fix:')
        console.log('1. Open firestore-test-rules.txt file')
        console.log('2. Copy the rules to Firebase Console')
        console.log('3. Publish the rules')
        console.log('4. Refresh this page')
      }
    }
  }, [error, addToast])




  useEffect(() => {
    if (!selectedConversation) return

    const stillExists = conversations.find(
      (c) => c.id === selectedConversation.id
    )

    if (!stillExists) {
      selectConversation('')
    }
  }, [conversations, selectedConversation, selectConversation])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      setSendingMessage(true)
      await sendMessage(newMessage)
      setNewMessage('')
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Failed to send message',
        'error'
      )
    } finally {
      setSendingMessage(false)
    }
  }

  const handleStartConversation = async (studentId: string, studentName: string) => {
    if (!admin) return

    try {
      const existing = allConversations.find((c) => c.studentId === studentId)
      if (existing) {
        selectConversation(existing.id)
        return
      }

      const conversationId = await createConversation(
        admin.id,
        studentId,
        admin.name,
        studentName,
        '',
        ''
      )
      
      // Select the new conversation
      const newConv = conversations.find((c) => c.id === conversationId)
      if (newConv) {
        selectConversation(conversationId)
      } else {
        // If conversation not in list yet, create a temporary one
        selectConversation(conversationId)
      }
      
      addToast(`Started conversation with ${studentName}`, 'success')
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Failed to start conversation',
        'error'
      )
    }
  }

  const handleAssignmentChange = async (conversationId: string, teacherId: string | null) => {
    try {
      // Ensure auth is ready and token is retrieved
      await auth.authStateReady()
      const token = await auth.currentUser?.getIdToken()

      if (!token) {
        throw new Error('Authentication required to assign conversations')
      }

      const response = await fetch(`${config.API_BASE_URL}/api/admin/assign-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId,
          teacherId,
          assignedBy: admin?.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        addToast(result.message, 'success')
      } else {
        addToast(result.message, 'error')
      }
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Failed to assign conversation',
        'error'
      )
    }
  }

  if (!ready) {
    return (
      <div className="p-4 sm:p-6 h-full">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="p-4 sm:p-6 h-full">
        <div className="text-center py-8">
          <p className="text-gray-500">Please log in to access chat</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-0px)] flex flex-col p-4 sm:p-6">
      <ToastContainer />

      <div className="mb-4 sm:mb-6 sticky top-0 z-10 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80">
        <div className="pt-1">
          <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-black">Chat</h1>
          </div>
          <p className="text-black mt-2">
          {admin?.role === 'super_admin' 
            ? 'Manage all conversations and assign to teachers' 
            : admin?.role === 'teacher'
            ? 'View and manage your assigned conversations'
            : 'Communicate with students'
          }
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
        <div className={`w-full lg:w-80 ${selectedConversation ? 'hidden lg:block' : ''}`}>
          <Card className="h-full">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={admin?.role === 'teacher' ? "Search assigned students..." : "Search students..."}
                  value={searchQuery}
                  onChange={(e) => searchConversations(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent"
                />
                
                </div>
                
                <DateRangePicker
                    value={dateRange}
  onChange={setDateRange}
  className="max-w-fit"
  size="md"
  classNames={{
    base: "bg-white border-gray-200",
    inputWrapper: "bg-white border-gray-200 hover:bg-gray-50",
    input: "hidden",
    separator: "hidden",
    popoverContent: "bg-white border-gray-200",
  }}
  calendarProps={{
    classNames: {
      cell: "cursor-pointer",
      cellButton:
        "cursor-pointer hover:bg-blue-100 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white",
    },
                    }}
                  />

  {dateRange && (
        <button
      onClick={() => setDateRange(null)}
      className="px-2 py-1 text-s  hover:bg-gray-200 rounded-md cursor-pointer hover:text-red-500"
    >
      <X/>
    </button>
  )}
                </div>
                    
       

              <div className="flex-1 min-h-0 overflow-y-auto">
                {usersLoading && loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading chats...</p>
                  </div>
                ) : (
                  (() => {
                    const q = searchQuery.trim().toLowerCase()
                    const conversationStudentIds = new Set(allConversations.map((c) => c.studentId))

                    const remainingUsers = availableUsers
                      .filter((u) => !conversationStudentIds.has(u.id))
                      .filter((u) => {
                        if (!q) return true
                        return (
                          u.name.toLowerCase().includes(q) ||
                          u.email.toLowerCase().includes(q)
                        )
                      })
                      // Deduplicate users by ID to prevent duplicates
                      .filter((user, index, self) => 
                        index === self.findIndex((u) => u.id === user.id)
                      )
                      .sort((a, b) => a.name.localeCompare(b.name))

                    const hasAny = conversations.length > 0 || remainingUsers.length > 0

                    if (!hasAny) {
                      return (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No chats found</p>
                        </div>
                      )
                    }

                    const filteredByDate = dateRange?.start && dateRange?.end
                      ? conversations.filter(c => {
                          const chatDate = new Date(c.createdAt)
                          const startDate = new Date(dateRange.start.toString())
                          const endDate = new Date(dateRange.end.toString())
                          return chatDate >= startDate && chatDate <= endDate
                        })
                      : conversations

                    return (
                      <div className="space-y-1">
                        {filteredByDate.map((conversation) => (
                          <div
                            key={conversation.id}
                            onClick={() => selectConversation(conversation.id)}
                            className={`p-3 rounded-xl cursor-pointer transition-colors border hover:border-gray-300 ${
                              selectedConversation?.id === conversation.id
                                ? 'bg-blue-50 border-blue-200'
                                : 'border-transparent hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative shrink-0">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                  {conversation.studentName.charAt(0).toUpperCase()}
                                </div>
                                {conversation.assignedTeacherId && (
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white" title="Assigned"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium text-black truncate">
                                    {conversation.studentName}
                                  </p>

                                  {(admin?.role === 'super_admin' || admin?.role === 'admin') && (
                                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                      <ConversationAssignment
                                        conversation={conversation}
                                        availableTeachers={teachers}
                                        currentUserId={admin?.id || ''}
                                        currentUserRole={admin?.role || ''}
                                        onAssignmentChange={handleAssignmentChange}
                                        displayMode="inline"
                                      />
                                    </div>
                                  )}
                                </div>

                                <p className="text-xs text-gray-500 mt-0.5">
                                  {conversation.lastMessageTime.toLocaleDateString()}
                                </p>
                                {(() => {
                                  const studentUser = availableUsers.find(
                                    (u) => u.id === conversation.studentId
                                  )
                                  return studentUser?.email ? (
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                      {studentUser.email}
                                    </p>
                                  ) : null
                                })()}
                                <p className="text-sm text-gray-600 truncate mt-1">
                                  {conversation.lastMessage || 'No messages yet'}
                                </p>

                                {/* Show assignment info for teachers */}
                                {admin?.role === 'teacher' && conversation.assignedTeacherName && (
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <span>Assigned to you</span>
                                  </div>
                                )}
                              </div>
                              {conversation.adminUnreadCount > 0 && (
                                <div className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                                  {conversation.adminUnreadCount}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Only show "start new conversation" for non-teachers */}
                        {admin?.role !== 'teacher' && remainingUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => handleStartConversation(user.id, user.name)}
                            className="p-3 rounded-xl cursor-pointer transition-colors border border-transparent hover:bg-gray-50"
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative flex-shrink-0">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-black truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate mt-1">{user.email}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Conversation */}
        <div className={`flex-1 min-h-0 ${selectedConversation ? '' : 'hidden lg:block'}`}>
          <Card className="h-full">
            <CardContent className="p-0 h-full flex flex-col min-h-0">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-[#f0f2f5] sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => selectConversation('')}
                        className="hover:cursor-pointer text-black"
                      >
                        <ChevronLeft className="hover:scale-120 transition-all duration-300" />
                      </button>
                      <div className="relative bg-[#f0f2f5]">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                          {selectedConversation.studentName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-[#111b21]">
                          {selectedConversation.studentName}
                        </p>
                        <p className="text-sm text-[#667781]">Student</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <MessageThread
                    messages={messages}
                    currentUserId={admin.id}
                    loading={loading}
                  />

                  {/* Message Input */}
                  <MessageInput
                    value={newMessage}
                    onChange={setNewMessage}
                    onSend={handleSendMessage}
                    disabled={!selectedConversation}
                    loading={sendingMessage}
                  />
                </>
              ) : (
                <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center">
                  <div className="text-center">
                    <p className="text-black text-lg">Select a student to start chatting</p>
                    <p className="text-black text-sm mt-2">Choose from the student list on the left</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div> 

        {!selectedConversation && (
          <div className="flex-1 min-h-0 lg:hidden">
            <Card className="h-full">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
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
