'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { FileText, Calendar, Search, Download, Eye, Loader2 } from 'lucide-react'
import { useStudentUser } from '@/hooks/useStudentUser'

interface UserAnswer {
  date: string
  question: string
  answer: string
  timestamp: string
}

export default function AnswersPage() {
  const [answers, setAnswers] = useState<UserAnswer[]>([])
  const [filteredAnswers, setFilteredAnswers] = useState<UserAnswer[]>([])
  const [displayedAnswers, setDisplayedAnswers] = useState<UserAnswer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAnswer, setSelectedAnswer] = useState<UserAnswer | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const itemsPerPage = 5
  const observer = useRef<IntersectionObserver | null>(null)
  const lastAnswerRef = useRef<HTMLDivElement | null>(null)
  const { addToast, ToastContainer } = useToast()
  const { user, ready } = useStudentUser()

  const loadAnswers = async () => {
    try {
      // Load answers from Firebase API
      const answersResponse = await fetch('/api/answers')
      if (answersResponse.ok) {
        const answersData = await answersResponse.json()
        console.log('All answers data:', answersData)
        
        // Ensure answersData is an array
        const answersArray = Array.isArray(answersData) ? answersData : []
        
        if (answersArray.length === 0) {
          console.log('No answers found in database')
          setAnswers([])
          setFilteredAnswers([])
          return
        }
        
        // For debugging: Show all answers to see if data exists
        // In a real app, you would filter by current student's ID
        const currentStudentId = 'current_student' // This should come from auth
        const studentAnswers = answersArray.filter((answer: any) => {
          // Show all answers for debugging, comment this for production
          return true; //answer.studentId === currentStudentId || !answer.studentId
        })
        
        console.log('Filtered answers for current student:', studentAnswers)
        
        if (studentAnswers.length === 0) {
          console.log('No answers found for current student')
          setAnswers([])
          setFilteredAnswers([])
          return
        }
        
        // Load all questions to get question text (only once)
        const questionsResponse = await fetch('/api/questions?date=all')
        let questions = []
        if (questionsResponse.ok) {
          questions = await questionsResponse.json()
          console.log('Questions loaded:', questions.length)
        }
        
        // Transform and enrich answers data
        const userAnswers: UserAnswer[] = studentAnswers.map((answer: any) => {
          const question = questions.find((q: any) => q.id === answer.questionId)
          return {
            date: answer.submittedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            question: question?.text || question?.question || `Question ID: ${answer.questionId}`,
            answer: answer.answer,
            timestamp: answer.submittedAt
          }
        })
        
        console.log('Transformed user answers:', userAnswers)
        
        // Sort by date (newest first)
        userAnswers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        
        setAnswers(userAnswers)
        setFilteredAnswers(userAnswers)
      } else {
        console.log('Failed to load answers, status:', answersResponse.status)
        setAnswers([])
        setFilteredAnswers([])
      }
    } catch (error) {
      console.error('Failed to load answers:', error)
      setAnswers([])
      setFilteredAnswers([])
    }
  }

  useEffect(() => {
    if (!ready) return
    if (!user) return

    loadAnswers()
  }, [ready, user])

  const submitTestAnswer = async () => {
    try {
      console.log('Submitting test answer...')
      
      // First get a question ID to use
      const questionsResponse = await fetch('/api/questions?date=all')
      if (questionsResponse.ok) {
        const questions = await questionsResponse.json()
        if (questions.length > 0) {
          const testQuestion = questions[0]
          
          const testData = {
            studentId: 'test_student_001',
            studentName: 'Test Student',
            questionId: testQuestion.id,
            answer: `This is a test answer submitted at ${new Date().toLocaleString()} to verify the API works correctly.`
          }
          
          const response = await fetch('/api/answers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('✅ Test answer submitted:', result)
            alert('Test answer submitted successfully! Refreshing answers...')
            
            // Reload answers
            loadAnswers()
          } else {
            const error = await response.text()
            console.error('❌ Failed to submit test answer:', error)
            alert(`Failed to submit test answer: ${error}`)
          }
        } else {
          alert('No questions found to test with. Please create a question first.')
        }
      } else {
        alert('Failed to load questions for testing')
      }
    } catch (error) {
      console.error('Test submission error:', error)
      alert('Failed to submit test answer')
    }
  }

  useEffect(() => {
    // Filter answers based on search query
    if (searchQuery.trim()) {
      const filtered = answers.filter(
        answer =>
          answer.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          answer.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          answer.date.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredAnswers(filtered)
      setCurrentPage(1)
      setDisplayedAnswers(filtered.slice(0, itemsPerPage))
      setHasMore(filtered.length > itemsPerPage)
    } else {
      setFilteredAnswers(answers)
      setCurrentPage(1)
      setDisplayedAnswers(answers.slice(0, itemsPerPage))
      setHasMore(answers.length > itemsPerPage)
    }
  }, [searchQuery, answers])

  const handleViewAnswer = (answer: UserAnswer) => {
    setSelectedAnswer(answer)
    setShowViewModal(true)
  }

  const loadMoreAnswers = useCallback(() => {
    if (isLoading || !hasMore) return
    
    setIsLoading(true)
    
    // Simulate API delay
    setTimeout(() => {
      const nextPage = currentPage + 1
      const startIndex = (nextPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const nextAnswers = filteredAnswers.slice(startIndex, endIndex)
      
      setDisplayedAnswers(prev => [...prev, ...nextAnswers])
      setCurrentPage(nextPage)
      setHasMore(endIndex < filteredAnswers.length)
      setIsLoading(false)
    }, 500)
  }, [currentPage, filteredAnswers, hasMore, isLoading])

  const lastAnswerElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreAnswers()
      }
    })
    
    if (node) observer.current.observe(node)
  }, [isLoading, hasMore, loadMoreAnswers])

 

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const stats = {
    totalAnswers: answers.length,
    thisWeek: answers.filter(a => {
      const answerDate = new Date(a.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return answerDate >= weekAgo
    }).length,
    thisMonth: answers.filter(a => {
      const answerDate = new Date(a.date)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      return answerDate.getMonth() === currentMonth && answerDate.getFullYear() === currentYear
    }).length
  }

  return (
    <div className="p-6 min-h-screen bg-linear-to-r from-purple-100 to-pink-200">
      <ToastContainer />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">My Answers</h1>
        <p className="text-black mt-2">Review your submitted responses and track your progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ">
        <Card >
          <CardContent className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between ">
              <div>
                <p className="text-sm font-medium text-black">Total Answers</p>
                <p className="text-2xl font-bold text-black mt-1">{stats.totalAnswers}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">This Week</p>
                <p className="text-2xl font-bold text-black mt-1">{stats.thisWeek}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">This Month</p>
                <p className="text-2xl font-bold text-black mt-1">{stats.thisMonth}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card className='bg-white p-8'>
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple -400"
              />
            </div>
            

          </div>
        </CardContent>
      </Card>

      {/* Answers List */}
      {filteredAnswers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">
              {searchQuery ? 'No answers found' : 'No answers yet'}
            </h2>
            <p className="text-black mb-4">
              {searchQuery ? 'Try adjusting your search terms' : 'Start answering questions to see them here'}
            </p>
            {!searchQuery && (
              <Button onClick={() => window.location.href = '/user/question'} className="hover:cursor-pointer">
                Answer Today's Question
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayedAnswers.map((answer, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-shadow"
              ref={index === displayedAnswers.length - 1 ? lastAnswerElementRef : null}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{answer.question}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(answer.date)}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewAnswer(answer)}
                    className="hover:cursor-pointer"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-black line-clamp-3">{answer.answer}</p>
              </CardContent>
            </Card>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading more answers...</span>
              </div>
            </div>
          )}
          
          {/* End of results indicator */}
          {!hasMore && displayedAnswers.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              <p>End of results</p>
            </div>
          )}
        </div>
      )}
      </Card>

      {/* View Answer Modal */}
      {showViewModal && selectedAnswer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-xl">{selectedAnswer.question}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(selectedAnswer.date)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-black whitespace-pre-wrap">{selectedAnswer.answer}</p>
              </div>
            </CardContent>
            <div className="p-6 pt-0">
              <Button 
                onClick={() => setShowViewModal(false)}
                className="hover:cursor-pointer"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
