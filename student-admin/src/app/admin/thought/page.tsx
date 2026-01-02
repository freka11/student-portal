'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { Modal } from '@/components/admin/Modal'
import { ThoughtHistory } from '@/components/admin/ThoughtHistory'
import ThoughtEditor from '@/components/admin/ThoughtEditor'
import { Card, CardContent } from '@/components/admin/Card'
import { Lightbulb } from 'lucide-react'

interface ThoughtHistoryItem {
  id: string
  content: string
  date: string
  adminName: string
  adminId: string
}

export default function ThoughtPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentThought, setCurrentThought] = useState<ThoughtHistoryItem | null>(null)
  const { addToast, ToastContainer } = useToast()

  // Load current thought from localStorage or use mock data
  useEffect(() => {
    const savedThought = localStorage.getItem('dailyThought')
    if (savedThought) {
      // Create a thought item from localStorage
      const thoughtItem: ThoughtHistoryItem = {
        id: 'current',
        content: savedThought,
        date: new Date().toISOString().split('T')[0],
        adminName: 'Current Admin',
        adminId: 'admin_current'
      }
      setCurrentThought(thoughtItem)
    } else {
      // Set mock thought if no data exists
      const mockThought = 'The expert in anything was once a beginner. Every professional started as an amateur, and every master was once a disaster. Keep going, keep growing, and never stop learning.'
      const thoughtItem: ThoughtHistoryItem = {
        id: 'current',
        content: mockThought,
        date: new Date().toISOString().split('T')[0],
        adminName: 'Current Admin',
        adminId: 'admin_current'
      }
      setCurrentThought(thoughtItem)
      localStorage.setItem('dailyThought', mockThought)
    }
  }, [])

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleThoughtSaved = (thought: string) => {
    addToast('Thought saved successfully!', 'success')
    handleCloseModal()
    
    // Update current thought
    const thoughtItem: ThoughtHistoryItem = {
      id: 'current',
      content: thought,
      date: new Date().toISOString().split('T')[0],
      adminName: 'Current Admin',
      adminId: 'admin_current'
    }
    setCurrentThought(thoughtItem)
  }

  const handleThoughtAdded = (thought: ThoughtHistoryItem) => {
    // Update current thought when new thought is added to history
    setCurrentThought(thought)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="p-6">
      <ToastContainer />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Thought of the Day</h1>
          <p className="text-black mt-2">Manage inspirational thoughts for students</p>
        </div>
        <Button
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          aria-label="Add new thought">
          Add Thought
        </Button>
      </div>

      {currentThought && (
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 transition-transform hover:scale-103">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Today's Thought</span>
            </div>
            <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
              "{currentThought.content}"
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-blue-200">
              <p className="text-xs text-blue-600">{formatDate(currentThought.date)}</p>
              <p className="text-xs text-gray-500">By {currentThought.adminName}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <ThoughtHistory onThoughtAdded={handleThoughtAdded} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Manage Thought of the Day"
        className="max-w-2xl"
      >
        <ThoughtEditor onThoughtSaved={handleThoughtSaved} />
      </Modal>
    </div>
  )
}
