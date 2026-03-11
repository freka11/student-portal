'use client'

import { useEffect, useState } from 'react'
import { Button } from './Button'
import { UserRoundCheck, UserRoundPen } from 'lucide-react'
import { Modal } from './Modal'

interface ConversationAssignmentProps {
  conversation: any
  availableTeachers: any[]
  currentUserId: string
  currentUserRole: string
  onAssignmentChange: (conversationId: string, teacherId: string | null) => Promise<void>
  displayMode?: 'card' | 'inline'
}

export function ConversationAssignment({
  conversation,
  availableTeachers,
  currentUserId,
  currentUserRole,
  onAssignmentChange,
  displayMode = 'card'
}: ConversationAssignmentProps) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<string>('')

  useEffect(() => {
    if (!isModalOpen) return
    setSelectedTeacher(conversation.assignedTeacherId || '')
  }, [isModalOpen, conversation.assignedTeacherId])

  // Only show assignment UI for super admins and admins
  if (currentUserRole !== 'super_admin' && currentUserRole !== 'admin') {
    if (conversation.assignedTeacherName) {
      return (
        <div className="text-xs text-gray-500 mt-1 truncate">
          {conversation.assignedTeacherName}
        </div>
      )
    }
    return null
  }

  const handleAssign = async () => {
    setIsAssigning(true)
    try {
      await onAssignmentChange(conversation.id, selectedTeacher || null)
      setIsModalOpen(false)
    } catch (error) {
      console.error('Assignment failed:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUnassign = async () => {
    setIsAssigning(true)
    try {
      await onAssignmentChange(conversation.id, null)
      setIsModalOpen(false)
    } catch (error) {
      console.error('Unassign failed:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  const assignmentButton = (
    <Button
      onClick={() => setIsModalOpen(true)}
      disabled={isAssigning}
      className="p-2 h-8 w-8 active:scale-75 hover:scale-110 transition-transform duration-200"
      variant={conversation.assignedTeacherId ? 'outline' : 'primary'}
      title={conversation.assignedTeacherId ? 'Reassign' : 'Assign'}
    >
      {conversation.assignedTeacherId ? (
        <UserRoundPen className="h-4 w-4" />
      ) : (
        <UserRoundCheck className="h-4 w-4" />
      )}
    </Button>
  )

  const assignmentModal = (
    <Modal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title={conversation.assignedTeacherId ? 'Reassign conversation' : 'Assign conversation'}
      backdropClassName="bg-black/30"
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="text-sm text-gray-700">
          {conversation.assignedTeacherName ? (
            <span>
              Assigned to: <span className="font-medium">{conversation.assignedTeacherName}</span>
            </span>
          ) : (
            <span>Currently unassigned</span>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select teacher
          </label>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isAssigning}
          >
            <option value="">Unassigned</option>
            {availableTeachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} ({teacher.email})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            onClick={handleUnassign}
            disabled={isAssigning || !conversation.assignedTeacherId}
            variant="outline"
            className="px-3"
          >
            Unassign
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsModalOpen(false)}
              disabled={isAssigning}
              variant="outline"
              className="px-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={
                isAssigning || selectedTeacher === (conversation.assignedTeacherId || '')
              }
              className="px-3"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )

  if (displayMode === 'inline') {
    return (
      <>
        {assignmentButton}
        {assignmentModal}
      </>
    )
  }

  return (
    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-end">
        {assignmentButton}
      </div>

      {assignmentModal}
    </div>
  )
}
