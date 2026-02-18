'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { MessageSquare, Plus } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { useAvailableUsers } from '@/hooks/useAvailableUsers'
import { ConversationList } from '@/components/admin/ConversationList'
import { MessageThread } from '@/components/admin/MessageThread'
import { MessageInput } from '@/components/admin/MessageInput'
import { useAdminUser } from '@/hooks/useAdminUser'
import { createConversation } from '@/lib/chatService'



export default function ChatPage() {
  const { admin, ready } = useAdminUser()
  const { addToast, ToastContainer } = useToast()
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [sidebarView, setSidebarView] = useState<'users' | 'conversations'>('users')

  const {
    conversations,
    selectedConversation,
    messages,
    loading,
    error,
    searchQuery,
    selectConversation,
    sendMessage,
    searchConversations,
  } = useChat({
    userId: admin?.id || '',
    userType: 'admin',
  })

  const { users: availableUsers, loading: usersLoading } = useAvailableUsers(
    admin?.id || '',
    'admin'
  )

  // Debug logging
  useEffect(() => {
    console.log('🔍 Admin Chat Debug - Admin User:', admin)
    console.log('🔍 Admin Chat Debug - Available Users:', availableUsers)
    console.log('🔍 Admin Chat Debug - Users Loading:', usersLoading)
    console.log('🔍 Admin Chat Debug - Conversations:', conversations)
    console.log('🔍 Admin Chat Debug - Selected Conversation:', selectedConversation)
  }, [admin, availableUsers, usersLoading, conversations, selectedConversation])

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
      
      setSidebarView('users')
      addToast(`Started conversation with ${studentName}`, 'success')
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Failed to start conversation',
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
    <div className="p-4 sm:p-6 h-full">
      <ToastContainer />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black">Chat</h1>
        <p className="text-black mt-2">Communicate with students</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-160px)] overflow-hidden">
        {/* Conversation List */}
        <div className={`w-full lg:w-80 ${selectedConversation ? 'hidden lg:block' : ''}`}>
          <Card className="h-full">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="-m-4 mb-4 p-4 bg-[#f0f2f5] border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#111b21]">Chats</h2>
                  <p className="text-xs text-[#667781] mt-1">Select a student to view messages</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setSidebarView('users')}
                    className={`flex items-center gap-2 ${
                      sidebarView === 'users'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-white hover:bg-gray-100 text-black border border-gray-200'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    New
                  </Button>
                  <Button
                    onClick={() => setSidebarView('conversations')}
                    className={`hidden sm:flex items-center gap-2 ${
                      sidebarView === 'conversations'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-white hover:bg-gray-100 text-black border border-gray-200'
                    }`}
                  >
                    Recent
                  </Button>
                </div>
              </div>

              {sidebarView === 'users' ? (
                // Available Users List
                <div className="flex-1 overflow-y-auto">
                  {usersLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading students...</p>
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No students available</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {availableUsers.map((user) => (
                        <div
                          key={user.id}
                          className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-black truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleStartConversation(user.id, user.name)}
                              className="ml-2 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            >
                              Chat
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Conversations List
                <ConversationList
                  conversations={conversations}
                  selectedId={selectedConversation?.id || null}
                  onSelect={selectConversation}
                  onSearch={searchConversations}
                  loading={loading}
                  searchQuery={searchQuery}
                />
              )}
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
                  <div className="p-4 border-b border-gray-200 bg-[#f0f2f5]">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => selectConversation('')}
                        className="lg:hidden hover:cursor-pointer"
                      >
                        Back
                      </Button>
                      <div className="relative">
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

        {!selectedConversation && (
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
