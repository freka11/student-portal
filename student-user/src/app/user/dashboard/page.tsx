'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { Textarea } from '@/components/admin/Textarea'
import { useToast } from '@/components/admin/Toast'
import { Lightbulb, HelpCircle, MessageSquare, FileText, CheckCircle, Send, X } from 'lucide-react'

interface Thought {
  id: string
  content: string
  date: string
  adminName: string
  adminId: string
}

interface Question {
  id: string
  question: string
  date: string
  adminName: string
  adminId: string
  status: 'published' | 'draft'
}

interface QuestionHistoryItem {
  id: string
  date: string
  questions: Question[]
  adminName: string
  adminId: string
}

interface DailyContent {
  thought: Thought | null
  questions: Question[]
}

interface AnswerModalProps {
  question: Question
  onClose: () => void
  onAnswerSubmitted: (questionId: string) => void
}

function AnswerModal({ question, onClose, onAnswerSubmitted }: AnswerModalProps) {
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToast()

  const handleSubmit = async () => {
    if (!answer.trim()) {
      addToast('Please enter your answer before submitting', 'error')
      return
    }

    if (answer.length < 10) {
      addToast('Please provide a more detailed answer (at least 10 characters)', 'error')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Save answer to localStorage
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(`answer_${question.id}_${today}`, answer)
      
      // Save to answers history
      const answers = JSON.parse(localStorage.getItem('userAnswers') || '[]')
      answers.unshift({
        date: today,
        question: question.question,
        answer: answer,
        timestamp: new Date().toISOString()
      })
      localStorage.setItem('userAnswers', JSON.stringify(answers))
      
      // Update answered questions list
      const answeredQuestions = JSON.parse(localStorage.getItem('answeredQuestions') || '[]')
      if (!answeredQuestions.includes(question.id)) {
        answeredQuestions.push(question.id)
        localStorage.setItem('answeredQuestions', JSON.stringify(answeredQuestions))
      }
      
      localStorage.setItem('lastAnswerDate', today)
      
      onAnswerSubmitted(question.id)
      setAnswer('')
    } catch (error) {
      addToast('Failed to submit answer', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Your Answer
        </label>
        <Textarea
          placeholder="Share your thoughts on this question..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="min-h-32"
          disabled={isSubmitting}
        />
        <p className="text-xs text-black mt-1">
          {answer.length}/500 characters (minimum 10 characters)
        </p>
      </div>
      
      <div className="flex gap-3">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !answer.trim() || answer.length < 10}
          className="flex items-center gap-2 hover:cursor-pointer"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onClose}
          disabled={isSubmitting}
          className="hover:cursor-pointer"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default function UserDashboard() {
  const [dailyContent, setDailyContent] = useState<DailyContent>({
    thought: null,
    questions: []
  })
  const [hasAnsweredToday, setHasAnsweredToday] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [showAnswerModal, setShowAnswerModal] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { addToast, ToastContainer } = useToast()

  useEffect(() => {
    const loadTodayContent = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        
        // Load thoughts from API
        const thoughtsResponse = await fetch('/api/thoughts')
        const thoughtsData = await thoughtsResponse.json()
        const todayThought = thoughtsData.find((thought: Thought) => thought.date === today)
        
        // Load questions from API
        const questionsResponse = await fetch('/api/questions')
        const questionsData = await questionsResponse.json()
        const todayQuestionsItem = questionsData.find((item: QuestionHistoryItem) => item.date === today)
        const todayQuestions = todayQuestionsItem?.questions || []
        
        setDailyContent({
          thought: todayThought || null,
          questions: todayQuestions
        })
        
        // Check if user has answered today
        const lastAnswerDate = localStorage.getItem('lastAnswerDate')
        const savedAnswers = JSON.parse(localStorage.getItem('answeredQuestions') || '[]')
        setAnsweredQuestions(savedAnswers)
        setHasAnsweredToday(lastAnswerDate === today)
        
      } catch (error) {
        console.error('Failed to load today\'s content:', error)
        // Fallback to empty content if API fails
        setDailyContent({
          thought: null,
          questions: []
        })
      } finally {
        setLoading(false)
      }
    }

    loadTodayContent()
  }, [])

  const stats = [
    {
      title: 'Questions Answered',
      value: '0',
      icon: CheckCircle,
      change: '+0 this week',
      changeType: 'positive'
    },
    {
      title: 'Current Streak',
      value: '0 days',
      icon: Lightbulb,
      change: 'Keep it up!',
      changeType: 'positive'
    },
    {
      title: 'Total Interactions',
      value: '0',
      icon: MessageSquare,
      change: '+0 this week',
      changeType: 'positive'
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Student Dashboard</h1>
        <p className="text-black mt-2">Welcome back! Here's your learning progress</p>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ">
        {stats.map((stat) => (
          <Card key={stat.title} className='hover:shadow-lg transition-shadow'>
            <CardContent className="p-6 ">
              <div className="flex items-center justify-between ">
                <div>
                  <p className="text-sm font-medium text-black">{stat.title}</p>
                  <p className="text-2xl font-bold text-black mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ToastContainer />
      
      

      {/* Thought of the Day Section */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 hover:scale-103 transition-all duration-200 ml-2 mr-2 hover:shadow-lg  ">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            Thought of the Day
          </CardTitle>
          <CardDescription>Your daily inspiration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-lg">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            ) : dailyContent.thought ? (
              <p className="text-lg text-black italic text-center">
                "{dailyContent.thought.content}"
              </p>
            ) : (
              <div className="text-center py-4">
                <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-black font-medium mb-1">No Thought Available</p>
                <p className="text-sm text-black">Check back later for today's inspiration!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      
      {/* Question of the Day Section */}
      <Card className="mb-8 bg-linear-to-r from-purple-50 to-pink-50 ml-2 mr-2 hover:scale-103 transction-all duration-200 hover:shadow-lg ">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-purple-600" />
              Questions of the Day
            </CardTitle>
            <CardDescription>Today's discussion prompts</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : dailyContent.questions.filter(q => q.status === 'published').length > 0 ? (
              dailyContent.questions.filter(q => q.status === 'published').map((q, index) => (
                <div 
                key={q.id} 

                className="p-4 rounded-lg border border-purple-200 bg-linear-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 cursor-pointer transition-all duration-300 ease-out   hover:scale-101 ">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-purple-900">Question {index + 1}</span>
                        {answeredQuestions.includes(q.id) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Answered
                          </span>
                        )}
                      </div>
                      <p className="text-black mb-3">{q.question}</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => {
                        setSelectedQuestion(q)
                        setShowAnswerModal(true)
                      }}
                      disabled={answeredQuestions.includes(q.id)}
                      className="hover:cursor-pointer bg-linear-to-r from-pink-200 to-purple-300 hover:from-pink-300 hover:to-purple-400"
                      size="sm"
                    >
                      {answeredQuestions.includes(q.id) ? 'Already Answered' : 'Answer Question'}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-black font-medium mb-1">No Questions Available</p>
                <p className="text-sm text-black">Check back later for today's questions!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Answer Question Modal */}
      {showAnswerModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-xl">Answer Question</CardTitle>
              <CardDescription>Share your thoughts on this question</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-black mb-2">Question:</h3>
                  <p className="text-black bg-gray-50 p-3 rounded-lg">{selectedQuestion.question}</p>
                </div>
                <AnswerModal 
                  question={selectedQuestion}
                  onClose={() => setShowAnswerModal(false)}
                  onAnswerSubmitted={(questionId) => {
                    setAnsweredQuestions(prev => [...prev, questionId])
                    setShowAnswerModal(false)
                    addToast('Answer submitted successfully!', 'success')
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
    </div>
  )
}
