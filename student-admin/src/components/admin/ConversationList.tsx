'use client'

import { Conversation } from '@/types/chat'
import { Search, User, Circle } from 'lucide-react'
import { Card, CardContent } from './Card'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  onSearch: (query: string) => void
  loading: boolean
  searchQuery: string
}

export const ConversationList = ({
  conversations,
  selectedId,
  onSelect,
  onSearch,
  loading,
  searchQuery,
}: ConversationListProps) => {
  return (
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
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent"
          />
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No conversations yet</p>
              <p className="text-sm text-gray-400 mt-2">Start a new conversation</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onSelect(conversation.id)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-colors
                    ${selectedId === conversation.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {conversation.studentName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-black truncate">
                          {conversation.studentName}
                        </p>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {conversation.adminUnreadCount > 0 && (
                      <div className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                        {conversation.adminUnreadCount}
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
  )
}

// Helper function to format time
const formatTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`

  return date.toLocaleDateString()
}
