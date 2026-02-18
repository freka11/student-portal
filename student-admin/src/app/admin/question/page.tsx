'use client'

import { useState, useEffect, Suspense } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown,  } from 'lucide-react'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { Modal } from '@/components/admin/Modal'
import { QuestionHistory } from '@/components/admin/QuestionHistory'
import QuestionEditor from '@/components/admin/QuestionEditor'
import { Card, CardContent } from '@/components/admin/Card'
import { HelpCircle, Users } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useRouter, usePathname } from 'next/navigation'
import { useAdminUser } from '@/hooks/useAdminUser'

interface Question {
  id: string
  question: string  
  status: 'published' | 'draft'
  date?: string
  disabled?: boolean
}

interface StudentAnswer {
  id: string
  studentId: string
  studentName: string
  answer: string
  questionId: string
  submittedAt: string
}

interface QuestionHistoryItem {
  id: string
  date: string
  questions: Question[]
  adminName: string
  adminId: string
}

function QuestionPageContent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([])
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const { addToast, ToastContainer } = useToast()
  const { admin, ready } = useAdminUser()

  const fetchQuestions = async () => {
  try {
    const response = await fetch('/api/questions')
    if (!response.ok) throw new Error('Failed to fetch')

    const data = await response.json()

    const mappedQuestions = data.map((q: any) => ({
      ...q,
      question: q.text,
      disabled: q.disabled ?? false
    }))

    setCurrentQuestions(mappedQuestions)
  } catch (error) {
    console.error('Fetch error:', error)
  }
}


  // Load current questions from API (network mode) or localStorage fallback
  useEffect(() => {

   if (!ready || !admin) return
  fetchQuestions()
  }, [ready, admin])

  const handleToggleDisable = async (questionId: string, currentDisabled?: boolean) => {
  try {
    const response = await fetch(`/api/questions?id=${questionId}`, {
      method: 'PATCH', // 👈 use PATCH for updating
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        disabled: !(currentDisabled ?? false)
      })
    })

    if (response.ok) {
      await fetchQuestions()
       addToast(
    !currentDisabled ? 'Question disabled' : 'Question enabled',
    'success'
  )
    } else {
      addToast('Failed to update question', 'error')
    }
  } catch (error) {
    console.error(error)
    addToast('Failed to update question', 'error')
  }
}


 

  const handleDeleteQuestion = async (questionId: string) => {
   
    
    try {
      const response = await fetch(`/api/questions?id=${questionId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remove from local state and sync localStorage from the same source of truth
      
           await fetchQuestions()
          addToast('Question deleted successfully!', 'success')
      } else {
        addToast('Failed to delete question', 'error')
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      addToast('Failed to delete question', 'error')
    }
  }


  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

 const handleQuestionsSaved = async () => {
  addToast('Questions saved successfully!', 'success')
  handleCloseModal()
  await fetchQuestions()
}


  const handleQuestionsAdded = (questionItem: QuestionHistoryItem) => {
    // Update current questions when new questions are added to history
    setCurrentQuestions(questionItem.questions)
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
const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

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



  return (
    <div className="p-4 sm:p-6 bg-linear-to-r from-purple-100 to-pink-200 ">
      <ToastContainer />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black">Question of the Day</h1>
          <p className="text-black mt-1 sm:mt-2 text-sm sm:text-base">Manage discussion question for students</p>
        </div>
        <Button
          onClick={handleOpenModal}
          className="bg-blue-700 hover:bg-blue-700 text-white w-full sm:w-auto hover:pr-8 transition-all ease-in-out duration-300 active:scale-90"
        >
          <Plus className="m-auto" />
        </Button>
      </div>

      {currentQuestions.length > 0 && (
        <Card className="mb-6 sm:mb-8 bg-linear-to-r from-purple-50 to-pink-50 ml-2 mr-2 hover:scale-103 transition-all duration-200 hover:shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <span className="text-sm sm:text-base font-medium text-purple-900">Questions of the Day</span>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {currentQuestions.map((q, index) => (
                <div 
                  key={q.id} 
                  className={`p-4 rounded-lg border border-purple-200 ${
                    q.disabled
                      ? 'bg-gray-200 border-gray-300 opacity-70'
                      : 'bg-linear-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 ease-out hover:scale-101'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-purple-900">Question {index + 1}</span>

                      </div>
                      <p className="text-black mb-3">{q.question}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleQuestionExpansion(q.id)}
                      className="inline-flex items-center gap-2 text-sm text-purple-900 hover:text-purple-950"
                    >
                      {expandedQuestions.has(q.id) ? (
                        <ChevronUp className="h-4 w-4 cursor-pointer" />
                      ) : (
                        <ChevronDown className="h-4 w-4 cursor-pointer" />
                      )}
                      Details
                    </button>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/admin/answers/${q.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        View Answers
                      </a>
                      <button
                      title="Disable question"
  onClick={() => handleToggleDisable(q.id, q.disabled)}
  className={`text-xs sm:text-sm px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
    q.disabled
      ? 'bg-green-600 text-white hover:bg-green-700'
      : 'bg-gray-600 text-white hover:bg-gray-700'
  }`}
  
>
  {q.disabled ? 'enable' : 'disable'}
</button>

                      <button 
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-xs sm:text-sm text-red-500 hover:text-white p-2 rounded-xl font-medium hover:bg-red-600 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {expandedQuestions.has(q.id) && (
                    <div className="mt-4 border-t border-purple-200 pt-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">Question Details</h4>
                        <div className="border border-purple-100 rounded-lg p-3 bg-white">
                          <p className="text-gray-700 text-sm mb-2">
                            <strong>Status:</strong> {!q.disabled ? 'Active' : 'Inactive'}
                          </p>
                          <p className="text-gray-700 text-sm mb-2">
                            <strong>Date:</strong> {formatDate(new Date().toISOString().split('T')[0])}
                          </p>
                  
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <QuestionHistory onQuestionAdded={handleQuestionsAdded} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Manage Question of the Day"
        className="max-w-4xl w-full mx-4"
      >
        <QuestionEditor onQuestionSaved={handleQuestionsSaved} />
      </Modal>
    </div>
  )
}

export default function QuestionPage() {
  return (
    <Suspense fallback={null}>
      <QuestionPageContent />
    </Suspense>
  )
}
