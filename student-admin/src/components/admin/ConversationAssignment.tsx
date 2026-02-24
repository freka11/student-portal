'use client'

import { useState } from 'react'
import { Button } from './Button'
import { User, Users, Check } from 'lucide-react'

interface ConversationAssignmentProps {
  conversation: any
  availableTeachers: any[]
  currentUserId: string
  currentUserRole: string
  onAssignmentChange: (conversationId: string, teacherId: string | null) => Promise<void>
}

export function ConversationAssignment({
  conversation,
  availableTeachers,
  currentUserId,
  currentUserRole,
  onAssignmentChange
}: ConversationAssignmentProps) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<string>(
    conversation.assignedTeacherId || ''
  )

  // Only show assignment UI for super admins
  if (currentUserRole !== 'super_admin') {
    if (conversation.assignedTeacherName) {
      return (
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <Users className="h-3 w-3" />
          <span>Assigned to: {conversation.assignedTeacherName}</span>
        </div>
      )
    }
    return null
  }

  const handleAssign = async () => {
    setIsAssigning(true)
    try {
      await onAssignmentChange(conversation.id, selectedTeacher || null)
    } catch (error) {
      console.error('Assignment failed:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <User className="h-4 w-4 text-gray-600" />
        <span className="text-xs font-medium text-gray-700">Assignment</span>
        {conversation.assignedTeacherId && (
          <div className="w-2 h-2 bg-green-500 rounded-full" title="Assigned"></div>
        )}
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <select
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
          className="flex-1 min-w-0 max-w-full w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
          disabled={isAssigning}
        >
          <option value="">Unassigned</option>
          {availableTeachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name} ({teacher.email})
            </option>
          ))}
        </select>

        <Button
          onClick={handleAssign}
          disabled={isAssigning || selectedTeacher === conversation.assignedTeacherId}
          className="px-2 py-1 text-xs shrink-0"
          variant={selectedTeacher === conversation.assignedTeacherId ? 'outline' : 'primary'}
        >
          {isAssigning ? (
            '...'
          ) : selectedTeacher === conversation.assignedTeacherId ? (
            <Check className="h-3 w-3" />
          ) : (
            'Assign'
          )}
        </Button>
      </div>

      {conversation.assignedTeacherName && (
        <div className="text-xs text-gray-600 mt-1">
          Currently assigned to: <span className="font-medium">{conversation.assignedTeacherName}</span>
        </div>
      )}
    </div>
  )
}
