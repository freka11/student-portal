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

// Mock data for thought history
const initialMockThoughtHistory: ThoughtHistoryItem[] = [
  {
    id: '1',
    content: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    date: '2024-12-26',
    adminName: 'John Doe',
    adminId: 'admin_001'
  },
  {
    id: '2',
    content: 'The only way to do great work is to love what you do. If you haven\'t found it yet, keep looking.',
    date: '2024-12-25',
    adminName: 'Jane Smith',
    adminId: 'admin_002'
  },
  {
    id: '3',
    content: 'Innovation distinguishes between a leader and a follower.',
    date: '2024-12-24',
    adminName: 'Mike Johnson',
    adminId: 'admin_003'
  },
  {
    id: '4',
    content: 'The future belongs to those who believe in the beauty of their dreams.',
    date: '2024-12-23',
    adminName: 'Sarah Williams',
    adminId: 'admin_004'
  },
  {
    id: '5',
    content: 'It is during our darkest moments that we must focus to see the light.',
    date: '2024-12-22',
    adminName: 'David Brown',
    adminId: 'admin_005'
  }
]

interface ThoughtHistoryProps {
  className?: string
  onThoughtAdded?: (thought: ThoughtHistoryItem) => void
}

export function ThoughtHistory({ className, onThoughtAdded }: ThoughtHistoryProps) {
  const [thoughts, setThoughts] = useState<ThoughtHistoryItem[]>(initialMockThoughtHistory)

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
      </CardContent>
    </Card>
  )
}
