'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { FileText, Users, Calendar, Search, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { useAdminUser } from '@/hooks/useAdminUser'

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
  text: string
  publishDate: string
  createdBy: string
  adminId: string
  status: 'published' | 'draft'
}

export default function AnswersPage() {
  const [answers, setAnswers] = useState<StudentAnswer[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredAnswers, setFilteredAnswers] = useState<StudentAnswer[]>([])
  const { admin, ready } = useAdminUser()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load answers from Firebase API
        const answersResponse = await fetch('/api/answers')
        const answersData = await answersResponse.json()
        
        // Load questions to get question text
        const questionsResponse = await fetch('/api/questions?date=all')
        const questionsData = await questionsResponse.json()
        
        setAnswers(answersData)
        setQuestions(questionsData)
        setFilteredAnswers(answersData)
      } catch (error) {
        console.error('Failed to load data:', error)
        setAnswers([])
        setQuestions([])
        setFilteredAnswers([])
      } finally {
        setLoading(false)
      }
    }

    if (!ready) return
    if (!admin) {
      setLoading(false)
      return
    }

    loadData()
  }, [ready, admin])

  useEffect(() => {
    // Filter answers based on search query
    if (searchQuery.trim()) {
      const filtered = answers.filter(
        answer =>
          answer.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          answer.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          answer.questionId.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredAnswers(filtered)
    } else {
      setFilteredAnswers(answers)
    }
  }, [searchQuery, answers])

  const getQuestionText = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    return question?.text || `Question ID: ${questionId}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDeleteAnswer = async (answerId: string) => {
    if (!confirm('Are you sure you want to delete this answer?')) return

    try {
      const response = await fetch(`/api/answers?id=${answerId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAnswers(prev => prev.filter(a => a.id !== answerId))
        alert('Answer deleted successfully')
      } else {
        alert('Failed to delete answer')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete answer')
    }
  }

  const stats = {
    totalAnswers: answers.length,
    uniqueStudents: new Set(answers.map(a => a.studentId)).size,
    todayAnswers: answers.filter(a => {
      const today = new Date().toISOString().split('T')[0]
      return a.submittedAt?.startsWith(today)
    }).length
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading answers...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          Student Answers
        </h1>
        <p className="text-gray-600 mt-2">
          View and manage all student responses across all questions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Answers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalAnswers}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.uniqueStudents}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Answers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.todayAnswers}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, answer, or question ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answers List */}
      {filteredAnswers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No answers found' : 'No answers yet'}
            </h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try adjusting your search terms' : 'Students haven\'t submitted any answers yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnswers.map((answer) => (
            <Card key={answer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{answer.studentName}</span>
                      <span className="text-sm text-gray-500">({answer.studentId})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(answer.submittedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/answers/${answer.questionId}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Question
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAnswer(answer.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Question:</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {getQuestionText(answer.questionId)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Answer:</p>
                  <p className="text-gray-800 bg-blue-50 p-3 rounded border border-blue-200">
                    {answer.answer}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
