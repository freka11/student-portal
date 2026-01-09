'use client'

import { useState, useEffect } from 'react'
import { Trash2, Lightbulb } from 'lucide-react'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { Modal } from '@/components/admin/Modal'
import { ThoughtHistory } from '@/components/admin/ThoughtHistory'
import ThoughtEditor from '@/components/admin/ThoughtEditor'
import { Card, CardContent } from '@/components/admin/Card'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

interface ThoughtHistoryItem {
  id: string
  content: string
  date: string
  adminName: string
  adminId: string
}

export default function ThoughtPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentThought, setCurrentThought] =
    useState<ThoughtHistoryItem | null>(null)

  const { addToast, ToastContainer } = useToast()

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  /* ---------- Load today's thought ---------- */
  useEffect(() => {
    const loadTodayThought = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]

        const res = await fetch('/api/thoughts')
        const thoughts: ThoughtHistoryItem[] = await res.json()

        const todayThought = thoughts.find(t => t.date === today)
        setCurrentThought(todayThought || null)
      } catch (err) {
        console.error('Failed to load today thought', err)
        setCurrentThought(null)
      }
    }

    loadTodayThought()
  }, [])

  /* ---------- Open modal via ?add=true and clean URL ---------- */
  useEffect(() => {
    if (searchParams.get('add') !== 'true') return

    setIsModalOpen(true)


    const params = new URLSearchParams(searchParams.toString())
    params.delete('add')

    const cleanUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname

    router.replace(cleanUrl, { scroll: false })
  }, [searchParams, pathname, router])

  /* ---------- Handlers ---------- */
  const handleOpenModal = () => setIsModalOpen(true)
  const handleCloseModal = () => setIsModalOpen(false)

  const handleThoughtSaved = (thought: string) => {
    addToast('Thought saved successfully!', 'success')
    setIsModalOpen(false)

    setCurrentThought({
      id: 'current',
      content: thought,
      date: new Date().toISOString().split('T')[0],
      adminName: 'Current Admin',
      adminId: 'admin_current',
    })
  }

  const handleThoughtAdded = (thought: ThoughtHistoryItem) => {
    setCurrentThought(thought)
  }

  const handleDeleteThought = async () => {
    if (!currentThought) return

    try {
      const res = await fetch(`/api/thoughts?id=${currentThought.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        addToast('Thought deleted successfully!', 'success')
        setCurrentThought(null)
      } else {
        addToast('Failed to delete thought', 'error')
      }
    } catch {
      addToast('Failed to delete thought', 'error')
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  /* ---------- UI ---------- */
  return (
    <div className="p-6">
      <ToastContainer />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Thought of the Day</h1>
          <p className="text-black mt-2">
            Manage inspirational thoughts for students
          </p>
        </div>

        <Button
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Add Thought
        </Button>
      </div>

      {currentThought && (
        <Card className="mb-8 bg-linear-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Today&apos;s Thought
              </span>
            </div>

            <p className="text-gray-700 italic text-lg mb-4">
              "{currentThought.content}"
            </p>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <p className="text-xs text-blue-600">
                  {formatDate(currentThought.date)}
                </p>
                <p className="text-xs text-gray-500">
                  By {currentThought.adminName}
                </p>
              </div>

              <Button
                onClick={handleDeleteThought}
                variant="outline"
                size="sm"
                className="text-white bg-red-500 hover:bg-red-600"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ThoughtHistory onThoughtAdded={handleThoughtAdded}/>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Manage Thought of the Day"
        className="max-w-2xl ">
        <ThoughtEditor onThoughtSaved={handleThoughtSaved} />
      </Modal>
    </div>
  )
}
