'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/Card'
import { Lightbulb, Calendar, User } from 'lucide-react'

interface ThoughtHistoryItem {
  id: string
  content: string
  date: string
  adminName: string
  adminId: string
}


interface ThoughtHistoryProps {
  className?: string
  onThoughtAdded?: (thought: ThoughtHistoryItem) => void
}

export function ThoughtHistory({ className, onThoughtAdded }: ThoughtHistoryProps) {
  const [thoughts, setThoughts] = useState<ThoughtHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Load thoughts from API
  useEffect(() => {
    const loadThoughts = async () => {
      try {
        const res = await fetch('/api/thoughts?date=all')
        if (res.ok) {
          const apiThoughts: any[] = await res.json()
          
          // Map API data structure to frontend interface
          const mappedThoughts = apiThoughts.map(thought => ({
            id: thought.id,
            content: thought.text,
            date: thought.publishDate,
            adminName: thought.createdBy?.name || 'Admin',
            adminId: thought.createdBy?.uid || 'admin'
          }))
          const sortedByLatest = mappedThoughts.sort(
          (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
          setThoughts(sortedByLatest) // Show newest first
        }
      } catch (error) {
        console.error('Failed to load thoughts:', error)
        // Fallback to mock data if API fails
  
      } finally {
        setLoading(false)
      }
    }

    loadThoughts()
  }, [])

  // Listen for new thoughts
  useEffect(() => {
    const handleNewThought = (event: CustomEvent<ThoughtHistoryItem>) => {
      const newThought = event.detail
      setThoughts(prev => [newThought, ...prev])
      onThoughtAdded?.(newThought)
    }

    window.addEventListener('newThought', handleNewThought as EventListener)
    return () => window.removeEventListener('newThought', handleNewThought as EventListener)
  }, [onThoughtAdded])

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          Thought History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500">Loading thoughts...</span>
          </div>
        ) : (
          <div className="space-y-3 h-fill overflow-y-auto">
            
            {thoughts.map((thought) => (
            <div
              key={thought.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-transform hover:scale-103 m-6"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(thought.date)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span>{thought.adminName}</span>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed italic">
                "{truncateText(thought.content)}"
              </p>
              <div className="mt-2 text-xs text-gray-400">
                ID: {thought.adminId}
              </div>
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  )
}
