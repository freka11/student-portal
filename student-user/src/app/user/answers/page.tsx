'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { FileText, Calendar, Search, Download, Eye, Loader2 } from 'lucide-react'

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

  useEffect(() => {
    // Load answers from localStorage or use mock data
    const savedAnswers = JSON.parse(localStorage.getItem('userAnswers') || '[]')
    
    // Generate more mock answers for testing infinite scroll
    if (savedAnswers.length === 0) {
      const mockAnswers = Array.from({ length: 20 }, (_, index) => ({
        date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        question: `Question ${index + 1}: What is the most surprising thing you learned this week, and how did it change your perspective?`,
        answer: `Answer ${index + 1}: I was surprised to learn that React hooks can only be called at top level of a function component. This completely changed my understanding of how React manages state and effects, and explained why I was getting so many errors before! This is answer number ${index + 1} to test infinite scroll functionality.`,
        timestamp: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString()
      }))
      setAnswers(mockAnswers)
      setFilteredAnswers(mockAnswers)
    } else {
      setAnswers(savedAnswers)
      setFilteredAnswers(savedAnswers)
    }
  }, [])

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
    <div className="p-6">
      <ToastContainer />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">My Answers</h1>
        <p className="text-black mt-2">Review your submitted responses and track your progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
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
          <CardContent className="p-6">
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
          <CardContent className="p-6">
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-3">

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
              className="hover:shadow-md transition-shadow"
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

      {/* View Answer Modal */}
      {showViewModal && selectedAnswer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
