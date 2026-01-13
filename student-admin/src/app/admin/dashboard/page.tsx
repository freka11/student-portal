'use client'
import { onAuthStateChanged } from 'firebase/auth'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { Lightbulb, HelpCircle, Edit, Users, MessageSquare } from 'lucide-react'





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
  
  const [isModalOpen, setIsModalOpen] = useState(false)
    const handleOpenModal = () => {
    setIsModalOpen(true)
  }



  


  // Load today's content from JSON APIs
  useEffect(() => {
    const loadTodayContent = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        
        // Load thoughts
        const thoughtsResponse = await fetch('/api/thoughts')
        const thoughtsData = await thoughtsResponse.json()
        const todayThought = thoughtsData.find((thought: Thought) => thought.date === today)
        setTodayThought(todayThought || null)
        
        // Load questions
        const questionsResponse = await fetch('/api/questions')
        const questionsData = await questionsResponse.json()
        const todayQuestionsItem = questionsData.find((item: QuestionHistoryItem) => item.date === today)
        setTodayQuestions(todayQuestionsItem?.questions || [])
      } catch (error) {
        console.error('Failed to load today\'s content:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTodayContent()

    // Listen for new thoughts
    const handleNewThought = (event: CustomEvent<Thought>) => {
      loadTodayContent() // Refresh data when new thought is added
    }

    window.addEventListener('newThought', handleNewThought as EventListener)
    
    return () => {
      window.removeEventListener('newThought', handleNewThought as EventListener)
    }
  }, [])

  const statsData = [
    {
      title: 'Total Students',
      value: '0',
      icon: Users,
      change: '+0%',
      changeType: 'positive'
    },
    {
      title: 'Active Chats',
      value: '0',
      icon: MessageSquare,
      change: '0%',
      changeType: 'positive'
    },
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
    <div className="p-4 sm:p-6">
      <ToastContainer />
      
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">Dashboard</h1>
        <p className="text-black mt-2 text-sm sm:text-base">Welcome to the admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {statsData.map((stat) => (
          <Card key={stat.title} className='hover:shadow-lg transition-all duration-200'>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-black">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-black mt-1">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 text-black">
        {/* Thought of the Day Card */}
        <Card className='bg-linear-to-r from-blue-50 to-indigo-50 hover:scale-105 transition-all hover:shadow-lg duration-200'>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" />
                  Thought of the Day
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Today's inspirational message</CardDescription>
              </div>
              <Link href="/admin/thought">
                <Button variant="outline" size="sm">
                 
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 sm:p-6 rounded-lg">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <p className="text-black italic text-sm sm:text-base">
                  {todayThought?.content || "No thought posted yet for today."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question of the Day Card */}
        <Card className='bg-linear-to-r from-purple-50 to-pink-50 hover:scale-105 transition-all hover:shadow-lg duration-200'>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  Questions of the Day
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Today's discussion prompts</CardDescription>
              </div>
              <Link href="/admin/question">
                <Button variant="outline" size="sm">
                View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-3 sm:p-4 rounded-lg">
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : todayQuestions.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {todayQuestions.map((question, index) => (
                    <div key={question.id} className="border-l-4 border-purple-400 pl-2 sm:pl-3">
                      <p className="text-black text-xs sm:text-sm mb-1 sm:mb-2">
                        <span className="font-medium">Q{index + 1}:</span> {question.question}
                      </p>
                      <span className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        question.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {question.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-black text-xs sm:text-sm">
                  No questions posted yet for today.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
