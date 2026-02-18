'use client'
  import { useAdminUser } from '@/hooks/useAdminUser'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { Lightbulb, HelpCircle, Edit, Users, MessageSquare } from 'lucide-react'


interface Thought {
  id: string
  text: string
  publishDate: string
  createdBy?: {
    uid: string
    name: string
  }
}

interface Question {
  id: string
  question: string
  date: string
  adminName: string
  adminId: string
  status: 'published' | 'draft'
  disabled?: boolean
}

interface QuestionHistoryItem {
  id: string
  date: string
  questions: Question[]
  adminName: string
  adminId: string
}

interface AdminUser {
  id: string
  username: string
  name: string
}

export default function Dashboard() {
  const [todayThought, setTodayThought] = useState<Thought | null>(null)
  const [todayQuestions, setTodayQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const { addToast, ToastContainer } = useToast()
  const { admin, ready } = useAdminUser()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  // Load today's content from JSON APIs
  useEffect(() => {
    if (!ready) return
    if (!admin) {
      setLoading(false)
      return
    }

    const loadTodayContent = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        
        // Load thoughts
        const thoughtsResponse = await fetch('/api/thoughts')
        if (!thoughtsResponse.ok) {
          throw new Error(`Failed to fetch thoughts: ${thoughtsResponse.status}`)
        }
        const thoughtsData = await thoughtsResponse.json()
        
        // Ensure thoughtsData is an array
        const thoughtsArray = Array.isArray(thoughtsData) ? thoughtsData : []
        const todayThought = thoughtsArray.find((thought: any) => thought.publishDate === today)
        setTodayThought(todayThought || null)
        
        // Load questions
        const questionsResponse = await fetch('/api/questions')
        if (!questionsResponse.ok) {
          throw new Error(`Failed to fetch questions: ${questionsResponse.status}`)
        }
        const questionsData = await questionsResponse.json()
        
        // Ensure questionsData is an array
        const questionsArray = Array.isArray(questionsData) ? questionsData : []
        // API returns individual questions, filter for today's and map to correct structure
        const todayQuestions = questionsArray
          .filter((q: any) => q.publishDate === today)
          .map((q: any) => ({
            ...q,
            question: q.text, // Map text field to question field
            disabled: q.disabled ?? false,
          }))
        setTodayQuestions(todayQuestions)
      } catch (error) {
        console.error('Failed to load today\'s content:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTodayContent()

    // Listen for new thoughts and questions
    const handleNewThought = (event: CustomEvent<any>) => {
      loadTodayContent() // Refresh data when new thought is added
    }

    const handleNewQuestion = (event: CustomEvent<any>) => {
      loadTodayContent() // Refresh data when new question is added
    }

    window.addEventListener('newThought', handleNewThought as EventListener)
    window.addEventListener('newQuestion', handleNewQuestion as EventListener)
    
    return () => {
      window.removeEventListener('newThought', handleNewThought as EventListener)
      window.removeEventListener('newQuestion', handleNewQuestion as EventListener)
    }
  }, [ready, admin])

  const statsData = [
    {
      title: 'Thoughts Posted',
      value: todayThought ? '1' : '0',
      icon: Lightbulb,
      change: '0%',
      changeType: 'positive'
    },
    {
      title: 'Questions Asked',
      value: todayQuestions.length.toString(),
      icon: HelpCircle,
      change: '0%',
      changeType: 'positive'
    }
  ]




  return (
    <div className="p-6">
      <ToastContainer />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
        <p className="text-black mt-2">Welcome back! Here's your admin overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 ">
        {statsData.map((stat) => (
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
            ) : todayThought ? (
              <p className="text-lg text-black italic text-center">"{todayThought.text}"</p>
            ) : (
              <div className="text-center py-4">
                <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-black font-medium mb-1">No Thought Available</p>
                <p className="text-sm text-black">Check back later for today's inspiration!</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Link href="/admin/thought">
              <Button variant="outline" size="sm">
                View all
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

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
            ) : todayQuestions.length > 0 ? (
              todayQuestions.map((q, index) => (
                <div
                  key={q.id}
                  className={`p-4 rounded-lg border ${
                    q.disabled
                      ? 'bg-gray-200 border-gray-300 opacity-70'
                      : 'border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 ease-out   hover:scale-101 m-2'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-purple-900">Question {index + 1}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            q.disabled ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {q.disabled ? 'Disabled' : 'Active'}
                        </span>
                      </div>
                      <p className="text-black mb-3">{q.question}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/admin/answers/${q.id}`} target="_blank">
                      <Button
                        size="sm"
                        className=" hover:cursor-pointer bg-linear-to-r from-pink-200 to-purple-300 hover:from-pink-300 hover:to-purple-400"
                      >
                        View Answers
                      </Button>
                    </Link>
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
          <div className="flex justify-end">
            <Link href="/admin/question">
              <Button variant="outline" size="sm">
                View all
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-6 sm:mt-8">
        <h2 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Link href="/admin/thought?add=true">
            <Button className="w-full justify-start" variant="outline">
              <Lightbulb className="h-4 w-4 mr-2" />
              Create New Thought
            </Button>
          </Link>
          <Link href="/admin/question?add=true">
            <Button className="w-full justify-start" variant="outline">
              <HelpCircle className="h-4 w-4 mr-2" />
              Create New Question
            </Button>
          </Link>
          <Link href="/admin/chat">
            <Button className="w-full justify-start" variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              View Messages
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
