'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { Textarea } from '@/components/admin/Textarea'
import { useToast } from '@/components/admin/Toast'
import { Lightbulb, HelpCircle, MessageSquare, FileText, CheckCircle, Send, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useStudentUser } from '@/hooks/useStudentUser'

interface Thought {
  id: string
  text: string
  publishDate: string
  createdBy: string
  adminId: string
}

interface Question {
  id: string
  text: string
  publishDate: string
  createdBy: string
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

interface UserData {
  id: string
  name: string
  email?: string
}

interface AnswerModalProps {
  question: Question
  user: UserData | null
  existingAnswer?: string
  onClose: () => void
  onAnswerSubmitted: (questionId: string, answerText: string) => void
}


function AnswerModal({ question, user, existingAnswer, onClose, onAnswerSubmitted }: AnswerModalProps) {
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToast()  

  const resolvedExistingAnswer = existingAnswer || ''

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
      // Submit answer to Firebase API
      const response = await fetch('/api/answers', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: question.id,
          answer: answer.trim(),
          publishDate: question.publishDate || new Date().toISOString().split('T')[0]
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Answer submitted:', result)

        onAnswerSubmitted(question.id, answer.trim())
        setAnswer('')
        addToast('Answer submitted successfully!', 'success')
      } else {
        const status = response.status
        const raw = await response.text()
        let errorData: any = null

        try {
          errorData = raw ? JSON.parse(raw) : null
        } catch {
          errorData = null
        }

        console.error(`Submit failed (${status})`, raw || '(empty response body)', errorData)

        if (status === 401) {
          addToast('Session expired. Please log in again.', 'error')
        } else {
          addToast(errorData?.message || 'Failed to submit answer', 'error')
        }
      }
    } catch (error) {
      console.error('Submit error:', error)
      addToast('Failed to submit answer', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      
      {resolvedExistingAnswer ? (
        <div>
          <label className="block text-sm font-medium text-black mb-2">Your Answer</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{resolvedExistingAnswer}</p>
          </div>
          <p className="text-xs text-gray-600 mt-2">This answer is already submitted and cannot be edited.</p>
        </div>
      ) : (
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
      )}
      
      <div className="flex gap-3">
        {!existingAnswer && (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !answer.trim() || answer.length < 10}
            className="flex items-center gap-2 hover:cursor-pointer"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </Button>

        )}
        
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

export default function SimpleDashboard() {
  const [dailyContent, setDailyContent] = useState<DailyContent>({
    thought: null,
    questions: []
  })
  const { user, ready } = useStudentUser()
  const [hasAnsweredToday, setHasAnsweredToday] = useState(false)
  const [questionsAnsweredCount, setQuestionsAnsweredCount] = useState(0)
  const [questionsAnsweredThisWeekCount, setQuestionsAnsweredThisWeekCount] = useState(0)
  const [streakCount, setStreakCount] = useState(0)
  const [lastAnsweredDate, setLastAnsweredDate] = useState<string | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [showAnswerModal, setShowAnswerModal] = useState(false)
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set())
  const [answerByQuestionId, setAnswerByQuestionId] = useState<Record<string, string>>({})
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const { addToast, ToastContainer } = useToast()

  useEffect(() => {
    if (!ready) return

    if (!user) {
      setLoading(false)
      return
    }

    const loadTodayContent = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        
        // Load thoughts from API
        const thoughtsResponse = await fetch('/api/thoughts')
        if (!thoughtsResponse.ok) {
          throw new Error(`Failed to fetch thoughts: ${thoughtsResponse.status}`)
        }
        const thoughtsData = await thoughtsResponse.json()
        
        // Ensure thoughtsData is an array
        const thoughtsArray = Array.isArray(thoughtsData) ? thoughtsData : []
        const todayThought = thoughtsArray.find((thought: Thought) => thought.publishDate === today)
        
        // Load questions from API
        const questionsResponse = await fetch('/api/questions')
        if (!questionsResponse.ok) {
          throw new Error(`Failed to fetch questions: ${questionsResponse.status}`)
        }
        const questionsData = await questionsResponse.json()
        
        // Ensure questionsData is an array
        const questionsArray = Array.isArray(questionsData) ? questionsData : []
        // Students should only see published questions
        const todayQuestions = questionsArray.filter(
          (q: Question) => q.publishDate === today && q.status === 'published'
        )

        // Load student's answers once and build lookups
        const answersResponse = await fetch('/api/answers', { credentials: 'include' })
        const answersData = answersResponse.ok ? await answersResponse.json() : []
        const answersArray = Array.isArray(answersData) ? answersData : []

        const uniqueAnsweredQuestionIds = new Set<string>()
        const uniqueAnsweredQuestionIdsThisWeek = new Set<string>()
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const sevenDaysAgoMs = sevenDaysAgo.getTime()

        const nextAnswered = new Set<string>()
        const nextAnswerById: Record<string, string> = {}

        for (const ans of answersArray) {
          if (!ans?.questionId) continue
          nextAnswered.add(ans.questionId)
          uniqueAnsweredQuestionIds.add(ans.questionId)

          const dateKey =
            typeof ans.publishDate === 'string'
              ? ans.publishDate
              : typeof ans.submittedAt === 'string'
                ? ans.submittedAt.split('T')[0]
                : null

          if (dateKey) {
            const dt = new Date(`${dateKey}T00:00:00Z`).getTime()
            if (!Number.isNaN(dt) && dt >= sevenDaysAgoMs) {
              uniqueAnsweredQuestionIdsThisWeek.add(ans.questionId)
            }
          }

          if (typeof ans.answer === 'string' && ans.answer.trim()) {
            nextAnswerById[ans.questionId] = ans.answer
          }
        }

        setQuestionsAnsweredCount(uniqueAnsweredQuestionIds.size)
        setQuestionsAnsweredThisWeekCount(uniqueAnsweredQuestionIdsThisWeek.size)

        setAnsweredQuestionIds(nextAnswered)
        setAnswerByQuestionId(nextAnswerById)

        setDailyContent({
          thought: todayThought || null,
          questions: todayQuestions
        })

        setHasAnsweredToday(todayQuestions.some(q => nextAnswered.has(q.id)))

        const streakResponse = await fetch('/api/streak', { credentials: 'include' })
        if (streakResponse.ok) {
          const streakData = await streakResponse.json()
          const streak = streakData?.streak
          setStreakCount(typeof streak?.streakCount === 'number' ? streak.streakCount : 0)
          setLastAnsweredDate(typeof streak?.lastAnsweredDate === 'string' ? streak.lastAnsweredDate : null)
        } else {
          setStreakCount(0)
          setLastAnsweredDate(null)
        }
        
      } catch (error) {
        console.error('Failed to load today\'s content:', error)
        // Fallback to empty content if API fails
        setDailyContent({
          thought: null,
          questions: []
        })
        setQuestionsAnsweredCount(0)
        setQuestionsAnsweredThisWeekCount(0)
        setStreakCount(0)
        setLastAnsweredDate(null)
      } finally {
        setLoading(false)
      }
    }

    loadTodayContent()
  }, [ready, user])

  const isQuestionAnswered = (question: Question) => {
    return answeredQuestionIds.has(question.id)
  }

  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  const yesterdayKey = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  })()

  const displayStreak = lastAnsweredDate === yesterdayKey ? streakCount : 0

  const stats = [
    {
      title: 'Questions Answered',
      value: String(questionsAnsweredCount),
      icon: CheckCircle,
      change: `+${questionsAnsweredThisWeekCount} this week`,
      changeType: 'positive'
    },
    {
      title: 'Current Streak',
      value: `${displayStreak} day${displayStreak === 1 ? '' : 's'}`,
      icon: Lightbulb,
      change: 'Keep it up!',
      changeType: 'positive'
    }
  ]
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Student Dashboard </h1>
        <p className="text-black mt-2">Welcome back! Here's your learning progress </p>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 ">
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
      

      {/* Thought of Day Section */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 hover:scale-103 transition-all duration-200 ml-2 mr-2 hover:shadow-lg  ">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            Thought of Day
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
                "{dailyContent.thought.text}"
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
      <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 ml-2 mr-2 hover:scale-103 transition-all duration-200 hover:shadow-lg ">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-purple-600" />
              Questions of the Day
            </CardTitle>
           
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : dailyContent.questions.length > 0 ? (
              dailyContent.questions.map((q: Question, index: number) => (
                (() => {
                  const savedAnswer = isQuestionAnswered(q) ? (answerByQuestionId[q.id] || '') : ''
                  const isExpanded = expandedQuestions.has(q.id)

                  return (
                <div 
                key={q.id} 

                className="p-4 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 ease-out hover:scale-101 m-2">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-purple-900">Question {index + 1}</span>
                        {isQuestionAnswered(q) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Answered
                          </span>
                        )}
                      </div>
                      <p className="text-black mb-3">{q.text}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleQuestionExpansion(q.id)}
                      className="inline-flex items-center gap-2 text-sm text-purple-900 hover:text-purple-950"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-6 w-6 cursor-pointer" />
                      ) : (
                        <ChevronDown className="h-6 w-6 cursor-pointer" />
                      )}
                   
                    </button>
                    <Button 
                      onClick={() => {
                        setSelectedQuestion(q)
                        setShowAnswerModal(true)
                      }}
                      disabled={isQuestionAnswered(q)}
                      className="hover:cursor-pointer bg-gradient-to-r  from-pink-300 to-purple-400 hover:from-purple-500 hover:to-pink-600 transition-colors duration-300"
                      size="sm"
                    >
                      {isQuestionAnswered(q) ? 'Already Answered' : 'Answer Question'}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t border-purple-200 pt-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">Your Answer</h4>
                        {savedAnswer ? (
                          <div className="border border-purple-300 rounded-lg p-3 bg-purple-100">
                            <p className="text-gray-700 text-sm">{savedAnswer}</p>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">No answer submitted yet.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                  )
                })()
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Answer Question</CardTitle>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowAnswerModal(false)}
                  className="hover:cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-black mb-2">Question:</h3>
                  <p className="text-black bg-gray-50 p-3 rounded-lg">{selectedQuestion.text}</p>
                </div>
                <AnswerModal 
                  question={selectedQuestion}
                   user={user}  
                  existingAnswer={answerByQuestionId[selectedQuestion.id] || ''}
                  onClose={() => setShowAnswerModal(false)}
                  onAnswerSubmitted={(questionId, answerText) => {
                    setAnsweredQuestionIds(prev => {
                      const next = new Set(prev)
                      next.add(questionId)
                      return next
                    })
                    setAnswerByQuestionId(prev => ({ ...prev, [questionId]: answerText }))
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
