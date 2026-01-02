'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/Card'
import { HelpCircle, Calendar, User, Plus, Trash2, Users } from 'lucide-react'

interface Question {
  id: string
  question: string
  date: string
  adminName: string
  adminId: string
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

interface QuestionHistoryProps {
  onQuestionAdded?: (questionItem: QuestionHistoryItem) => void
}

export function QuestionHistory({ onQuestionAdded }: QuestionHistoryProps) {
  const [questionHistory, setQuestionHistory] = useState<QuestionHistoryItem[]>([])
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load data from JSON files
    const loadData = async () => {
      try {
        // Load questions history
        const questionsResponse = await fetch('/api/questions')
        const questionsData = await questionsResponse.json()
        
        // Load student answers
        const answersResponse = await fetch('/api/answers')
        const answersData = await answersResponse.json()
        
        setQuestionHistory(questionsData)
        setStudentAnswers(answersData)
      } catch (error) {
        console.error('Failed to load data:', error)
        // Fallback to mock data if API fails
        setQuestionHistory([])
        setStudentAnswers([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getAnswersForQuestion = (questionId: string) => {
    return studentAnswers.filter(answer => answer.questionId === questionId)
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Question History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading question history...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Question History
        </CardTitle>
      </CardHeader>
      <CardContent  >
        {questionHistory.length === 0 ? (
          <div className="text-center py-8 ">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Question History</h3>
            <p className="text-gray-500">Questions will appear here once they are created.</p>
          </div>
        ) : (
          <div className="space-y-6 ">
            {questionHistory.map((historyItem) => (
              <div key={historyItem.id} className="border border-gray-200 rounded-lg p-4 hover:scale-102 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-900">{formatDate(historyItem.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User className="h-4 w-4" />
                    <span>{historyItem.adminName}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {historyItem.questions.map((question) => {
                    const answers = getAnswersForQuestion(question.id)
                    return (
                      <div key={question.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <HelpCircle className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-900">
                                {question.status === 'published' ? 'Published' : 'Draft'}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed mb-2">
                              {question.question}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>By {question.adminName}</span>
                              <span>{answers.length} answers</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {answers.length > 0 && (
                              <a
                                href={`/admin/answers/${question.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                              >
                                <Users className="h-3 w-3 mr-1" />
                                View Answers
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
