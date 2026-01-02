'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { Textarea } from '@/components/admin/Textarea'
import { Lightbulb, Save, Eye } from 'lucide-react'

interface ThoughtHistoryItem {
  id: string
  content: string
  date: string
  adminName: string
  adminId: string
}

interface ThoughtEditorProps {
  onThoughtSaved: (thought: string) => void
}

export default function ThoughtEditor({ onThoughtSaved }: ThoughtEditorProps) {
  const [thought, setThought] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [existingThought, setExistingThought] = useState('')

  // Load existing thought (could be from localStorage or API)
  useEffect(() => {
    const savedThought = localStorage.getItem('dailyThought')
    if (savedThought) {
      setExistingThought(savedThought)
      setThought(savedThought)
    }
  }, [])

  const createNewThoughtItem = (content: string): ThoughtHistoryItem => {
    const today = new Date()
    return {
      id: Date.now().toString(),
      content,
      date: today.toISOString().split('T')[0], // YYYY-MM-DD format
      adminName: 'Current Admin',
      adminId: 'admin01'
    }
  }

  const handleSave = async () => {
    if (!thought.trim()) return

    setIsSaving(true)
    
    try {
      // Create new thought item with admin01
      const newThoughtItem = createNewThoughtItem(thought)
      
      // Save to JSON API
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newThoughtItem),
      })
      
      if (response.ok) {
        // Also save to localStorage for current session
        localStorage.setItem('dailyThought', thought)
        setExistingThought(thought)
        
        // Emit event for other components
        window.dispatchEvent(new CustomEvent('newThought', { detail: newThoughtItem }))
        
        onThoughtSaved(thought)
      } else {
        throw new Error('Failed to save to server')
      }
    } catch (error) {
      console.error('Failed to save thought:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!thought.trim()) return

    setIsSaving(true)
    
    try {
      // Create thought item with admin01
      const newThoughtItem = createNewThoughtItem(thought)
      
      // Save to JSON API (use POST for both new and updated thoughts)
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newThoughtItem),
      })
      
      if (response.ok) {
        // Also save to localStorage for current session
        localStorage.setItem('dailyThought', thought)
        setExistingThought(thought)
        
        // Emit event for other components
        window.dispatchEvent(new CustomEvent('newThought', { detail: newThoughtItem }))
        
        onThoughtSaved(thought)
      } else {
        throw new Error('Failed to update to server')
      }
    } catch (error) {
      console.error('Failed to update thought:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const isNewThought = !existingThought

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          {isNewThought ? 'Create Thought' : 'Update Thought'}
        </CardTitle>
        <CardDescription>
          {isNewThought 
            ? 'Share an inspirational thought for today' 
            : 'Edit today\'s thought'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="thought" className="block text-sm font-medium text-black mb-2">
            Thought Content
          </label>
          <Textarea
            id="thought"
            placeholder="Enter your inspirational thought here..."
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            className="min-h-32"
          />
        </div>
        
        <div className="flex gap-3">
          {isNewThought ? (
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Thought'}
            </Button>
          ) : (
            <Button 
              onClick={handleUpdate} 
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Updating...' : 'Update Thought'}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Thought of the Day</span>
              </div>
              <p className="text-gray-700 italic text-sm leading-relaxed">
                {thought || "Your thought will appear here..."}
              </p>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600">{today}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
