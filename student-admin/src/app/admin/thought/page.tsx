'use client'

import { useState, useEffect, Suspense } from 'react'
import { Trash2, Lightbulb, Plus } from 'lucide-react'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { Modal } from '@/components/admin/Modal'
import { ThoughtHistory } from '@/components/admin/ThoughtHistory'
import ThoughtEditor from '@/components/admin/ThoughtEditor'
import { Card, CardContent } from '@/components/admin/Card'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useAdminUser } from '@/hooks/useAdminUser'

interface ThoughtHistoryItem {
  id: string
  content: string
  date: string
  adminName: string
  adminId: string
}

function ThoughtPageContent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentThought, setCurrentThought] =
    useState<ThoughtHistoryItem | null>(null)

  const { addToast, ToastContainer } = useToast()

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { admin, ready } = useAdminUser()

  const loadTodayThought = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      console.log('Loading thought for date:', today)

      // Try to fetch from API first
      const res = await fetch('/api/thoughts')
      if (res.ok) {
        const thoughts: any[] = await res.json()
        console.log('All thoughts from API:', thoughts)

        // Map API data structure to frontend interface
        const mappedThoughts = thoughts.map(thought => ({
          id: thought.id,
          content: thought.text,
          date: thought.publishDate,
          adminName: thought.createdBy?.name || 'Admin',
          adminId: thought.createdBy?.uid || 'admin'
        }))

        const todayThought = mappedThoughts.find(t => t.date === today)
        console.log('Today\'s thought found from API:', todayThought)
        
        if (todayThought) {
          setCurrentThought(todayThought)
          return
        }
      }
    } catch (error) {
      console.log('API mode failed, falling back to localStorage')
    }

    // Fallback to localStorage
    try {
      const today = new Date().toISOString().split('T')[0]
      const savedThought = localStorage.getItem('dailyThought')
      
      if (savedThought) {
        console.log('Found thought in localStorage:', savedThought)
        const thoughtItem: ThoughtHistoryItem = {
          id: 'localStorage',
          content: savedThought,
          date: today,
          adminName: 'Current Admin',
          adminId: 'admin_current'
        }
        setCurrentThought(thoughtItem)
      } else {
        console.log('No thought found in localStorage for today')
        setCurrentThought(null)
      }
    } catch (err) {
      console.error('Failed to load from localStorage:', err)
      setCurrentThought(null)
    }
  }

  /* ---------- Load today's thought ---------- */
  useEffect(() => {
    if (!ready) return
    if (!admin) return

    // Clear any stale localStorage data
    localStorage.removeItem('dailyThought')
    loadTodayThought()
  }, [ready, admin])

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

  const handleThoughtSaved = async (thought: string) => {
    addToast('Thought saved successfully!', 'success')
    setIsModalOpen(false)
    
    // Reload today's thought to get the latest from API
    await loadTodayThought()
  }

  const handleThoughtAdded = async (thought: ThoughtHistoryItem) => {
    // Reload today's thought to ensure we have the latest
    await loadTodayThought()
  }

  const handleDeleteThought = async () => {
    if (!currentThought) return

    try {
      console.log('Deleting thought with ID:', currentThought.id)
      const res = await fetch(`/api/thoughts?id=${currentThought.id}`, {
        method: 'DELETE',
      })

      console.log('Delete response status:', res.status)
      console.log('Delete response ok:', res.ok)

      if (res.ok) {
        const responseData = await res.json()
        console.log('Delete response data:', responseData)
        addToast('Thought deleted successfully!', 'success')
        
        // Clear localStorage to prevent old thoughts from reappearing
        localStorage.removeItem('dailyThought')
        
        // Force clear current thought immediately
        setCurrentThought(null)
        
        // Then reload to confirm
        await loadTodayThought()
      } else {
        const errorText = await res.text()
        console.error('Delete failed:', errorText)
        addToast('Failed to delete thought', 'error')
      }
    } catch (error) {
      console.error('Delete error:', error)
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

  return (
    <div className="p-6 bg-linear-to-r from-blue-100 to-blue-200  ">
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
            className="bg-blue-700 hover:bg-blue-700 text-white w-full sm:w-auto hover:pr-8 transition-all ease-in-out duration-300 active:scale-90"
        >
          <Plus className="m-auto" />
          
        </Button>
      </div>

      {!currentThought && (
        <Card className="mb-8 bg-linear-to-l from-blue-100 to-blue-50 ">
          <CardContent className="p-6 text-center ">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Thought for Today
            </h3>
            <p className="text-gray-500 mb-4">
              Add an inspirational thought for students today!
            </p>
            <Button
              onClick={handleOpenModal}
              className="bg-blue-500 hover:bg-blue-700 text-white hover:scale-103 transition-all duration-200"
            >
              Add Thought
            </Button>
          </CardContent>
        </Card>
      )}

      {currentThought && (
        <Card className="mb-8 bg-linear-to-r from-blue-50 to-indigo-50 hover:scale-103 transition-all duration-200 ">          
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

                      <button 
                        onClick={() => handleDeleteThought()}
                        className="text-xs sm:text-sm text-red-500 hover:text-white p-2 rounded-xl font-medium hover:bg-red-600 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="h-6 w-6" />
                      </button>
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

export default function ThoughtPage() {
  return (
    <Suspense fallback={null}>
      <ThoughtPageContent />
    </Suspense>
  )
}
