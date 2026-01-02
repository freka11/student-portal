'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { Modal } from '@/components/admin/Modal'
import { QuestionHistory } from '@/components/admin/QuestionHistory'
import QuestionEditor from '@/components/admin/QuestionEditor'
import { Card, CardContent } from '@/components/admin/Card'
import { HelpCircle, Users } from 'lucide-react'

interface Question {
  id: string
  question: string
  status: 'published' | 'draft'
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

// Mock student answers data
const mockStudentAnswers: StudentAnswer[] = [
  {
    id: 'sa1',
    studentId: 'STU001',
    studentName: 'Alice Johnson',
    answer: 'I learned that JavaScript closures can capture variables from their outer scope, which was surprising because I thought variables would be garbage collected.',
    questionId: 'q1',
    submittedAt: '2024-12-26T10:30:00Z'
  },
  {
    id: 'sa2',
    studentId: 'STU002',
    studentName: 'Bob Smith',
    answer: 'The most surprising thing was learning about async/await - it makes asynchronous code so much more readable compared to promises!',
    questionId: 'q1',
    submittedAt: '2024-12-26T11:15:00Z'
  },
  {
    id: 'sa3',
    studentId: 'STU003',
    studentName: 'Carol Williams',
    answer: 'I was surprised to learn that React hooks can only be called at the top level of a function component. This explains why I was getting errors before!',
    questionId: 'q1',
    submittedAt: '2024-12-26T09:45:00Z'
  }
]

export default function QuestionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([])
  const { addToast, ToastContainer } = useToast()

  // Load current questions from localStorage or use mock data
  useEffect(() => {
    const savedQuestions = localStorage.getItem('dailyQuestions')
    if (savedQuestions) {
      const parsed = JSON.parse(savedQuestions)
      setCurrentQuestions(parsed)
    } else {
      // Set mock questions if no data exists
      const mockQuestions = [
        {
          id: 'q1',
          question: 'What is the most surprising thing you learned this week, and how did it change your perspective?',
          status: 'published' as const
        },
        {
          id: 'q2',
          question: 'Describe a challenge you faced recently and how you overcame it.',
          status: 'published' as const
        },
        {
          id: 'q3',
          question: 'What skill would you like to develop next, and what steps will you take to learn it?',
          status: 'draft' as const
        }
      ]
      setCurrentQuestions(mockQuestions)
      localStorage.setItem('dailyQuestions', JSON.stringify(mockQuestions))
    }
  }, [])

  const handleQuestionClick = (question: Question) => {
    // Open answers page in new tab
    window.open(`/admin/answers/${question.id}`, '_blank')
  }

  const getAnswersForQuestion = (questionId: string) => {
    return mockStudentAnswers.filter(answer => answer.questionId === questionId)
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleQuestionsSaved = (questions: Question[]) => {
    addToast('Questions saved successfully!', 'success')
    handleCloseModal()
    setCurrentQuestions(questions)
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

  return (
    <div className="p-4 sm:p-6">
      <ToastContainer />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black">Questions of the Day</h1>
          <p className="text-black mt-1 sm:mt-2 text-sm sm:text-base">Manage discussion questions for students</p>
        </div>
        <Button
          onClick={handleOpenModal}
          className="bg-purple-500 hover:bg-purple-700 text-white w-full sm:w-auto"
        >
          + Add Questions
        </Button>
      </div>

      {currentQuestions.length > 0 && (
        <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <span className="text-sm sm:text-base font-medium text-purple-900">Today's Questions</span>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {currentQuestions.map((q, index) => (
                <div 
                  key={q.id} 
                  className="p-3 sm:p-4 rounded-lg border border-purple-100 m-2 sm:m-4 transition-transform hover:scale-105 hover:bg-purple-100"
                  onClick={() => handleQuestionClick(q)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 gap-2">
                    <span className="text-sm sm:text-base font-medium text-purple-900">Question {index + 1}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      q.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {q.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-2 sm:mb-3">
                    {q.question}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 sm:pt-4 border-t border-purple-200 mt-2 sm:mt-3 gap-2">
                    <p className="text-xs sm:text-sm text-blue-600 font-medium">
                      Click to view student answers ({getAnswersForQuestion(q.id).length} answers)
                    </p>
                    <p className="text-xs sm:text-sm text-purple-600">{formatDate(new Date().toISOString().split('T')[0])}</p>
                    <p className="text-xs sm:text-sm text-gray-500">By Current Admin</p>
                  </div>
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
        title="Manage Questions of the Day"
        className="max-w-4xl w-full mx-4"
      >
        <QuestionEditor onQuestionSaved={handleQuestionsSaved} />
      </Modal>
    </div>
  )
}
