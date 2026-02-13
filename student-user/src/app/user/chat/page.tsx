'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { MessageSquare, Plus } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { useAvailableUsers } from '@/hooks/useAvailableUsers'
import { ConversationList } from '@/components/user/ConversationList'
import { MessageThread } from '@/components/user/MessageThread'
import { MessageInput } from '@/components/user/MessageInput'
import { useStudentUser } from '@/hooks/useStudentUser'
import { createConversation } from '@/lib/chatService'

export default function UserChatPage() {
  const { user, ready } = useStudentUser()
  const { addToast, ToastContainer } = useToast()
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showAvailableUsers, setShowAvailableUsers] = useState(false)

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
    userId: user?.id || '',
    userType: 'student',
  })

  const { users: availableUsers, loading: usersLoading } = useAvailableUsers(
    user?.id || '',
    'student'
  )

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
      
      setShowAvailableUsers(false)
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
              <div className="-m-4 mb-4 p-4 bg-[#f0f2f5] border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#111b21]">Chats</h2>
                  <p className="text-xs text-[#667781] mt-1">Select an admin to chat</p>
                </div>
                <Button
                  onClick={() => setShowAvailableUsers(!showAvailableUsers)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </div>

              {showAvailableUsers ? (
                // Available Users List
                <div className="flex-1 overflow-y-auto">
                  {usersLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading admins...</p>
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No admins available</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {availableUsers.map((admin) => (
                        <div
                          key={admin.id}
                          className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-black truncate">
                                {admin.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {admin.email}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleStartConversation(admin.id, admin.name)}
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
