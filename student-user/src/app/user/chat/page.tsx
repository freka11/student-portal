'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { MessageSquare, Search } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { useAvailableUsers } from '@/hooks/useAvailableUsers'
import { MessageThread } from '@/components/user/MessageThread'
import { MessageInput } from '@/components/user/MessageInput'
import { useStudentUser } from '@/hooks/useStudentUser'
import { createConversation } from '@/lib/chatService'

export default function UserChatPage() {
  const { user, ready } = useStudentUser()
  const { addToast, ToastContainer } = useToast()
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

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
  } = useChat({
    userId: user?.id || '',
    userType: 'student',

  })

  const { users: availableUsers, loading: usersLoading } = useAvailableUsers(
    user?.id || '',
    'student'
  )

  // Debug logging
  useEffect(() => {
    console.log('🔍 Chat Debug - Student User:', user)
    console.log('🔍 Chat Debug - Available Users:', availableUsers)
    console.log('🔍 Chat Debug - Users Loading:', usersLoading)
    console.log('🔍 Chat Debug - Conversations:', conversations)
    console.log('🔍 Chat Debug - Selected Conversation:', selectedConversation)
  }, [user, availableUsers, usersLoading, conversations, selectedConversation])

  useEffect(() => {
    if (error) {
      console.error('Chat error:', error)
      addToast(error, 'error')
      
      // Check if it's a Firestore permission error
      if (error.includes('permission') || error.includes('Permission')) {
        console.log('⚠️ Firestore permission error detected!')
        console.log('Follow these steps to fix:')
        console.log('1. Open firestore-test-rules.txt file in student-admin folder')
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
      addToast('Message sent', 'success')
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Failed to send message',
        'error'
      )
    } finally {
      setSendingMessage(false)
    }
  }

  const handleStartConversation = async (adminId: string, adminName: string) => {
    if (!user) return

    try {
      const existing = allConversations.find((c) => c.adminId === adminId)
      if (existing) {
        selectConversation(existing.id)
        return
      }

      const conversationId = await createConversation(
        adminId,
        user.id,
        adminName,
        user.name,
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
      addToast(`Started conversation with ${adminName}`, 'success')
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

  if (!user) {
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
        <h1 className="text-2xl sm:text-3xl font-bold text-black">Chat with Admin</h1>
        <p className="text-black mt-2">Get help and support from your admin</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-180px)] min-h-0">
        {/* Conversation List */}
        <div className={`w-full lg:w-80 ${selectedConversation ? 'hidden lg:block' : ''}`}>
          <Card className="h-full">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="-m-4 mb-4 p-4 bg-[#f0f2f5] border-b border-gray-200 justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search admins..."
                    value={searchQuery}
                    onChange={(e) => searchConversations(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {usersLoading && loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading chats...</p>
                  </div>
                ) : (
                  (() => {
                    const q = searchQuery.trim().toLowerCase()
                    const conversationAdminIds = new Set(allConversations.map((c) => c.adminId))

                    const remainingAdmins = availableUsers
                      .filter((u) => !conversationAdminIds.has(u.id))
                      .filter((u) => {
                        if (!q) return true
                        return (
                          u.name.toLowerCase().includes(q) ||
                          u.email.toLowerCase().includes(q)
                        )
                      })
                      .sort((a, b) => a.name.localeCompare(b.name))

                    const hasAny = conversations.length > 0 || remainingAdmins.length > 0
                    if (!hasAny) {
                      return (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No chats found</p>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-1">
                        {conversations.map((conversation) => {
                          const adminUser = availableUsers.find(
                            (u) => u.id === conversation.adminId
                          )
                          return (
                            <div
                              key={conversation.id}
                              onClick={() => selectConversation(conversation.id)}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedConversation?.id === conversation.id
                                  ? 'bg-blue-50 border border-blue-200'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="relative flex-shrink-0">
                                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                    {conversation.adminName.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-black truncate">
                                      {conversation.adminName}
                                    </p>
                                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                      {conversation.lastMessageTime.toLocaleDateString()}
                                    </span>
                                  </div>
                                  {adminUser?.email ? (
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                      {adminUser.email}
                                    </p>
                                  ) : null}
                                  <p className="text-sm text-gray-600 truncate mt-1">
                                    {conversation.lastMessage || 'No messages yet'}
                                  </p>
                                </div>
                                {conversation.studentUnreadCount > 0 && (
                                  <div className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                                    {conversation.studentUnreadCount}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}

                        {remainingAdmins.map((admin) => (
                          <div
                            key={admin.id}
                            onClick={() => handleStartConversation(admin.id, admin.name)}
                            className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative flex-shrink-0">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                  {admin.name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-black truncate">{admin.name}</p>
                                <p className="text-xs text-gray-500 truncate mt-1">{admin.email}</p>
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
                          {selectedConversation.adminName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-[#111b21]">
                          {selectedConversation.adminName}
                        </p>
                        <p className="text-sm text-[#667781]">Admin</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <MessageThread
                    messages={messages}
                    currentUserId={user.id}
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
                    <p className="text-black text-lg">Select an admin to start chatting</p>
                    <p className="text-black text-sm mt-2">Choose from the admin list on the left</p>
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
                  <p className="text-black text-lg">Select an admin to start chatting</p>
                  <p className="text-black text-sm mt-2">Choose from the admin list above</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
