'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/user/Card'

interface Question {
  id: string
  question: string
  status: 'published' | 'draft'
}

interface QuestionHistoryItem {
  id: string
  date: string
  questions: Question[]
  adminName: string
  adminId: string
}

interface StudentAnswer {
  id: string
  studentId: string
  studentName: string
  answer: string
  questionId: string
  submittedAt: string
}

export default function PreviousQuestionsPage() {
  const [questionHistory, setQuestionHistory] = useState<QuestionHistoryItem[]>([])
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all questions from API (not just today's)
        const questionsResponse = await fetch('/api/questions?date=all')
        let questionsData = []
        
        if (questionsResponse.ok) {
          questionsData = await questionsResponse.json()
          console.log('Questions data:', questionsData)
        } else {
          console.log('Questions API failed, using empty array')
        }
        
        // Load student answers
        const answersResponse = await fetch('/api/answers')
        let answersData = []
        
        if (answersResponse.ok) {
          answersData = await answersResponse.json()
          console.log('Previous questions - Answers data:', answersData)
        } else {
          console.log('Previous questions - Answers API failed, using empty array')
        }
        
        // Group questions by date for history view
        const groupedByDate = questionsData.reduce((acc: any, question: any) => {
          const date = question.publishDate || new Date().toISOString().split('T')[0]
          if (!acc[date]) {
            acc[date] = {
              id: date,
              date: date,
              questions: [],
              adminName: question.createdBy?.name || 'Admin',
              adminId: question.createdBy?.uid || 'admin-123'
            }
          }
          acc[date].questions.push({
            id: question.id,
            question: question.text, // Map 'text' to 'question'
            status: question.status
          })
          return acc
        }, {})
        
        const historyArray = Object.values(groupedByDate) as QuestionHistoryItem[]
        // Sort by date (newest first)
        historyArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        
        setQuestionHistory(historyArray)
        setStudentAnswers(answersData)
      } catch (error) {
        console.error('Failed to load data:', error)
        // Fallback to empty arrays if API fails
        setQuestionHistory([])
        setStudentAnswers([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getAnswersForQuestion = (questionId: string) => {
    const answers = studentAnswers.filter(answer => answer.questionId === questionId)
    console.log(`Answers for question ${questionId}:`, answers)
    return answers
  }

  const toggleQuestionExpansion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading previous questions...</p>
        </div>
      </div>
    )
  }

  return (
 
    <div className="min-h-screen bg-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            Previous Questions
 
          </h1>
          <p className="text-gray-600 mt-2">
            Explore all previous questions and see what other students answered.
          </p>
        </div>

        {questionHistory.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Previous Questions</h3>
              <p className="text-gray-500">No questions have been posted yet. Check back later!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {questionHistory.map((historyItem) => {
              // Check if this history item has any published questions
              const publishedQuestions = historyItem.questions.filter((q: Question) => q.status === 'published')
              if (publishedQuestions.length === 0) return null // Skip if no published questions
              
              return (
                <div
                  key={historyItem.id}
                  className="border border-gray-200 rounded-lg p-4 hover:scale-102 transition-transform duration-200 bg-white"
                >
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
                    {publishedQuestions.map((question) => {
                    const answers = getAnswersForQuestion(question.id)
                    const isExpanded = expandedQuestions.has(question.id)

                    return (
                      <div key={question.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-gray-700 text-sm leading-relaxed mb-2">
                              {question.question}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {answers.length} {answers.length === 1 ? 'answer' : 'answers'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleQuestionExpansion(question.id)}
                            className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 cursor-pointer" />
                            ) : (
                              <ChevronDown className="h-5 w-5 cursor-pointer" />
                            )}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 space-y-4 border-t border-gray-200 pt-3">
                              {/* Answers Section */}
                              {answers.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4" />
                                    Student Answers
                                  </h5>
                                  <div className="space-y-3">
                                    {answers.map((answer) => (
                                      <div key={answer.id} className="border border-gray-100 rounded-lg p-3 bg-white">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium text-sm text-gray-900">
                                            {answer.studentName}
                                          </span>
                                          <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(answer.submittedAt)}
                                          </span>
                                        </div>
                                        <p className="text-gray-700 text-sm">{answer.answer}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {answers.length === 0 && (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                  <p>No answers yet for this question.</p>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>

  )
}
