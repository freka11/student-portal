'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/Card'
import { Users, Calendar, ArrowLeft, HelpCircle, Search } from 'lucide-react'
import Link from 'next/link'

interface StudentAnswer {
  id: string
  studentId: string
  studentName: string
  answer: string
  questionId: string
  submittedAt: string
}

interface Question {
  id: string
  question: string
  date: string
  adminName: string
  adminId: string
  status: 'published' | 'draft'
}

export default function AnswersByQuestionPage() {
  const params = useParams()
  const questionId = params.questionId as string
  
  const [answers, setAnswers] = useState<StudentAnswer[]>([])
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredAnswers, setFilteredAnswers] = useState<StudentAnswer[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load answers
        const answersResponse = await fetch('/api/answers')
        const answersData = await answersResponse.json()
        
        // Load questions to find the specific question
        const questionsResponse = await fetch('/api/questions')
        const questionsData = await questionsResponse.json()
        
        // Filter answers for this question
        const filteredAnswers = answersData.filter((answer: StudentAnswer) => answer.questionId === questionId)
        setAnswers(filteredAnswers)
        setFilteredAnswers(filteredAnswers)
        
        // Find the question details
        let foundQuestion: Question | null = null
        for (const historyItem of questionsData) {
          if (historyItem.questions && Array.isArray(historyItem.questions)) {
            const q = historyItem.questions.find((q: Question) => q.id === questionId)
            if (q) {
              foundQuestion = q
              break
            }
          }
        }
        setQuestion(foundQuestion)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [questionId])

  // Filter answers based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAnswers(answers)
    } else {
      const filtered = answers.filter(answer => 
        answer.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        answer.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        answer.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredAnswers(filtered)
    }
  }, [searchTerm, answers])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading answers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
  
      <div className="mb-4 sm:mb-6">
        <Link 
          href="/admin/question"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-3 sm:mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Questions
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-black">Student Answers</h1>
        </div>
        
        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative w-full max-w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by student name, ID, or answer content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 sm:pl-10 pr-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {searchTerm && (
            <div className="mt-2 text-xs sm:text-sm text-gray-600">
              Found {filteredAnswers.length} {filteredAnswers.length === 1 ? 'answer' : 'answers'} matching "{searchTerm}"
            </div>
          )}
        </div>
        
        {question && (
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <h2 className="text-base sm:text-lg font-semibold text-black mb-1 sm:mb-2">
                    Question 
                  </h2>
                  <p className="text-sm sm:text-base text-gray-700 mb-2 sm:mb-3">{question.question}</p>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <span>By {question.adminName}</span>
                    <span>{formatDate(question.date)}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      question.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {question.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Answers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Student Responses ({filteredAnswers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAnswers.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No matching answers found' : 'No answers submitted yet'}
              </h3>
              <p className="text-sm sm:text-base text-gray-500">
                {searchTerm ? 'Try adjusting your search terms' : 'Answers will appear here once students submit them.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredAnswers.map((answer) => (
                <div key={answer.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-medium text-purple-700">
                          {answer.studentName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-medium text-gray-900">{answer.studentName}</p>
                      </div>
                    </div>
                    <div className="text-right sm:text-left">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(answer.submittedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded border border-gray-200">
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{answer.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
