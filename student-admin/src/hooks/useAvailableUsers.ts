// Hook for fetching available users to chat with
import { useState, useEffect } from 'react'
import { getUsersByRole } from '@/lib/userService'
import { getConversations } from '@/lib/chatService'

export interface AvailableUser {
  id: string
  name: string
  email: string
  avatar?: string
  hasConversation: boolean
}

export const useAvailableUsers = (currentUserId: string, userType: 'admin' | 'student') => {
  const [users, setUsers] = useState<AvailableUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      if (!currentUserId) return

      try {
        setLoading(true)
        setError(null)

        // Determine which role to fetch
        const roleToFetch = userType === 'admin' ? 'student' : 'admin'
        
        // Get all users with the target role
        const allUsers = await getUsersByRole(roleToFetch)
        
        // Get existing conversations
        const conversations = await getConversations(currentUserId, userType)
        const conversationUserIds = new Set(
          conversations.map((conv) =>
            userType === 'admin' ? conv.studentId : conv.adminId
          )
        )

        // Map users to available users - SHOW ALL USERS, NO FILTERING
        const availableUsers: AvailableUser[] = allUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          hasConversation: conversationUserIds.has(user.id),
        }))

        console.log('🔍 Admin useAvailableUsers - Final available users (ALL USERS):', availableUsers)
        setUsers(availableUsers)
      } catch (err) {
        console.error('Error loading available users:', err)
        setError(err instanceof Error ? err.message : 'Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [currentUserId, userType])

  return { users, loading, error }
}
